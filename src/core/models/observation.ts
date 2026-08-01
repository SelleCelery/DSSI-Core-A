export type TriggerType =
  | 'page_observation_started'
  | 'password_field_focus'
  | 'email_or_id_field_focus'
  | 'payment_field_focus'
  | 'personal_info_field_focus'
  | 'free_text_surface_focus'
  | 'unknown_input_surface_focus'
  | 'paste_event_observed'
  | 'paste_into_field'
  | 'paste_reflected_in_field'
  | 'keyboard_input_started'
  | 'autofill_or_manager_suspected'
  | 'script_or_unknown_value_change'
  | 'submit_attempt'
  | 'submitter_activation_observed'
  | 'enter_submit_candidate'
  | 'external_domain_click'
  | 'download_attempt'
  | 'consent_control_focus'
  | 'consent_control_checked'
  | 'live_sync_surface_detected'
  | 'network_activity_during_input'
  | 'network_activity_after_content_edit'
  | 'network_activity_after_submit_operation'
  | 'network_activity_without_correlated_operation'
  | 'partially_observable_surface'
  | 'unobservable_surface';

export type SurfaceType =
  | 'page'
  | 'password'
  | 'email_or_id'
  | 'payment'
  | 'personal_information'
  | 'free_text'
  | 'ai_prompt'
  | 'comment'
  | 'chat'
  | 'webmail'
  | 'cloud_editor'
  | 'consent'
  | 'download_link'
  | 'external_navigation'
  | 'unknown';

export type ObservationScope =
  | 'input_surface_and_dom_events'
  | 'declared_submission_boundary'
  | 'submission_boundary_partial'
  | 'network_metadata_only'
  | 'page_surface_partial'
  | 'unobservable'
  | 'unsupported';

export type OperationEvidence =
  | 'extension_observation'
  | 'direct_trusted_event'
  | 'correlated_trusted_events'
  | 'browser_network_api_observation'
  | 'inferred_from_trusted_event'
  | 'untrusted_or_unknown';

export type FrameType = 'top' | 'iframe';

export type LogLayer = 'activity' | 'diagnostic';

export type InputOrigin =
  | 'keyboard_confirmed'
  | 'paste_confirmed'
  | 'autofill_or_manager_suspected'
  | 'script_or_unknown_update'
  | 'unknown';

export type ClassificationConfidence = 'explicit' | 'heuristic' | 'generic' | 'unknown';

export type LegacyObservabilityState =
  'observable' | 'partially_observable' | 'high_uncertainty' | 'unobservable' | 'unsupported';

import type {
  DestinationRelation,
  SubmissionAssociation,
  SubmissionEncoding,
  SubmissionMechanism,
  SubmissionMethod,
} from './submission';
import type {
  NetworkCorrelation,
  NetworkMechanism,
  NetworkMethod,
  NetworkPayloadObservation,
  CookieHeaderDetection,
  PageObservationTiming,
} from './network';

export interface ObservationLogRecord {
  schemaVersion?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  eventId: string;
  timestamp: number;
  sessionId: string;
  settingsSnapshotId?: string;
  domainKey: string;
  logLayer?: LogLayer;
  frameType?: FrameType;
  topLevelDomain?: string;
  frameDomain?: string;
  surfaceType: SurfaceType;
  triggerType: TriggerType;
  observationScope?: ObservationScope;
  operationEvidence?: OperationEvidence;
  /** @deprecated Sprint 1/1.1 compatibility only. */
  observability?: LegacyObservabilityState;
  viscosityLevel: 1 | 2 | 3;
  cuePresented: boolean;
  inputOrigin?: InputOrigin;
  classificationConfidence?: ClassificationConfidence;
  submissionMethod?: SubmissionMethod;
  submissionEncoding?: SubmissionEncoding;
  destinationRelation?: DestinationRelation;
  destinationScheme?: string;
  destinationHost?: string;
  submissionMechanism?: SubmissionMechanism;
  submissionAssociation?: SubmissionAssociation;
  declaredDestinationObservable?: boolean;
  networkMethod?: NetworkMethod;
  networkMechanism?: NetworkMechanism;
  networkCorrelation?: NetworkCorrelation;
  networkPayloadObservation?: NetworkPayloadObservation;
  cookieHeaderDetection?: CookieHeaderDetection;
  pageObservationTiming?: PageObservationTiming;
  surfaceTagName?: string;
  surfaceInputType?: string;
  surfaceRole?: string;
  surfaceIsContentEditable?: boolean;
  surfaceAutocompleteTokens?: string[];
}
