import {
  configurationFromLegacySettings,
  configurationWithLegacySettings,
  isConnectBitsConfiguration,
  legacySettingsFromConfiguration,
  type ConfigurationChangeSource,
  type ConnectBitsConfiguration,
} from '../core/models/configuration';
import type { DssiSettings } from '../core/models/settings';

export const CONFIGURATION_STORAGE_KEY = 'connectBitsConfiguration';
export const LEGACY_SETTINGS_STORAGE_KEY = 'dssiSettings';

export async function loadConfiguration(): Promise<ConnectBitsConfiguration> {
  const result = await chrome.storage.local.get([
    CONFIGURATION_STORAGE_KEY,
    LEGACY_SETTINGS_STORAGE_KEY,
  ]);
  const stored: unknown = result[CONFIGURATION_STORAGE_KEY];
  if (isConnectBitsConfiguration(stored)) return stored;

  const legacy = result[LEGACY_SETTINGS_STORAGE_KEY] as Partial<DssiSettings> | undefined;
  const migrated = configurationFromLegacySettings(legacy);
  await saveConfiguration(migrated);
  return migrated;
}

export async function saveConfiguration(configuration: ConnectBitsConfiguration): Promise<void> {
  if (!isConnectBitsConfiguration(configuration)) {
    throw new TypeError('Invalid ConnectBits configuration');
  }
  await chrome.storage.local.set({
    [CONFIGURATION_STORAGE_KEY]: configuration,
    [LEGACY_SETTINGS_STORAGE_KEY]: legacySettingsFromConfiguration(configuration),
  });
}

export async function saveLegacyCompatibleSettings(
  settings: DssiSettings,
  changedFrom: ConfigurationChangeSource = 'migration',
): Promise<ConnectBitsConfiguration> {
  const current = await loadConfiguration();
  const updated = configurationWithLegacySettings(current, settings, { changedFrom });
  if (updated !== current) await saveConfiguration(updated);
  return updated;
}

export async function ensureConfiguration(): Promise<void> {
  await loadConfiguration();
}
