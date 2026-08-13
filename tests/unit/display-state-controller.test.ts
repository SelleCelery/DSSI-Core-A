import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from '../../src/core/models/settings';
import type { SettingsMemoryResponse } from '../../src/core/models/settings-memory';
import { DisplayStateController } from '../../src/ui/display-state-controller';

function response(): SettingsMemoryResponse {
  return {
    ok: true,
    settings: { ...DEFAULT_SETTINGS, enabled: true },
    reaction: {
      source: { kind: 'global' },
      revision: 'global:1',
      updatedAt: 1,
      bundle: {
        communicationPulseEnabled: true,
        communicationTextChipEnabled: false,
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
  vi.unstubAllGlobals();
});

describe('display state controller', () => {
  it('publishes one render revision to every display surface', () => {
    vi.stubGlobal('chrome', {});
    const controller = new DisplayStateController('example.test', response());
    const before = controller.snapshot();
    controller.acknowledge('communication_pulse', before.renderRevision);
    controller.acknowledge('settings_panel', before.renderRevision);
    controller.acknowledge('text_chip', before.renderRevision);
    expect(controller.surfacesSynchronized()).toBe(true);

    controller.updateDraft({ factChipPosition: 'left' });
    expect(controller.snapshot().settings.factChipPosition).toBe('left');
    expect(controller.surfacesSynchronized()).toBe(false);

    const after = controller.snapshot();
    controller.acknowledge('communication_pulse', after.renderRevision);
    controller.acknowledge('settings_panel', after.renderRevision);
    controller.acknowledge('text_chip', after.renderRevision);
    expect(controller.surfacesSynchronized()).toBe(true);
  });
});
