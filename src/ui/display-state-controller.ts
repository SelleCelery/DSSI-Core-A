import {
  acceptConfirmedDisplayState,
  clearDisplayDraftAtRevision,
  createDisplayTransientMemory,
  displayMemorySnapshot,
  settingsWithDisplayBundle,
  updateDisplayDraft,
  type DisplayMemorySnapshot,
  type DisplaySettingsBundle,
  type DisplayTransientMemory,
} from '../core/models/display-memory';
import type { SettingsMemoryResponse } from '../core/models/settings-memory';
import type { DssiSettings } from '../core/models/settings';
import {
  readSettingsMemory,
  removeHostDisplayMemory,
  persistSessionDisplayDraft,
  saveHostDisplayPatch,
} from '../storage/settings-memory-client';
import {
  setCommunicationTextVisible,
  setPulsePaused,
  setPulseVisible,
} from './transient-display-state';

export type DisplaySurface = 'communication_pulse' | 'settings_panel' | 'text_chip';
export type DisplaySynchronization = 'synchronized' | 'writing' | 'rendering' | 'error';

export interface DisplayStateView {
  settings: DssiSettings;
  display: DisplayMemorySnapshot;
  renderRevision: string;
  synchronization: DisplaySynchronization;
}

type DisplayStateListener = (view: DisplayStateView) => void;

export class DisplayStateController {
  readonly #hostname: string;
  readonly #listeners = new Set<DisplayStateListener>();
  readonly #appliedRevisions = new Map<DisplaySurface, string>();
  #globalSettings: DssiSettings;
  #memory: DisplayTransientMemory;
  #pendingMemory: DisplayTransientMemory | undefined;
  #readSequence = 0;
  #sessionCommandSequence = 0;
  #writeQueue: Promise<void> = Promise.resolve();
  #sessionDraftWriteQueue: Promise<void> = Promise.resolve();
  #synchronization: DisplaySynchronization = 'synchronized';

  public constructor(hostname: string, initial: SettingsMemoryResponse) {
    if (!initial.ok) throw new Error(initial.reason ?? 'settings memory unavailable');
    this.#hostname = hostname;
    this.#globalSettings = initial.settings;
    this.#memory = createDisplayTransientMemory(initial.reaction, initial.sessionDraft);
    this.#notify();
  }

  public snapshot(): DisplayStateView {
    return this.#snapshotFor(this.#memory);
  }

  /** Returns the latest intended state for calculating the next command only. */
  public commandSnapshot(): DisplayStateView {
    return this.#snapshotFor(this.#pendingMemory ?? this.#memory);
  }

  #snapshotFor(memory: DisplayTransientMemory): DisplayStateView {
    const display = displayMemorySnapshot(memory);
    return {
      settings: settingsWithDisplayBundle(this.#globalSettings, display.current),
      display,
      renderRevision: `${display.committed.revision}:${display.draftRevision}`,
      synchronization: this.#synchronization,
    };
  }

  public subscribe(listener: DisplayStateListener): () => void {
    this.#listeners.add(listener);
    listener(this.snapshot());
    return () => this.#listeners.delete(listener);
  }

  public acknowledge(surface: DisplaySurface, renderRevision: string): void {
    this.#appliedRevisions.set(surface, renderRevision);
    if (this.#synchronization === 'rendering' && this.surfacesSynchronized()) {
      this.#synchronization = 'synchronized';
    }
  }

  public surfacesSynchronized(): boolean {
    const revision = this.snapshot().renderRevision;
    return (['communication_pulse', 'settings_panel', 'text_chip'] as const).every(
      (surface) => this.#appliedRevisions.get(surface) === revision,
    );
  }

  public updateDraft(patch: Partial<DisplaySettingsBundle>): void {
    this.#pendingMemory = updateDisplayDraft(this.#pendingMemory ?? this.#memory, patch);
    const commandSequence = ++this.#sessionCommandSequence;
    const command = displayMemorySnapshot(this.#pendingMemory);
    this.#synchronization = 'writing';
    this.#notify();
    this.#queueSessionDraftWrite(command, commandSequence);
  }

  public refresh(): Promise<DisplayStateView> {
    const readSequence = ++this.#readSequence;
    return readSettingsMemory(this.#hostname).then((response) => {
      if (!response.ok) throw new Error(response.reason ?? 'settings memory unavailable');
      this.#globalSettings = response.settings;
      this.#replaceConfirmedState(response, readSequence);
      this.#synchronization = this.#pendingMemory ? 'writing' : 'rendering';
      this.#notify();
      return this.snapshot();
    });
  }

  public saveHostDraft(): Promise<SettingsMemoryResponse> {
    const sessionBarrier = this.#sessionDraftWriteQueue;
    return this.#enqueueWrite(async () => {
      await sessionBarrier;
      const before = displayMemorySnapshot(this.#memory);
      const readSequence = ++this.#readSequence;
      const response = await saveHostDisplayPatch(
        this.#hostname,
        before.committed.revision,
        before.draft,
      );
      this.#globalSettings = response.settings;
      if (response.ok) {
        this.#memory = clearDisplayDraftAtRevision(this.#memory, before.draftRevision);
      }
      this.#replaceConfirmedState(response, readSequence);
      this.#synchronization = response.ok
        ? this.#pendingMemory
          ? 'writing'
          : 'rendering'
        : 'error';
      this.#notify();
      return response;
    });
  }

  public removeHostMemory(): Promise<SettingsMemoryResponse> {
    const sessionBarrier = this.#sessionDraftWriteQueue;
    return this.#enqueueWrite(async () => {
      await sessionBarrier;
      const before = displayMemorySnapshot(this.#memory);
      const readSequence = ++this.#readSequence;
      const response = await removeHostDisplayMemory(this.#hostname, before.committed.revision);
      this.#globalSettings = response.settings;
      if (response.ok) {
        this.#memory = clearDisplayDraftAtRevision(this.#memory, before.draftRevision);
      }
      this.#replaceConfirmedState(response, readSequence);
      if (response.ok) setPulsePaused(false);
      this.#synchronization = response.ok
        ? this.#pendingMemory
          ? 'writing'
          : 'rendering'
        : 'error';
      this.#notify();
      return response;
    });
  }

  #enqueueWrite<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.#writeQueue.then(async () => {
      this.#synchronization = 'writing';
      this.#notify();
      try {
        return await operation();
      } catch (error) {
        this.#synchronization = 'error';
        this.#notify();
        throw error;
      }
    });
    this.#writeQueue = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  #queueSessionDraftWrite(snapshot: DisplayMemorySnapshot, commandSequence: number): void {
    const sessionBarrier = this.#sessionDraftWriteQueue;
    const persistentWriteBarrier = this.#writeQueue;
    const operation = Promise.all([sessionBarrier, persistentWriteBarrier]).then(async () => {
      const rebasedCommand = displayMemorySnapshot(
        updateDisplayDraft(createDisplayTransientMemory(this.#memory.committed), snapshot.draft),
      );
      const response = await persistSessionDisplayDraft(
        this.#hostname,
        rebasedCommand.draftBaseRevision,
        rebasedCommand.draft,
      );
      const readSequence = ++this.#readSequence;
      this.#globalSettings = response.settings;
      this.#replaceConfirmedState(response, readSequence);
      const latestCommand = commandSequence === this.#sessionCommandSequence;
      if (latestCommand) this.#pendingMemory = undefined;
      this.#synchronization = response.ok ? (latestCommand ? 'rendering' : 'writing') : 'error';
      this.#notify();
    });
    this.#sessionDraftWriteQueue = operation.then(
      () => undefined,
      () => {
        if (commandSequence !== this.#sessionCommandSequence) return;
        this.#pendingMemory = undefined;
        this.#synchronization = 'error';
        this.#notify();
      },
    );
  }

  #replaceConfirmedState(response: SettingsMemoryResponse, readSequence: number): void {
    const pendingDraft = this.#pendingMemory
      ? displayMemorySnapshot(this.#pendingMemory).draft
      : undefined;
    this.#memory = acceptConfirmedDisplayState(
      this.#memory,
      response.reaction,
      readSequence,
      response.sessionDraft,
    );
    if (pendingDraft !== undefined) {
      this.#pendingMemory = updateDisplayDraft(
        createDisplayTransientMemory(this.#memory.committed),
        pendingDraft,
      );
    }
  }

  #notify(): void {
    const view = this.snapshot();
    setCommunicationTextVisible(view.display.current.communicationTextChipEnabled);
    setPulseVisible(view.display.current.communicationPulseEnabled);
    for (const listener of this.#listeners) listener(view);
  }
}
