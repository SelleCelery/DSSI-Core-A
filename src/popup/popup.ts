import {
  isUserInputObservation,
  observationActionLabel,
  surfaceTypeLabel,
} from '../core/observation-presentation';
import type { ObservationLogRecord } from '../core/models/observation';
import type { ReportingMode } from '../core/models/settings';
import { loadSettings, saveSettings } from '../storage/settings-store';
import { getSessionRecords } from '../storage/session-buffer';
import { requiredElement } from '../ui/required-element';

const MAX_RECENT_RECORDS = 5;

const enabled = requiredElement<HTMLInputElement>('#enabled');
const viscosity = requiredElement<HTMLSelectElement>('#viscosityLevel');
const reportingMode = requiredElement<HTMLSelectElement>('#reportingMode');
const status = requiredElement<HTMLElement>('#status');
const count = requiredElement<HTMLElement>('#count');
const recentList = requiredElement<HTMLUListElement>('#recentList');
const recentEmpty = requiredElement<HTMLElement>('#recentEmpty');
const openLog = requiredElement<HTMLButtonElement>('#openLog');
const openOptions = requiredElement<HTMLButtonElement>('#openOptions');

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function renderRecent(records: ObservationLogRecord[]): void {
  recentList.replaceChildren();

  const recent = records.filter(isUserInputObservation).slice(-MAX_RECENT_RECORDS).reverse();

  recentEmpty.hidden = recent.length > 0;

  for (const record of recent) {
    const item = document.createElement('li');
    item.className = 'observation-item';

    const action = document.createElement('strong');
    action.textContent = observationActionLabel(record);

    const detail = document.createElement('span');
    detail.textContent = `${formatTime(record.timestamp)} · ${surfaceTypeLabel(record.surfaceType)} · ${record.domainKey}`;

    item.append(action, detail);
    recentList.append(item);
  }
}

function asReportingMode(value: string): ReportingMode {
  return value === 'max_coverage' ? 'max_coverage' : 'standard';
}

async function refresh(): Promise<void> {
  const [settings, records] = await Promise.all([loadSettings(), getSessionRecords()]);
  enabled.checked = settings.enabled;
  viscosity.value = String(settings.viscosityLevel);
  reportingMode.value = settings.reportingMode;
  count.textContent = String(records.length);
  renderRecent(records);
}

async function persist(): Promise<void> {
  const current = await loadSettings();
  await saveSettings({
    ...current,
    enabled: enabled.checked,
    viscosityLevel: Number(viscosity.value) === 3 ? 3 : Number(viscosity.value) === 2 ? 2 : 1,
    reportingMode: asReportingMode(reportingMode.value),
  });
  status.textContent =
    reportingMode.value === 'max_coverage'
      ? 'MAX報告モードを保存しました。対象ページの再読み込み後に反映されます。'
      : '設定を保存しました。';
}

enabled.addEventListener('change', () => void persist());
viscosity.addEventListener('change', () => void persist());
reportingMode.addEventListener('change', () => void persist());
openLog.addEventListener('click', () => {
  void chrome.tabs.create({ url: chrome.runtime.getURL('logs.html') });
});
openOptions.addEventListener('click', () => void chrome.runtime.openOptionsPage());

chrome.storage.onChanged.addListener(
  (_changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
    if (areaName === 'session') void refresh();
  },
);

void refresh();
