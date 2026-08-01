import type { FactChipPosition } from './models/settings';

export const FACT_CHIP_POSITION_ORDER: readonly FactChipPosition[] = [
  'top',
  'left',
  'bottom',
  'right',
];

export function nextFactChipPosition(current: FactChipPosition): FactChipPosition {
  const index = FACT_CHIP_POSITION_ORDER.indexOf(current);
  return FACT_CHIP_POSITION_ORDER[(index + 1) % FACT_CHIP_POSITION_ORDER.length] ?? 'top';
}

export function factChipPositionLabel(position: FactChipPosition): string {
  switch (position) {
    case 'top':
      return '上';
    case 'left':
      return '左';
    case 'bottom':
      return '下';
    case 'right':
      return '右';
  }
}
