import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { invalidateHostDisplayProfileCache } from '../../src/storage/host-display-profile-store';
import {
  readSettingsMemory,
  writeSessionDisplayDraft,
  writeSettingsMemory,
} from '../../src/storage/settings-memory-store';

describe('settings memory storage round trip', () => {
  let storage: Record<string, unknown>;
  let sessionStorage: Record<string, unknown>;
  let sessionGet: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    storage = {};
    sessionStorage = {};
    sessionGet = vi.fn((key: string) =>
      key in sessionStorage ? { [key]: sessionStorage[key] } : {},
    );
    invalidateHostDisplayProfileCache();
    vi.stubGlobal('chrome', {
      storage: {
        local: {
          get: vi.fn((keys: string | string[]) => {
            const requested = Array.isArray(keys) ? keys : [keys];
            return Object.fromEntries(
              requested.filter((key) => key in storage).map((key) => [key, storage[key]]),
            );
          }),
          set: vi.fn((values: Record<string, unknown>) => {
            Object.assign(storage, values);
          }),
        },
        session: {
          get: sessionGet,
          set: vi.fn((values: Record<string, unknown>) => {
            Object.assign(sessionStorage, values);
          }),
        },
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps a host bundle independent from later global changes and returns to the latest global bundle on removal', async () => {
    const initial = await readSettingsMemory('example.test');
    const saved = await writeSettingsMemory({
      type: 'DSSI_SETTINGS_MEMORY_WRITE',
      operationId: 'host-save',
      destination: { kind: 'host', hostname: 'example.test' },
      action: 'save',
      baseRevision: initial.reaction.revision,
      patch: {
        factChipPosition: 'left',
        communicationTextChipEnabled: true,
        observationSettingsPanelVisible: false,
        communicationPulseOpacity: 1,
      },
    });

    expect(saved).toMatchObject({
      ok: true,
      reaction: {
        source: { kind: 'host', hostname: 'example.test' },
        bundle: {
          factChipPosition: 'left',
          communicationTextChipEnabled: true,
          observationSettingsPanelVisible: false,
          communicationPulseOpacity: 1,
        },
      },
    });

    await writeSettingsMemory({
      type: 'DSSI_SETTINGS_MEMORY_WRITE',
      operationId: 'global-save',
      destination: { kind: 'global' },
      action: 'patch',
      changedFrom: 'options',
      patch: { factChipPosition: 'top', communicationTextChipEnabled: false },
    });

    const hostAfterGlobalChange = await readSettingsMemory('example.test');
    expect(hostAfterGlobalChange.reaction).toMatchObject({
      source: { kind: 'host' },
      bundle: {
        factChipPosition: 'left',
        communicationTextChipEnabled: true,
        observationSettingsPanelVisible: false,
        communicationPulseOpacity: 1,
      },
    });

    const removed = await writeSettingsMemory({
      type: 'DSSI_SETTINGS_MEMORY_WRITE',
      operationId: 'host-remove',
      destination: { kind: 'host', hostname: 'example.test' },
      action: 'remove',
      baseRevision: hostAfterGlobalChange.reaction.revision,
      patch: {},
    });
    expect(removed.reaction).toMatchObject({
      source: { kind: 'global' },
      bundle: { factChipPosition: 'top', communicationTextChipEnabled: false },
    });
  });

  it('rejects a stale host write and returns the current confirmed reaction', async () => {
    const initial = await readSettingsMemory('example.test');
    const first = await writeSettingsMemory({
      type: 'DSSI_SETTINGS_MEMORY_WRITE',
      operationId: 'first',
      destination: { kind: 'host', hostname: 'example.test' },
      action: 'save',
      baseRevision: initial.reaction.revision,
      patch: { factChipPosition: 'left' },
    });
    const stale = await writeSettingsMemory({
      type: 'DSSI_SETTINGS_MEMORY_WRITE',
      operationId: 'stale',
      destination: { kind: 'host', hostname: 'example.test' },
      action: 'save',
      baseRevision: initial.reaction.revision,
      patch: { factChipPosition: 'top' },
    });

    expect(stale.ok).toBe(false);
    expect(stale.reason).toBe('conflict');
    expect(stale.reaction.revision).toBe(first.reaction.revision);
    expect(stale.reaction.bundle.factChipPosition).toBe('left');
  });

  it('copies a legacy host profile into a confirmed bundle without deleting the rollback source', async () => {
    storage.dssiHostDisplayProfiles = {
      'example.test': {
        schemaVersion: 1,
        hostname: 'example.test',
        overrides: { position: 'left' },
        updatedAt: 100,
      },
    };

    const migrated = await readSettingsMemory('example.test');

    expect(migrated.reaction).toMatchObject({
      source: { kind: 'host', hostname: 'example.test' },
      bundle: { factChipPosition: 'left' },
    });
    expect(storage.dssiHostDisplayProfiles).toMatchObject({
      'example.test': { overrides: { position: 'left' } },
    });
    expect(storage.connectBitsHostDisplayMemories).toMatchObject({
      'example.test': { bundle: { factChipPosition: 'left' } },
    });
  });

  it('migrates an earlier display bundle with the observation settings panel open', async () => {
    storage.connectBitsHostDisplayMemories = {
      'example.test': {
        schemaVersion: 1,
        hostname: 'example.test',
        revision: 'host:legacy',
        bundle: {
          communicationPulseEnabled: true,
          communicationTextChipEnabled: false,
          factChipPosition: 'right',
          communicationPulseDurationMs: 700,
          communicationPulseOpacity: 0.8,
          communicationPulseDomColor: 'magenta',
          communicationPulseWebRequestColor: 'cyan',
        },
        updatedAt: 100,
      },
    };

    const migrated = await readSettingsMemory('example.test');

    expect(migrated.reaction.bundle.observationSettingsPanelVisible).toBe(true);
    expect(storage.connectBitsHostDisplayMemories).toMatchObject({
      'example.test': {
        schemaVersion: 2,
        bundle: { observationSettingsPanelVisible: true },
      },
    });
  });

  it('restores a session draft and clears it after the same values are committed', async () => {
    const initial = await readSettingsMemory('example.test');
    const drafted = await writeSessionDisplayDraft({
      type: 'DSSI_SESSION_DISPLAY_DRAFT_WRITE',
      operationId: 'session-save',
      hostname: 'example.test',
      action: 'save',
      baseRevision: initial.reaction.revision,
      patch: { communicationPulseOpacity: 1, factChipPosition: 'left' },
    });

    expect(drafted).toMatchObject({
      ok: true,
      sessionDraft: {
        baseRevision: initial.reaction.revision,
        patch: { communicationPulseOpacity: 1, factChipPosition: 'left' },
      },
    });
    await expect(readSettingsMemory('example.test')).resolves.toMatchObject({
      sessionDraft: { patch: { communicationPulseOpacity: 1, factChipPosition: 'left' } },
    });

    const committed = await writeSettingsMemory({
      type: 'DSSI_SETTINGS_MEMORY_WRITE',
      operationId: 'host-save-after-draft',
      destination: { kind: 'host', hostname: 'example.test' },
      action: 'save',
      baseRevision: initial.reaction.revision,
      patch: drafted.sessionDraft?.patch ?? {},
    });

    expect(committed.ok).toBe(true);
    expect(committed.sessionDraft).toBeUndefined();
    expect(sessionStorage.connectBitsSessionDisplayDrafts).toEqual({});
  });

  it('rejects a session draft based on a superseded confirmed revision', async () => {
    const initial = await readSettingsMemory('example.test');
    await writeSettingsMemory({
      type: 'DSSI_SETTINGS_MEMORY_WRITE',
      operationId: 'host-save-before-stale-draft',
      destination: { kind: 'host', hostname: 'example.test' },
      action: 'save',
      baseRevision: initial.reaction.revision,
      patch: { factChipPosition: 'top' },
    });

    const rejected = await writeSessionDisplayDraft({
      type: 'DSSI_SESSION_DISPLAY_DRAFT_WRITE',
      operationId: 'stale-session-save',
      hostname: 'example.test',
      action: 'save',
      baseRevision: initial.reaction.revision,
      patch: { factChipPosition: 'left' },
    });

    expect(rejected).toMatchObject({ ok: false, reason: 'conflict' });
    expect(rejected.sessionDraft).toBeUndefined();
  });

  it('removes a session draft when every value returns to the confirmed bundle', async () => {
    const initial = await readSettingsMemory('example.test');
    await writeSessionDisplayDraft({
      type: 'DSSI_SESSION_DISPLAY_DRAFT_WRITE',
      operationId: 'temporary-change',
      hostname: 'example.test',
      action: 'save',
      baseRevision: initial.reaction.revision,
      patch: { factChipPosition: 'left' },
    });

    const returned = await writeSessionDisplayDraft({
      type: 'DSSI_SESSION_DISPLAY_DRAFT_WRITE',
      operationId: 'returned-to-base',
      hostname: 'example.test',
      action: 'save',
      baseRevision: initial.reaction.revision,
      patch: { factChipPosition: initial.reaction.bundle.factChipPosition },
    });

    expect(returned.sessionDraft).toBeUndefined();
    expect(sessionStorage.connectBitsSessionDisplayDrafts).toEqual({});
  });

  it('falls back to committed settings when session storage cannot be read', async () => {
    sessionGet.mockRejectedValueOnce(new Error('session unavailable'));

    await expect(readSettingsMemory('example.test')).resolves.toMatchObject({
      ok: true,
      reaction: { source: { kind: 'global' } },
    });
  });
});
