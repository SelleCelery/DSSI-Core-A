import type { DssiSettings } from '../core/models/settings';

export interface RuntimeSettingsTransition {
  wasEnabled: boolean;
  becameEnabled: boolean;
}

export function applyRuntimeSettings(
  current: DssiSettings,
  updated: DssiSettings,
): RuntimeSettingsTransition {
  const wasEnabled = current.enabled;
  Object.assign(current, updated);
  return {
    wasEnabled,
    becameEnabled: !wasEnabled && updated.enabled,
  };
}
