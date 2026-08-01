import type { PageObservationTiming } from './models/network';

export const PAGE_OBSERVATION_EARLY_WINDOW_MS = 5000;

/**
 * Classifies only elapsed time from DSSI's page-observation start.
 * It does not classify the purpose of the request as initialization,
 * authentication, restoration, analytics, or any other application intent.
 */
export function classifyPageObservationTiming(
  pageObservationStartedAt: number | undefined,
  networkObservedAt: number,
): PageObservationTiming {
  if (pageObservationStartedAt === undefined) return 'unknown';
  const elapsed = networkObservedAt - pageObservationStartedAt;
  if (elapsed < 0) return 'unknown';
  return elapsed <= PAGE_OBSERVATION_EARLY_WINDOW_MS
    ? 'within_5s_of_page_observation'
    : 'after_5s_of_page_observation';
}
