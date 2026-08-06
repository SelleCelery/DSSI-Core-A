import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../../src/core/models/settings';
import { applyRuntimeSettings } from '../../src/content/runtime-settings';

describe('content runtime settings', () => {
  it('replaces the paused snapshot when observation resumes', () => {
    const current = { ...DEFAULT_SETTINGS };
    const updated = {
      ...DEFAULT_SETTINGS,
      enabled: true,
      networkObservationEnabled: true,
      reportingMode: 'max_coverage' as const,
      viscosityLevel: 3 as const,
    };

    expect(applyRuntimeSettings(current, updated)).toEqual({
      wasEnabled: false,
      becameEnabled: true,
    });
    expect(current).toEqual(updated);
  });

  it('does not report a resume transition for an already active observer', () => {
    const current = { ...DEFAULT_SETTINGS, enabled: true };
    const updated = { ...current, communicationPulseEnabled: false };

    expect(applyRuntimeSettings(current, updated)).toEqual({
      wasEnabled: true,
      becameEnabled: false,
    });
    expect(current.communicationPulseEnabled).toBe(false);
  });
});
