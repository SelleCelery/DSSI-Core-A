import { describe, expect, it } from 'vitest';
import {
  EMPTY_ONBOARDING_ACKNOWLEDGEMENTS,
  onboardingAcknowledgementsComplete,
} from '../../src/storage/onboarding-store';

describe('ConnectBits onboarding acknowledgements', () => {
  it('does not treat an incomplete review as permission to continue', () => {
    expect(onboardingAcknowledgementsComplete(EMPTY_ONBOARDING_ACKNOWLEDGEMENTS)).toBe(false);
  });

  it('requires every currently presented boundary item', () => {
    expect(
      onboardingAcknowledgementsComplete({
        observationBoundary: true,
        frequency: true,
        storage: true,
        externalTransmission: true,
        judgmentBoundary: true,
        supportBoundary: true,
        currentDecision: true,
      }),
    ).toBe(true);
  });
});
