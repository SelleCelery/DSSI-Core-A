export const TUTORIAL_VERSION = 1;
const TUTORIAL_KEY = 'connectBitsTutorialState';

export interface TutorialState {
  version: typeof TUTORIAL_VERSION;
  firstPresentedAt: number;
  lastPresentedAt: number;
  lastFrameIndex: number;
  completedAt?: number;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isTimestamp(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isFrameIndex(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function isTutorialState(value: unknown): value is TutorialState {
  if (!isObject(value)) return false;
  return (
    value.version === TUTORIAL_VERSION &&
    isTimestamp(value.firstPresentedAt) &&
    isTimestamp(value.lastPresentedAt) &&
    isFrameIndex(value.lastFrameIndex) &&
    (value.completedAt === undefined || isTimestamp(value.completedAt))
  );
}

function clampFrameIndex(frameIndex: number, frameCount: number): number {
  if (!Number.isInteger(frameCount) || frameCount < 1) return 0;
  return Math.max(0, Math.min(frameCount - 1, Math.trunc(frameIndex)));
}

export function recordTutorialPresentation(
  state: TutorialState | undefined,
  presentedAt: number,
  frameCount: number,
): TutorialState {
  if (state !== undefined) {
    return {
      ...state,
      lastPresentedAt: presentedAt,
      lastFrameIndex: clampFrameIndex(state.lastFrameIndex, frameCount),
    };
  }
  return {
    version: TUTORIAL_VERSION,
    firstPresentedAt: presentedAt,
    lastPresentedAt: presentedAt,
    lastFrameIndex: 0,
  };
}

export function recordTutorialProgress(
  state: TutorialState,
  frameIndex: number,
  frameCount: number,
): TutorialState {
  return {
    ...state,
    lastFrameIndex: clampFrameIndex(frameIndex, frameCount),
  };
}

export function completeTutorialState(state: TutorialState, completedAt: number): TutorialState {
  return state.completedAt === undefined ? { ...state, completedAt } : state;
}

export async function loadTutorialState(): Promise<TutorialState | undefined> {
  const result = await chrome.storage.local.get(TUTORIAL_KEY);
  const candidate: unknown = result[TUTORIAL_KEY];
  return isTutorialState(candidate) ? candidate : undefined;
}

export async function saveTutorialState(state: TutorialState): Promise<void> {
  await chrome.storage.local.set({ [TUTORIAL_KEY]: state });
}
