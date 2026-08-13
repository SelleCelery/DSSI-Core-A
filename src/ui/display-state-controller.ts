import {
  acceptDisplayReaction,
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
  saveHostDisplayPatch,
} from '../storage/settings-memory-client';
import { setCommunicationTextVisible, setPulseVisible } from './transient-display-state';

export type DisplaySurface = 'communication_pulse' | 'settings_panel' | 'text_chip';
export type DisplaySynchronization = 'synchronized' | 'writing' | 'error';

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
  #readSequence = 0;
  #writeQueue: Promise<void> = Promise.resolve();
  #synchronization: DisplaySynchronization = 'synchronized';

  public constructor(hostname: string, initial: SettingsMemoryResponse) {
    if (!initial.ok) throw new Error(initial.reason ?? 'settings memory unavailable');
    this.#hostname = hostname;
    this.#globalSettings = initial.settings;
    this.#memory = createDisplayTransientMemory(initial.reaction);
    this.#notify();
  }

  public snapshot(): DisplayStateView {
    const display = displayMemorySnapshot(this.#memory);
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
  }

  public surfacesSynchronized(): boolean {
    const revision = this.snapshot().renderRevision;
    return (['communication_pulse', 'settings_panel', 'text_chip'] as const).every(
      (surface) => this.#appliedRevisions.get(surface) === revision,
    );
  }

  public updateDraft(patch: Partial<DisplaySettingsBundle>): void {
    this.#memory = updateDisplayDraft(this.#memory, patch);
    this.#synchronization = 'synchronized';
    this.#notify();
  }

  public refresh(): Promise<DisplayStateView> {
    const readSequence = ++this.#readSequence;
    return readSettingsMemory(this.#hostname).then((response) => {
      if (!response.ok) throw new Error(response.reason ?? 'settings memory unavailable');
      this.#globalSettings = response.settings;
      this.#memory = acceptDisplayReaction(this.#memory, response.reaction, readSequence);
      this.#synchronization = 'synchronized';
      this.#notify();
      return this.snapshot();
    });
  }

  public saveHostDraft(): Promise<SettingsMemoryResponse> {
    return this.#enqueueWrite(async () => {
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
      this.#memory = acceptDisplayReaction(this.#memory, response.reaction, readSequence);
      this.#synchronization = response.ok ? 'synchronized' : 'error';
      this.#notify();
      return response;
    });
  }

  public removeHostMemory(): Promise<SettingsMemoryResponse> {
    return this.#enqueueWrite(async () => {
      const before = displayMemorySnapshot(this.#memory);
      const readSequence = ++this.#readSequence;
      const response = await removeHostDisplayMemory(this.#hostname, before.committed.revision);
      this.#globalSettings = response.settings;
      if (response.ok) {
        this.#memory = clearDisplayDraftAtRevision(this.#memory, before.draftRevision);
      }
      this.#memory = acceptDisplayReaction(this.#memory, response.reaction, readSequence);
      this.#synchronization = response.ok ? 'synchronized' : 'error';
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

  #notify(): void {
    const view = this.snapshot();
    setCommunicationTextVisible(view.display.current.communicationTextChipEnabled);
    setPulseVisible(view.display.current.communicationPulseEnabled);
    for (const listener of this.#listeners) listener(view);
  }
}
