import { describe, expect, it } from 'vitest';
import { assessInputOrigin, inferInputOrigin } from '../../src/core/input-origin';

describe('input origin assessment', () => {
  it('correlates trusted paste and input events', () => {
    expect(
      assessInputOrigin({
        now: 1000,
        lastPasteAt: 800,
        lastPasteTrusted: true,
        inputType: 'insertFromPaste',
        isTrusted: true,
      }),
    ).toEqual({
      origin: 'paste_confirmed',
      operationEvidence: 'correlated_trusted_events',
    });
  });

  it('accepts an explicit trusted paste input event without a separate paste event', () => {
    expect(assessInputOrigin({ now: 100, inputType: 'insertFromPaste', isTrusted: true })).toEqual({
      origin: 'paste_confirmed',
      operationEvidence: 'direct_trusted_event',
    });
  });

  it('correlates trusted keyboard and input events', () => {
    expect(
      assessInputOrigin({
        now: 1000,
        lastKeyboardAt: 500,
        lastKeyboardTrusted: true,
        inputType: 'insertText',
        isTrusted: true,
      }),
    ).toEqual({
      origin: 'keyboard_confirmed',
      operationEvidence: 'correlated_trusted_events',
    });
  });

  it('does not misclassify later keyboard input as the previous paste', () => {
    expect(
      assessInputOrigin({
        now: 1000,
        lastPasteAt: 500,
        lastPasteTrusted: true,
        lastKeyboardAt: 900,
        lastKeyboardTrusted: true,
        inputType: 'insertText',
        isTrusted: true,
      }),
    ).toEqual({
      origin: 'keyboard_confirmed',
      operationEvidence: 'correlated_trusted_events',
    });
  });

  it('does not treat untrusted events as confirmed user input', () => {
    expect(
      assessInputOrigin({
        now: 1000,
        lastPasteAt: 900,
        lastPasteTrusted: false,
        inputType: 'insertFromPaste',
        isTrusted: false,
      }),
    ).toEqual({
      origin: 'script_or_unknown_update',
      operationEvidence: 'untrusted_or_unknown',
    });
  });

  it('marks autofill or manager detection as inference', () => {
    expect(assessInputOrigin({ now: 1000, inputType: '', isTrusted: true })).toEqual({
      origin: 'autofill_or_manager_suspected',
      operationEvidence: 'inferred_from_trusted_event',
    });
  });

  it('retains a compatibility helper for origin-only callers', () => {
    expect(
      inferInputOrigin({
        now: 1000,
        lastKeyboardAt: 900,
        lastKeyboardTrusted: true,
        inputType: 'insertText',
        isTrusted: true,
      }),
    ).toBe('keyboard_confirmed');
  });
});
