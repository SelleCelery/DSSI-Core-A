export type ViscosityLevel = 1 | 2 | 3;
export type ReportingMode = 'standard' | 'max_coverage';
export type FactChipPosition =
  'top' | 'top_right' | 'right' | 'bottom_right' | 'bottom' | 'bottom_left' | 'left' | 'top_left';
export type CommunicationPulseDurationMs = 300 | 700 | 1500 | 3000;
export type CommunicationPulseSize = 'small' | 'medium';

export interface DssiSettings {
  enabled: boolean;
  viscosityLevel: ViscosityLevel;
  reportingMode: ReportingMode;
  factChipPosition: FactChipPosition;
  communicationPulseEnabled: boolean;
  communicationPulseDurationMs: CommunicationPulseDurationMs;
  communicationPulseSize: CommunicationPulseSize;
  localClassificationEnabled: boolean;
  networkObservationEnabled: boolean;
  downloadObservationEnabled: boolean;
  persistentHistoryEnabled: boolean;
}

export const DEFAULT_SETTINGS: Readonly<DssiSettings> = Object.freeze({
  enabled: true,
  viscosityLevel: 1,
  reportingMode: 'standard',
  factChipPosition: 'right',
  communicationPulseEnabled: true,
  communicationPulseDurationMs: 700,
  communicationPulseSize: 'small',
  localClassificationEnabled: false,
  networkObservationEnabled: false,
  downloadObservationEnabled: false,
  persistentHistoryEnabled: false,
});

export function effectiveCueLevel(
  settings: Pick<DssiSettings, 'viscosityLevel' | 'reportingMode'>,
): ViscosityLevel {
  return settings.reportingMode === 'max_coverage' ? 3 : settings.viscosityLevel;
}

export function shouldPresentCommunicationPulse(
  settings: Pick<DssiSettings, 'viscosityLevel' | 'reportingMode' | 'communicationPulseEnabled'>,
): boolean {
  return (
    settings.communicationPulseEnabled &&
    (settings.reportingMode === 'max_coverage' || settings.viscosityLevel >= 2)
  );
}
