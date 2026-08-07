import type { ConnectBitsConfiguration, ObservationMode } from './models/configuration';
import type {
  CurrentTabEffectiveState,
  EffectiveStateSnapshot,
  StateDiscrepancy,
} from './models/effective-state';

export interface EffectiveStateFacts {
  networkMetadataGranted: boolean;
  networkListenerRegistered: boolean;
  backgroundConfigurationRevisionApplied?: string;
  currentTab?: CurrentTabEffectiveState;
  records?: {
    activity: number;
    diagnostic: number;
  };
}

export interface EffectiveStateStamp {
  observedAt?: number;
  snapshotId?: string;
}

const UNAVAILABLE_TAB: CurrentTabEffectiveState = {
  urlKind: 'unavailable',
  topFrameRuntime: 'unreachable',
};

function effectiveObservationMode(
  requestedMode: ObservationMode,
  facts: Pick<EffectiveStateFacts, 'networkMetadataGranted' | 'networkListenerRegistered'>,
): ObservationMode {
  if (requestedMode === 'paused') return 'paused';
  if (requestedMode === 'dom_only') return 'dom_only';
  return facts.networkMetadataGranted && facts.networkListenerRegistered ? 'standard' : 'dom_only';
}

function backgroundDiscrepancies(
  requestedMode: ObservationMode,
  facts: Pick<EffectiveStateFacts, 'networkMetadataGranted' | 'networkListenerRegistered'>,
): StateDiscrepancy[] {
  const discrepancies: StateDiscrepancy[] = [];

  if (requestedMode === 'standard') {
    if (!facts.networkMetadataGranted) {
      discrepancies.push({ code: 'network_permission_missing', scope: 'permission' });
    }
    if (!facts.networkListenerRegistered) {
      discrepancies.push({ code: 'network_listener_missing', scope: 'background' });
    }
  } else {
    if (facts.networkMetadataGranted) {
      discrepancies.push({ code: 'network_permission_residual', scope: 'permission' });
    }
    if (facts.networkListenerRegistered) {
      discrepancies.push({ code: 'network_listener_residual', scope: 'background' });
    }
  }

  return discrepancies;
}

export function deriveEffectiveState(
  configuration: ConnectBitsConfiguration,
  facts: EffectiveStateFacts,
  stamp: EffectiveStateStamp = {},
): EffectiveStateSnapshot {
  const requestedMode = configuration.observation.requestedMode;
  const discrepancies = backgroundDiscrepancies(requestedMode, facts);
  const activity = facts.records?.activity ?? 0;
  const diagnostic = facts.records?.diagnostic ?? 0;

  return {
    snapshotId: stamp.snapshotId ?? crypto.randomUUID(),
    observedAt: stamp.observedAt ?? Date.now(),
    configurationRevision: configuration.revision,
    requestedMode,
    effectiveMode: effectiveObservationMode(requestedMode, facts),
    transitionStatus: discrepancies.length === 0 ? 'confirmed' : 'degraded',
    permission: {
      networkMetadataGranted: facts.networkMetadataGranted,
    },
    background: {
      networkListenerRegistered: facts.networkListenerRegistered,
      configurationRevisionApplied:
        facts.backgroundConfigurationRevisionApplied ?? configuration.revision,
    },
    currentTab: facts.currentTab ?? UNAVAILABLE_TAB,
    records: {
      activity,
      diagnostic,
      total: activity + diagnostic,
    },
    discrepancies,
  };
}
