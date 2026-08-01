import { NETWORK_PERMISSION_REQUEST } from '../core/network-permission';
import { loadSettings, saveSettings } from '../storage/settings-store';
import { requiredElement } from '../ui/required-element';

const localClassification = requiredElement<HTMLInputElement>('#localClassificationEnabled');
const networkObservation = requiredElement<HTMLInputElement>('#networkObservationEnabled');
const save = requiredElement<HTMLButtonElement>('#save');
const clearSession = requiredElement<HTMLButtonElement>('#clearSession');
const status = requiredElement<HTMLElement>('#status');

async function hasNetworkPermission(): Promise<boolean> {
  return chrome.permissions.contains(NETWORK_PERMISSION_REQUEST);
}

async function refresh(): Promise<void> {
  const [settings, permissionGranted] = await Promise.all([loadSettings(), hasNetworkPermission()]);
  localClassification.checked = settings.localClassificationEnabled;
  networkObservation.checked = settings.networkObservationEnabled && permissionGranted;

  if (settings.networkObservationEnabled && !permissionGranted) {
    await saveSettings({ ...settings, networkObservationEnabled: false });
  }
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
    });

    if (networkEnabled) {
      status.textContent =
        '通信メタデータ観測を有効にしました。本文・URL path/query・ヘッダー値は保存しません。';
    } else if (!wantsNetworkObservation) {
      status.textContent = '設定を保存しました。通信メタデータ観測は無効です。';
    }
  });
});

clearSession.addEventListener('click', () => {
  void chrome.runtime.sendMessage({ type: 'DSSI_CLEAR_SESSION_LOG' }).then(() => {
    status.textContent = 'セッション観測ログを消去しました。';
  });
});

void refresh();
