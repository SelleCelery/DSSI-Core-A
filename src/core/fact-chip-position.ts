import type { FactChipPosition } from './models/settings';

export const FACT_CHIP_POSITION_ORDER: readonly FactChipPosition[] = [
  'top',
  'top_right',
  'right',
  'bottom_right',
  'bottom',
  'bottom_left',
  'left',
  'top_left',
];

export function isFactChipPosition(value: unknown): value is FactChipPosition {
  return (
    value === 'top' ||
    value === 'top_right' ||
    value === 'right' ||
    value === 'bottom_right' ||
    value === 'bottom' ||
    value === 'bottom_left' ||
    value === 'left' ||
    value === 'top_left'
  );
}

export function nextFactChipPosition(current: FactChipPosition): FactChipPosition {
  const index = FACT_CHIP_POSITION_ORDER.indexOf(current);
  return FACT_CHIP_POSITION_ORDER[(index + 1) % FACT_CHIP_POSITION_ORDER.length] ?? 'top';
}

export function factChipPositionLabel(position: FactChipPosition): string {
  switch (position) {
    case 'top':
      return '上';
    case 'top_right':
      return '右上';
    case 'right':
      return '右';
    case 'bottom_right':
      return '右下';
    case 'bottom':
      return '下';
    case 'bottom_left':
      return '左下';
    case 'left':
      return '左';
    case 'top_left':
      return '左上';
  }
}
