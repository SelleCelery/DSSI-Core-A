import {
  legacySettingsFromConfiguration,
  type ConfigurationChangeSource,
} from '../core/models/configuration';
import type { DssiSettings } from '../core/models/settings';
import {
  ensureConfiguration,
  loadConfiguration,
  saveLegacyCompatibleSettings,
} from './configuration-store';

export async function loadSettings(): Promise<DssiSettings> {
  return legacySettingsFromConfiguration(await loadConfiguration());
}

export async function saveSettings(
  settings: DssiSettings,
  changedFrom: ConfigurationChangeSource = 'migration',
): Promise<void> {
  await saveLegacyCompatibleSettings(settings, changedFrom);
}

export async function ensureDefaultSettings(): Promise<void> {
  await ensureConfiguration();
}
