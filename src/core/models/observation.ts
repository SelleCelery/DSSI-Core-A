export type TriggerType =
  | 'page_observation_started'
  | 'password_field_focus'
  | 'email_or_id_field_focus'
  | 'payment_field_focus'
  | 'personal_info_field_focus'
  | 'free_text_surface_focus'
  | 'unknown_input_surface_focus'
  | 'paste_into_field'
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

export type ObservabilityState =
  'observable' | 'partially_observable' | 'high_uncertainty' | 'unobservable' | 'unsupported';

export type InputOrigin =
  | 'keyboard_confirmed'
  | 'paste_confirmed'
  | 'autofill_or_manager_suspected'
  | 'script_or_unknown_update'
  | 'unknown';

export type ClassificationConfidence = 'explicit' | 'heuristic' | 'generic';

export interface ObservationLogRecord {
  eventId: string;
  timestamp: number;
  sessionId: string;
  domainKey: string;
  surfaceType: SurfaceType;
  triggerType: TriggerType;
  observability: ObservabilityState;
  viscosityLevel: 1 | 2 | 3;
  cuePresented: boolean;
  inputOrigin?: InputOrigin;
  classificationConfidence?: ClassificationConfidence;
}
