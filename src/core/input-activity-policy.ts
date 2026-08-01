export type InputActivityKind = 'focus' | 'paste' | 'input';

/**
 * Network-correlation pulses are refreshed only by trusted content-related
 * operations. Focus is intentionally excluded because it does not establish
 * that the field content changed.
 */
export function shouldRefreshNetworkPulse(kind: InputActivityKind, isTrusted: boolean): boolean {
  return isTrusted && kind !== 'focus';
}
