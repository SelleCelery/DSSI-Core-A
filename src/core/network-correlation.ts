export const INPUT_NETWORK_CORRELATION_WINDOW_MS = 2500;
export const NETWORK_DUPLICATE_SUPPRESSION_WINDOW_MS = 1200;

export function isRecentInputActivity(
  inputObservedAt: number | undefined,
  networkObservedAt: number,
): boolean {
  if (inputObservedAt === undefined) return false;
  const elapsed = networkObservedAt - inputObservedAt;
  return elapsed >= 0 && elapsed <= INPUT_NETWORK_CORRELATION_WINDOW_MS;
}

export function shouldSuppressDuplicateNetworkRecord(
  previousObservedAt: number | undefined,
  currentObservedAt: number,
): boolean {
  if (previousObservedAt === undefined) return false;
  const elapsed = currentObservedAt - previousObservedAt;
  return elapsed >= 0 && elapsed <= NETWORK_DUPLICATE_SUPPRESSION_WINDOW_MS;
}
