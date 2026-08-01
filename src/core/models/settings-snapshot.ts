import type {
  CommunicationPulseColor,
  CommunicationPulseDurationMs,
  CommunicationPulseOpacity,
  CommunicationPulseSize,
  FactChipPosition,
  ReportingMode,
  ViscosityLevel,
} from './settings';

export interface ObservationSettingsSnapshot {
  id: string;
  capturedAt: number;
  hostname: string;
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
  hostProfileApplied: boolean;
}
