import { loadSettings, saveSettings } from '../storage/settings-store';
import { requiredElement } from '../ui/required-element';

const enabled = requiredElement<HTMLInputElement>('#enabled');
const viscosity = requiredElement<HTMLSelectElement>('#viscosityLevel');
const status = requiredElement<HTMLElement>('#status');
const count = requiredElement<HTMLElement>('#count');
const openOptions = requiredElement<HTMLButtonElement>('#openOptions');

async function refresh(): Promise<void> {
  const settings = await loadSettings();
  enabled.checked = settings.enabled;
  viscosity.value = String(settings.viscosityLevel);
  const rawResponse: unknown = await chrome.runtime.sendMessage({
    type: 'DSSI_GET_SESSION_LOG_COUNT',
  });
  const responseCount =
    typeof rawResponse === 'object' &&
    rawResponse !== null &&
    'count' in rawResponse &&
    typeof rawResponse.count === 'number'
      ? rawResponse.count
      : 0;
  count.textContent = String(responseCount);
}

async function persist(): Promise<void> {
  const current = await loadSettings();
  await saveSettings({
    ...current,
    enabled: enabled.checked,
    viscosityLevel: Number(viscosity.value) === 3 ? 3 : Number(viscosity.value) === 2 ? 2 : 1,
  });
  status.textContent = '設定を保存しました。';
}

enabled.addEventListener('change', () => void persist());
viscosity.addEventListener('change', () => void persist());
openOptions.addEventListener('click', () => void chrome.runtime.openOptionsPage());

void refresh();
