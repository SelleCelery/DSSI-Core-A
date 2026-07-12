import { describe, expect, it } from 'vitest';
import { shouldPresentCue } from '../../src/core/cue-policy';

describe('cue policy', () => {
  it('shows only high-impact input surfaces in silent mode', () => {
    expect(shouldPresentCue(1, 'password')).toBe(true);
    expect(shouldPresentCue(1, 'payment')).toBe(true);
    expect(shouldPresentCue(1, 'email_or_id')).toBe(false);
    expect(shouldPresentCue(1, 'free_text')).toBe(false);
  });

  it('shows classified input surfaces in learning mode', () => {
    expect(shouldPresentCue(2, 'email_or_id')).toBe(true);
    expect(shouldPresentCue(2, 'free_text')).toBe(true);
    expect(shouldPresentCue(2, 'unknown')).toBe(false);
  });

  it('discloses unknown input surfaces in sovereign mode', () => {
    expect(shouldPresentCue(3, 'unknown')).toBe(true);
  });
});
