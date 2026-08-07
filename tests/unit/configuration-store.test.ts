import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from '../../src/core/models/settings';
import {
  CONFIGURATION_STORAGE_KEY,
  LEGACY_SETTINGS_STORAGE_KEY,
  loadConfiguration,
} from '../../src/storage/configuration-store';
import {
  invalidateHostDisplayProfileCache,
  replaceHostDisplayProfile,
} from '../../src/storage/host-display-profile-store';
import { saveSettings } from '../../src/storage/settings-store';

const HOST_PROFILES_KEY = 'dssiHostDisplayProfiles';

describe('configuration storage boundaries', () => {
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

  it('migrates legacy global settings into the canonical configuration', async () => {
    storage[LEGACY_SETTINGS_STORAGE_KEY] = {
      ...DEFAULT_SETTINGS,
      enabled: true,
      networkObservationEnabled: true,
      factChipPosition: 'bottom',
      localClassificationEnabled: true,
    };

    const configuration = await loadConfiguration();

    expect(configuration.observation.requestedMode).toBe('standard');
    expect(configuration.presentation.factChipPosition).toBe('bottom');
    expect(storage[CONFIGURATION_STORAGE_KEY]).toEqual(configuration);
    expect(storage[LEGACY_SETTINGS_STORAGE_KEY]).toMatchObject({
      localClassificationEnabled: false,
      downloadObservationEnabled: false,
      persistentHistoryEnabled: false,
    });
  });

  it('updates common settings without creating or changing host overrides', async () => {
    storage[HOST_PROFILES_KEY] = {
      'example.test': {
        schemaVersion: 1,
        hostname: 'example.test',
        overrides: { position: 'left' },
        updatedAt: 100,
      },
    };

    await saveSettings({ ...DEFAULT_SETTINGS, factChipPosition: 'bottom' }, 'options');

    expect(
      (storage[CONFIGURATION_STORAGE_KEY] as { presentation: { factChipPosition: string } })
        .presentation.factChipPosition,
    ).toBe('bottom');
    expect(storage[HOST_PROFILES_KEY]).toEqual({
      'example.test': {
        schemaVersion: 1,
        hostname: 'example.test',
        overrides: { position: 'left' },
        updatedAt: 100,
      },
    });
  });

  it('updates host overrides without changing the common configuration', async () => {
    await saveSettings({ ...DEFAULT_SETTINGS, factChipPosition: 'bottom' }, 'options');
    const configurationBefore = storage[CONFIGURATION_STORAGE_KEY];

    await replaceHostDisplayProfile('Example.Test', { position: 'left' });

    expect(storage[CONFIGURATION_STORAGE_KEY]).toBe(configurationBefore);
    expect(storage[HOST_PROFILES_KEY]).toMatchObject({
      'example.test': {
        schemaVersion: 1,
        hostname: 'example.test',
        overrides: { position: 'left' },
      },
    });
  });
});
