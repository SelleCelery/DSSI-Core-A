import { describe, expect, it } from 'vitest';
import {
  ACTION_NETWORK_CORRELATION_WINDOW_MS,
  INPUT_NETWORK_CORRELATION_WINDOW_MS,
  NETWORK_DUPLICATE_SUPPRESSION_WINDOW_MS,
  isRecentInputActivity,
  isRecentUserAction,
  shouldSuppressDuplicateNetworkRecord,
} from '../../src/core/network-correlation';

describe('network correlation', () => {
  it('accepts the exact input correlation boundary and rejects the next millisecond', () => {
    expect(isRecentInputActivity(1000, 1000 + INPUT_NETWORK_CORRELATION_WINDOW_MS)).toBe(true);
    expect(isRecentInputActivity(1000, 1001 + INPUT_NETWORK_CORRELATION_WINDOW_MS)).toBe(false);
  });

  it('accepts the exact standard-form action boundary and rejects the next millisecond', () => {
    expect(isRecentUserAction(1000, 1000 + ACTION_NETWORK_CORRELATION_WINDOW_MS)).toBe(true);
    expect(isRecentUserAction(1000, 1001 + ACTION_NETWORK_CORRELATION_WINDOW_MS)).toBe(false);
  });

  it('rejects missing or future activity', () => {
    expect(isRecentInputActivity(undefined, 1000)).toBe(false);
    expect(isRecentInputActivity(1200, 1000)).toBe(false);
    expect(isRecentUserAction(undefined, 1000)).toBe(false);
    expect(isRecentUserAction(1200, 1000)).toBe(false);
  });

  it('suppresses duplicate network metadata only inside the short window', () => {
    expect(
      shouldSuppressDuplicateNetworkRecord(1000, 1000 + NETWORK_DUPLICATE_SUPPRESSION_WINDOW_MS),
    ).toBe(true);
    expect(
      shouldSuppressDuplicateNetworkRecord(1000, 1001 + NETWORK_DUPLICATE_SUPPRESSION_WINDOW_MS),
    ).toBe(false);
  });
});
