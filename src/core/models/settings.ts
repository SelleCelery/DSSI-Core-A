export type ViscosityLevel = 1 | 2 | 3;

export interface DssiSettings {
  enabled: boolean;
  viscosityLevel: ViscosityLevel;
  localClassificationEnabled: boolean;
  networkObservationEnabled: boolean;
  downloadObservationEnabled: boolean;
  persistentHistoryEnabled: boolean;
}

export const DEFAULT_SETTINGS: Readonly<DssiSettings> = Object.freeze({
  enabled: true,
  viscosityLevel: 1,
  localClassificationEnabled: false,
  networkObservationEnabled: false,
  downloadObservationEnabled: false,
  persistentHistoryEnabled: false,
});
