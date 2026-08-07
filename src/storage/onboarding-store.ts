import type { ObservationSelection } from '../core/models/settings';

export const ONBOARDING_VERSION = 3;
const ONBOARDING_KEY = 'connectBitsOnboardingState';

export interface OnboardingAcknowledgements {
  observationBoundary: boolean;
  frequency: boolean;
  storage: boolean;
  externalTransmission: boolean;
  judgmentBoundary: boolean;
  supportBoundary: boolean;
  currentDecision: boolean;
}

export interface OnboardingState {
  version: typeof ONBOARDING_VERSION;
  completedAt: number;
  reviewedAt: number;
  acknowledgements: OnboardingAcknowledgements;
  selectionAtLastReview: ObservationSelection;
}

export const EMPTY_ONBOARDING_ACKNOWLEDGEMENTS: Readonly<OnboardingAcknowledgements> =
  Object.freeze({
    observationBoundary: false,
    frequency: false,
    storage: false,
    externalTransmission: false,
    judgmentBoundary: false,
    supportBoundary: false,
    currentDecision: false,
  });

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isOnboardingAcknowledgements(value: unknown): value is OnboardingAcknowledgements {
  if (!isObject(value)) return false;
  return (
    typeof value.observationBoundary === 'boolean' &&
    typeof value.frequency === 'boolean' &&
    typeof value.storage === 'boolean' &&
    typeof value.externalTransmission === 'boolean' &&
    typeof value.judgmentBoundary === 'boolean' &&
    typeof value.supportBoundary === 'boolean' &&
    typeof value.currentDecision === 'boolean'
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
    isTimestamp(value.completedAt) &&
    isTimestamp(value.reviewedAt) &&
    isObservationSelection(value.selectionAtLastReview) &&
    isOnboardingAcknowledgements(value.acknowledgements)
  );
}

export function migrateOnboardingState(value: unknown): OnboardingState | undefined {
  if (isOnboardingState(value)) return value;
  if (!isObject(value) || value.version !== 2) return undefined;
  if (
    !isTimestamp(value.completedAt) ||
    !isTimestamp(value.changedAt) ||
    !isObservationSelection(value.observationSelection) ||
    !isOnboardingAcknowledgements(value.acknowledgements)
  ) {
    return undefined;
  }
  return {
    version: ONBOARDING_VERSION,
    completedAt: value.completedAt,
    reviewedAt: value.changedAt,
    acknowledgements: value.acknowledgements,
    selectionAtLastReview: value.observationSelection,
  };
}

export function onboardingAcknowledgementsComplete(
  acknowledgements: OnboardingAcknowledgements,
): boolean {
  return Object.values(acknowledgements).every(Boolean);
}

export async function loadOnboardingState(): Promise<OnboardingState | undefined> {
  const result = await chrome.storage.local.get(ONBOARDING_KEY);
  const candidate: unknown = result[ONBOARDING_KEY];
  const migrated = migrateOnboardingState(candidate);
  if (migrated !== undefined && migrated !== candidate) {
    await saveOnboardingState(migrated);
  }
  return migrated;
}

export async function saveOnboardingState(state: OnboardingState): Promise<void> {
  await chrome.storage.local.set({ [ONBOARDING_KEY]: state });
}

export async function onboardingCompleted(): Promise<boolean> {
  return (await loadOnboardingState()) !== undefined;
}
