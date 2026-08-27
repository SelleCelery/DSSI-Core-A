import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from '../../src/core/models/settings';
import type { SettingsMemoryResponse } from '../../src/core/models/settings-memory';
import { DisplayStateController } from '../../src/ui/display-state-controller';
import {
  initializeTransientDisplayState,
  setPulsePaused,
  transientDisplayState,
} from '../../src/ui/transient-display-state';

function response(): SettingsMemoryResponse {
  return {
    ok: true,
    settings: { ...DEFAULT_SETTINGS, enabled: true, networkObservationEnabled: true },
    reaction: {
      source: { kind: 'global' },
      revision: 'global:1',
      updatedAt: 1,
      bundle: {
        communicationPulseEnabled: true,
        communicationTextChipEnabled: false,
        observationSettingsPanelVisible: true,
        factChipPosition: 'right',
        communicationPulseDurationMs: 700,
        communicationPulseOpacity: 0.8,
        communicationPulseDomColor: 'magenta',
        communicationPulseWebRequestColor: 'cyan',
      },
    },
  };
}

afterEach(() => {
  initializeTransientDisplayState({ communicationTextVisible: true, pulseVisible: true });
  vi.unstubAllGlobals();
});

describe('display state controller', () => {
  it('publishes one render revision to every display surface', async () => {
    let confirmWrite: ((value: SettingsMemoryResponse) => void) | undefined;
    const sendMessage = vi.fn(
      () =>
        new Promise<SettingsMemoryResponse>((resolve) => {
          confirmWrite = resolve;
        }),
    );
    vi.stubGlobal('chrome', { runtime: { sendMessage } });
    const controller = new DisplayStateController('example.test', response());
    const before = controller.snapshot();
    controller.acknowledge('communication_pulse', before.renderRevision);
    controller.acknowledge('settings_panel', before.renderRevision);
    controller.acknowledge('text_chip', before.renderRevision);
    expect(controller.surfacesSynchronized()).toBe(true);

    controller.updateDraft({ factChipPosition: 'left', communicationPulseOpacity: 1 });
    expect(controller.snapshot()).toMatchObject({
      settings: { factChipPosition: 'right', communicationPulseOpacity: 0.8 },
      synchronization: 'writing',
    });
    expect(controller.commandSnapshot().settings).toMatchObject({
      factChipPosition: 'left',
      communicationPulseOpacity: 1,
    });
    expect(controller.surfacesSynchronized()).toBe(true);

    await vi.waitFor(() => expect(sendMessage).toHaveBeenCalledTimes(1));
    const confirmed = response();
    confirmed.sessionDraft = {
      revision: 'draft:1',
      baseRevision: confirmed.reaction.revision,
      patch: { factChipPosition: 'left', communicationPulseOpacity: 1 },
      updatedAt: 2,
    };
    confirmWrite?.(confirmed);
    await vi.waitFor(() => expect(controller.snapshot().settings.factChipPosition).toBe('left'));
    expect(controller.snapshot().settings.communicationPulseOpacity).toBe(1);
    expect(controller.surfacesSynchronized()).toBe(false);

    const after = controller.snapshot();
    controller.acknowledge('communication_pulse', after.renderRevision);
    controller.acknowledge('settings_panel', after.renderRevision);
    controller.acknowledge('text_chip', after.renderRevision);
    expect(controller.surfacesSynchronized()).toBe(true);
    expect(controller.snapshot().synchronization).toBe('synchronized');
  });

  it('starts from a valid browser-session draft without committing it', () => {
    vi.stubGlobal('chrome', { runtime: { sendMessage: vi.fn() } });
    const initial = response();
    initial.sessionDraft = {
      revision: 'draft:1',
      baseRevision: initial.reaction.revision,
      patch: { factChipPosition: 'bottom_left', communicationPulseOpacity: 1 },
      updatedAt: 100,
    };

    const controller = new DisplayStateController('example.test', initial);

    expect(controller.snapshot()).toMatchObject({
      settings: { factChipPosition: 'bottom_left', communicationPulseOpacity: 1 },
      display: {
        committed: { bundle: { factChipPosition: 'right', communicationPulseOpacity: 0.8 } },
        draft: { factChipPosition: 'bottom_left', communicationPulseOpacity: 1 },
        dirty: true,
      },
    });
  });

  it('serializes complete session drafts and removes them after returning to base', async () => {
    const sent: unknown[] = [];
    const sendMessage = vi.fn((message: unknown) => {
      sent.push(message);
      const command = message as {
        action: 'save' | 'remove';
        baseRevision: string;
        patch: Record<string, unknown>;
      };
      const confirmed = response();
      if (command.action === 'save') {
        confirmed.sessionDraft = {
          revision: `draft:${sent.length}`,
          baseRevision: command.baseRevision,
          patch: command.patch,
          updatedAt: sent.length,
        };
      }
      return Promise.resolve(confirmed);
    });
    vi.stubGlobal('chrome', { runtime: { sendMessage } });
    const controller = new DisplayStateController('example.test', response());

    controller.updateDraft({ factChipPosition: 'left' });
    controller.updateDraft({ communicationPulseOpacity: 1 });
    await vi.waitFor(() => expect(sendMessage).toHaveBeenCalledTimes(2));

    expect(sent[0]).toMatchObject({
      action: 'save',
      patch: { factChipPosition: 'left' },
    });
    expect(sent[1]).toMatchObject({
      action: 'save',
      patch: { factChipPosition: 'left', communicationPulseOpacity: 1 },
    });

    controller.updateDraft({ factChipPosition: 'right' });
    controller.updateDraft({ communicationPulseOpacity: 0.8 });
    await vi.waitFor(() => expect(sendMessage).toHaveBeenCalledTimes(4));
    expect(sent[3]).toMatchObject({ action: 'remove', patch: {} });
  });

  it('restores a disabled pulse only after storage confirms re-enabling it', async () => {
    const sendMessage = vi.fn((message: unknown) => {
      const command = message as {
        action: 'save' | 'remove';
        baseRevision: string;
        patch: Record<string, unknown>;
      };
      const confirmed = response();
      if (command.action === 'save') {
        confirmed.sessionDraft = {
          revision: crypto.randomUUID(),
          baseRevision: command.baseRevision,
          patch: command.patch,
          updatedAt: Date.now(),
        };
      }
      return Promise.resolve(confirmed);
    });
    vi.stubGlobal('chrome', { runtime: { sendMessage } });
    const controller = new DisplayStateController('example.test', response());

    controller.updateDraft({ communicationPulseEnabled: false });
    await vi.waitFor(() =>
      expect(controller.snapshot().settings.communicationPulseEnabled).toBe(false),
    );
    setPulsePaused(true);

    controller.updateDraft({ communicationPulseEnabled: true });
    expect(controller.snapshot().settings.communicationPulseEnabled).toBe(false);
    await vi.waitFor(() =>
      expect(controller.snapshot().settings.communicationPulseEnabled).toBe(true),
    );

    expect(transientDisplayState()).toMatchObject({ pulseVisible: true, pulsePaused: false });
    expect(controller.snapshot().settings).toMatchObject({
      enabled: true,
      networkObservationEnabled: true,
    });
  });

  it('clears the independent pause latch when settings are reset', async () => {
    vi.stubGlobal('chrome', {
      runtime: { sendMessage: vi.fn(() => Promise.resolve(response())) },
    });
    const controller = new DisplayStateController('example.test', response());
    setPulsePaused(true);

    await controller.removeHostMemory();

    expect(transientDisplayState()).toMatchObject({ pulseVisible: true, pulsePaused: false });
  });

  it('rebases a session command issued during a host write onto the confirmed host revision', async () => {
    let confirmHostWrite: ((value: SettingsMemoryResponse) => void) | undefined;
    const sent: Array<Record<string, unknown>> = [];
    const hostResponse = response();
    hostResponse.reaction = {
      ...hostResponse.reaction,
      source: { kind: 'host', hostname: 'example.test' },
      revision: 'host:2',
    };
    const sendMessage = vi.fn((message: Record<string, unknown>) => {
      sent.push(message);
      if (message.type === 'DSSI_SETTINGS_MEMORY_WRITE') {
        return new Promise<SettingsMemoryResponse>((resolve) => {
          confirmHostWrite = resolve;
        });
      }
      const confirmed = structuredClone(hostResponse);
      confirmed.sessionDraft = {
        revision: 'draft:after-host-write',
        baseRevision: confirmed.reaction.revision,
        patch: { communicationPulseOpacity: 1 },
        updatedAt: 3,
      };
      return Promise.resolve(confirmed);
    });
    vi.stubGlobal('chrome', { runtime: { sendMessage } });
    const controller = new DisplayStateController('example.test', response());

    const hostWrite = controller.saveHostDraft();
    await vi.waitFor(() => expect(sendMessage).toHaveBeenCalledTimes(1));
    controller.updateDraft({ communicationPulseOpacity: 1 });
    expect(sendMessage).toHaveBeenCalledTimes(1);

    confirmHostWrite?.(hostResponse);
    await hostWrite;
    await vi.waitFor(() => expect(sendMessage).toHaveBeenCalledTimes(2));

    expect(sent[1]).toMatchObject({
      type: 'DSSI_SESSION_DISPLAY_DRAFT_WRITE',
      baseRevision: 'host:2',
      patch: { communicationPulseOpacity: 1 },
    });
    await vi.waitFor(() =>
      expect(controller.snapshot().settings.communicationPulseOpacity).toBe(1),
    );
  });
});
