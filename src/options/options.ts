import { loadSettings, saveSettings } from '../storage/settings-store';
import { requiredElement } from '../ui/required-element';

const localClassification = requiredElement<HTMLInputElement>('#localClassificationEnabled');
const save = requiredElement<HTMLButtonElement>('#save');
const clearSession = requiredElement<HTMLButtonElement>('#clearSession');
const status = requiredElement<HTMLElement>('#status');

async function refresh(): Promise<void> {
  const settings = await loadSettings();
  localClassification.checked = settings.localClassificationEnabled;
}

save.addEventListener('click', () => {
  void loadSettings().then(async (current) => {
    await saveSettings({
      ...current,
      localClassificationEnabled: localClassification.checked,
    });
    status.textContent = '設定を保存しました。';
  });
});

clearSession.addEventListener('click', () => {
  void chrome.runtime.sendMessage({ type: 'DSSI_CLEAR_SESSION_LOG' }).then(() => {
    status.textContent = 'セッション観測ログを消去しました。';
  });
});

void refresh();
