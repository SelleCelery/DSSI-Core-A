export type ViscosityLevel = 1 | 2 | 3;
export type ReportingMode = 'standard' | 'max_coverage';
export type FactChipPosition = 'top' | 'left' | 'bottom' | 'right';

export interface DssiSettings {
  enabled: boolean;
  viscosityLevel: ViscosityLevel;
  reportingMode: ReportingMode;
  factChipPosition: FactChipPosition;
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
