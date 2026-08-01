export const INPUT_NETWORK_CORRELATION_WINDOW_MS = 2500;
export const ACTION_NETWORK_CORRELATION_WINDOW_MS = 2000;
export const NETWORK_DUPLICATE_SUPPRESSION_WINDOW_MS = 1200;
export const DIAGNOSTIC_CHIP_AGGREGATION_WINDOW_MS = 800;

function isRecent(observedAt: number | undefined, currentAt: number, windowMs: number): boolean {
  if (observedAt === undefined) return false;
  const elapsed = currentAt - observedAt;
  return elapsed >= 0 && elapsed <= windowMs;
}

export function isRecentInputActivity(
  inputObservedAt: number | undefined,
  networkObservedAt: number,
): boolean {
  return isRecent(inputObservedAt, networkObservedAt, INPUT_NETWORK_CORRELATION_WINDOW_MS);
}

export function isRecentUserAction(
  actionObservedAt: number | undefined,
  networkObservedAt: number,
): boolean {
  return isRecent(actionObservedAt, networkObservedAt, ACTION_NETWORK_CORRELATION_WINDOW_MS);
}

export function shouldSuppressDuplicateNetworkRecord(
  previousObservedAt: number | undefined,
  currentObservedAt: number,
): boolean {
  if (previousObservedAt === undefined) return false;
  const elapsed = currentObservedAt - previousObservedAt;
  return elapsed >= 0 && elapsed <= NETWORK_DUPLICATE_SUPPRESSION_WINDOW_MS;
}
