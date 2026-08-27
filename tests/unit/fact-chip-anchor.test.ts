import { describe, expect, it } from 'vitest';

import { calculateFactChipAnchorPlacement } from '../../src/ui/fact-chip-anchor';

describe('calculateFactChipAnchorPlacement', () => {
  it('places the chip directly below a field when space is available', () => {
    expect(
      calculateFactChipAnchorPlacement({
        anchorLeft: 100,
        anchorTop: 200,
        anchorBottom: 240,
        anchorWidth: 320,
        chipHeight: 70,
        viewportWidth: 800,
        viewportHeight: 600,
      }),
    ).toEqual({ left: 100, top: 246, width: 320, placement: 'below' });
  });

  it('keeps the anchored chip inside the right edge of the viewport', () => {
    expect(
      calculateFactChipAnchorPlacement({
        anchorLeft: 700,
        anchorTop: 200,
        anchorBottom: 240,
        anchorWidth: 200,
        chipHeight: 70,
        viewportWidth: 800,
        viewportHeight: 600,
      }),
    ).toEqual({ left: 550, top: 246, width: 240, placement: 'below' });
  });

  it('moves above the field only when the lower edge cannot contain the chip', () => {
    expect(
      calculateFactChipAnchorPlacement({
        anchorLeft: 100,
        anchorTop: 520,
        anchorBottom: 560,
        anchorWidth: 320,
        chipHeight: 70,
        viewportWidth: 800,
        viewportHeight: 600,
      }),
    ).toEqual({ left: 100, top: 444, width: 320, placement: 'above' });
  });

  it('keeps a usable fallback inside an extremely small viewport', () => {
    expect(
      calculateFactChipAnchorPlacement({
        anchorLeft: -30,
        anchorTop: 40,
        anchorBottom: 70,
        anchorWidth: 300,
        chipHeight: 80,
        viewportWidth: 200,
        viewportHeight: 100,
      }),
    ).toEqual({ left: 10, top: 10, width: 180, placement: 'below' });
  });
});
