import { describe, expect, it } from 'vitest';
import { isPrivacySafeUserActionPulse } from '../../src/core/user-action-pulse';

const valid = {
  sessionId: '123e4567-e89b-42d3-a456-426614174000',
  domainKey: 'example.test',
  viscosityLevel: 2 as const,
  actionType: 'submit_control' as const,
  observedAt: 100,
};

describe('user action pulse', () => {
  it('accepts the closed metadata-only action pulse', () => {
    expect(isPrivacySafeUserActionPulse(valid)).toBe(true);
  });

  it('rejects raw or unknown additions indirectly by requiring the closed action type', () => {
    expect(isPrivacySafeUserActionPulse({ ...valid, actionType: 'button_label_secret' })).toBe(
      false,
    );
    expect(isPrivacySafeUserActionPulse({ ...valid, observedAt: Number.NaN })).toBe(false);
    expect(isPrivacySafeUserActionPulse({ ...valid, rawContent: 'secret' })).toBe(false);
  });
});
