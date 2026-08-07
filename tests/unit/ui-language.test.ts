import { describe, expect, it } from 'vitest';
import { resolveUiLanguage, t } from '../../src/i18n/ui';

describe('ConnectBits UI language', () => {
  it('uses an explicit language when selected', () => {
    expect(resolveUiLanguage('ja', 'en-US')).toBe('ja');
    expect(resolveUiLanguage('en', 'ja-JP')).toBe('en');
  });

  it('uses the browser language only for auto selection', () => {
    expect(resolveUiLanguage('auto', 'ja-JP')).toBe('ja');
    expect(resolveUiLanguage('auto', 'en-US')).toBe('en');
    expect(resolveUiLanguage('auto', 'fr-FR')).toBe('en');
  });

  it('keeps key boundary statements available in both languages', () => {
    expect(t('ja', 'permissionJudgmentBoundary')).toContain('妥当性');
    expect(t('en', 'permissionJudgmentBoundary')).toContain('appropriateness');
    expect(t('ja', 'pulseGuide8')).toContain('要求・取得していません');
    expect(t('en', 'pulseGuide8')).toContain('does not request or collect');
    expect(t('ja', 'navSetup')).toBe('設定とプライバシー');
    expect(t('ja', 'startLocalOnly')).toBe('通信メタデータを観測せず開始');
    expect(t('ja', 'onboardingChangeable')).toBe('いつでもこの選択は変更できます。');
    expect(t('ja', 'localClassification')).toContain('現在は固定');
    expect(t('ja', 'localClassificationHelp')).toContain('切替未実装');
    expect(t('en', 'localClassificationHelp')).toContain('does not yet provide a switch');
    expect(t('ja', 'clearFilters')).toBe('絞り込みと並べ替えをリセット');
    expect(t('ja', 'clearSelection')).toBe('選択を解除');
  });
});
