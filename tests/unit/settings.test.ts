import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS,
  communicationPulseAvailable,
  effectiveCueLevel,
  shouldPresentCommunicationPulse,
} from '../../src/core/models/settings';

describe('default settings', () => {
  it('starts in silent standard mode with optional analysis disabled', () => {
    expect(DEFAULT_SETTINGS).toEqual({
      enabled: true,
      viscosityLevel: 1,
      reportingMode: 'standard',
      factChipPosition: 'right',
      communicationPulseEnabled: true,
      communicationTextChipEnabled: false,
      communicationPulseDurationMs: 700,
      communicationPulseSize: 'small',
      communicationPulseDomColor: 'magenta',
      communicationPulseWebRequestColor: 'cyan',
      communicationPulseOpacity: 0.8,
      localClassificationEnabled: false,
      networkObservationEnabled: false,
      downloadObservationEnabled: false,
      persistentHistoryEnabled: false,
      uiLanguage: 'auto',
    });
  });

  it('treats MAX as a reporting mode that includes Level 3 cues without creating Level 4', () => {
    expect(effectiveCueLevel({ viscosityLevel: 1, reportingMode: 'standard' })).toBe(1);
    expect(effectiveCueLevel({ viscosityLevel: 1, reportingMode: 'max_coverage' })).toBe(3);
    expect(effectiveCueLevel({ viscosityLevel: 3, reportingMode: 'max_coverage' })).toBe(3);
  });

  it('makes the pulse HUD available from Level 2 upward or in MAX', () => {
    expect(communicationPulseAvailable({ viscosityLevel: 1, reportingMode: 'standard' })).toBe(
      false,
    );
    expect(communicationPulseAvailable({ viscosityLevel: 2, reportingMode: 'standard' })).toBe(
      true,
    );
    expect(communicationPulseAvailable({ viscosityLevel: 1, reportingMode: 'max_coverage' })).toBe(
      true,
    );
  });

  it('shows communication pulses only from Level 2 upward or in MAX and when visible', () => {
    expect(
      shouldPresentCommunicationPulse({
        viscosityLevel: 1,
        reportingMode: 'standard',
        communicationPulseEnabled: true,
      }),
    ).toBe(false);
    expect(
      shouldPresentCommunicationPulse({
        viscosityLevel: 2,
        reportingMode: 'standard',
        communicationPulseEnabled: true,
      }),
    ).toBe(true);
    expect(
      shouldPresentCommunicationPulse({
        viscosityLevel: 1,
        reportingMode: 'max_coverage',
        communicationPulseEnabled: true,
      }),
    ).toBe(true);
    expect(
      shouldPresentCommunicationPulse({
        viscosityLevel: 3,
        reportingMode: 'max_coverage',
        communicationPulseEnabled: false,
      }),
    ).toBe(false);
  });
});
