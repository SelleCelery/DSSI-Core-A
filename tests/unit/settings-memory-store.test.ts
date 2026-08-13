import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { invalidateHostDisplayProfileCache } from '../../src/storage/host-display-profile-store';
import { readSettingsMemory, writeSettingsMemory } from '../../src/storage/settings-memory-store';

describe('settings memory storage round trip', () => {
  let storage: Record<string, unknown>;

  beforeEach(() => {
    storage = {};
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
      patch: { factChipPosition: 'left', communicationTextChipEnabled: true },
    });

    expect(saved).toMatchObject({
      ok: true,
      reaction: {
        source: { kind: 'host', hostname: 'example.test' },
        bundle: { factChipPosition: 'left', communicationTextChipEnabled: true },
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
      bundle: { factChipPosition: 'left', communicationTextChipEnabled: true },
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
});
