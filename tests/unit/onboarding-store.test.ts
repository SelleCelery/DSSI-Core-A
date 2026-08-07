import { describe, expect, it } from 'vitest';
import {
  EMPTY_ONBOARDING_ACKNOWLEDGEMENTS,
  ONBOARDING_VERSION,
  migrateOnboardingState,
  onboardingAcknowledgementsComplete,
} from '../../src/storage/onboarding-store';

describe('ConnectBits onboarding acknowledgements', () => {
  it('stores the last onboarding review as history in version 3', () => {
    expect(ONBOARDING_VERSION).toBe(3);
  });

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

  it('migrates version 2 current-selection data into review history', () => {
    const acknowledgements = {
      observationBoundary: true,
      frequency: true,
      storage: true,
      externalTransmission: true,
      judgmentBoundary: true,
      supportBoundary: true,
      currentDecision: true,
    };

    expect(
      migrateOnboardingState({
        version: 2,
        completedAt: 100,
        changedAt: 200,
        acknowledgements,
        observationSelection: 'standard',
      }),
    ).toEqual({
      version: 3,
      completedAt: 100,
      reviewedAt: 200,
      acknowledgements,
      selectionAtLastReview: 'standard',
    });
  });
});
