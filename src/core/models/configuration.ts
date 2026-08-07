import type { UiLanguageSetting } from '../../i18n/ui';
import {
  DEFAULT_SETTINGS,
  type CommunicationPulseColor,
  type CommunicationPulseDurationMs,
  type CommunicationPulseOpacity,
  type CommunicationPulseSize,
  type DssiSettings,
  type FactChipPosition,
  type ObservationSelection,
  type ReportingMode,
  type ViscosityLevel,
} from './settings';

export const CONFIGURATION_SCHEMA_VERSION = 1 as const;

export type ObservationMode = ObservationSelection;
export type ConfigurationChangeSource =
  'onboarding' | 'popup' | 'options' | 'permission_event' | 'migration';

export interface GlobalPresentationSettings {
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
  uiLanguage: UiLanguageSetting;
}

export interface ConnectBitsConfiguration {
  schemaVersion: typeof CONFIGURATION_SCHEMA_VERSION;
  revision: string;
  observation: {
    requestedMode: ObservationMode;
    changedAt: number;
    changedFrom: ConfigurationChangeSource;
  };
  presentation: GlobalPresentationSettings;
}

export interface ConfigurationStamp {
  changedAt?: number;
  changedFrom?: ConfigurationChangeSource;
  revision?: string;
}

const VISCOSITY_LEVELS: readonly ViscosityLevel[] = [1, 2, 3];
const REPORTING_MODES: readonly ReportingMode[] = ['standard', 'max_coverage'];
const FACT_CHIP_POSITIONS: readonly FactChipPosition[] = [
  'top',
  'top_right',
  'right',
  'bottom_right',
  'bottom',
  'bottom_left',
  'left',
  'top_left',
];
const PULSE_DURATIONS: readonly CommunicationPulseDurationMs[] = [
  0, 300, 700, 1500, 3000, 10000, 30000, 60000,
];
const PULSE_SIZES: readonly CommunicationPulseSize[] = ['small', 'medium'];
const PULSE_COLORS: readonly CommunicationPulseColor[] = ['magenta', 'cyan', 'yellow', 'neutral'];
const PULSE_OPACITIES: readonly CommunicationPulseOpacity[] = [1, 0.8, 0.6, 0.4];
const UI_LANGUAGES: readonly UiLanguageSetting[] = ['auto', 'ja', 'en'];
const OBSERVATION_MODES: readonly ObservationMode[] = ['standard', 'dom_only', 'paused'];
const CHANGE_SOURCES: readonly ConfigurationChangeSource[] = [
  'onboarding',
  'popup',
  'options',
  'permission_event',
  'migration',
];

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isMember<T extends string | number>(values: readonly T[], value: unknown): value is T {
  return values.some((candidate) => candidate === value);
}

function booleanOr(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function memberOr<T extends string | number>(values: readonly T[], value: unknown, fallback: T): T {
  return isMember(values, value) ? value : fallback;
}

function normalizedLegacySettings(stored: Partial<DssiSettings> | undefined): DssiSettings {
  return {
    enabled: booleanOr(stored?.enabled, DEFAULT_SETTINGS.enabled),
    viscosityLevel: memberOr(
      VISCOSITY_LEVELS,
      stored?.viscosityLevel,
      DEFAULT_SETTINGS.viscosityLevel,
    ),
    reportingMode: memberOr(REPORTING_MODES, stored?.reportingMode, DEFAULT_SETTINGS.reportingMode),
    factChipPosition: memberOr(
      FACT_CHIP_POSITIONS,
      stored?.factChipPosition,
      DEFAULT_SETTINGS.factChipPosition,
    ),
    communicationPulseEnabled: booleanOr(
      stored?.communicationPulseEnabled,
      DEFAULT_SETTINGS.communicationPulseEnabled,
    ),
    communicationTextChipEnabled: booleanOr(
      stored?.communicationTextChipEnabled,
      DEFAULT_SETTINGS.communicationTextChipEnabled,
    ),
    communicationPulseDurationMs: memberOr(
      PULSE_DURATIONS,
      stored?.communicationPulseDurationMs,
      DEFAULT_SETTINGS.communicationPulseDurationMs,
    ),
    communicationPulseSize: memberOr(
      PULSE_SIZES,
      stored?.communicationPulseSize,
      DEFAULT_SETTINGS.communicationPulseSize,
    ),
    communicationPulseDomColor: memberOr(
      PULSE_COLORS,
      stored?.communicationPulseDomColor,
      DEFAULT_SETTINGS.communicationPulseDomColor,
    ),
    communicationPulseWebRequestColor: memberOr(
      PULSE_COLORS,
      stored?.communicationPulseWebRequestColor,
      DEFAULT_SETTINGS.communicationPulseWebRequestColor,
    ),
    communicationPulseOpacity: memberOr(
      PULSE_OPACITIES,
      stored?.communicationPulseOpacity,
      DEFAULT_SETTINGS.communicationPulseOpacity,
    ),
    localClassificationEnabled: false,
    networkObservationEnabled: booleanOr(
      stored?.networkObservationEnabled,
      DEFAULT_SETTINGS.networkObservationEnabled,
    ),
    downloadObservationEnabled: false,
    persistentHistoryEnabled: false,
    uiLanguage: memberOr(UI_LANGUAGES, stored?.uiLanguage, DEFAULT_SETTINGS.uiLanguage),
  };
}

export function requestedModeFromLegacySettings(
  settings: Pick<DssiSettings, 'enabled' | 'networkObservationEnabled'>,
): ObservationMode {
  if (!settings.enabled) return 'paused';
  return settings.networkObservationEnabled ? 'standard' : 'dom_only';
}

export function presentationFromLegacySettings(
  stored: Partial<DssiSettings> | undefined,
): GlobalPresentationSettings {
  const settings = normalizedLegacySettings(stored);
  return {
    viscosityLevel: settings.viscosityLevel,
    reportingMode: settings.reportingMode,
    factChipPosition: settings.factChipPosition,
    communicationPulseEnabled: settings.communicationPulseEnabled,
    communicationTextChipEnabled: settings.communicationTextChipEnabled,
    communicationPulseDurationMs: settings.communicationPulseDurationMs,
    communicationPulseSize: settings.communicationPulseSize,
    communicationPulseDomColor: settings.communicationPulseDomColor,
    communicationPulseWebRequestColor: settings.communicationPulseWebRequestColor,
    communicationPulseOpacity: settings.communicationPulseOpacity,
    uiLanguage: settings.uiLanguage,
  };
}

export function createConfigurationRevision(): string {
  return crypto.randomUUID();
}

export function configurationFromLegacySettings(
  stored: Partial<DssiSettings> | undefined,
  stamp: ConfigurationStamp = {},
): ConnectBitsConfiguration {
  const settings = normalizedLegacySettings(stored);
  return {
    schemaVersion: CONFIGURATION_SCHEMA_VERSION,
    revision: stamp.revision ?? createConfigurationRevision(),
    observation: {
      requestedMode: requestedModeFromLegacySettings(settings),
      changedAt: stamp.changedAt ?? Date.now(),
      changedFrom: stamp.changedFrom ?? 'migration',
    },
    presentation: presentationFromLegacySettings(settings),
  };
}

export function legacySettingsFromConfiguration(
  configuration: ConnectBitsConfiguration,
): DssiSettings {
  const requestedMode = configuration.observation.requestedMode;
  return {
    enabled: requestedMode !== 'paused',
    networkObservationEnabled: requestedMode === 'standard',
    ...configuration.presentation,
    localClassificationEnabled: false,
    downloadObservationEnabled: false,
    persistentHistoryEnabled: false,
  };
}

export function configurationWithLegacySettings(
  current: ConnectBitsConfiguration,
  stored: Partial<DssiSettings>,
  stamp: ConfigurationStamp = {},
): ConnectBitsConfiguration {
  const settings = normalizedLegacySettings(stored);
  const requestedMode = requestedModeFromLegacySettings(settings);
  const presentation = presentationFromLegacySettings(settings);
  const observationChanged = requestedMode !== current.observation.requestedMode;
  const presentationChanged = JSON.stringify(presentation) !== JSON.stringify(current.presentation);

  if (!observationChanged && !presentationChanged) return current;

  return {
    schemaVersion: CONFIGURATION_SCHEMA_VERSION,
    revision: stamp.revision ?? createConfigurationRevision(),
    observation: observationChanged
      ? {
          requestedMode,
          changedAt: stamp.changedAt ?? Date.now(),
          changedFrom: stamp.changedFrom ?? 'migration',
        }
      : current.observation,
    presentation,
  };
}

export function configurationForObservationMode(
  current: ConnectBitsConfiguration,
  requestedMode: ObservationMode,
  stamp: ConfigurationStamp = {},
): ConnectBitsConfiguration {
  if (current.observation.requestedMode === requestedMode) return current;
  return {
    ...current,
    revision: stamp.revision ?? createConfigurationRevision(),
    observation: {
      requestedMode,
      changedAt: stamp.changedAt ?? Date.now(),
      changedFrom: stamp.changedFrom ?? 'migration',
    },
  };
}

function isGlobalPresentationSettings(value: unknown): value is GlobalPresentationSettings {
  if (!isObject(value)) return false;
  return (
    isMember(VISCOSITY_LEVELS, value.viscosityLevel) &&
    isMember(REPORTING_MODES, value.reportingMode) &&
    isMember(FACT_CHIP_POSITIONS, value.factChipPosition) &&
    typeof value.communicationPulseEnabled === 'boolean' &&
    typeof value.communicationTextChipEnabled === 'boolean' &&
    isMember(PULSE_DURATIONS, value.communicationPulseDurationMs) &&
    isMember(PULSE_SIZES, value.communicationPulseSize) &&
    isMember(PULSE_COLORS, value.communicationPulseDomColor) &&
    isMember(PULSE_COLORS, value.communicationPulseWebRequestColor) &&
    isMember(PULSE_OPACITIES, value.communicationPulseOpacity) &&
    isMember(UI_LANGUAGES, value.uiLanguage)
  );
}

export function isConnectBitsConfiguration(value: unknown): value is ConnectBitsConfiguration {
  if (!isObject(value) || !isObject(value.observation)) return false;
  return (
    value.schemaVersion === CONFIGURATION_SCHEMA_VERSION &&
    typeof value.revision === 'string' &&
    value.revision.length > 0 &&
    isMember(OBSERVATION_MODES, value.observation.requestedMode) &&
    typeof value.observation.changedAt === 'number' &&
    Number.isFinite(value.observation.changedAt) &&
    isMember(CHANGE_SOURCES, value.observation.changedFrom) &&
    isGlobalPresentationSettings(value.presentation)
  );
}
