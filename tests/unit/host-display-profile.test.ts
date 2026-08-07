import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../../src/core/models/settings';
import {
  applyHostDisplayProfile,
  hostDisplayOverridesFromEffectiveSettings,
  isHostDisplayProfileStale,
  migrateHostDisplayProfiles,
} from '../../src/storage/host-display-profile-store';

describe('host display profiles', () => {
  it('overrides display density without changing viscosity or reporting mode', () => {
    const result = applyHostDisplayProfile(
      { ...DEFAULT_SETTINGS, viscosityLevel: 3, reportingMode: 'max_coverage' },
      {
        schemaVersion: 1,
        hostname: 'example.test',
        overrides: {
          pulseVisible: false,
          communicationTextVisible: true,
          position: 'bottom_right',
          pulseOpacity: 0.4,
          domColor: 'yellow',
          webRequestColor: 'neutral',
        },
        updatedAt: 100,
      },
    );

    expect(result.communicationPulseEnabled).toBe(false);
    expect(result.communicationTextChipEnabled).toBe(true);
    expect(result.factChipPosition).toBe('bottom_right');
    expect(result.communicationPulseOpacity).toBe(0.4);
    expect(result.communicationPulseDomColor).toBe('yellow');
    expect(result.communicationPulseWebRequestColor).toBe('neutral');
    expect(result.viscosityLevel).toBe(3);
    expect(result.reportingMode).toBe('max_coverage');
  });

  it('marks only sufficiently old profiles for review', () => {
    const profile = {
      schemaVersion: 1 as const,
      hostname: 'example.test',
      overrides: { position: 'right' as const },
      updatedAt: 0,
    };
    expect(isHostDisplayProfileStale(profile, 91 * 24 * 60 * 60 * 1000)).toBe(true);
    expect(isHostDisplayProfileStale(profile, 30 * 24 * 60 * 60 * 1000)).toBe(false);
  });

  it('stores only differences from global display settings', () => {
    const overrides = hostDisplayOverridesFromEffectiveSettings(DEFAULT_SETTINGS, {
      ...DEFAULT_SETTINGS,
      factChipPosition: 'bottom_right',
      communicationPulseDomColor: 'yellow',
    });

    expect(overrides).toEqual({
      position: 'bottom_right',
      domColor: 'yellow',
    });
  });

  it('migrates legacy flat profiles without writing into global settings', () => {
    const profiles = migrateHostDisplayProfiles({
      'Example.Test': {
        hostname: 'Example.Test',
        pulseVisible: false,
        position: 'bottom_left',
        pulseDurationMs: 700,
        updatedAt: 100,
      },
    });

    expect(profiles).toEqual({
      'example.test': {
        schemaVersion: 1,
        hostname: 'example.test',
        overrides: {
          pulseVisible: false,
          position: 'bottom_left',
          pulseDurationMs: 700,
        },
        updatedAt: 100,
      },
    });
  });
});
