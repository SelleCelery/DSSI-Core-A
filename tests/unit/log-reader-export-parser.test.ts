import { describe, expect, it } from 'vitest';
import { parseObservationLogExport } from '../../src/core/log-reader/export-parser';

describe('ConnectBits Log Reader export parser', () => {
  it('rejects an empty file', () => {
    const result = parseObservationLogExport('  \n');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('empty_file');
  });

  it('rejects invalid JSON without echoing the source text', () => {
    const result = parseObservationLogExport('{"secret":');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('invalid_json');
      expect(result.error.message).not.toContain('secret');
    }
  });

  it('returns valid JSON as unknown input for validation', () => {
    const result = parseObservationLogExport('{"value":1}');
    expect(result).toEqual({ ok: true, value: { value: 1 } });
  });
});
