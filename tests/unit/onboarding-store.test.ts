import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  completeOnboardingState,
  EMPTY_ONBOARDING_REVIEW_MARKS,
  ONBOARDING_VERSION,
  onboardingPresentationRecorded,
  recordOnboardingPresentation,
} from '../../src/storage/onboarding-store';

describe('ConnectBits onboarding presentation state', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('uses version 5 for the purpose, method, permission, and responsibility explanation', () => {
    expect(ONBOARDING_VERSION).toBe(5);
  });

  it('records that the current explanation was actually presented without requiring review marks', () => {
    expect(recordOnboardingPresentation(undefined, 100)).toEqual({
      version: 5,
      firstPresentedAt: 100,
      lastPresentedAt: 100,
      reviewMarks: { ...EMPTY_ONBOARDING_REVIEW_MARKS },
    });
  });

  it('updates only the latest presentation time when the explanation is revisited', () => {
    const initial = recordOnboardingPresentation(undefined, 100);
    const revisited = recordOnboardingPresentation(initial, 200);

    expect(revisited.firstPresentedAt).toBe(100);
    expect(revisited.lastPresentedAt).toBe(200);
  });

  it('records a selection even when every optional review mark is empty', () => {
    const presented = recordOnboardingPresentation(undefined, 100);

    expect(
      completeOnboardingState(presented, 'dom_only', 200, {
        ...EMPTY_ONBOARDING_REVIEW_MARKS,
      }),
    ).toMatchObject({
      completedAt: 200,
      selectionAtLastReview: 'dom_only',
      reviewMarks: { ...EMPTY_ONBOARDING_REVIEW_MARKS },
    });
  });

  it('keeps local review marks as history without converting them into a usage condition', () => {
    const presented = recordOnboardingPresentation(undefined, 100);
    const reviewMarks = {
      ...EMPTY_ONBOARDING_REVIEW_MARKS,
      judgmentBoundary: true,
      permissionDifference: true,
    };

    expect(completeOnboardingState(presented, 'standard', 200, reviewMarks).reviewMarks).toEqual(
      reviewMarks,
    );
  });

  it('requires the version 5 explanation after an older onboarding state', async () => {
    vi.stubGlobal('chrome', {
      storage: {
        local: {
          get: vi.fn().mockResolvedValue({
            connectBitsOnboardingState: { version: 4 },
          }),
        },
      },
    });

    await expect(onboardingPresentationRecorded()).resolves.toBe(false);
  });
});
