import { describe, expect, it } from 'vitest';
import { shouldRefreshNetworkPulse } from '../../src/core/input-activity-policy';

describe('input activity pulse policy', () => {
  it('excludes focus from network correlation', () => {
    expect(shouldRefreshNetworkPulse('focus', true)).toBe(false);
  });

  it('refreshes the transient pulse for every trusted paste or input event', () => {
    expect(shouldRefreshNetworkPulse('paste', true)).toBe(true);
    expect(shouldRefreshNetworkPulse('input', true)).toBe(true);
  });

  it('rejects untrusted events', () => {
    expect(shouldRefreshNetworkPulse('paste', false)).toBe(false);
    expect(shouldRefreshNetworkPulse('input', false)).toBe(false);
  });
});
