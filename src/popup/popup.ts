import type { ObservationLogRecord } from '../core/models/observation';
import { settingsForObservationSelection, type ReportingMode } from '../core/models/settings';
import { removeNetworkMetadataPermission } from '../core/network-permission';
import {
  isUserInputObservation,
  observationActionLabel,
  surfaceTypeLabel,
} from '../core/observation-presentation';
import {
  applyDocumentTranslations,
  browserUiLanguage,
  resolveUiLanguage,
  t,
  type UiLanguage,
} from '../i18n/ui';
import { loadSettings, saveSettings } from '../storage/settings-store';
import { updateOnboardingSelection } from '../storage/onboarding-store';
import { getSessionRecords } from '../storage/session-buffer';
import { requiredElement } from '../ui/required-element';

const MAX_RECENT_RECORDS = 5;

const enabled = requiredElement<HTMLInputElement>('#enabled');
const viscosity = requiredElement<HTMLSelectElement>('#viscosityLevel');
const reportingMode = requiredElement<HTMLSelectElement>('#reportingMode');
const communicationPulseEnabled = requiredElement<HTMLInputElement>('#communicationPulseEnabled');
const status = requiredElement<HTMLElement>('#status');
const count = requiredElement<HTMLElement>('#count');
const recentList = requiredElement<HTMLUListElement>('#recentList');
const recentEmpty = requiredElement<HTMLElement>('#recentEmpty');
const openLog = requiredElement<HTMLButtonElement>('#openLog');
const openReader = requiredElement<HTMLButtonElement>('#openReader');
const openOptions = requiredElement<HTMLButtonElement>('#openOptions');
const openOnboarding = requiredElement<HTMLButtonElement>('#openOnboarding');

let language: UiLanguage = 'ja';

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString(language === 'ja' ? 'ja-JP' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function applyLanguage(next: UiLanguage): void {
  language = next;
  applyDocumentTranslations(document, language);
  document.title = t(language, 'productName');
}

function renderRecent(records: ObservationLogRecord[]): void {
  recentList.replaceChildren();

  const recent = records.filter(isUserInputObservation).slice(-MAX_RECENT_RECORDS).reverse();

  recentEmpty.hidden = recent.length > 0;

  for (const record of recent) {
    const item = document.createElement('li');
    item.className = 'observation-item';

    const action = document.createElement('strong');
    action.textContent = observationActionLabel(record, language);

    const detail = document.createElement('span');
    detail.textContent = `${formatTime(record.timestamp)} · ${surfaceTypeLabel(record.surfaceType, language)} · ${record.domainKey}`;

    item.append(action, detail);
    recentList.append(item);
  }
}

function asReportingMode(value: string): ReportingMode {
  return value === 'max_coverage' ? 'max_coverage' : 'standard';
}

async function refresh(): Promise<void> {
  const [settings, records] = await Promise.all([loadSettings(), getSessionRecords()]);
  applyLanguage(resolveUiLanguage(settings.uiLanguage, browserUiLanguage()));
  enabled.checked = settings.enabled;
  viscosity.value = String(settings.viscosityLevel);
  reportingMode.value = settings.reportingMode;
  communicationPulseEnabled.checked = settings.communicationPulseEnabled;
  count.textContent = String(records.length);
  renderRecent(records);
}

async function persist(): Promise<void> {
  const current = await loadSettings();
  await saveSettings({
    ...current,
    viscosityLevel: Number(viscosity.value) === 3 ? 3 : Number(viscosity.value) === 2 ? 2 : 1,
    reportingMode: asReportingMode(reportingMode.value),
    communicationPulseEnabled: communicationPulseEnabled.checked,
  });
  status.textContent =
    reportingMode.value === 'max_coverage'
      ? t(language, 'statusMaxSaved')
      : t(language, 'statusSaved');
}

async function persistEnabled(): Promise<void> {
  try {
    const current = await loadSettings();
    if (!enabled.checked) {
      const removed = await removeNetworkMetadataPermission();
      if (!removed) throw new Error('network metadata permission was not removed');
      await saveSettings(settingsForObservationSelection(current, 'paused'));
      await updateOnboardingSelection('paused');
      status.textContent = t(language, 'statusObservationPaused');
      return;
    }
    await saveSettings(settingsForObservationSelection(current, 'dom_only'));
    await updateOnboardingSelection('dom_only');
    status.textContent = t(language, 'statusObservationDomOnly');
  } catch {
    await refresh();
    status.textContent = t(language, 'statusPermissionError');
  }
}

enabled.addEventListener('change', () => void persistEnabled());
viscosity.addEventListener('change', () => void persist());
reportingMode.addEventListener('change', () => void persist());
communicationPulseEnabled.addEventListener('change', () => void persist());
openLog.addEventListener('click', () => {
  void chrome.tabs.create({ url: chrome.runtime.getURL('logs.html') });
});
openReader.addEventListener('click', () => {
  void chrome.tabs.create({ url: chrome.runtime.getURL('reader.html') });
});
openOptions.addEventListener('click', () => void chrome.runtime.openOptionsPage());
openOnboarding.addEventListener('click', () => {
  void chrome.tabs.create({ url: chrome.runtime.getURL('onboarding.html') });
});

chrome.storage.onChanged.addListener(
  (_changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
    if (areaName === 'session' || areaName === 'local') void refresh();
  },
);

void refresh();
