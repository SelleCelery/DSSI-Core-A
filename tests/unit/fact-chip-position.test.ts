import { describe, expect, it } from 'vitest';
import { nextFactChipPosition } from '../../src/core/fact-chip-position';

describe('fact chip position', () => {
  it('cycles top, left, bottom, right and back to top', () => {
    expect(nextFactChipPosition('top')).toBe('left');
    expect(nextFactChipPosition('left')).toBe('bottom');
    expect(nextFactChipPosition('bottom')).toBe('right');
    expect(nextFactChipPosition('right')).toBe('top');
  });
});
