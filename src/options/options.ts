import {
  buildCoverageManifest,
  coverageReasonLabel,
  coverageStatusLabel,
} from '../core/coverage-manifest';
import { NETWORK_PERMISSION_REQUEST } from '../core/network-permission';
import type { FactChipPosition, ReportingMode } from '../core/models/settings';
import { loadSettings, saveSettings } from '../storage/settings-store';
import { requiredElement } from '../ui/required-element';

const localClassification = requiredElement<HTMLInputElement>('#localClassificationEnabled');
const networkObservation = requiredElement<HTMLInputElement>('#networkObservationEnabled');
const reportingMode = requiredElement<HTMLSelectElement>('#reportingMode');
const factChipPosition = requiredElement<HTMLSelectElement>('#factChipPosition');
const coverageBody = requiredElement<HTMLDivElement>('#coverageBody');
const save = requiredElement<HTMLButtonElement>('#save');
const clearSession = requiredElement<HTMLButtonElement>('#clearSession');
const status = requiredElement<HTMLElement>('#status');

async function hasNetworkPermission(): Promise<boolean> {
  return chrome.permissions.contains(NETWORK_PERMISSION_REQUEST);
}

function asReportingMode(value: string): ReportingMode {
  return value === 'max_coverage' ? 'max_coverage' : 'standard';
}

function asFactChipPosition(value: string): FactChipPosition {
  return value === 'top' || value === 'left' || value === 'bottom' ? value : 'right';
}

async function renderCoverage(): Promise<void> {
  const [settings, permissionGranted] = await Promise.all([loadSettings(), hasNetworkPermission()]);
  coverageBody.replaceChildren();

  for (const entry of buildCoverageManifest({
    networkObservationEnabled: settings.networkObservationEnabled,
    networkPermissionGranted: permissionGranted,
  })) {
    const article = document.createElement('article');
    article.className = 'coverage-entry';

    const heading = document.createElement('h3');
    heading.textContent = entry.label;

    const badges = document.createElement('p');
    badges.className = 'coverage-badges';

    const statusBadge = document.createElement('span');
    statusBadge.className = `coverage-status coverage-${entry.status}`;
    statusBadge.textContent = coverageStatusLabel(entry.status);

    const reasonBadge = document.createElement('span');
    reasonBadge.className = 'coverage-reason';
    reasonBadge.textContent = coverageReasonLabel(entry.reason);

    badges.append(statusBadge, reasonBadge);

    if (entry.permissionGranted !== undefined) {
      const permissionBadge = document.createElement('span');
      permissionBadge.className = 'coverage-reason';
      permissionBadge.textContent = entry.permissionGranted ? '権限あり' : '権限なし';
      badges.append(permissionBadge);
    }

    const detail = document.createElement('p');
    detail.textContent = entry.detail;

    const availability = document.createElement('p');
    availability.className = 'small';
    availability.textContent = entry.enabled ? '現在有効' : '現在は観測経路へ未接続';

    article.append(heading, badges, detail, availability);
    coverageBody.append(article);
  }
}

async function refresh(): Promise<void> {
  const [settings, permissionGranted] = await Promise.all([loadSettings(), hasNetworkPermission()]);
  localClassification.checked = settings.localClassificationEnabled;
  networkObservation.checked = settings.networkObservationEnabled && permissionGranted;
  reportingMode.value = settings.reportingMode;
  factChipPosition.value = settings.factChipPosition;

  if (settings.networkObservationEnabled && !permissionGranted) {
    await saveSettings({ ...settings, networkObservationEnabled: false });
  }

  await renderCoverage();
}

save.addEventListener('click', () => {
  const wantsNetworkObservation = networkObservation.checked;

  // Optional permission requests must begin directly from the user gesture.
  const permissionOperation = wantsNetworkObservation
    ? chrome.permissions.request(NETWORK_PERMISSION_REQUEST)
    : chrome.permissions.remove(NETWORK_PERMISSION_REQUEST).then(() => false);

  void permissionOperation.then(async (networkEnabled: boolean) => {
    const current = await loadSettings();

    if (wantsNetworkObservation && !networkEnabled) {
      networkObservation.checked = false;
      status.textContent = '通信メタデータ観測の権限が付与されなかったため、無効のままです。';
    }

    await saveSettings({
      ...current,
      localClassificationEnabled: localClassification.checked,
      networkObservationEnabled: networkEnabled,
      reportingMode: asReportingMode(reportingMode.value),
      factChipPosition: asFactChipPosition(factChipPosition.value),
    });

    if (networkEnabled) {
      status.textContent =
        '設定を保存しました。通信本文・URL path/query・ヘッダー値は保存しません。';
    } else if (!wantsNetworkObservation) {
      status.textContent = '設定を保存しました。通信メタデータ観測は無効です。';
    }
    await renderCoverage();
  });
});

clearSession.addEventListener('click', () => {
  void chrome.runtime.sendMessage({ type: 'DSSI_CLEAR_SESSION_LOG' }).then(() => {
    status.textContent = 'セッション観測ログを消去しました。';
  });
});

void refresh();
