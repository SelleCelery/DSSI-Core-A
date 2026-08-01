import {
  communicationPulseAriaLabel,
  type CommunicationPulseDescriptor,
} from '../core/communication-pulse';
import { buildCoverageManifest } from '../core/coverage-manifest';
import {
  buildDssiObservationLogExport,
  exportFilenameTimestamp,
  observationRecordsToCsv,
  type LogExportScopeType,
} from '../core/log-export';
import type { ObservationLogRecord } from '../core/models/observation';
import type { DssiSettings } from '../core/models/settings';
import { NETWORK_PERMISSION_REQUEST } from '../core/network-permission';
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
import { createCommunicationPulseIcon } from '../ui/communication-pulse-icon';
import { requiredElement } from '../ui/required-element';

type ViewMode = 'all' | 'activity' | 'diagnostic';
type DisplayMode = 'simple' | 'detailed';
type ExportFormat = 'json' | 'csv' | 'both';

interface TaggedRecord {
  record: ObservationLogRecord;
  layer: 'activity' | 'diagnostic';
}

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
const tableScrollTop = requiredElement<HTMLDivElement>('#tableScrollTop');
const tableScrollTopSizer = requiredElement<HTMLDivElement>('#tableScrollTopSizer');
const tableScroll = requiredElement<HTMLDivElement>('#tableScroll');
const observationTable = requiredElement<HTMLTableElement>('#observationTable');
let viewMode: ViewMode = 'all';
let displayMode: DisplayMode = 'simple';
let scrollSyncInProgress = false;
let currentSettings: DssiSettings | undefined;

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatClock(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('ja-JP', {
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

function communicationDescriptorFromRecord(
  record: ObservationLogRecord,
): CommunicationPulseDescriptor | null {
  if (record.networkMechanism !== undefined && record.networkMethod !== undefined) {
    return {
      kind: record.networkMechanism,
      method: record.networkMethod,
      cookieState: record.cookieHeaderDetection ?? 'not_observed',
      destinationRelation: record.destinationRelation ?? 'unknown',
      bodyObservation: 'not_observed',
    };
  }

  if (record.submissionMethod !== undefined) {
    return {
      kind: 'dom_submit',
      method: record.submissionMethod,
      cookieState: 'not_applicable',
      destinationRelation: record.destinationRelation ?? 'unknown',
      bodyObservation: 'not_observed',
    };
  }

  return null;
}

function createStreamGlyph(record: ObservationLogRecord): HTMLSpanElement {
  const wrapper = document.createElement('span');
  wrapper.className = 'stream-glyph';
  const descriptor = communicationDescriptorFromRecord(record);
  if (descriptor === null) {
    wrapper.textContent = '◇';
    return wrapper;
  }

  const settings = currentSettings;
  const icon = createCommunicationPulseIcon(
    descriptor,
    settings
      ? {
          domColor: settings.communicationPulseDomColor,
          webRequestColor: settings.communicationPulseWebRequestColor,
          opacity: settings.communicationPulseOpacity,
        }
      : undefined,
  );
  icon.title = communicationPulseAriaLabel(descriptor);
  wrapper.append(icon);
  return wrapper;
}

function shortCorrelation(record: ObservationLogRecord): string {
  switch (record.networkCorrelation) {
    case 'recent_content_edit':
      return '内容変更近接';
    case 'recent_submit_operation':
      return 'submit近接';
    case 'no_correlated_user_operation':
      return '操作相関未確認';
    case 'correlation_unavailable':
      return '相関判定不能';
    case 'recent_input_activity':
      return '入力近接（旧）';
    default:
      return record.submissionAssociation === 'correlated_submit_event' ? 'submit成立相関' : '';
  }
}

function detailItem(term: string, description: string): DocumentFragment {
  const fragment = document.createDocumentFragment();
  const dt = document.createElement('dt');
  dt.textContent = term;
  const dd = document.createElement('dd');
  dd.textContent = description;
  fragment.append(dt, dd);
  return fragment;
}

function renderSimple(records: TaggedRecord[]): void {
  simpleStream.replaceChildren();

  for (const { record, layer } of records) {
    const details = document.createElement('details');
    details.className = 'stream-entry';
    details.dataset.layer = layer;

    const summary = document.createElement('summary');
    const time = document.createElement('time');
    time.dateTime = new Date(record.timestamp).toISOString();
    time.textContent = formatClock(record.timestamp);

    const glyph = createStreamGlyph(record);
    glyph.dataset.layer = layer;

    const action = document.createElement('span');
    action.className = 'stream-action';
    action.textContent = observationActionLabel(record);

    const destination = document.createElement('span');
    destination.className = 'stream-destination';
    const destinationText = submissionDestinationLabel(record);
    destination.textContent = destinationText === '—' ? record.domainKey : destinationText;

    const correlation = document.createElement('span');
    correlation.className = 'stream-correlation';
    correlation.textContent = shortCorrelation(record);

    summary.append(time, glyph, action, destination, correlation);

    const detail = document.createElement('dl');
    detail.className = 'stream-detail';
    detail.append(
      detailItem('記録区分', layer === 'diagnostic' ? '診断ログ' : '通常ログ'),
      detailItem('時刻', formatTimestamp(record.timestamp)),
      detailItem('観測フレーム', record.domainKey),
      detailItem('フレーム関係', frameContextLabel(record)),
      detailItem('入力面', surfaceTypeLabel(record.surfaceType)),
      detailItem('安全な構造情報', surfaceStructureLabel(record)),
      detailItem('観測事実', observationActionLabel(record)),
      detailItem('操作証拠', operationEvidenceLabel(record.operationEvidence)),
      detailItem('入力面分類根拠', classificationConfidenceLabel(record.classificationConfidence)),
      detailItem('境界観測範囲', observationScopeLabel(record)),
      detailItem('境界種別', boundarySourceLabel(record)),
      detailItem('送信関連づけ', submissionAssociationLabel(record)),
      detailItem('method', submissionMethodLabel(record)),
      detailItem('送信先／通信先', submissionDestinationLabel(record)),
      detailItem('encoding', submissionEncodingLabel(record)),
      detailItem('通信方式', networkMechanismLabel(record)),
      detailItem('操作相関', networkCorrelationLabel(record)),
      detailItem('ページ観測との時間関係', pageObservationTimingLabel(record)),
      detailItem('Cookieヘッダー検出', cookieHeaderDetectionLabel(record)),
      detailItem('本文観測', networkPayloadObservationLabel(record)),
      detailItem('設定スナップショット', record.settingsSnapshotId ?? '取得不能'),
      detailItem(
        '表示方針',
        record.cuePresented ? '表示対象（実表示は観測時設定に依存）' : '表示対象外',
      ),
    );

    details.append(summary, detail);
    simpleStream.append(details);
  }
}

function renderDetailed(records: TaggedRecord[]): void {
  body.replaceChildren();

  for (const { record, layer } of records) {
    const row = document.createElement('tr');
    row.dataset.layer = layer;
    row.append(
      makeCell(formatTimestamp(record.timestamp)),
      makeCell(layer === 'diagnostic' ? '診断' : '通常'),
      makeCell(record.domainKey),
      makeCell(frameContextLabel(record)),
      makeCell(surfaceTypeLabel(record.surfaceType)),
      makeCell(surfaceStructureLabel(record)),
      makeCell(observationActionLabel(record)),
      makeCell(operationEvidenceLabel(record.operationEvidence)),
      makeCell(classificationConfidenceLabel(record.classificationConfidence)),
      makeCell(observationScopeLabel(record)),
      makeCell(boundarySourceLabel(record)),
      makeCell(submissionAssociationLabel(record)),
      makeCell(submissionMethodLabel(record)),
      makeCell(submissionDestinationLabel(record)),
      makeCell(submissionEncodingLabel(record)),
      makeCell(networkMechanismLabel(record)),
      makeCell(networkCorrelationLabel(record)),
      makeCell(pageObservationTimingLabel(record)),
      makeCell(cookieHeaderDetectionLabel(record)),
      makeCell(networkPayloadObservationLabel(record)),
      makeCell(record.cuePresented ? '表示対象（設定依存）' : '表示対象外'),
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
    viewMode === 'all' ? '全時系列' : viewMode === 'activity' ? '通常ログ' : '診断ログ';
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
  updateViewControls();
  currentSettings = await loadSettings();
  render(await recordsForCurrentView());
}

async function showCoverage(): Promise<void> {
  const [settings, permissionGranted] = await Promise.all([
    loadSettings(),
    chrome.permissions.contains(NETWORK_PERMISSION_REQUEST),
  ]);
  renderCoverageManifest(
    coverageDialogBody,
    buildCoverageManifest({
      networkObservationEnabled: settings.networkObservationEnabled,
      networkPermissionGranted: permissionGranted,
    }),
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
    chrome.permissions.contains(NETWORK_PERMISSION_REQUEST),
  ]);
  const snapshotIds = new Set(
    records
      .map((record) => record.settingsSnapshotId)
      .filter((id): id is string => id !== undefined),
  );
  const settingsSnapshots = await getObservationSettingsSnapshots(snapshotIds);
  const now = new Date();
  const timestamp = exportFilenameTimestamp(now);
  const baseName = `dssi-observation-log_${timestamp}`;
  const document = buildDssiObservationLogExport({
    records,
    settings,
    settingsSnapshots,
    coverageManifest: buildCoverageManifest({
      networkObservationEnabled: settings.networkObservationEnabled,
      networkPermissionGranted: permissionGranted,
    }),
    applicationVersion: chrome.runtime.getManifest().version,
    scope: {
      type: scopeType,
      viewMode,
      filterApplied: scopeType === 'current_view' && viewMode !== 'all',
    },
    exportedAt: now,
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

  status.textContent = `${records.length}件の一次観測記録を保存しました。保存時の追加集約・判定は行っていません。`;
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
exportLogsButton.addEventListener('click', () => void exportLogs());
clearCurrentButton.addEventListener('click', () => {
  if (viewMode === 'all') {
    if (!window.confirm('通常ログと診断ログをすべて消去しますか？')) return;
    void clearSessionRecords().then(async () => {
      status.textContent = '通常ログと診断ログを消去しました。';
      await refresh();
    });
    return;
  }

  const label = viewMode === 'activity' ? '通常ログ' : '診断ログ';
  if (!window.confirm(`${label}を消去しますか？`)) return;
  const clear = viewMode === 'activity' ? clearActivityRecords : clearDiagnosticRecords;
  void clear().then(async () => {
    status.textContent = `${label}を消去しました。`;
    await refresh();
  });
});
clearAllButton.addEventListener('click', () => {
  if (!window.confirm('現在のブラウザセッションの通常ログと診断ログをすべて消去しますか？')) return;
  void clearSessionRecords().then(async () => {
    status.textContent = '通常ログと診断ログを消去しました。';
    await refresh();
  });
});

chrome.storage.onChanged.addListener(
  (_changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
    if (areaName === 'session') void refresh();
  },
);

void refresh();
