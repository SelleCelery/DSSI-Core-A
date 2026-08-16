import type { ObservationSelection } from '../core/models/settings';

export const ONBOARDING_VERSION = 5;
const ONBOARDING_KEY = 'connectBitsOnboardingState';

export interface OnboardingReviewMarks {
  judgmentBoundary: boolean;
  observationScope: boolean;
  observationAbsence: boolean;
  permissionDifference: boolean;
  evidenceBoundary: boolean;
  highImpactBoundary: boolean;
  exportBoundary: boolean;
}

export interface OnboardingState {
  version: typeof ONBOARDING_VERSION;
  firstPresentedAt: number;
  lastPresentedAt: number;
  completedAt?: number;
  reviewMarks: OnboardingReviewMarks;
  selectionAtLastReview?: ObservationSelection;
}

export const EMPTY_ONBOARDING_REVIEW_MARKS: Readonly<OnboardingReviewMarks> = Object.freeze({
  judgmentBoundary: false,
  observationScope: false,
  observationAbsence: false,
  permissionDifference: false,
  evidenceBoundary: false,
  highImpactBoundary: false,
  exportBoundary: false,
});

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isOnboardingReviewMarks(value: unknown): value is OnboardingReviewMarks {
  if (!isObject(value)) return false;
  return (
    typeof value.judgmentBoundary === 'boolean' &&
    typeof value.observationScope === 'boolean' &&
    typeof value.observationAbsence === 'boolean' &&
    typeof value.permissionDifference === 'boolean' &&
    typeof value.evidenceBoundary === 'boolean' &&
    typeof value.highImpactBoundary === 'boolean' &&
    typeof value.exportBoundary === 'boolean'
  );
}

function isObservationSelection(value: unknown): value is ObservationSelection {
  return value === 'standard' || value === 'dom_only' || value === 'paused';
}

function isTimestamp(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isOnboardingState(value: unknown): value is OnboardingState {
  if (!isObject(value)) return false;
  return (
    value.version === ONBOARDING_VERSION &&
    isTimestamp(value.firstPresentedAt) &&
    isTimestamp(value.lastPresentedAt) &&
    (value.completedAt === undefined || isTimestamp(value.completedAt)) &&
    (value.selectionAtLastReview === undefined ||
      isObservationSelection(value.selectionAtLastReview)) &&
    isOnboardingReviewMarks(value.reviewMarks)
  );
}

export function recordOnboardingPresentation(
  state: OnboardingState | undefined,
  presentedAt: number,
): OnboardingState {
  if (state !== undefined) return { ...state, lastPresentedAt: presentedAt };
  return {
    version: ONBOARDING_VERSION,
    firstPresentedAt: presentedAt,
    lastPresentedAt: presentedAt,
    reviewMarks: { ...EMPTY_ONBOARDING_REVIEW_MARKS },
  };
}

export function completeOnboardingState(
  state: OnboardingState,
  selection: ObservationSelection,
  completedAt: number,
  reviewMarks: OnboardingReviewMarks,
): OnboardingState {
  return {
    ...state,
    completedAt,
    reviewMarks,
    selectionAtLastReview: selection,
  };
}

export async function loadOnboardingState(): Promise<OnboardingState | undefined> {
  const result = await chrome.storage.local.get(ONBOARDING_KEY);
  const candidate: unknown = result[ONBOARDING_KEY];
  return isOnboardingState(candidate) ? candidate : undefined;
}

export async function saveOnboardingState(state: OnboardingState): Promise<void> {
  await chrome.storage.local.set({ [ONBOARDING_KEY]: state });
}

export async function onboardingPresentationRecorded(): Promise<boolean> {
  return (await loadOnboardingState()) !== undefined;
}
