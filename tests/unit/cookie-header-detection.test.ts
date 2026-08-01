import { describe, expect, it } from 'vitest';
import { detectCookieHeader } from '../../src/core/cookie-header-detection';

describe('Cookie header detection', () => {
  it('returns unavailable when Chrome does not provide request headers', () => {
    expect(detectCookieHeader(undefined)).toBe('unavailable');
  });

  it('detects the Cookie header name case-insensitively', () => {
    expect(detectCookieHeader([{ name: 'cookie' }])).toBe('detected');
    expect(detectCookieHeader([{ name: 'CoOkIe' }])).toBe('detected');
  });

  it('returns not_detected only for the header set it received', () => {
    expect(detectCookieHeader([{ name: 'Accept' }, { name: 'Content-Type' }])).toBe('not_detected');
  });

  it('does not access header values', () => {
    const header = {
      name: 'Cookie',
      get value(): never {
        throw new Error('header value must not be read');
      },
    };

    expect(() => detectCookieHeader([header])).not.toThrow();
    expect(detectCookieHeader([header])).toBe('detected');
  });
});
