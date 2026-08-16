import { describe, expect, it } from 'vitest';
import { shouldOpenOnboarding } from '../../src/core/onboarding-launch-policy';

describe('ConnectBits onboarding launch policy', () => {
  it('always opens onboarding for a new installation', () => {
    expect(shouldOpenOnboarding('install', false)).toBe(true);
    expect(shouldOpenOnboarding('install', true)).toBe(true);
  });

  it('opens after an update when the current explanation has not been presented', () => {
    expect(shouldOpenOnboarding('update', false)).toBe(true);
  });

  it('does not repeat the current explanation on every update', () => {
    expect(shouldOpenOnboarding('update', true)).toBe(false);
  });
});
