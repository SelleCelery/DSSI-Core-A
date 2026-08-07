import type { ObservationMode } from './configuration';

export type StateTransitionStatus = 'confirmed' | 'degraded' | 'applying' | 'rejected' | 'failed';

export type StateDiscrepancyCode =
  | 'network_permission_missing'
  | 'network_permission_residual'
  | 'network_listener_missing'
  | 'network_listener_residual'
  | 'content_runtime_unreachable'
  | 'content_runtime_stale'
  | 'unsupported_page'
  | 'observer_state_mismatch'
  | 'record_count_unavailable'
  | 'permission_request_denied'
  | 'permission_change_failed'
  | 'configuration_write_failed';

export interface StateDiscrepancy {
  code: StateDiscrepancyCode;
  scope: 'permission' | 'background' | 'current_tab' | 'records' | 'configuration';
}

export interface CurrentTabEffectiveState {
  tabId?: number;
  urlKind: 'supported' | 'unsupported' | 'unavailable';
  topFrameRuntime: 'active' | 'paused' | 'stale' | 'unreachable' | 'not_applicable';
  configurationRevisionApplied?: string;
  domObserverActive?: boolean;
  submissionObserverActive?: boolean;
  effectiveDisplaySource?: 'temporary' | 'host' | 'global';
}

export interface EffectiveStateSnapshot {
  snapshotId: string;
  observedAt: number;
  configurationRevision: string;
  requestedMode: ObservationMode;
  effectiveMode: ObservationMode;
  transitionStatus: StateTransitionStatus;
  permission: {
    networkMetadataGranted: boolean;
  };
  background: {
    networkListenerRegistered: boolean;
    configurationRevisionApplied: string;
  };
  currentTab: CurrentTabEffectiveState;
  records: {
    activity: number;
    diagnostic: number;
    total: number;
  };
  discrepancies: StateDiscrepancy[];
}
