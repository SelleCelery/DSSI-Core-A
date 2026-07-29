import {
  boundarySourceLabel,
  classificationConfidenceLabel,
  frameContextLabel,
  observationActionLabel,
  networkCorrelationLabel,
  networkMechanismLabel,
  networkPayloadObservationLabel,
  observationScopeLabel,
  operationEvidenceLabel,
  submissionAssociationLabel,
  submissionDestinationLabel,
  submissionEncodingLabel,
  submissionMethodLabel,
  surfaceStructureLabel,
  surfaceTypeLabel,
} from '../core/observation-presentation';
import type { ObservationLogRecord } from '../core/models/observation';
import {
  clearActivityRecords,
  clearDiagnosticRecords,
  clearSessionRecords,
  getDiagnosticRecords,
  getSessionRecords,
} from '../storage/session-buffer';
import { requiredElement } from '../ui/required-element';

type ViewMode = 'activity' | 'diagnostic';

const count = requiredElement<HTMLElement>('#count');
const viewLabel = requiredElement<HTMLElement>('#viewLabel');
const empty = requiredElement<HTMLElement>('#empty');
const body = requiredElement<HTMLTableSectionElement>('#logBody');
const refreshButton = requiredElement<HTMLButtonElement>('#refresh');
const clearCurrentButton = requiredElement<HTMLButtonElement>('#clearCurrent');
const clearAllButton = requiredElement<HTMLButtonElement>('#clearAll');
const activityButton = requiredElement<HTMLButtonElement>('#showActivity');
const diagnosticButton = requiredElement<HTMLButtonElement>('#showDiagnostic');
const status = requiredElement<HTMLElement>('#status');
let viewMode: ViewMode = 'activity';

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

function makeCell(text: string): HTMLTableCellElement {
  const cell = document.createElement('td');
  cell.textContent = text;
  return cell;
}

function render(records: ObservationLogRecord[]): void {
  body.replaceChildren();
  count.textContent = String(records.length);
  empty.hidden = records.length > 0;

  for (const record of [...records].reverse()) {
    const row = document.createElement('tr');
    row.append(
      makeCell(formatTimestamp(record.timestamp)),
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
      makeCell(networkPayloadObservationLabel(record)),
      makeCell(record.cuePresented ? '表示' : '非表示'),
    );
    body.append(row);
  }
}

function updateViewControls(): void {
  const activity = viewMode === 'activity';
  activityButton.setAttribute('aria-selected', String(activity));
  diagnosticButton.setAttribute('aria-selected', String(!activity));
  activityButton.classList.toggle('active', activity);
  diagnosticButton.classList.toggle('active', !activity);
  viewLabel.textContent = activity ? '通常ログ' : '診断ログ';
}

async function recordsForCurrentView(): Promise<ObservationLogRecord[]> {
  return viewMode === 'activity' ? getSessionRecords() : getDiagnosticRecords();
}

async function refresh(): Promise<void> {
  updateViewControls();
  render(await recordsForCurrentView());
}

activityButton.addEventListener('click', () => {
  viewMode = 'activity';
  void refresh();
});
diagnosticButton.addEventListener('click', () => {
  viewMode = 'diagnostic';
  void refresh();
});
refreshButton.addEventListener('click', () => void refresh());
clearCurrentButton.addEventListener('click', () => {
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
