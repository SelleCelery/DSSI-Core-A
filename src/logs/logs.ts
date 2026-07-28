import {
  classificationConfidenceLabel,
  observationActionLabel,
  observationScopeLabel,
  operationEvidenceLabel,
  surfaceTypeLabel,
} from '../core/observation-presentation';
import type { ObservationLogRecord } from '../core/models/observation';
import { clearSessionRecords, getSessionRecords } from '../storage/session-buffer';
import { requiredElement } from '../ui/required-element';

const count = requiredElement<HTMLElement>('#count');
const empty = requiredElement<HTMLElement>('#empty');
const body = requiredElement<HTMLTableSectionElement>('#logBody');
const refreshButton = requiredElement<HTMLButtonElement>('#refresh');
const clearButton = requiredElement<HTMLButtonElement>('#clear');
const status = requiredElement<HTMLElement>('#status');

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
      makeCell(surfaceTypeLabel(record.surfaceType)),
      makeCell(observationActionLabel(record)),
      makeCell(operationEvidenceLabel(record.operationEvidence)),
      makeCell(classificationConfidenceLabel(record.classificationConfidence)),
      makeCell(observationScopeLabel(record)),
      makeCell(record.cuePresented ? '表示' : '非表示'),
    );
    body.append(row);
  }
}

async function refresh(): Promise<void> {
  render(await getSessionRecords());
}

refreshButton.addEventListener('click', () => void refresh());
clearButton.addEventListener('click', () => {
  const confirmed = window.confirm('現在のブラウザセッションの観測ログを消去しますか？');
  if (!confirmed) return;

  void clearSessionRecords().then(async () => {
    status.textContent = 'セッション観測ログを消去しました。';
    await refresh();
  });
});

chrome.storage.onChanged.addListener((_changes, areaName) => {
  if (areaName === 'session') void refresh();
});

void refresh();
