import { OBSERVATION_CSV_COLUMNS, type DssiObservationLogExport } from '../log-export';
import type { ObservationLogRecord } from '../models/observation';
import { deepFreeze, type ValidatedObservationLogExport } from './reader-model';

export type ReaderValidationErrorCode =
  | 'not_object'
  | 'missing_export_section'
  | 'unsupported_format'
  | 'unsupported_format_version'
  | 'missing_records'
  | 'records_not_array'
  | 'unsupported_record_schema_version'
  | 'invalid_required_field'
  | 'duplicate_event_id';

export type ReaderValidationNoticeCode =
  | 'record_count_mismatch'
  | 'settings_snapshot_partial'
  | 'integrity_not_provided'
  | 'unknown_optional_field'
  | 'empty_records';

export interface ReaderValidationError {
  code: ReaderValidationErrorCode;
  message: string;
  path?: string;
  recordIndex?: number;
}

export interface ReaderValidationNotice {
  code: ReaderValidationNoticeCode;
  message: string;
}

export type ValidationResult<T> =
  | { ok: true; value: T; notices: readonly ReaderValidationNotice[] }
  | { ok: false; errors: readonly ReaderValidationError[] };

const SURFACE_TYPES = new Set([
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
]);
const TRIGGER_TYPES = new Set([
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
]);
const OPTIONAL_ENUMS: Readonly<Record<string, ReadonlySet<string>>> = {
  logLayer: new Set(['activity', 'diagnostic']),
  frameType: new Set(['top', 'iframe']),
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
const TOP_FIELDS = new Set(['export', 'observationContext', 'useBoundary', 'records', 'integrity']);
const RECORD_FIELDS = new Set<string>(OBSERVATION_CSV_COLUMNS);

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function isText(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function isDssiObservationLogExport(value: unknown): value is DssiObservationLogExport {
  if (!isObject(value)) return false;
  return (
    isObject(value.export) &&
    isObject(value.observationContext) &&
    isObject(value.useBoundary) &&
    Array.isArray(value.records) &&
    isObject(value.integrity)
  );
}
function pushInvalid(
  errors: ReaderValidationError[],
  path: string,
  message: string,
  recordIndex?: number,
): void {
  errors.push({
    code: 'invalid_required_field',
    message,
    path,
    ...(recordIndex === undefined ? {} : { recordIndex }),
  });
}

function validateRecord(
  value: unknown,
  index: number,
  errors: ReaderValidationError[],
  eventIds: Set<string>,
  unknownFields: Set<string>,
): void {
  if (!isObject(value)) {
    pushInvalid(errors, `records[${index}]`, 'レコードがオブジェクトではありません。', index);
    return;
  }
  const schema = value.schemaVersion;
  if (typeof schema !== 'number' || !Number.isInteger(schema) || schema < 1 || schema > 10) {
    errors.push({
      code: 'unsupported_record_schema_version',
      message: `records[${index}].schemaVersion は1〜10である必要があります。`,
      path: `records[${index}].schemaVersion`,
      recordIndex: index,
    });
  }
  if (!isText(value.eventId))
    pushInvalid(errors, `records[${index}].eventId`, 'eventIdがありません。', index);
  else if (eventIds.has(value.eventId)) {
    errors.push({
      code: 'duplicate_event_id',
      message: `eventId「${value.eventId}」が重複しています。`,
      path: `records[${index}].eventId`,
      recordIndex: index,
    });
  } else eventIds.add(value.eventId);

  if (typeof value.timestamp !== 'number' || !Number.isFinite(value.timestamp)) {
    pushInvalid(errors, `records[${index}].timestamp`, 'timestampが有限数ではありません。', index);
  }
  if (!isText(value.sessionId))
    pushInvalid(errors, `records[${index}].sessionId`, 'sessionIdがありません。', index);
  if (!isText(value.domainKey))
    pushInvalid(errors, `records[${index}].domainKey`, 'domainKeyがありません。', index);
  if (typeof value.surfaceType !== 'string' || !SURFACE_TYPES.has(value.surfaceType)) {
    pushInvalid(
      errors,
      `records[${index}].surfaceType`,
      'surfaceTypeが現行定義に一致しません。',
      index,
    );
  }
  if (typeof value.triggerType !== 'string' || !TRIGGER_TYPES.has(value.triggerType)) {
    pushInvalid(
      errors,
      `records[${index}].triggerType`,
      'triggerTypeが現行定義に一致しません。',
      index,
    );
  }
  if (value.viscosityLevel !== 1 && value.viscosityLevel !== 2 && value.viscosityLevel !== 3) {
    pushInvalid(
      errors,
      `records[${index}].viscosityLevel`,
      'viscosityLevelは1、2、3のいずれかです。',
      index,
    );
  }
  if (typeof value.cuePresented !== 'boolean') {
    pushInvalid(
      errors,
      `records[${index}].cuePresented`,
      'cuePresentedはbooleanである必要があります。',
      index,
    );
  }
  for (const [field, allowed] of Object.entries(OPTIONAL_ENUMS)) {
    const optional = value[field];
    if (optional !== undefined && (typeof optional !== 'string' || !allowed.has(optional))) {
      pushInvalid(
        errors,
        `records[${index}].${field}`,
        `${field}が現行定義に一致しません。`,
        index,
      );
    }
  }
  for (const field of Object.keys(value))
    if (!RECORD_FIELDS.has(field)) unknownFields.add(`records.*.${field}`);
}

export function validateObservationLogExport(
  value: unknown,
): ValidationResult<ValidatedObservationLogExport> {
  if (!isObject(value)) {
    return {
      ok: false,
      errors: [{ code: 'not_object', message: 'JSONの最上位がオブジェクトではありません。' }],
    };
  }
  const errors: ReaderValidationError[] = [];
  const notices: ReaderValidationNotice[] = [];
  const unknownFields = new Set<string>();
  for (const field of Object.keys(value)) if (!TOP_FIELDS.has(field)) unknownFields.add(field);

  const exportSection = value.export;
  if (!isObject(exportSection)) {
    errors.push({
      code: 'missing_export_section',
      message: 'exportセクションがありません。',
      path: 'export',
    });
  } else {
    if (exportSection.format !== 'dssi-observation-log') {
      errors.push({
        code: 'unsupported_format',
        message: 'export.format が dssi-observation-log ではありません。',
        path: 'export.format',
      });
    }
    if (exportSection.formatVersion !== 1) {
      errors.push({
        code: 'unsupported_format_version',
        message: '対応しているformatVersionは1です。',
        path: 'export.formatVersion',
      });
    }
    if (!isText(exportSection.exportedAt) || Number.isNaN(Date.parse(exportSection.exportedAt))) {
      pushInvalid(errors, 'export.exportedAt', 'exportedAtが有効な日時文字列ではありません。');
    }
    if (!isText(exportSection.applicationVersion))
      pushInvalid(errors, 'export.applicationVersion', 'applicationVersionがありません。');
    if (
      typeof exportSection.recordCount !== 'number' ||
      !Number.isInteger(exportSection.recordCount) ||
      exportSection.recordCount < 0
    ) {
      pushInvalid(errors, 'export.recordCount', 'recordCountが0以上の整数ではありません。');
    }
  }

  if (!('records' in value))
    errors.push({ code: 'missing_records', message: 'recordsがありません。', path: 'records' });
  else if (!Array.isArray(value.records))
    errors.push({
      code: 'records_not_array',
      message: 'recordsが配列ではありません。',
      path: 'records',
    });

  if (!isObject(value.observationContext))
    pushInvalid(errors, 'observationContext', 'observationContextがありません。');
  if (!isObject(value.useBoundary)) pushInvalid(errors, 'useBoundary', 'useBoundaryがありません。');
  if (!isObject(value.integrity)) pushInvalid(errors, 'integrity', 'integrityがありません。');

  if (Array.isArray(value.records)) {
    const eventIds = new Set<string>();
    value.records.forEach((record, index) =>
      validateRecord(record, index, errors, eventIds, unknownFields),
    );
    if (value.records.length === 0)
      notices.push({ code: 'empty_records', message: 'recordsは空です。' });
    if (
      isObject(exportSection) &&
      typeof exportSection.recordCount === 'number' &&
      exportSection.recordCount !== value.records.length
    ) {
      notices.push({
        code: 'record_count_mismatch',
        message: `export.recordCount（${exportSection.recordCount}）と実件数（${value.records.length}）が一致しません。`,
      });
    }
  }
  if (
    isObject(value.observationContext) &&
    value.observationContext.recordTimeSettingsAvailability === 'partial'
  ) {
    notices.push({
      code: 'settings_snapshot_partial',
      message: '観測時設定スナップショットは一部のレコードでのみ利用できます。',
    });
  }
  if (isObject(value.integrity) && value.integrity.status === 'not_provided') {
    notices.push({
      code: 'integrity_not_provided',
      message: '署名・改変検知などのintegrity情報は提供されていません。',
    });
  }
  if (unknownFields.size > 0) {
    const names = [...unknownFields].sort();
    notices.push({
      code: 'unknown_optional_field',
      message: `現行Readerで意味を定義していない追加フィールドがあります: ${names.slice(0, 8).join(', ')}${names.length > 8 ? ' ほか' : ''}`,
    });
  }
  if (errors.length > 0) return { ok: false, errors };
  if (!isDssiObservationLogExport(value)) {
    return {
      ok: false,
      errors: [
        {
          code: 'invalid_required_field',
          message: '検証済みログを読取専用モデルへ変換できませんでした。',
        },
      ],
    };
  }
  const clone = structuredClone(value);
  const frozen: ValidatedObservationLogExport = deepFreeze(clone);
  return { ok: true, value: frozen, notices };
}

export function asObservationRecord(record: Readonly<ObservationLogRecord>): ObservationLogRecord {
  return record;
}
