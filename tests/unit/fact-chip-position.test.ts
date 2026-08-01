import { describe, expect, it } from 'vitest';
import { nextFactChipPosition } from '../../src/core/fact-chip-position';

describe('fact chip position', () => {
  it('cycles clockwise through eight positions and back to top', () => {
    expect(nextFactChipPosition('top')).toBe('top_right');
    expect(nextFactChipPosition('top_right')).toBe('right');
    expect(nextFactChipPosition('right')).toBe('bottom_right');
    expect(nextFactChipPosition('bottom_right')).toBe('bottom');
    expect(nextFactChipPosition('bottom')).toBe('bottom_left');
    expect(nextFactChipPosition('bottom_left')).toBe('left');
    expect(nextFactChipPosition('left')).toBe('top_left');
    expect(nextFactChipPosition('top_left')).toBe('top');
  });
});
