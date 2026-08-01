import { buildCoverageManifest } from '../core/coverage-manifest';
import { NETWORK_PERMISSION_REQUEST } from '../core/network-permission';
import type {
  CommunicationPulseColor,
  CommunicationPulseDurationMs,
  CommunicationPulseOpacity,
  CommunicationPulseSize,
  FactChipPosition,
  ReportingMode,
} from '../core/models/settings';
import { loadSettings, saveSettings } from '../storage/settings-store';
import { renderCoverageManifest } from '../ui/coverage-renderer';
import { requiredElement } from '../ui/required-element';

const localClassification = requiredElement<HTMLInputElement>('#localClassificationEnabled');
const networkObservation = requiredElement<HTMLInputElement>('#networkObservationEnabled');
const reportingMode = requiredElement<HTMLSelectElement>('#reportingMode');
const factChipPosition = requiredElement<HTMLSelectElement>('#factChipPosition');
const communicationPulseEnabled = requiredElement<HTMLInputElement>('#communicationPulseEnabled');
const communicationTextChipEnabled = requiredElement<HTMLInputElement>(
  '#communicationTextChipEnabled',
);
const communicationPulseDuration = requiredElement<HTMLSelectElement>(
  '#communicationPulseDuration',
);
const communicationPulseSize = requiredElement<HTMLSelectElement>('#communicationPulseSize');
const communicationPulseDomColor = requiredElement<HTMLSelectElement>(
  '#communicationPulseDomColor',
);
const communicationPulseWebRequestColor = requiredElement<HTMLSelectElement>(
  '#communicationPulseWebRequestColor',
);
const communicationPulseOpacity = requiredElement<HTMLSelectElement>('#communicationPulseOpacity');
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
  switch (value) {
    case 'top':
    case 'top_right':
    case 'right':
    case 'bottom_right':
    case 'bottom':
    case 'bottom_left':
    case 'left':
    case 'top_left':
      return value;
    default:
      return 'right';
  }
}

function asCommunicationPulseDuration(value: string): CommunicationPulseDurationMs {
  const duration = Number(value);
  return duration === 0 ||
    duration === 300 ||
    duration === 700 ||
    duration === 1500 ||
    duration === 3000 ||
    duration === 10000 ||
    duration === 30000 ||
    duration === 60000
    ? duration
    : 700;
}

function asCommunicationPulseSize(value: string): CommunicationPulseSize {
  return value === 'medium' ? 'medium' : 'small';
}

function asCommunicationPulseColor(value: string): CommunicationPulseColor {
  switch (value) {
    case 'magenta':
    case 'cyan':
    case 'yellow':
    case 'neutral':
      return value;
    default:
      return 'neutral';
  }
}

function asCommunicationPulseOpacity(value: string): CommunicationPulseOpacity {
  const opacity = Number(value);
  return opacity === 1 || opacity === 0.8 || opacity === 0.6 || opacity === 0.4 ? opacity : 0.8;
}

async function renderCoverage(): Promise<void> {
  const [settings, permissionGranted] = await Promise.all([loadSettings(), hasNetworkPermission()]);
  renderCoverageManifest(
    coverageBody,
    buildCoverageManifest({
      networkObservationEnabled: settings.networkObservationEnabled,
      networkPermissionGranted: permissionGranted,
    }),
  );
}

async function refresh(): Promise<void> {
  const [settings, permissionGranted] = await Promise.all([loadSettings(), hasNetworkPermission()]);
  localClassification.checked = settings.localClassificationEnabled;
  networkObservation.checked = settings.networkObservationEnabled && permissionGranted;
  reportingMode.value = settings.reportingMode;
  factChipPosition.value = settings.factChipPosition;
  communicationPulseEnabled.checked = settings.communicationPulseEnabled;
  communicationTextChipEnabled.checked = settings.communicationTextChipEnabled;
  communicationPulseDuration.value = String(settings.communicationPulseDurationMs);
  communicationPulseSize.value = settings.communicationPulseSize;
  communicationPulseDomColor.value = settings.communicationPulseDomColor;
  communicationPulseWebRequestColor.value = settings.communicationPulseWebRequestColor;
  communicationPulseOpacity.value = String(settings.communicationPulseOpacity);

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
      communicationPulseEnabled: communicationPulseEnabled.checked,
      communicationTextChipEnabled: communicationTextChipEnabled.checked,
      communicationPulseDurationMs: asCommunicationPulseDuration(communicationPulseDuration.value),
      communicationPulseSize: asCommunicationPulseSize(communicationPulseSize.value),
      communicationPulseDomColor: asCommunicationPulseColor(communicationPulseDomColor.value),
      communicationPulseWebRequestColor: asCommunicationPulseColor(
        communicationPulseWebRequestColor.value,
      ),
      communicationPulseOpacity: asCommunicationPulseOpacity(communicationPulseOpacity.value),
    });

    if (networkEnabled) {
      status.textContent =
        '設定を保存しました。通信本文・URL path/query・ヘッダー値は保存しません。対象ページの再読み込み後に確実に反映されます。';
    } else if (!wantsNetworkObservation) {
      status.textContent =
        '設定を保存しました。通信メタデータ観測は無効です。対象ページの再読み込み後に確実に反映されます。';
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
