import { describe, expect, it } from 'vitest';
import {
  PAGE_OBSERVATION_EARLY_WINDOW_MS,
  classifyPageObservationTiming,
} from '../../src/core/page-observation-timing';

describe('page observation timing', () => {
  it('uses a factual five-second boundary', () => {
    expect(classifyPageObservationTiming(1000, 1000 + PAGE_OBSERVATION_EARLY_WINDOW_MS)).toBe(
      'within_5s_of_page_observation',
    );
    expect(classifyPageObservationTiming(1000, 1001 + PAGE_OBSERVATION_EARLY_WINDOW_MS)).toBe(
      'after_5s_of_page_observation',
    );
  });

  it('returns unknown when the start is missing or in the future', () => {
    expect(classifyPageObservationTiming(undefined, 1000)).toBe('unknown');
    expect(classifyPageObservationTiming(1200, 1000)).toBe('unknown');
  });
});
