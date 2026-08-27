import type { CommunicationPulseOpacity } from '../core/models/settings';

export type CommunicationPulseTransparencyPercent = 0 | 30 | 60 | 90;

/**
 * The persisted values are retained as compatibility tokens. The UI presents
 * them as transparency so existing global and host-specific settings remain
 * readable without a storage migration.
 */
export function communicationPulseTransparencyPercent(
  storedOpacity: CommunicationPulseOpacity,
): CommunicationPulseTransparencyPercent {
  switch (storedOpacity) {
    case 1:
      return 0;
    case 0.8:
      return 30;
    case 0.6:
      return 60;
    case 0.4:
      return 90;
  }
}

export function communicationPulseBackgroundOpacity(
  storedOpacity: CommunicationPulseOpacity,
): number {
  return 1 - communicationPulseTransparencyPercent(storedOpacity) / 100;
}
