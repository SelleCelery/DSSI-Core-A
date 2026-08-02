export const ONBOARDING_VERSION = 1;
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
  version: number;
  completedAt: number;
  acknowledgements: OnboardingAcknowledgements;
  networkObservationEnabled: boolean;
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

function isOnboardingState(value: unknown): value is OnboardingState {
  if (!isObject(value)) return false;
  return (
    value.version === ONBOARDING_VERSION &&
    typeof value.completedAt === 'number' &&
    Number.isFinite(value.completedAt) &&
    typeof value.networkObservationEnabled === 'boolean' &&
    isOnboardingAcknowledgements(value.acknowledgements)
  );
}

export function onboardingAcknowledgementsComplete(
  acknowledgements: OnboardingAcknowledgements,
): boolean {
  return Object.values(acknowledgements).every(Boolean);
}

export async function loadOnboardingState(): Promise<OnboardingState | undefined> {
  const result = await chrome.storage.local.get(ONBOARDING_KEY);
  const candidate: unknown = result[ONBOARDING_KEY];
  return isOnboardingState(candidate) ? candidate : undefined;
}

export async function saveOnboardingState(state: OnboardingState): Promise<void> {
  await chrome.storage.local.set({ [ONBOARDING_KEY]: state });
}

export async function onboardingCompleted(): Promise<boolean> {
  return (await loadOnboardingState()) !== undefined;
}
