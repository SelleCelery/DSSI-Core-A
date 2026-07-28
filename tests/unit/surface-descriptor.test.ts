import { describe, expect, it } from 'vitest';
import { describeSafeInputSurfaceStructure } from '../../src/content/surface-descriptor';

const base = {
  tagName: 'input',
  inputType: 'date',
  autocompleteTokens: ['bday', 'not valid!', 'x'.repeat(80)],
  semanticText: 'private label and placeholder',
  isContentEditable: false,
  role: 'textbox private-label',
};

describe('privacy-safe input surface structure', () => {
  it('keeps structural metadata and excludes semantic text', () => {
    expect(describeSafeInputSurfaceStructure(base)).toEqual({
      tagName: 'input',
      inputType: 'date',
      role: '',
      isContentEditable: false,
      autocompleteTokens: ['bday'],
    });
  });
});
