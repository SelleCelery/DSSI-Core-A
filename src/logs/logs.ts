import { buildCoverageManifest } from '../core/coverage-manifest';
import {
  buildDssiObservationLogExport,
  exportFilenameTimestamp,
  observationRecordsToCsv,
  type LogExportScopeType,
} from '../core/log-export';
import type { DssiSettings } from '../core/models/settings';
import { NETWORK_METADATA_PERMISSION_REQUEST } from '../core/network-permission';
import {
  boundarySourceLabel,
  classificationConfidenceLabel,
  cookieHeaderDetectionLabel,
  frameContextLabel,
  networkCorrelationLabel,
  networkMechanismLabel,
  networkPayloadObservationLabel,
  observationActionLabel,
  observationScopeLabel,
  operationEvidenceLabel,
  pageObservationTimingLabel,
  submissionAssociationLabel,
  submissionDestinationLabel,
  submissionEncodingLabel,
  submissionMethodLabel,
  surfaceStructureLabel,
  surfaceTypeLabel,
} from '../core/observation-presentation';
import {
  applyDocumentTranslations,
  browserUiLanguage,
  resolveUiLanguage,
  t,
  type UiLanguage,
} from '../i18n/ui';
import { loadSettings } from '../storage/settings-store';
import { getObservationSettingsSnapshots } from '../storage/settings-snapshot-store';
import {
  clearActivityRecords,
  clearDiagnosticRecords,
  clearSessionRecords,
  getDiagnosticRecords,
  getSessionRecords,
} from '../storage/session-buffer';
import { renderCoverageManifest } from '../ui/coverage-renderer';
import {
  renderObservationSimpleStream,
  type TaggedObservationRecord,
} from '../ui/observation-simple-stream';
import { requiredElement } from '../ui/required-element';

type ViewMode = 'all' | 'activity' | 'diagnostic';
type DisplayMode = 'simple' | 'detailed';
type ExportFormat = 'json' | 'csv' | 'both';

type TaggedRecord = TaggedObservationRecord;

const count = requiredElement<HTMLElement>('#count');
const viewLabel = requiredElement<HTMLElement>('#viewLabel');
const empty = requiredElement<HTMLElement>('#empty');
const body = requiredElement<HTMLTableSectionElement>('#logBody');
const simpleStream = requiredElement<HTMLDivElement>('#simpleStream');
const detailView = requiredElement<HTMLDivElement>('#detailView');
const refreshButton = requiredElement<HTMLButtonElement>('#refresh');
const showCoverageButton = requiredElement<HTMLButtonElement>('#showCoverage');
const clearCurrentButton = requiredElement<HTMLButtonElement>('#clearCurrent');
const clearAllButton = requiredElement<HTMLButtonElement>('#clearAll');
const allButton = requiredElement<HTMLButtonElement>('#showAll');
const activityButton = requiredElement<HTMLButtonElement>('#showActivity');
const diagnosticButton = requiredElement<HTMLButtonElement>('#showDiagnostic');
const simpleButton = requiredElement<HTMLButtonElement>('#showSimple');
const detailedButton = requiredElement<HTMLButtonElement>('#showDetailed');
const exportFormat = requiredElement<HTMLSelectElement>('#exportFormat');
const exportScope = requiredElement<HTMLSelectElement>('#exportScope');
const exportLogsButton = requiredElement<HTMLButtonElement>('#exportLogs');
const status = requiredElement<HTMLElement>('#status');
const coverageDialog = requiredElement<HTMLDialogElement>('#coverageDialog');
const coverageDialogBody = requiredElement<HTMLDivElement>('#coverageDialogBody');
const pulseGuideDialog = requiredElement<HTMLDialogElement>('#pulseGuideDialog');
const openPulseGuideButton = requiredElement<HTMLButtonElement>('#openPulseGuide');
const openOptionsButton = requiredElement<HTMLButtonElement>('#openOptions');
const openReaderButton = requiredElement<HTMLButtonElement>('#openReader');
const openOnboardingButton = requiredElement<HTMLButtonElement>('#openOnboarding');
const advancedReadingBody = requiredElement<HTMLDivElement>('#advancedReadingBody');
const tableScrollTop = requiredElement<HTMLDivElement>('#tableScrollTop');
const tableScrollTopSizer = requiredElement<HTMLDivElement>('#tableScrollTopSizer');
const tableScroll = requiredElement<HTMLDivElement>('#tableScroll');
const observationTable = requiredElement<HTMLTableElement>('#observationTable');

let viewMode: ViewMode = 'all';
let displayMode: DisplayMode = 'simple';
let scrollSyncInProgress = false;
let currentSettings: DssiSettings | undefined;
let language: UiLanguage = 'ja';

function local(ja: string, en: string): string {
  return language === 'ja' ? ja : en;
}

function locale(): string {
  return language === 'ja' ? 'ja-JP' : 'en-US';
}

function applyLanguage(next: UiLanguage): void {
  language = next;
  applyDocumentTranslations(document, language);
  document.title = `${t(language, 'productName')} — ${t(language, 'logTitle')}`;
  renderColumnLabels();
  renderAdvancedReading();
}

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString(locale(), {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function makeCell(text: string): HTMLTableCellElement {
  const cell = document.createElement('td');
  cell.textContent = text;
  return cell;
}

function renderColumnLabels(): void {
  const labels: Readonly<Record<string, readonly [string, string]>> = {
    time: ['時刻', 'Time'],
    layer: ['区分', 'Layer'],
    frameHost: ['観測フレーム', 'Observed frame'],
    frameRelation: ['フレーム関係', 'Frame relation'],
    surface: ['入力面', 'Input surface'],
    structure: ['安全な構造情報', 'Safe structure'],
    fact: ['観測事実', 'Observed fact'],
    evidence: ['操作証拠', 'Operation evidence'],
    classification: ['入力面分類根拠', 'Classification basis'],
    scope: ['境界観測範囲', 'Observation scope'],
    boundary: ['境界種別', 'Boundary type'],
    association: ['送信関連づけ', 'Submission association'],
    destination: ['送信先／通信先', 'Declared / observed destination'],
    mechanism: ['通信方式', 'Communication mechanism'],
    correlation: ['操作相関', 'Operation correlation'],
    timing: ['ページ観測との時間関係', 'Relation to page observation'],
    cookie: ['Cookieヘッダー', 'Cookie header'],
    payload: ['通信本文', 'Network payload'],
    presentation: ['表示方針', 'Presentation policy'],
  };
  for (const heading of document.querySelectorAll<HTMLElement>('[data-column]')) {
    const key = heading.dataset.column;
    const pair = key === undefined ? undefined : labels[key];
    if (pair) heading.textContent = language === 'ja' ? pair[0] : pair[1];
  }
}

function renderAdvancedReading(): void {
  const notes =
    language === 'ja'
      ? [
          '「トップフレーム」はタブの最上位文書です。「埋め込みフレーム」はその中に置かれた別文書です。',
          '「安全な構造情報」はタグ名、標準type、role、contenteditable、autocompleteトークンだけです。name、id、ラベル、placeholder、入力値は保存しません。',
          '標準formの操作とsubmit成立は、実際の通信完了やサーバー到達を意味しません。',
          '通信の時間相関は、入力内容の送信、因果関係、目的、利用者の意図を証明しません。',
          'MAXは権限や取得内容を増やさず、現在の観測面にある診断事象と既知の死角を多く表示します。',
          'ページ観測開始からの時間関係は、初期化、認証、分析などの用途を分類するものではありません。',
          'Cookieヘッダーは存在だけを検出します。Cookie値や端末内の保存Cookie一覧は取得しません。未検出は不存在の証明ではありません。',
          'ConnectBitsでは通信本文を観測対象としていません。表示はYes／No判定ではなく、現在の設計境界を示します。',
        ]
      : [
          '“Top frame” is the top-level document in a tab. An embedded frame is a separate document inside it.',
          '“Safe structure” contains only tag names, standard input types, roles, contenteditable state, and autocomplete tokens. Names, IDs, labels, placeholders, and values are not stored.',
          'A standard-form action or observed submit event does not establish network completion or server receipt.',
          'Temporal correlation does not establish that input content was sent, causation, purpose, or user intent.',
          'MAX does not add permissions or collection. It presents more diagnostic events and known observation limits within the existing boundary.',
          'Timing relative to page observation does not classify a request as initialization, authentication, analytics, or any other purpose.',
          'Only the presence of a Cookie header is detected. Cookie values and stored-Cookie inventories are not collected. “Not detected” is not proof of absence.',
          "Network payloads are outside ConnectBits' observation scope. This is a design boundary, not a Yes/No reading result.",
        ];
  advancedReadingBody.replaceChildren(
    ...notes.map((note) => {
      const paragraph = document.createElement('p');
      paragraph.textContent = note;
      return paragraph;
    }),
  );
}

function updateMirrorScrollbar(): void {
  if (displayMode !== 'detailed') {
    tableScrollTop.hidden = true;
    return;
  }
  const width = tableScroll.scrollWidth;
  tableScrollTopSizer.style.width = `${width}px`;
  tableScrollTop.hidden = width <= tableScroll.clientWidth;
  if (!tableScrollTop.hidden) tableScrollTop.scrollLeft = tableScroll.scrollLeft;
}

function renderSimple(records: TaggedRecord[]): void {
  renderObservationSimpleStream(simpleStream, records, {
    language,
    ...(currentSettings === undefined
      ? {}
      : {
          visualOptions: {
            domColor: currentSettings.communicationPulseDomColor,
            webRequestColor: currentSettings.communicationPulseWebRequestColor,
            opacity: currentSettings.communicationPulseOpacity,
          },
        }),
  });
}

function renderDetailed(records: TaggedRecord[]): void {
  body.replaceChildren();
  for (const { record, layer } of records) {
    const row = document.createElement('tr');
    row.dataset.layer = layer;
    row.append(
      makeCell(formatTimestamp(record.timestamp)),
      makeCell(layer === 'diagnostic' ? local('診断', 'Diagnostic') : local('通常', 'Activity')),
      makeCell(record.domainKey),
      makeCell(frameContextLabel(record, language)),
      makeCell(surfaceTypeLabel(record.surfaceType, language)),
      makeCell(surfaceStructureLabel(record)),
      makeCell(observationActionLabel(record, language)),
      makeCell(operationEvidenceLabel(record.operationEvidence, language)),
      makeCell(classificationConfidenceLabel(record.classificationConfidence, language)),
      makeCell(observationScopeLabel(record, language)),
      makeCell(boundarySourceLabel(record, language)),
      makeCell(submissionAssociationLabel(record, language)),
      makeCell(submissionMethodLabel(record)),
      makeCell(submissionDestinationLabel(record, language)),
      makeCell(submissionEncodingLabel(record)),
      makeCell(networkMechanismLabel(record, language)),
      makeCell(networkCorrelationLabel(record, language)),
      makeCell(pageObservationTimingLabel(record, language)),
      makeCell(cookieHeaderDetectionLabel(record, language)),
      makeCell(networkPayloadObservationLabel(record, language)),
      makeCell(
        record.cuePresented
          ? local('表示対象（設定依存）', 'Eligible; setting-dependent')
          : local('表示対象外', 'Not presented'),
      ),
    );
    body.append(row);
  }
  requestAnimationFrame(updateMirrorScrollbar);
}

function render(records: TaggedRecord[]): void {
  count.textContent = String(records.length);
  empty.hidden = records.length > 0;
  simpleStream.hidden = displayMode !== 'simple';
  detailView.hidden = displayMode !== 'detailed';
  if (displayMode === 'simple') {
    renderSimple(records);
    tableScrollTop.hidden = true;
  } else {
    renderDetailed(records);
  }
}

function setSelected(button: HTMLButtonElement, selected: boolean): void {
  button.setAttribute('aria-selected', String(selected));
  button.classList.toggle('active', selected);
}

function updateViewControls(): void {
  setSelected(allButton, viewMode === 'all');
  setSelected(activityButton, viewMode === 'activity');
  setSelected(diagnosticButton, viewMode === 'diagnostic');
  setSelected(simpleButton, displayMode === 'simple');
  setSelected(detailedButton, displayMode === 'detailed');
  viewLabel.textContent =
    viewMode === 'all'
      ? t(language, 'allTimeline')
      : viewMode === 'activity'
        ? t(language, 'activityLog')
        : t(language, 'diagnosticLog');
}

async function allTaggedRecords(): Promise<TaggedRecord[]> {
  const [activity, diagnostic] = await Promise.all([getSessionRecords(), getDiagnosticRecords()]);
  return [
    ...activity.map((record) => ({ record, layer: 'activity' as const })),
    ...diagnostic.map((record) => ({ record, layer: 'diagnostic' as const })),
  ].sort((a, b) => b.record.timestamp - a.record.timestamp);
}

async function recordsForCurrentView(): Promise<TaggedRecord[]> {
  const all = await allTaggedRecords();
  if (viewMode === 'all') return all;
  return all.filter(({ layer }) => layer === viewMode);
}

async function refresh(): Promise<void> {
  currentSettings = await loadSettings();
  applyLanguage(resolveUiLanguage(currentSettings.uiLanguage, browserUiLanguage()));
  updateViewControls();
  render(await recordsForCurrentView());
}

async function showCoverage(): Promise<void> {
  const [settings, permissionGranted] = await Promise.all([
    loadSettings(),
    chrome.permissions.contains(NETWORK_METADATA_PERMISSION_REQUEST),
  ]);
  renderCoverageManifest(
    coverageDialogBody,
    buildCoverageManifest(
      {
        observationEnabled: settings.enabled,
        networkObservationEnabled: settings.networkObservationEnabled,
        networkPermissionGranted: permissionGranted,
      },
      language,
    ),
    language,
  );
  coverageDialog.showModal();
}

function synchronizeScroll(source: HTMLDivElement, target: HTMLDivElement): void {
  if (scrollSyncInProgress) return;
  scrollSyncInProgress = true;
  target.scrollLeft = source.scrollLeft;
  requestAnimationFrame(() => {
    scrollSyncInProgress = false;
  });
}

function selectView(next: ViewMode): void {
  viewMode = next;
  void refresh();
}

function selectDisplay(next: DisplayMode): void {
  displayMode = next;
  void refresh();
}

function downloadText(filename: string, text: string, mimeType: string): void {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.hidden = true;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function selectedExportFormat(): ExportFormat {
  return exportFormat.value === 'csv' ? 'csv' : exportFormat.value === 'both' ? 'both' : 'json';
}

function selectedExportScope(): LogExportScopeType {
  return exportScope.value === 'current_view' ? 'current_view' : 'all_records';
}

async function exportLogs(): Promise<void> {
  const scopeType = selectedExportScope();
  const tagged =
    scopeType === 'all_records' ? await allTaggedRecords() : await recordsForCurrentView();
  const records = tagged.map(({ record }) => record);
  const [settings, permissionGranted] = await Promise.all([
    loadSettings(),
    chrome.permissions.contains(NETWORK_METADATA_PERMISSION_REQUEST),
  ]);
  const snapshotIds = new Set(
    records
      .map((record) => record.settingsSnapshotId)
      .filter((id): id is string => id !== undefined),
  );
  const settingsSnapshots = await getObservationSettingsSnapshots(snapshotIds);
  const now = new Date();
  const timestamp = exportFilenameTimestamp(now);
  const baseName = `connectbits-observation-log_${timestamp}`;
  const document = buildDssiObservationLogExport({
    records,
    settings,
    settingsSnapshots,
    coverageManifest: buildCoverageManifest(
      {
        observationEnabled: settings.enabled,
        networkObservationEnabled: settings.networkObservationEnabled,
        networkPermissionGranted: permissionGranted,
      },
      language,
    ),
    applicationVersion: chrome.runtime.getManifest().version,
    scope: {
      type: scopeType,
      viewMode,
      filterApplied: scopeType === 'current_view' && viewMode !== 'all',
    },
    exportedAt: now,
    language,
  });
  const json = `${JSON.stringify(document, null, 2)}\n`;
  const contextOnly = {
    export: document.export,
    observationContext: document.observationContext,
    useBoundary: document.useBoundary,
    integrity: document.integrity,
  };
  const contextJson = `${JSON.stringify(contextOnly, null, 2)}\n`;
  const csv = `\uFEFF${observationRecordsToCsv(records)}\r\n`;

  switch (selectedExportFormat()) {
    case 'json':
      downloadText(`${baseName}.json`, json, 'application/json;charset=utf-8');
      break;
    case 'csv':
      downloadText(`${baseName}.csv`, csv, 'text/csv;charset=utf-8');
      downloadText(`${baseName}.context.json`, contextJson, 'application/json;charset=utf-8');
      break;
    case 'both':
      downloadText(`${baseName}.json`, json, 'application/json;charset=utf-8');
      downloadText(`${baseName}.csv`, csv, 'text/csv;charset=utf-8');
      break;
  }
  status.textContent = t(language, 'statusExported', { count: records.length });
}

tableScrollTop.addEventListener('scroll', () => synchronizeScroll(tableScrollTop, tableScroll));
tableScroll.addEventListener('scroll', () => synchronizeScroll(tableScroll, tableScrollTop));
new ResizeObserver(updateMirrorScrollbar).observe(observationTable);
new ResizeObserver(updateMirrorScrollbar).observe(tableScroll);

allButton.addEventListener('click', () => selectView('all'));
activityButton.addEventListener('click', () => selectView('activity'));
diagnosticButton.addEventListener('click', () => selectView('diagnostic'));
simpleButton.addEventListener('click', () => selectDisplay('simple'));
detailedButton.addEventListener('click', () => selectDisplay('detailed'));
refreshButton.addEventListener('click', () => void refresh());
showCoverageButton.addEventListener('click', () => void showCoverage());
openPulseGuideButton.addEventListener('click', () => pulseGuideDialog.showModal());
exportLogsButton.addEventListener('click', () => void exportLogs());
openOptionsButton.addEventListener('click', () => void chrome.runtime.openOptionsPage());
openReaderButton.addEventListener('click', () => {
  void chrome.tabs.create({ url: chrome.runtime.getURL('reader.html') });
});
openOnboardingButton.addEventListener('click', () => {
  void chrome.tabs.create({ url: chrome.runtime.getURL('onboarding.html') });
});
clearCurrentButton.addEventListener('click', () => {
  if (viewMode === 'all') {
    if (!window.confirm(t(language, 'confirmClearAll'))) return;
    void clearSessionRecords().then(async () => {
      status.textContent = t(language, 'clearedAll');
      await refresh();
    });
    return;
  }
  const label = viewMode === 'activity' ? t(language, 'activityLog') : t(language, 'diagnosticLog');
  if (!window.confirm(t(language, 'confirmClearLayer', { label }))) return;
  const clear = viewMode === 'activity' ? clearActivityRecords : clearDiagnosticRecords;
  void clear().then(async () => {
    status.textContent = t(language, 'clearedLayer', { label });
    await refresh();
  });
});
clearAllButton.addEventListener('click', () => {
  if (!window.confirm(t(language, 'confirmClearAll'))) return;
  void clearSessionRecords().then(async () => {
    status.textContent = t(language, 'clearedAll');
    await refresh();
  });
});

chrome.storage.onChanged.addListener(
  (_changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
    if (areaName === 'session' || areaName === 'local') void refresh();
  },
);

void refresh();
