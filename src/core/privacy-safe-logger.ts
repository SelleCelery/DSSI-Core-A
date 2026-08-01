import type { ObservationLogRecord } from './models/observation';

const PROHIBITED_KEY_PARTS = [
  'value',
  'content',
  'body',
  'clipboard',
  'password',
  'paymentnumber',
  'prompt',
  'messagebody',
  'requestbody',
  'header',
  'cookie',
  'query',
  'fragment',
  'pathname',
  'rawurl',
  'urlpath',
] as const;

const ALLOWED_RECORD_KEYS = new Set<keyof ObservationLogRecord>([
  'schemaVersion',
  'eventId',
  'timestamp',
  'sessionId',
  'domainKey',
  'logLayer',
  'frameType',
  'topLevelDomain',
  'frameDomain',
  'surfaceType',
  'triggerType',
  'observationScope',
  'operationEvidence',
  'observability',
  'viscosityLevel',
  'cuePresented',
  'inputOrigin',
  'classificationConfidence',
  'submissionMethod',
  'submissionEncoding',
  'destinationRelation',
  'destinationScheme',
  'destinationHost',
  'submissionMechanism',
  'submissionAssociation',
  'declaredDestinationObservable',
  'networkMethod',
  'networkMechanism',
  'networkCorrelation',
  'networkPayloadObservation',
  'cookieHeaderDetection',
  'pageObservationTiming',
  'surfaceTagName',
  'surfaceInputType',
  'surfaceRole',
  'surfaceIsContentEditable',
  'surfaceAutocompleteTokens',
]);

const HOST_FIELDS = new Set<keyof ObservationLogRecord>([
  'domainKey',
  'topLevelDomain',
  'frameDomain',
  'destinationHost',
]);

const ENUM_FIELDS: Readonly<Partial<Record<keyof ObservationLogRecord, ReadonlySet<string>>>> = {
  logLayer: new Set(['activity', 'diagnostic']),
  frameType: new Set(['top', 'iframe']),
  surfaceType: new Set([
    'page',
    'password',
    'email_or_id',
    'payment',
    'personal_information',
    'free_text',
    'ai_prompt',
    'comment',
    'chat',
    'webmail',
    'cloud_editor',
    'consent',
    'download_link',
    'external_navigation',
    'unknown',
  ]),
  triggerType: new Set([
    'page_observation_started',
    'password_field_focus',
    'email_or_id_field_focus',
    'payment_field_focus',
    'personal_info_field_focus',
    'free_text_surface_focus',
    'unknown_input_surface_focus',
    'paste_event_observed',
    'paste_into_field',
    'paste_reflected_in_field',
    'keyboard_input_started',
    'autofill_or_manager_suspected',
    'script_or_unknown_value_change',
    'submit_attempt',
    'submitter_activation_observed',
    'enter_submit_candidate',
    'external_domain_click',
    'download_attempt',
    'consent_control_focus',
    'consent_control_checked',
    'live_sync_surface_detected',
    'network_activity_during_input',
    'network_activity_after_content_edit',
    'network_activity_after_submit_operation',
    'network_activity_without_correlated_operation',
    'partially_observable_surface',
    'unobservable_surface',
  ]),
  observationScope: new Set([
    'input_surface_and_dom_events',
    'declared_submission_boundary',
    'submission_boundary_partial',
    'network_metadata_only',
    'page_surface_partial',
    'unobservable',
    'unsupported',
  ]),
  operationEvidence: new Set([
    'extension_observation',
    'direct_trusted_event',
    'correlated_trusted_events',
    'browser_network_api_observation',
    'inferred_from_trusted_event',
    'untrusted_or_unknown',
  ]),
  observability: new Set([
    'observable',
    'partially_observable',
    'high_uncertainty',
    'unobservable',
    'unsupported',
  ]),
  inputOrigin: new Set([
    'keyboard_confirmed',
    'paste_confirmed',
    'autofill_or_manager_suspected',
    'script_or_unknown_update',
    'unknown',
  ]),
  classificationConfidence: new Set(['explicit', 'heuristic', 'generic', 'unknown']),
  submissionMethod: new Set(['GET', 'POST', 'DIALOG', 'UNKNOWN']),
  submissionEncoding: new Set([
    'application/x-www-form-urlencoded',
    'multipart/form-data',
    'text/plain',
    'unknown',
  ]),
  destinationRelation: new Set(['same_origin', 'cross_origin', 'non_http', 'unknown']),
  submissionMechanism: new Set([
    'form_submit_event',
    'submitter_activation',
    'enter_key_candidate',
  ]),
  submissionAssociation: new Set([
    'declared_submit_control',
    'enter_key_candidate',
    'correlated_submit_event',
    'submit_event_without_prior_candidate',
  ]),
  networkMethod: new Set([
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'HEAD',
    'OPTIONS',
    'CONNECT',
    'TRACE',
    'UNKNOWN',
  ]),
  networkMechanism: new Set(['fetch_or_xhr', 'beacon_or_ping']),
  networkCorrelation: new Set([
    'recent_input_activity',
    'recent_content_edit',
    'recent_submit_operation',
    'no_correlated_user_operation',
    'correlation_unavailable',
  ]),
  networkPayloadObservation: new Set(['not_requested']),
  cookieHeaderDetection: new Set(['detected', 'not_detected', 'not_observed', 'unavailable']),
  pageObservationTiming: new Set([
    'within_5s_of_page_observation',
    'after_5s_of_page_observation',
    'unknown',
  ]),
};

const BOOLEAN_FIELDS = new Set<keyof ObservationLogRecord>([
  'cuePresented',
  'declaredDestinationObservable',
  'surfaceIsContentEditable',
]);

export class PrivacyBoundaryError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'PrivacyBoundaryError';
  }
}

function normalizeKey(key: string): string {
  return key.toLowerCase().replaceAll(/[^a-z0-9]/g, '');
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value) as object | null;
  return prototype === Object.prototype || prototype === null;
}

function assertHostLike(field: string, value: unknown): void {
  if (value === undefined) return;
  if (typeof value !== 'string') {
    throw new PrivacyBoundaryError(`${field} must be a string.`);
  }
  if (value.length === 0 || value.length > 253 || /[/?#@\s]/u.test(value)) {
    throw new PrivacyBoundaryError(
      `${field} must not contain URL path, query, credentials, or whitespace.`,
    );
  }
}

function assertSchemeLike(value: unknown): void {
  if (value === undefined) return;
  if (typeof value !== 'string' || !/^(?:unknown|[a-z][a-z0-9+.-]{0,20})$/u.test(value)) {
    throw new PrivacyBoundaryError(
      'destinationScheme must contain only a normalized scheme token.',
    );
  }
}

function assertAutocompleteTokens(value: unknown): void {
  if (value === undefined) return;
  if (!Array.isArray(value) || value.length > 8) {
    throw new PrivacyBoundaryError(
      'surfaceAutocompleteTokens must be an array with at most eight entries.',
    );
  }
  for (const token of value) {
    if (typeof token !== 'string' || !/^[a-z0-9-]{1,64}$/u.test(token)) {
      throw new PrivacyBoundaryError('Unsafe autocomplete token detected.');
    }
  }
}

function assertUuid(field: string, value: unknown): void {
  if (
    typeof value !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value)
  ) {
    throw new PrivacyBoundaryError(`${field} must be a UUID generated by DSSI.`);
  }
}

function assertSafeStructureToken(field: string, value: unknown): void {
  if (value === undefined) return;
  if (
    typeof value !== 'string' ||
    value.length > 64 ||
    (value.length > 0 && !/^[a-z0-9-]+$/u.test(value))
  ) {
    throw new PrivacyBoundaryError(`${field} must contain only a safe structural token.`);
  }
}

function assertEnumField(
  field: keyof ObservationLogRecord,
  value: unknown,
  allowed: ReadonlySet<string>,
): void {
  if (value === undefined) return;
  if (typeof value !== 'string' || !allowed.has(value)) {
    throw new PrivacyBoundaryError(`Unexpected categorical value for ${String(field)}.`);
  }
}

function assertScalarFields(payload: ObservationLogRecord): void {
  if (
    payload.schemaVersion !== undefined &&
    ![1, 2, 3, 4, 5, 6, 7, 8, 9].includes(payload.schemaVersion)
  ) {
    throw new PrivacyBoundaryError('Unsupported observation schema version.');
  }
  if (!Number.isFinite(payload.timestamp) || payload.timestamp < 0) {
    throw new PrivacyBoundaryError('timestamp must be a non-negative finite number.');
  }
  if (![1, 2, 3].includes(payload.viscosityLevel)) {
    throw new PrivacyBoundaryError('viscosityLevel must be 1, 2, or 3.');
  }
  assertUuid('eventId', payload.eventId);
  assertUuid('sessionId', payload.sessionId);
  if (typeof payload.domainKey !== 'string') {
    throw new PrivacyBoundaryError('domainKey is required.');
  }
  if (payload.surfaceType === undefined || payload.triggerType === undefined) {
    throw new PrivacyBoundaryError('surfaceType and triggerType are required.');
  }
  if (typeof payload.cuePresented !== 'boolean') {
    throw new PrivacyBoundaryError('cuePresented is required and must be boolean.');
  }

  for (const field of BOOLEAN_FIELDS) {
    const value = payload[field];
    if (value !== undefined && typeof value !== 'boolean') {
      throw new PrivacyBoundaryError(`${String(field)} must be boolean.`);
    }
  }

  for (const [field, allowed] of Object.entries(ENUM_FIELDS) as [
    keyof ObservationLogRecord,
    ReadonlySet<string>,
  ][]) {
    assertEnumField(field, payload[field], allowed);
  }

  assertSafeStructureToken('surfaceTagName', payload.surfaceTagName);
  assertSafeStructureToken('surfaceInputType', payload.surfaceInputType);
  assertSafeStructureToken('surfaceRole', payload.surfaceRole);
}

/**
 * Enforces the persistence boundary. Observation records are intentionally flat,
 * use a closed key and value set, and may not contain raw locators or nested payloads.
 */
export function assertPrivacySafePayload(
  payload: unknown,
): asserts payload is ObservationLogRecord {
  if (!isPlainObject(payload)) {
    throw new PrivacyBoundaryError('Observation log payload must be a plain object.');
  }

  for (const [key, value] of Object.entries(payload)) {
    const normalized = normalizeKey(key);
    if (!ALLOWED_RECORD_KEYS.has(key as keyof ObservationLogRecord)) {
      if (PROHIBITED_KEY_PARTS.some((part) => normalized.includes(part))) {
        throw new PrivacyBoundaryError(`Prohibited raw-data field detected: ${key}`);
      }
      throw new PrivacyBoundaryError(`Unknown observation record field detected: ${key}`);
    }
    if (isPlainObject(value)) {
      throw new PrivacyBoundaryError(`Nested object is not allowed in observation records: ${key}`);
    }
    if (Array.isArray(value) && key !== 'surfaceAutocompleteTokens') {
      throw new PrivacyBoundaryError(`Unexpected array field detected: ${key}`);
    }
  }

  const record = payload as unknown as ObservationLogRecord;
  assertScalarFields(record);
  for (const field of HOST_FIELDS) {
    assertHostLike(field, record[field]);
  }
  assertSchemeLike(record.destinationScheme);
  assertAutocompleteTokens(record.surfaceAutocompleteTokens);

  if (
    record.networkPayloadObservation !== undefined &&
    record.networkPayloadObservation !== 'not_requested'
  ) {
    throw new PrivacyBoundaryError('Network payload observation must remain not_requested.');
  }
}

export function createPrivacySafeRecord(record: ObservationLogRecord): ObservationLogRecord {
  assertPrivacySafePayload(record);
  const copy: ObservationLogRecord = {
    ...record,
    ...(record.surfaceAutocompleteTokens === undefined
      ? {}
      : {
          surfaceAutocompleteTokens: Object.freeze([
            ...record.surfaceAutocompleteTokens,
          ]) as string[],
        }),
  };
  return Object.freeze(copy);
}
