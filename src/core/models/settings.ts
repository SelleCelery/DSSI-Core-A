import type { UiLanguageSetting } from '../../i18n/ui';

export type ViscosityLevel = 1 | 2 | 3;
export type ReportingMode = 'standard' | 'max_coverage';
export type ObservationSelection = 'standard' | 'dom_only' | 'paused';
export type FactChipPosition =
  'top' | 'top_right' | 'right' | 'bottom_right' | 'bottom' | 'bottom_left' | 'left' | 'top_left';
export type CommunicationPulseDurationMs = 0 | 300 | 700 | 1500 | 3000 | 10000 | 30000 | 60000;
export type CommunicationPulseSize = 'small' | 'medium';
export type CommunicationPulseColor = 'magenta' | 'cyan' | 'yellow' | 'neutral';
export type CommunicationPulseOpacity = 1 | 0.8 | 0.6 | 0.4;

export interface DssiSettings {
  enabled: boolean;
  viscosityLevel: ViscosityLevel;
  reportingMode: ReportingMode;
  factChipPosition: FactChipPosition;
  communicationPulseEnabled: boolean;
  communicationTextChipEnabled: boolean;
  communicationPulseDurationMs: CommunicationPulseDurationMs;
  communicationPulseSize: CommunicationPulseSize;
  communicationPulseDomColor: CommunicationPulseColor;
  communicationPulseWebRequestColor: CommunicationPulseColor;
  communicationPulseOpacity: CommunicationPulseOpacity;
  localClassificationEnabled: boolean;
  networkObservationEnabled: boolean;
  downloadObservationEnabled: boolean;
  persistentHistoryEnabled: boolean;
  uiLanguage: UiLanguageSetting;
}

export const DEFAULT_SETTINGS: Readonly<DssiSettings> = Object.freeze({
  enabled: false,
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

export function observationSelectionFromSettings(
  settings: Pick<DssiSettings, 'enabled' | 'networkObservationEnabled'>,
  networkPermissionGranted = true,
): ObservationSelection {
  if (!settings.enabled) return 'paused';
  return settings.networkObservationEnabled && networkPermissionGranted ? 'standard' : 'dom_only';
}

export function settingsForObservationSelection(
  settings: DssiSettings,
  selection: ObservationSelection,
): DssiSettings {
  switch (selection) {
    case 'standard':
      return { ...settings, enabled: true, networkObservationEnabled: true };
    case 'dom_only':
      return { ...settings, enabled: true, networkObservationEnabled: false };
    case 'paused':
      return { ...settings, enabled: false, networkObservationEnabled: false };
  }
}

export function effectiveCueLevel(
  settings: Pick<DssiSettings, 'viscosityLevel' | 'reportingMode'>,
): ViscosityLevel {
  return settings.reportingMode === 'max_coverage' ? 3 : settings.viscosityLevel;
}

export function communicationPulseAvailable(
  settings: Pick<DssiSettings, 'viscosityLevel' | 'reportingMode'>,
): boolean {
  return settings.reportingMode === 'max_coverage' || settings.viscosityLevel >= 2;
}

export function shouldPresentCommunicationPulse(
  settings: Pick<DssiSettings, 'viscosityLevel' | 'reportingMode' | 'communicationPulseEnabled'>,
): boolean {
  return (
    settings.communicationPulseEnabled &&
    (settings.reportingMode === 'max_coverage' || settings.viscosityLevel >= 2)
  );
}
