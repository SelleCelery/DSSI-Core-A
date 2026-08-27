import { describe, expect, it } from 'vitest';
import {
  communicationPulseBackgroundOpacity,
  communicationPulseTransparencyPercent,
} from '../../src/ui/communication-pulse-transparency';

describe('communication pulse transparency', () => {
  it.each([
    [1, 0, 1],
    [0.8, 30, 0.7],
    [0.6, 60, 0.4],
    [0.4, 90, 0.1],
  ] as const)(
    'maps persisted level %s to %s%% transparency and %s CSS opacity',
    (stored, transparency, cssOpacity) => {
      expect(communicationPulseTransparencyPercent(stored)).toBe(transparency);
      expect(communicationPulseBackgroundOpacity(stored)).toBeCloseTo(cssOpacity);
    },
  );
});
