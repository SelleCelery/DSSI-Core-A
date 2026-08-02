import type { UiLanguage } from '../i18n/ui';
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

export function factChipPositionLabel(
  position: FactChipPosition,
  language: UiLanguage = 'ja',
): string {
  const labels: Readonly<Record<UiLanguage, Readonly<Record<FactChipPosition, string>>>> = {
    ja: {
      top: '上',
      top_right: '右上',
      right: '右',
      bottom_right: '右下',
      bottom: '下',
      bottom_left: '左下',
      left: '左',
      top_left: '左上',
    },
    en: {
      top: 'top',
      top_right: 'top right',
      right: 'right',
      bottom_right: 'bottom right',
      bottom: 'bottom',
      bottom_left: 'bottom left',
      left: 'left',
      top_left: 'top left',
    },
  };
  return labels[language][position];
}
