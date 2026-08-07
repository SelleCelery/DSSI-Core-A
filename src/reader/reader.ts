import type { ObservationLogRecord } from '../core/models/observation';
import {
  cookieHeaderDetectionLabel,
  frameContextLabel,
  logLayerLabel,
  networkCorrelationLabel,
  networkMechanismLabel,
  networkPayloadObservationLabel,
  observationScopeLabel,
  operationEvidenceLabel,
  pageObservationTimingLabel,
  submissionAssociationLabel,
  submissionDestinationLabel,
  submissionEncodingLabel,
  submissionMethodLabel,
  surfaceStructureLabel,
  surfaceTypeLabel,
  triggerTypeLabel,
} from '../core/observation-presentation';
import { parseObservationLogExport } from '../core/log-reader/export-parser';
import {
  asObservationRecord,
  type ReaderValidationError,
  type ReaderValidationNotice,
  validateObservationLogExport,
} from '../core/log-reader/export-validator';
import {
  analyzeObservationTips,
  isObservationTipId,
  matchedTipIdsForRecord,
  type ObservationTipAnalysis,
  type ObservationTipId,
} from '../core/log-reader/observation-tips';
import {
  createDefaultReaderQuery,
  type ReaderGroupValue,
  type ReaderQuery,
  type ReaderSort,
  type ValidatedObservationLogExport,
} from '../core/log-reader/reader-model';
import { applyReaderQuery } from '../core/log-reader/reader-query';
import { buildReaderGroups, buildReaderSummary } from '../core/log-reader/reader-summary';
import {
  applyDocumentTranslations,
  browserUiLanguage,
  resolveUiLanguage,
  t,
  type UiLanguage,
} from '../i18n/ui';
import { loadSettings } from '../storage/settings-store';
import { requiredElement } from '../ui/required-element';

const FILE_WARNING_BYTES = 5 * 1024 * 1024;
const FILE_REJECT_BYTES = 25 * 1024 * 1024;
const PAGE_SIZE = 100;
const MISSING_VALUE = '__missing__';

interface ReaderFileMetadata {
  name: string;
  size: number;
  lastModified: number;
}

interface ReaderState {
  source: ValidatedObservationLogExport | undefined;
  query: ReaderQuery;
  file: ReaderFileMetadata | undefined;
  notices: readonly ReaderValidationNotice[];
  selectedRecordId: string | undefined;
  selectedTipId: ObservationTipId | undefined;
  currentPage: number;
}

const fileInput = requiredElement<HTMLInputElement>('#fileInput');
const fileMeta = requiredElement<HTMLElement>('#fileMeta');
const readerStatus = requiredElement<HTMLElement>('#readerStatus');
const validationMessages = requiredElement<HTMLUListElement>('#validationMessages');
const loadedArea = requiredElement<HTMLElement>('#loadedArea');
const openOptions = requiredElement<HTMLButtonElement>('#openOptions');
const openLog = requiredElement<HTMLButtonElement>('#openLog');
const openOnboarding = requiredElement<HTMLButtonElement>('#openOnboarding');

const summaryExportedAt = requiredElement<HTMLElement>('#summaryExportedAt');
const summaryAppVersion = requiredElement<HTMLElement>('#summaryAppVersion');
const summaryFormat = requiredElement<HTMLElement>('#summaryFormat');
const summarySchemas = requiredElement<HTMLElement>('#summarySchemas');
const summarySourceCount = requiredElement<HTMLElement>('#summarySourceCount');
const summaryVisibleCount = requiredElement<HTMLElement>('#summaryVisibleCount');
const summaryPeriod = requiredElement<HTMLElement>('#summaryPeriod');
const summaryDomainCount = requiredElement<HTMLElement>('#summaryDomainCount');
const summaryHostCount = requiredElement<HTMLElement>('#summaryHostCount');
const summaryRelationCount = requiredElement<HTMLElement>('#summaryRelationCount');
const summaryCorrelationCount = requiredElement<HTMLElement>('#summaryCorrelationCount');
const summaryCueCount = requiredElement<HTMLElement>('#summaryCueCount');
const summarySettings = requiredElement<HTMLElement>('#summarySettings');
const summaryIntegrity = requiredElement<HTMLElement>('#summaryIntegrity');

const searchText = requiredElement<HTMLInputElement>('#searchText');
const sortOrder = requiredElement<HTMLSelectElement>('#sortOrder');
const cuePresentedFilter = requiredElement<HTMLSelectElement>('#cuePresentedFilter');
const timestampFrom = requiredElement<HTMLInputElement>('#timestampFrom');
const timestampTo = requiredElement<HTMLInputElement>('#timestampTo');
const clearFilters = requiredElement<HTMLButtonElement>('#clearFilters');
const activeFilterSummary = requiredElement<HTMLElement>('#activeFilterSummary');

const domainFilter = requiredElement<HTMLSelectElement>('#domainFilter');
const destinationFilter = requiredElement<HTMLSelectElement>('#destinationFilter');
const triggerFilter = requiredElement<HTMLSelectElement>('#triggerFilter');
const surfaceFilter = requiredElement<HTMLSelectElement>('#surfaceFilter');
const logLayerFilter = requiredElement<HTMLSelectElement>('#logLayerFilter');
const frameFilter = requiredElement<HTMLSelectElement>('#frameFilter');
const relationFilter = requiredElement<HTMLSelectElement>('#relationFilter');
const mechanismFilter = requiredElement<HTMLSelectElement>('#mechanismFilter');
const correlationFilter = requiredElement<HTMLSelectElement>('#correlationFilter');
const timingFilter = requiredElement<HTMLSelectElement>('#timingFilter');
const viscosityFilter = requiredElement<HTMLSelectElement>('#viscosityFilter');

const domainGroups = requiredElement<HTMLElement>('#domainGroups');
const destinationGroups = requiredElement<HTMLElement>('#destinationGroups');
const correlationGroups = requiredElement<HTMLElement>('#correlationGroups');
const mechanismGroups = requiredElement<HTMLElement>('#mechanismGroups');
const relationGroups = requiredElement<HTMLElement>('#relationGroups');
const cueGroups = requiredElement<HTMLElement>('#cueGroups');

const recordsSection = requiredElement<HTMLElement>('#recordsSection');
const recordsBody = requiredElement<HTMLTableSectionElement>('#recordsBody');
const recordCountLabel = requiredElement<HTMLElement>('#recordCountLabel');
const previousPage = requiredElement<HTMLButtonElement>('#previousPage');
const nextPage = requiredElement<HTMLButtonElement>('#nextPage');
const pageLabel = requiredElement<HTMLElement>('#pageLabel');
const recordsEmpty = requiredElement<HTMLElement>('#recordsEmpty');

const detailSection = requiredElement<HTMLElement>('#detailSection');
const detailEmpty = requiredElement<HTMLElement>('#detailEmpty');
const clearSelection = requiredElement<HTMLButtonElement>('#clearSelection');
const recordDetail = requiredElement<HTMLElement>('#recordDetail');
const recordDetailList = requiredElement<HTMLElement>('#recordDetailList');
const rawRecordJson = requiredElement<HTMLElement>('#rawRecordJson');
const tipsList = requiredElement<HTMLElement>('#tipsList');
const tipDetail = requiredElement<HTMLElement>('#tipDetail');

let language: UiLanguage = 'en';
let state: ReaderState = {
  source: undefined,
  query: createDefaultReaderQuery(),
  file: undefined,
  notices: [],
  selectedRecordId: undefined,
  selectedTipId: undefined,
  currentPage: 1,
};

function local(ja: string, en: string): string {
  return language === 'ja' ? ja : en;
}

function localeName(): string {
  return language === 'ja' ? 'ja-JP' : 'en-US';
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString(localeName(), {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  });
}

function formatIsoDate(value: string): string {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? value : formatDateTime(timestamp);
}

function textOrDash(value: unknown): string {
  if (value === undefined || value === null || value === '') return '—';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return value.toString();
  }
  if (typeof value === 'symbol') return value.description ?? 'Symbol';
  if (Array.isArray(value)) {
    return value.length === 0 ? '—' : value.map((item) => textOrDash(item)).join(', ');
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '—';
    }
  }
  return '—';
}

function selectedValues(select: HTMLSelectElement): readonly string[] {
  return [...select.selectedOptions].map((option) => option.value);
}

function selectedViscosityLevels(select: HTMLSelectElement): readonly (1 | 2 | 3)[] {
  return selectedValues(select)
    .map(Number)
    .filter((value): value is 1 | 2 | 3 => value === 1 || value === 2 || value === 3);
}

function dateInputValueToTimestamp(input: HTMLInputElement): number | undefined {
  if (input.value.length === 0) return undefined;
  const timestamp = new Date(input.value).getTime();
  return Number.isNaN(timestamp) ? undefined : timestamp;
}

function timestampToDateInputValue(timestamp: number | undefined): string {
  if (timestamp === undefined) return '';
  const date = new Date(timestamp);
  const localDate = new Date(timestamp - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function asReaderSort(value: string): ReaderSort {
  switch (value) {
    case 'timestamp_ascending':
    case 'domain_ascending':
    case 'destination_ascending':
    case 'trigger_ascending':
      return value;
    default:
      return 'timestamp_descending';
  }
}

function updateQueryFromControls(): void {
  const from = dateInputValueToTimestamp(timestampFrom);
  const to = dateInputValueToTimestamp(timestampTo);
  const next: ReaderQuery = {
    searchText: searchText.value,
    domainKeys: selectedValues(domainFilter),
    destinationHosts: selectedValues(destinationFilter),
    triggerTypes: selectedValues(triggerFilter),
    surfaceTypes: selectedValues(surfaceFilter),
    logLayers: selectedValues(logLayerFilter),
    frameTypes: selectedValues(frameFilter),
    destinationRelations: selectedValues(relationFilter),
    networkMechanisms: selectedValues(mechanismFilter),
    networkCorrelations: selectedValues(correlationFilter),
    pageObservationTimings: selectedValues(timingFilter),
    cuePresented:
      cuePresentedFilter.value === 'true' || cuePresentedFilter.value === 'false'
        ? cuePresentedFilter.value
        : 'all',
    viscosityLevels: selectedViscosityLevels(viscosityFilter),
    sort: asReaderSort(sortOrder.value),
    ...(from === undefined ? {} : { timestampFrom: from }),
    ...(to === undefined ? {} : { timestampTo: to }),
  };
  state = {
    ...state,
    query: next,
    currentPage: 1,
  };
  render();
}

function syncControlsToQuery(): void {
  searchText.value = state.query.searchText;
  sortOrder.value = state.query.sort;
  cuePresentedFilter.value = state.query.cuePresented;
  timestampFrom.value = timestampToDateInputValue(state.query.timestampFrom);
  timestampTo.value = timestampToDateInputValue(state.query.timestampTo);

  const selections: ReadonlyArray<[HTMLSelectElement, readonly string[]]> = [
    [domainFilter, state.query.domainKeys],
    [destinationFilter, state.query.destinationHosts],
    [triggerFilter, state.query.triggerTypes],
    [surfaceFilter, state.query.surfaceTypes],
    [logLayerFilter, state.query.logLayers],
    [frameFilter, state.query.frameTypes],
    [relationFilter, state.query.destinationRelations],
    [mechanismFilter, state.query.networkMechanisms],
    [correlationFilter, state.query.networkCorrelations],
    [timingFilter, state.query.pageObservationTimings],
    [viscosityFilter, state.query.viscosityLevels.map(String)],
  ];
  for (const [select, selected] of selections) {
    for (const option of select.options) option.selected = selected.includes(option.value);
  }
}

function appendMessage(text: string, kind: 'notice' | 'warning' | 'error'): void {
  const item = document.createElement('li');
  item.className = `reader-message reader-message-${kind}`;
  item.textContent = text;
  validationMessages.append(item);
}

function validationNoticeText(notice: ReaderValidationNotice): string {
  if (language === 'ja') return notice.message;
  switch (notice.code) {
    case 'record_count_mismatch':
      return 'The record count declared in the export does not match the number of records in the file.';
    case 'settings_snapshot_partial':
      return 'Observation-time settings snapshots are available for only some records.';
    case 'integrity_not_provided':
      return 'No signature or modification-detection integrity information is provided.';
    case 'unknown_optional_field':
      return 'The file contains additional fields whose meaning is not defined by this Reader version.';
    case 'empty_records':
      return 'The records array is empty.';
  }
}

function validationErrorText(error: ReaderValidationError): string {
  if (language === 'ja') return error.message;
  switch (error.code) {
    case 'not_object':
      return 'The top-level JSON value is not an object.';
    case 'missing_export_section':
      return 'The export section is missing.';
    case 'unsupported_format':
      return 'export.format is not dssi-observation-log.';
    case 'unsupported_format_version':
      return 'This Reader supports formatVersion 1.';
    case 'missing_records':
      return 'The records field is missing.';
    case 'records_not_array':
      return 'The records field is not an array.';
    case 'unsupported_record_schema_version':
      return 'A record uses a schemaVersion outside the supported range 1–10.';
    case 'invalid_required_field':
      return 'A required field is missing or invalid.';
    case 'duplicate_event_id':
      return 'The file contains duplicate eventId values.';
  }
}

function renderFileState(): void {
  validationMessages.replaceChildren();
  if (state.file === undefined) {
    fileMeta.textContent = t(language, 'noFile');
  } else {
    fileMeta.textContent = local(
      `${state.file.name} · ${formatBytes(state.file.size)} · 最終更新 ${formatDateTime(state.file.lastModified)}`,
      `${state.file.name} · ${formatBytes(state.file.size)} · Last modified ${formatDateTime(state.file.lastModified)}`,
    );
    if (state.file.size > FILE_WARNING_BYTES) {
      appendMessage(
        local(
          '5 MBを超えるため、読込や絞り込みに時間がかかる場合があります。',
          'The file is larger than 5 MB, so loading and filtering may take longer.',
        ),
        'warning',
      );
    }
  }
  for (const notice of state.notices) appendMessage(validationNoticeText(notice), 'notice');
}

function distinctValues(
  records: readonly Readonly<ObservationLogRecord>[],
  getter: (record: Readonly<ObservationLogRecord>) => string | undefined,
): readonly string[] {
  const values = new Set<string>();
  let hasMissing = false;
  for (const record of records) {
    const value = getter(record);
    if (value === undefined) hasMissing = true;
    else values.add(value);
  }
  const ordered = [...values].sort((left, right) => left.localeCompare(right, localeName()));
  return hasMissing ? [...ordered, MISSING_VALUE] : ordered;
}

function relationValueLabel(value: string): string {
  const ja: Readonly<Record<string, string>> = {
    same_origin: '同一オリジン (same_origin)',
    cross_origin: '別オリジン (cross_origin)',
    non_http: 'HTTP以外 (non_http)',
    unknown: '不明 (unknown)',
    [MISSING_VALUE]: '値なし',
  };
  const en: Readonly<Record<string, string>> = {
    same_origin: 'Same origin (same_origin)',
    cross_origin: 'Cross-origin (cross_origin)',
    non_http: 'Non-HTTP (non_http)',
    unknown: 'Unknown (unknown)',
    [MISSING_VALUE]: 'Missing value',
  };
  return (language === 'ja' ? ja : en)[value] ?? value;
}

function mechanismValueLabel(value: string): string {
  const ja: Readonly<Record<string, string>> = {
    fetch_or_xhr: 'fetch/XHR系 (fetch_or_xhr)',
    beacon_or_ping: 'Beacon/Ping系 (beacon_or_ping)',
    form_submit_event: '標準form submitイベント',
    submitter_activation: 'submit操作面',
    enter_key_candidate: 'Enter候補',
    [MISSING_VALUE]: '値なし',
  };
  const en: Readonly<Record<string, string>> = {
    fetch_or_xhr: 'fetch/XHR (fetch_or_xhr)',
    beacon_or_ping: 'Beacon/Ping (beacon_or_ping)',
    form_submit_event: 'Standard form submit event',
    submitter_activation: 'Submit control activation',
    enter_key_candidate: 'Enter candidate',
    [MISSING_VALUE]: 'Missing value',
  };
  return (language === 'ja' ? ja : en)[value] ?? value;
}

function correlationValueLabel(value: string): string {
  const ja: Readonly<Record<string, string>> = {
    recent_input_activity: '入力操作と時間相関（旧形式）',
    recent_content_edit: '内容変更操作と時間相関',
    recent_submit_operation: '標準form送信操作と時間相関',
    no_correlated_user_operation: '相関可能な利用者操作を確認していない',
    correlation_unavailable: '操作相関を判定できない',
    [MISSING_VALUE]: '値なし',
  };
  const en: Readonly<Record<string, string>> = {
    recent_input_activity: 'Near input activity (legacy)',
    recent_content_edit: 'Near a content edit',
    recent_submit_operation: 'Near a standard-form submission action',
    no_correlated_user_operation: 'No correlatable user action observed',
    correlation_unavailable: 'Correlation unavailable',
    [MISSING_VALUE]: 'Missing value',
  };
  return (language === 'ja' ? ja : en)[value] ?? value;
}

function timingValueLabel(value: string): string {
  const ja: Readonly<Record<string, string>> = {
    within_5s_of_page_observation: 'ページ観測開始から5秒以内',
    after_5s_of_page_observation: 'ページ観測開始から5秒超',
    unknown: '時間関係不明',
    [MISSING_VALUE]: '値なし',
  };
  const en: Readonly<Record<string, string>> = {
    within_5s_of_page_observation: 'Within 5 seconds of page observation',
    after_5s_of_page_observation: 'More than 5 seconds after page observation',
    unknown: 'Timing relation unknown',
    [MISSING_VALUE]: 'Missing value',
  };
  return (language === 'ja' ? ja : en)[value] ?? value;
}

function optionLabel(kind: string, value: string): string {
  if (value === MISSING_VALUE) return t(language, 'valueMissing');
  switch (kind) {
    case 'trigger':
      return `${triggerTypeLabel(value as ObservationLogRecord['triggerType'], language)} (${value})`;
    case 'surface':
      return `${surfaceTypeLabel(value as ObservationLogRecord['surfaceType'], language)} (${value})`;
    case 'layer':
      return value === 'diagnostic'
        ? local('診断 (diagnostic)', 'Diagnostic (diagnostic)')
        : local('通常 (activity)', 'Activity (activity)');
    case 'frame':
      return value === 'iframe'
        ? local('埋め込みフレーム (iframe)', 'Embedded frame (iframe)')
        : local('トップフレーム (top)', 'Top frame (top)');
    case 'relation':
      return relationValueLabel(value);
    case 'mechanism':
      return mechanismValueLabel(value);
    case 'correlation':
      return correlationValueLabel(value);
    case 'timing':
      return timingValueLabel(value);
    case 'cue':
      return value === 'true'
        ? local('表示対象 (true)', 'Presentation eligible (true)')
        : value === 'false'
          ? local('表示対象外 (false)', 'Not presentation eligible (false)')
          : value;
    default:
      return value;
  }
}

function populateSelect(select: HTMLSelectElement, values: readonly string[], kind: string): void {
  const selected = new Set(selectedValues(select));
  const options = values.map((value) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = optionLabel(kind, value);
    option.selected = selected.has(value);
    return option;
  });
  select.replaceChildren(...options);
}

function populateFilters(source: ValidatedObservationLogExport): void {
  const records = source.records;
  populateSelect(
    domainFilter,
    distinctValues(records, (record) => record.domainKey),
    'domain',
  );
  populateSelect(
    destinationFilter,
    distinctValues(records, (record) => record.destinationHost),
    'destination',
  );
  populateSelect(
    triggerFilter,
    distinctValues(records, (record) => record.triggerType),
    'trigger',
  );
  populateSelect(
    surfaceFilter,
    distinctValues(records, (record) => record.surfaceType),
    'surface',
  );
  populateSelect(
    logLayerFilter,
    distinctValues(records, (record) => record.logLayer),
    'layer',
  );
  populateSelect(
    frameFilter,
    distinctValues(records, (record) => record.frameType),
    'frame',
  );
  populateSelect(
    relationFilter,
    distinctValues(records, (record) => record.destinationRelation),
    'relation',
  );
  populateSelect(
    mechanismFilter,
    distinctValues(records, (record) => record.networkMechanism),
    'mechanism',
  );
  populateSelect(
    correlationFilter,
    distinctValues(records, (record) => record.networkCorrelation),
    'correlation',
  );
  populateSelect(
    timingFilter,
    distinctValues(records, (record) => record.pageObservationTiming),
    'timing',
  );
  populateSelect(viscosityFilter, ['1', '2', '3'], 'viscosity');
  syncControlsToQuery();
}

function filterCount(query: ReaderQuery): number {
  return [
    query.searchText.trim().length > 0,
    query.domainKeys.length > 0,
    query.destinationHosts.length > 0,
    query.triggerTypes.length > 0,
    query.surfaceTypes.length > 0,
    query.logLayers.length > 0,
    query.frameTypes.length > 0,
    query.destinationRelations.length > 0,
    query.networkMechanisms.length > 0,
    query.networkCorrelations.length > 0,
    query.pageObservationTimings.length > 0,
    query.cuePresented !== 'all',
    query.viscosityLevels.length > 0,
    query.timestampFrom !== undefined,
    query.timestampTo !== undefined,
  ].filter(Boolean).length;
}

function renderSummary(
  source: ValidatedObservationLogExport,
  visibleRecords: readonly Readonly<ObservationLogRecord>[],
): void {
  const summary = buildReaderSummary(source.records, visibleRecords);
  const schemas = [...new Set(source.records.map((record) => record.schemaVersion))]
    .sort((left, right) => (left ?? 0) - (right ?? 0))
    .map((value) => value ?? t(language, 'valueMissing'));

  summaryExportedAt.textContent = formatIsoDate(source.export.exportedAt);
  summaryAppVersion.textContent = source.export.applicationVersion;
  summaryFormat.textContent = `${source.export.format} / v${source.export.formatVersion}`;
  summarySchemas.textContent = schemas.length === 0 ? '—' : schemas.join(', ');
  summarySourceCount.textContent = String(summary.sourceRecordCount);
  summaryVisibleCount.textContent = String(summary.visibleRecordCount);
  summaryPeriod.textContent =
    summary.timestampMin === undefined || summary.timestampMax === undefined
      ? '—'
      : `${formatDateTime(summary.timestampMin)} – ${formatDateTime(summary.timestampMax)}`;
  summaryDomainCount.textContent = String(summary.domainCount);
  summaryHostCount.textContent = String(summary.destinationHostCount);
  summaryRelationCount.textContent = local(
    `同一 ${summary.sameOriginCount} / 別 ${summary.crossOriginCount} / その他・値なし ${summary.unknownRelationCount}`,
    `Same ${summary.sameOriginCount} / Cross ${summary.crossOriginCount} / Other or missing ${summary.unknownRelationCount}`,
  );
  summaryCorrelationCount.textContent = local(
    `相関あり ${summary.correlatedCount} / 未確認 ${summary.uncorrelatedCount} / 判定不能 ${summary.correlationUnavailableCount}`,
    `Correlated ${summary.correlatedCount} / Uncorrelated ${summary.uncorrelatedCount} / Unavailable ${summary.correlationUnavailableCount}`,
  );
  summaryCueCount.textContent = `true ${summary.cuePresentedCount} / false ${summary.cueNotPresentedCount}`;
  summarySettings.textContent = source.observationContext.recordTimeSettingsAvailability;
  summaryIntegrity.textContent =
    source.integrity.status === 'not_provided'
      ? local(
          'integrity情報は提供されていません。真正性・改変不存在を保証する表示ではありません。',
          'No integrity information is provided. This does not guarantee authenticity or absence of modification.',
        )
      : textOrDash(source.integrity.status);

  const count = filterCount(state.query);
  activeFilterSummary.textContent =
    count === 0
      ? t(language, 'noFilters')
      : local(`${count}種類の条件を適用中`, `${count} filter conditions active`);
}

function groupButton(
  group: ReaderGroupValue,
  kind: 'domain' | 'destination' | 'correlation' | 'mechanism' | 'relation' | 'cue',
): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'reader-group-button';
  button.dataset.groupKind = kind;
  button.dataset.groupValue = group.value;
  const value =
    kind === 'correlation'
      ? correlationValueLabel(group.value)
      : kind === 'mechanism'
        ? mechanismValueLabel(group.value)
        : kind === 'relation'
          ? relationValueLabel(group.value)
          : kind === 'cue'
            ? optionLabel('cue', group.value)
            : group.value === MISSING_VALUE
              ? t(language, 'valueMissing')
              : group.value;
  button.textContent = `${value} · ${group.count}`;
  return button;
}

function renderGroupList(
  container: HTMLElement,
  groups: readonly ReaderGroupValue[],
  kind: 'domain' | 'destination' | 'correlation' | 'mechanism' | 'relation' | 'cue',
): void {
  const buttons = groups.slice(0, 12).map((group) => groupButton(group, kind));
  container.replaceChildren(...buttons);
  if (buttons.length === 0) {
    const empty = document.createElement('span');
    empty.className = 'small';
    empty.textContent = local('該当なし', 'No matching groups');
    container.append(empty);
  }
}

function renderGroups(visibleRecords: readonly Readonly<ObservationLogRecord>[]): void {
  const groups = buildReaderGroups(visibleRecords);
  renderGroupList(domainGroups, groups.domains, 'domain');
  renderGroupList(destinationGroups, groups.destinations, 'destination');
  renderGroupList(correlationGroups, groups.correlations, 'correlation');
  renderGroupList(mechanismGroups, groups.mechanisms, 'mechanism');
  renderGroupList(relationGroups, groups.relations, 'relation');
  renderGroupList(cueGroups, groups.cuePresentation, 'cue');
}

function communicationMechanismLabel(record: ObservationLogRecord): string {
  const network = networkMechanismLabel(record, language);
  if (network !== '—') return network;
  const submission: Readonly<Record<string, string>> =
    language === 'ja'
      ? {
          form_submit_event: '標準form submitイベント',
          submitter_activation: 'submit操作面',
          enter_key_candidate: 'Enter送信候補',
        }
      : {
          form_submit_event: 'Standard form submit event',
          submitter_activation: 'Submit control activation',
          enter_key_candidate: 'Enter submission candidate',
        };
  return record.submissionMechanism === undefined
    ? '—'
    : (submission[record.submissionMechanism] ?? record.submissionMechanism);
}

function appendCell(row: HTMLTableRowElement, text: string, title?: string): HTMLTableCellElement {
  const cell = document.createElement('td');
  cell.textContent = text;
  if (title !== undefined) cell.title = title;
  row.append(cell);
  return cell;
}

function renderRecords(
  visibleRecords: readonly Readonly<ObservationLogRecord>[],
  tipAnalyses: readonly ObservationTipAnalysis[],
): void {
  const pageCount = Math.max(1, Math.ceil(visibleRecords.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, state.currentPage), pageCount);
  if (currentPage !== state.currentPage) state = { ...state, currentPage };
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageRecords = visibleRecords.slice(start, start + PAGE_SIZE);

  recordsBody.replaceChildren();
  recordsEmpty.hidden = visibleRecords.length > 0;
  recordCountLabel.textContent = local(
    `${visibleRecords.length}件中 ${pageRecords.length}件を表示（${visibleRecords.length === 0 ? 0 : start + 1}～${Math.min(start + pageRecords.length, visibleRecords.length)}）`,
    `Showing ${pageRecords.length} of ${visibleRecords.length} records (${visibleRecords.length === 0 ? 0 : start + 1}–${Math.min(start + pageRecords.length, visibleRecords.length)})`,
  );
  pageLabel.textContent = `${currentPage} / ${pageCount}`;
  previousPage.disabled = currentPage <= 1;
  nextPage.disabled = currentPage >= pageCount;

  for (const readonlyRecord of pageRecords) {
    const record = asObservationRecord(readonlyRecord);
    const row = document.createElement('tr');
    row.dataset.eventId = record.eventId;
    if (record.eventId === state.selectedRecordId) row.dataset.selected = 'true';

    const timeCell = document.createElement('td');
    const selectButton = document.createElement('button');
    selectButton.type = 'button';
    selectButton.className = 'reader-record-button';
    selectButton.dataset.eventId = record.eventId;
    selectButton.setAttribute('aria-pressed', String(record.eventId === state.selectedRecordId));
    selectButton.textContent = formatDateTime(record.timestamp);
    selectButton.title = local(
      `原レコードを表示: ${record.eventId}`,
      `Show original record: ${record.eventId}`,
    );
    timeCell.append(selectButton);
    row.append(timeCell);

    appendCell(row, record.domainKey, record.domainKey);
    appendCell(row, frameContextLabel(record, language), textOrDash(record.frameType));
    appendCell(
      row,
      `${triggerTypeLabel(record.triggerType, language)} · ${surfaceTypeLabel(record.surfaceType, language)}`,
      `${record.triggerType} / ${record.surfaceType}`,
    );
    appendCell(
      row,
      `${submissionMethodLabel(record)} · ${communicationMechanismLabel(record)}`,
      `${textOrDash(record.networkMethod ?? record.submissionMethod)} / ${textOrDash(record.networkMechanism ?? record.submissionMechanism)}`,
    );
    appendCell(
      row,
      submissionDestinationLabel(record, language),
      textOrDash(record.destinationHost),
    );
    appendCell(
      row,
      networkCorrelationLabel(record, language),
      textOrDash(record.networkCorrelation),
    );
    const matchedTips = matchedTipIdsForRecord(tipAnalyses, record.eventId);
    appendCell(
      row,
      record.cuePresented
        ? local('表示対象', 'Presentation eligible')
        : local('表示対象外', 'Not presentation eligible'),
      `${record.cuePresented}; ${local('関連チップス', 'Related tips')} ${matchedTips.length}`,
    );
    recordsBody.append(row);
  }
}

function appendDetail(list: HTMLElement, label: string, value: string, rawValue?: string): void {
  const wrapper = document.createElement('div');
  const term = document.createElement('dt');
  const description = document.createElement('dd');
  term.textContent = label;
  description.textContent =
    rawValue === undefined || rawValue === value
      ? value
      : local(`${value} / 原値: ${rawValue}`, `${value} / Raw value: ${rawValue}`);
  wrapper.append(term, description);
  list.append(wrapper);
}

function findSelectedRecord(
  source: ValidatedObservationLogExport,
): Readonly<ObservationLogRecord> | undefined {
  return state.selectedRecordId === undefined
    ? undefined
    : source.records.find((record) => record.eventId === state.selectedRecordId);
}

function renderRecordDetail(
  source: ValidatedObservationLogExport,
  tipAnalyses: readonly ObservationTipAnalysis[],
): void {
  const readonlyRecord = findSelectedRecord(source);
  clearSelection.disabled = readonlyRecord === undefined;
  detailEmpty.hidden = readonlyRecord !== undefined;
  recordDetail.hidden = readonlyRecord === undefined;
  recordDetailList.replaceChildren();
  rawRecordJson.textContent = '';
  if (readonlyRecord === undefined) return;

  const record = asObservationRecord(readonlyRecord);
  appendDetail(recordDetailList, 'eventId', record.eventId);
  appendDetail(
    recordDetailList,
    t(language, 'time'),
    formatDateTime(record.timestamp),
    String(record.timestamp),
  );
  appendDetail(recordDetailList, t(language, 'browsingSite'), record.domainKey);
  appendDetail(
    recordDetailList,
    local('ログ層', 'Log layer'),
    logLayerLabel(record, language),
    textOrDash(record.logLayer),
  );
  appendDetail(
    recordDetailList,
    t(language, 'frame'),
    frameContextLabel(record, language),
    textOrDash(record.frameType),
  );
  appendDetail(
    recordDetailList,
    local('観測面', 'Observation surface'),
    surfaceTypeLabel(record.surfaceType, language),
    record.surfaceType,
  );
  appendDetail(
    recordDetailList,
    local('観測契機', 'Observation trigger'),
    triggerTypeLabel(record.triggerType, language),
    record.triggerType,
  );
  appendDetail(
    recordDetailList,
    local('観測範囲', 'Observation scope'),
    observationScopeLabel(record, language),
    textOrDash(record.observationScope ?? record.observability),
  );
  appendDetail(
    recordDetailList,
    local('操作根拠', 'Operation evidence'),
    operationEvidenceLabel(record.operationEvidence, language),
    textOrDash(record.operationEvidence),
  );
  appendDetail(
    recordDetailList,
    'method',
    submissionMethodLabel(record),
    textOrDash(record.networkMethod ?? record.submissionMethod),
  );
  appendDetail(
    recordDetailList,
    t(language, 'mechanism'),
    communicationMechanismLabel(record),
    textOrDash(record.networkMechanism ?? record.submissionMechanism),
  );
  appendDetail(
    recordDetailList,
    t(language, 'destination'),
    submissionDestinationLabel(record, language),
    textOrDash(record.destinationHost),
  );
  appendDetail(
    recordDetailList,
    t(language, 'operationCorrelation'),
    networkCorrelationLabel(record, language),
    textOrDash(record.networkCorrelation),
  );
  appendDetail(
    recordDetailList,
    local('ページ観測との時間関係', 'Timing relative to page observation'),
    pageObservationTimingLabel(record, language),
    textOrDash(record.pageObservationTiming),
  );
  appendDetail(
    recordDetailList,
    local('Cookieヘッダー', 'Cookie header'),
    cookieHeaderDetectionLabel(record, language),
    textOrDash(record.cookieHeaderDetection),
  );
  appendDetail(
    recordDetailList,
    local('通信本文', 'Network payload'),
    networkPayloadObservationLabel(record, language),
    textOrDash(record.networkPayloadObservation),
  );
  appendDetail(
    recordDetailList,
    local('送信形式', 'Submission encoding'),
    submissionEncodingLabel(record),
    textOrDash(record.submissionEncoding),
  );
  appendDetail(
    recordDetailList,
    local('送信操作との関係', 'Relation to submission action'),
    submissionAssociationLabel(record, language),
    textOrDash(record.submissionAssociation),
  );
  appendDetail(
    recordDetailList,
    local('入力面構造', 'Input-surface structure'),
    surfaceStructureLabel(record),
  );
  appendDetail(recordDetailList, t(language, 'viscosityLevel'), String(record.viscosityLevel));
  appendDetail(recordDetailList, 'cuePresented', String(record.cuePresented));
  const matched = matchedTipIdsForRecord(tipAnalyses, record.eventId);
  appendDetail(
    recordDetailList,
    local('関連し得るチップス', 'Potentially relevant tips'),
    matched.length === 0 ? local('なし', 'None') : matched.join(', '),
  );

  rawRecordJson.textContent = JSON.stringify(readonlyRecord, null, 2);
}

function appendTextList(parent: HTMLElement, heading: string, values: readonly string[]): void {
  const title = document.createElement('h4');
  title.textContent = heading;
  const list = document.createElement('ul');
  for (const value of values) {
    const item = document.createElement('li');
    item.textContent = value;
    list.append(item);
  }
  parent.append(title, list);
}

function renderTipDetail(analyses: readonly ObservationTipAnalysis[]): void {
  const selected = analyses.find((analysis) => analysis.tip.id === state.selectedTipId);
  tipDetail.replaceChildren();
  tipDetail.hidden = selected === undefined;
  if (selected === undefined) return;

  const title = document.createElement('h3');
  title.textContent = selected.tip.title;
  const statusText = document.createElement('p');
  statusText.className = 'reader-tip-status';
  statusText.textContent =
    selected.status === 'available'
      ? local(
          `この表示範囲に関連候補 ${selected.matchingRecordIds.length}件`,
          `${selected.matchingRecordIds.length} potentially related records in the current view`,
        )
      : local(
          'この表示範囲では、必要な観測項目または候補レコードを確認できません。',
          'The current view does not contain the required fields or candidate records for this pattern.',
        );
  const observedHeading = document.createElement('h4');
  observedHeading.textContent = local('観測されたこと', 'Observed');
  const observed = document.createElement('p');
  observed.textContent = selected.tip.observedFact;
  tipDetail.append(title, statusText, observedHeading, observed);
  appendTextList(
    tipDetail,
    local('この記録からは分からないこと', 'Not established by these records'),
    selected.tip.notEstablished,
  );
  appendTextList(
    tipDetail,
    local('一般的にあり得る技術用途', 'Common technical possibilities'),
    selected.tip.commonPossibilities,
  );
  appendTextList(
    tipDetail,
    local('侵襲せずに比較できること', 'Non-invasive comparisons'),
    selected.tip.nonInvasiveChecks,
  );
  const responsibilityHeading = document.createElement('h4');
  responsibilityHeading.textContent = local(
    '運営者へ残る説明責任',
    'Responsibility that remains with the operator',
  );
  const responsibility = document.createElement('p');
  responsibility.className = 'reader-responsibility-return';
  responsibility.textContent = selected.tip.responsibilityReturn;
  tipDetail.append(responsibilityHeading, responsibility);
}

function renderTips(analyses: readonly ObservationTipAnalysis[]): void {
  const buttons = analyses.map((analysis) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'reader-tip-button';
    button.dataset.tipId = analysis.tip.id;
    button.dataset.status = analysis.status;
    button.setAttribute('aria-pressed', String(state.selectedTipId === analysis.tip.id));
    button.textContent = `${analysis.tip.title} · ${
      analysis.status === 'available'
        ? local(
            `${analysis.matchingRecordIds.length}件`,
            `${analysis.matchingRecordIds.length} records`,
          )
        : local('候補なし', 'No candidates')
    }`;
    return button;
  });
  tipsList.replaceChildren(...buttons);
  renderTipDetail(analyses);
}

function render(): void {
  renderFileState();
  const source = state.source;
  loadedArea.hidden = source === undefined;
  if (source === undefined) return;

  const visibleRecords = applyReaderQuery(source.records, state.query);
  const tipAnalyses = analyzeObservationTips(visibleRecords, language);
  renderSummary(source, visibleRecords);
  renderGroups(visibleRecords);
  renderRecords(visibleRecords, tipAnalyses);
  renderRecordDetail(source, tipAnalyses);
  renderTips(tipAnalyses);
}

function setGroupFilter(kind: string, value: string): void {
  const query = state.query;
  let next: ReaderQuery;
  switch (kind) {
    case 'domain':
      next = { ...query, domainKeys: [value] };
      break;
    case 'destination':
      next = { ...query, destinationHosts: [value] };
      break;
    case 'correlation':
      next = { ...query, networkCorrelations: [value] };
      break;
    case 'mechanism':
      next = { ...query, networkMechanisms: [value] };
      break;
    case 'relation':
      next = { ...query, destinationRelations: [value] };
      break;
    case 'cue':
      next = {
        ...query,
        cuePresented: value === 'true' || value === 'false' ? value : 'all',
      };
      break;
    default:
      return;
  }
  state = {
    ...state,
    query: next,
    currentPage: 1,
  };
  syncControlsToQuery();
  render();
  recordsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function parseErrorMessage(code: 'empty_file' | 'invalid_json' | 'file_read_failed'): string {
  switch (code) {
    case 'empty_file':
      return local(
        'ファイルが空です。JSON形式の観測ログを選択してください。',
        'The file is empty. Select a JSON observation log.',
      );
    case 'invalid_json':
      return local(
        'JSONとして解析できませんでした。ファイルは変更されていません。',
        'The file could not be parsed as JSON. The file was not modified.',
      );
    case 'file_read_failed':
      return local(
        'ファイルを読み取れませんでした。ファイルは変更されていません。',
        'The file could not be read. The file was not modified.',
      );
  }
}

async function readSelectedFile(file: File): Promise<void> {
  validationMessages.replaceChildren();
  readerStatus.textContent = local('ファイルを確認しています。', 'Checking the file.');
  if (file.size > FILE_REJECT_BYTES) {
    state = {
      ...state,
      source: undefined,
      file: { name: file.name, size: file.size, lastModified: file.lastModified },
      notices: [],
      selectedRecordId: undefined,
      selectedTipId: undefined,
      currentPage: 1,
    };
    readerStatus.textContent = local(
      '25 MBを超えるファイルはv0.5では読み込めません。ファイルは変更されていません。',
      'Files larger than 25 MB are not supported in v0.5. The file was not modified.',
    );
    fileInput.value = '';
    render();
    appendMessage(local('読込上限は25 MBです。', 'The file-size limit is 25 MB.'), 'error');
    return;
  }

  let text: string;
  try {
    text = await file.text();
  } catch {
    state = {
      ...state,
      source: undefined,
      file: { name: file.name, size: file.size, lastModified: file.lastModified },
      notices: [],
      selectedRecordId: undefined,
      selectedTipId: undefined,
      currentPage: 1,
    };
    readerStatus.textContent = parseErrorMessage('file_read_failed');
    fileInput.value = '';
    render();
    appendMessage(
      local(
        'ブラウザーがファイル内容を取得できませんでした。ファイルを選び直してください。',
        'The browser could not access the file contents. Select the file again.',
      ),
      'error',
    );
    return;
  }

  const parsed = parseObservationLogExport(text);
  if (!parsed.ok) {
    state = {
      ...state,
      source: undefined,
      file: { name: file.name, size: file.size, lastModified: file.lastModified },
      notices: [],
      selectedRecordId: undefined,
      selectedTipId: undefined,
      currentPage: 1,
    };
    const message = parseErrorMessage(parsed.error.code);
    readerStatus.textContent = message;
    fileInput.value = '';
    render();
    appendMessage(
      parsed.error.position === undefined
        ? message
        : local(
            `${message} エラー位置: ${parsed.error.position}`,
            `${message} Error position: ${parsed.error.position}`,
          ),
      'error',
    );
    return;
  }

  const validation = validateObservationLogExport(parsed.value);
  if (!validation.ok) {
    state = {
      ...state,
      source: undefined,
      file: { name: file.name, size: file.size, lastModified: file.lastModified },
      notices: [],
      selectedRecordId: undefined,
      selectedTipId: undefined,
      currentPage: 1,
    };
    readerStatus.textContent = local(
      'このファイルはConnectBits/DSSI観測ログとして認識できませんでした。ファイルは変更されていません。',
      'This file was not recognized as a ConnectBits/DSSI observation log. The file was not modified.',
    );
    renderFileState();
    for (const error of validation.errors) {
      const message = validationErrorText(error);
      appendMessage(`${error.path === undefined ? '' : `${error.path}: `}${message}`, 'error');
    }
    fileInput.value = '';
    loadedArea.hidden = true;
    return;
  }

  state = {
    source: validation.value,
    query: createDefaultReaderQuery(),
    file: { name: file.name, size: file.size, lastModified: file.lastModified },
    notices: validation.notices,
    selectedRecordId: undefined,
    selectedTipId: undefined,
    currentPage: 1,
  };
  populateFilters(validation.value);
  readerStatus.textContent = local(
    `${validation.value.records.length}件を読取専用で読み込みました。ファイルへの書き戻しは行いません。`,
    `${validation.value.records.length} records loaded read-only. The source file will not be written back.`,
  );
  fileInput.value = '';
  render();
}

function addEventListeners(): void {
  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (file !== undefined) void readSelectedFile(file);
  });

  for (const input of [
    searchText,
    sortOrder,
    cuePresentedFilter,
    timestampFrom,
    timestampTo,
    domainFilter,
    destinationFilter,
    triggerFilter,
    surfaceFilter,
    logLayerFilter,
    frameFilter,
    relationFilter,
    mechanismFilter,
    correlationFilter,
    timingFilter,
    viscosityFilter,
  ]) {
    input.addEventListener(input === searchText ? 'input' : 'change', updateQueryFromControls);
  }

  clearFilters.addEventListener('click', () => {
    state = {
      ...state,
      query: createDefaultReaderQuery(),
      currentPage: 1,
    };
    syncControlsToQuery();
    render();
  });

  previousPage.addEventListener('click', () => {
    if (state.currentPage <= 1) return;
    state = { ...state, currentPage: state.currentPage - 1 };
    render();
  });

  nextPage.addEventListener('click', () => {
    state = { ...state, currentPage: state.currentPage + 1 };
    render();
  });

  clearSelection.addEventListener('click', () => {
    state = { ...state, selectedRecordId: undefined };
    render();
  });

  recordsBody.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const button = target.closest<HTMLButtonElement>('[data-event-id]');
    const eventId = button?.dataset.eventId;
    if (eventId === undefined) return;
    state = { ...state, selectedRecordId: eventId };
    render();
    detailSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  for (const groupContainer of [
    domainGroups,
    destinationGroups,
    correlationGroups,
    mechanismGroups,
    relationGroups,
    cueGroups,
  ]) {
    groupContainer.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const button = target.closest<HTMLButtonElement>('[data-group-kind][data-group-value]');
      const kind = button?.dataset.groupKind;
      const value = button?.dataset.groupValue;
      if (kind === undefined || value === undefined) return;
      setGroupFilter(kind, value);
    });
  }

  tipsList.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const button = target.closest<HTMLButtonElement>('[data-tip-id]');
    const tipId = button?.dataset.tipId;
    if (!isObservationTipId(tipId)) return;
    state = {
      ...state,
      selectedTipId: state.selectedTipId === tipId ? undefined : tipId,
    };
    render();
  });

  openOptions.addEventListener('click', () => void chrome.runtime.openOptionsPage());
  openLog.addEventListener('click', () => {
    void chrome.tabs.create({ url: chrome.runtime.getURL('logs.html') });
  });
  openOnboarding.addEventListener('click', () => {
    void chrome.tabs.create({ url: chrome.runtime.getURL('onboarding.html') });
  });
}

async function initialize(): Promise<void> {
  try {
    const settings = await loadSettings();
    language = resolveUiLanguage(settings.uiLanguage, browserUiLanguage());
  } catch {
    language = resolveUiLanguage('auto', browserUiLanguage());
  }
  applyDocumentTranslations(document, language);
  readerStatus.textContent = t(language, 'waiting');
  addEventListeners();
  render();
}

void initialize();
