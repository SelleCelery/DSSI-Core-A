import { describe, expect, it } from 'vitest';
import { isPrivacySafeInputActivityPulse } from '../../src/core/input-activity-pulse';

const validPulse = {
  sessionId: '123e4567-e89b-42d3-a456-426614174000',
  domainKey: 'example.test',
  surfaceType: 'free_text',
  classificationConfidence: 'generic',
  viscosityLevel: 2,
} as const;

describe('privacy-safe input activity pulse', () => {
  it('accepts the closed metadata-only shape', () => {
    expect(isPrivacySafeInputActivityPulse(validPulse)).toBe(true);
  });

  it('rejects unknown fields and raw locators', () => {
    expect(isPrivacySafeInputActivityPulse({ ...validPulse, fieldValue: 'secret' })).toBe(false);
    expect(
      isPrivacySafeInputActivityPulse({ ...validPulse, domainKey: 'example.test/private?x=1' }),
    ).toBe(false);
  });

  it('rejects unknown classifications and viscosity levels', () => {
    expect(isPrivacySafeInputActivityPulse({ ...validPulse, surfaceType: 'mystery' })).toBe(false);
    expect(isPrivacySafeInputActivityPulse({ ...validPulse, viscosityLevel: 4 })).toBe(false);
  });
});
