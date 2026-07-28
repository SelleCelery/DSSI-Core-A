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
  | 'external_domain_click'
  | 'download_attempt'
  | 'consent_control_focus'
  | 'consent_control_checked'
  | 'live_sync_surface_detected'
  | 'network_activity_during_input'
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

/**
 * The scope DSSI can currently inspect for this record.
 * This does not assert that a destination, transmission, storage behavior,
 * or safety property has been observed.
 */
export type ObservationScope =
  'input_surface_and_dom_events' | 'page_surface_partial' | 'unobservable' | 'unsupported';

/** How the operation claim was supported. */
export type OperationEvidence =
  | 'extension_observation'
  | 'direct_trusted_event'
  | 'correlated_trusted_events'
  | 'inferred_from_trusted_event'
  | 'untrusted_or_unknown';

export type InputOrigin =
  | 'keyboard_confirmed'
  | 'paste_confirmed'
  | 'autofill_or_manager_suspected'
  | 'script_or_unknown_update'
  | 'unknown';

export type ClassificationConfidence = 'explicit' | 'heuristic' | 'generic' | 'unknown';

/** Legacy Sprint 1/1.1 field retained only for session-log compatibility. */
export type LegacyObservabilityState =
  'observable' | 'partially_observable' | 'high_uncertainty' | 'unobservable' | 'unsupported';

export interface ObservationLogRecord {
  schemaVersion?: 1 | 2;
  eventId: string;
  timestamp: number;
  sessionId: string;
  domainKey: string;
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
}
