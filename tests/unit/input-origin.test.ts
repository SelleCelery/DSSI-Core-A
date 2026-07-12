import { describe, expect, it } from 'vitest';
import { inferInputOrigin } from '../../src/core/input-origin';

describe('input origin inference', () => {
  it('confirms paste from the input type', () => {
    expect(inferInputOrigin({ now: 100, inputType: 'insertFromPaste', isTrusted: true })).toBe(
      'paste_confirmed',
    );
  });

  it('confirms keyboard input when a key event occurred recently', () => {
    expect(
      inferInputOrigin({
        now: 1000,
        lastKeyboardAt: 500,
        inputType: 'insertText',
        isTrusted: true,
      }),
    ).toBe('keyboard_confirmed');
  });

  it('suspects autofill or a password manager when trusted input has no prior evidence', () => {
    expect(inferInputOrigin({ now: 1000, inputType: '', isTrusted: true })).toBe(
      'autofill_or_manager_suspected',
    );
  });

  it('classifies untrusted changes as script or unknown updates', () => {
    expect(inferInputOrigin({ now: 1000, inputType: 'insertText', isTrusted: false })).toBe(
      'script_or_unknown_update',
    );
  });
});
