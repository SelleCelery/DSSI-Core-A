import type { CookieHeaderDetection } from './models/network';

interface HeaderNameOnly {
  name: string;
}

/**
 * Looks only at header names. Header values are deliberately not accessed.
 * Chrome may still place values in the callback object before this function
 * receives it; DSSI does not copy, classify, log, display, or persist them.
 */
export function detectCookieHeader(
  headers: readonly HeaderNameOnly[] | undefined,
): CookieHeaderDetection {
  if (headers === undefined) return 'unavailable';
  return headers.some((header) => header.name.toLowerCase() === 'cookie')
    ? 'detected'
    : 'not_detected';
}
