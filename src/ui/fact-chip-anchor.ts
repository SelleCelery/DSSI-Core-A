export interface FactChipAnchorGeometry {
  anchorLeft: number;
  anchorTop: number;
  anchorBottom: number;
  anchorWidth: number;
  chipHeight: number;
  viewportWidth: number;
  viewportHeight: number;
}

export interface FactChipAnchorPlacement {
  left: number;
  top: number;
  width: number;
  placement: 'below' | 'above';
}

const VIEWPORT_MARGIN_PX = 10;
const ANCHOR_GAP_PX = 6;
const MIN_CHIP_WIDTH_PX = 240;
const MAX_CHIP_WIDTH_PX = 360;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
}

export function calculateFactChipAnchorPlacement(
  geometry: FactChipAnchorGeometry,
): FactChipAnchorPlacement {
  const viewportWidth = Math.max(0, geometry.viewportWidth);
  const viewportHeight = Math.max(0, geometry.viewportHeight);
  const horizontalMargin = Math.min(VIEWPORT_MARGIN_PX, viewportWidth / 2);
  const verticalMargin = Math.min(VIEWPORT_MARGIN_PX, viewportHeight / 2);
  const availableWidth = Math.max(0, viewportWidth - horizontalMargin * 2);
  const width = Math.min(
    availableWidth,
    MAX_CHIP_WIDTH_PX,
    Math.max(MIN_CHIP_WIDTH_PX, geometry.anchorWidth),
  );
  const left = clamp(
    geometry.anchorLeft,
    horizontalMargin,
    viewportWidth - horizontalMargin - width,
  );
  const chipHeight = Math.max(0, geometry.chipHeight);
  const belowTop = geometry.anchorBottom + ANCHOR_GAP_PX;
  const aboveTop = geometry.anchorTop - ANCHOR_GAP_PX - chipHeight;
  const canFitBelow = belowTop + chipHeight <= viewportHeight - verticalMargin;
  const canFitAbove = aboveTop >= verticalMargin;
  const placement = canFitBelow || !canFitAbove ? 'below' : 'above';
  const desiredTop = placement === 'below' ? belowTop : aboveTop;
  const top = clamp(desiredTop, verticalMargin, viewportHeight - verticalMargin - chipHeight);

  return { left, top, width, placement };
}
