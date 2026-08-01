import { describe, expect, it } from 'vitest';
import { shouldPresentFocusCue } from '../../src/core/cue-policy';

describe('focus cue policy', () => {
  it('keeps focus silent at Level 1', () => {
    expect(shouldPresentFocusCue(1, 'password')).toBe(false);
    expect(shouldPresentFocusCue(1, 'payment')).toBe(false);
    expect(shouldPresentFocusCue(1, 'free_text')).toBe(false);
  });

  it('shows only sensitive focus surfaces at Level 2', () => {
    expect(shouldPresentFocusCue(2, 'password')).toBe(true);
    expect(shouldPresentFocusCue(2, 'payment')).toBe(true);
    expect(shouldPresentFocusCue(2, 'personal_information')).toBe(true);
    expect(shouldPresentFocusCue(2, 'email_or_id')).toBe(false);
    expect(shouldPresentFocusCue(2, 'free_text')).toBe(false);
    expect(shouldPresentFocusCue(2, 'unknown')).toBe(false);
  });

  it('shows all input-surface focus cues at Level 3', () => {
    expect(shouldPresentFocusCue(3, 'free_text')).toBe(true);
    expect(shouldPresentFocusCue(3, 'unknown')).toBe(true);
    expect(shouldPresentFocusCue(3, 'page')).toBe(false);
  });
});
