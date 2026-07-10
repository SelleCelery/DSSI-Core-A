import { DEFAULT_SETTINGS, type DssiSettings } from '../core/models/settings';

const SETTINGS_KEY = 'dssiSettings';

export async function loadSettings(): Promise<DssiSettings> {
  const result = await chrome.storage.local.get(SETTINGS_KEY);
  const stored = result[SETTINGS_KEY] as Partial<DssiSettings> | undefined;
  return { ...DEFAULT_SETTINGS, ...stored };
}

export async function saveSettings(settings: DssiSettings): Promise<void> {
  await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
}

export async function ensureDefaultSettings(): Promise<void> {
  const result = await chrome.storage.local.get(SETTINGS_KEY);
  if (result[SETTINGS_KEY] === undefined) {
    await saveSettings({ ...DEFAULT_SETTINGS });
  }
}
