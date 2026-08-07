import { describe, expect, it } from 'vitest';
import {
  configurationFromLegacySettings,
  configurationWithLegacySettings,
  isConnectBitsConfiguration,
  legacySettingsFromConfiguration,
} from '../../src/core/models/configuration';
import { DEFAULT_SETTINGS } from '../../src/core/models/settings';

describe('canonical ConnectBits configuration', () => {
  it.each([
    { enabled: true, networkObservationEnabled: true, expected: 'standard' },
    { enabled: true, networkObservationEnabled: false, expected: 'dom_only' },
    { enabled: false, networkObservationEnabled: true, expected: 'paused' },
    { enabled: false, networkObservationEnabled: false, expected: 'paused' },
  ] as const)(
    'migrates enabled=$enabled and network=$networkObservationEnabled to $expected',
    ({ enabled, networkObservationEnabled, expected }) => {
      const configuration = configurationFromLegacySettings(
        { ...DEFAULT_SETTINGS, enabled, networkObservationEnabled },
        { changedAt: 100, revision: 'migration-revision' },
      );

      expect(configuration.observation).toEqual({
        requestedMode: expected,
        changedAt: 100,
        changedFrom: 'migration',
      });
      expect(isConnectBitsConfiguration(configuration)).toBe(true);
    },
  );

  it('keeps only implemented global settings in the canonical configuration', () => {
    const configuration = configurationFromLegacySettings(
      {
        ...DEFAULT_SETTINGS,
        localClassificationEnabled: true,
        downloadObservationEnabled: true,
        persistentHistoryEnabled: true,
      },
      { changedAt: 100, revision: 'migration-revision' },
    );

    expect(configuration).not.toHaveProperty('localClassificationEnabled');
    expect(configuration.presentation).not.toHaveProperty('localClassificationEnabled');
    expect(legacySettingsFromConfiguration(configuration)).toMatchObject({
      localClassificationEnabled: false,
      downloadObservationEnabled: false,
      persistentHistoryEnabled: false,
    });
  });

  it('updates the requested mode without treating permission as saved configuration', () => {
    const current = configurationFromLegacySettings(DEFAULT_SETTINGS, {
      changedAt: 100,
      revision: 'before',
    });
    const updated = configurationWithLegacySettings(
      current,
      { ...DEFAULT_SETTINGS, enabled: true, networkObservationEnabled: true },
      { changedAt: 200, changedFrom: 'options', revision: 'after' },
    );

    expect(updated.revision).toBe('after');
    expect(updated.observation).toEqual({
      requestedMode: 'standard',
      changedAt: 200,
      changedFrom: 'options',
    });
    expect(updated).not.toHaveProperty('permission');
  });

  it('does not create a revision when a compatibility save changes nothing', () => {
    const current = configurationFromLegacySettings(DEFAULT_SETTINGS, {
      changedAt: 100,
      revision: 'same',
    });
    const updated = configurationWithLegacySettings(
      current,
      { ...DEFAULT_SETTINGS },
      {
        changedAt: 200,
        changedFrom: 'popup',
        revision: 'unused',
      },
    );

    expect(updated).toBe(current);
  });
});
