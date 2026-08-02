import invalidFixtureSource from '../fixtures/observation-log-invalid.json';
import validFixtureSource from '../fixtures/observation-log-format-v1.json';
import { describe, expect, it } from 'vitest';
import { validateObservationLogExport } from '../../src/core/log-reader/export-validator';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function fixture(
  name: 'observation-log-format-v1.json' | 'observation-log-invalid.json',
): Record<string, unknown> {
  const source =
    name === 'observation-log-format-v1.json' ? validFixtureSource : invalidFixtureSource;
  const value: unknown = structuredClone(source);
  if (!isRecord(value)) throw new Error(`Fixture is not an object: ${name}`);
  return value;
}

function fixtureRecords(value: Record<string, unknown>): Record<string, unknown>[] {
  const records = value.records;
  if (!Array.isArray(records) || !records.every(isRecord)) {
    throw new Error('Fixture records are not object records.');
  }
  return records;
}

function fixtureExport(value: Record<string, unknown>): Record<string, unknown> {
  const exportSection = value.export;
  if (!isRecord(exportSection)) throw new Error('Fixture export section is not an object.');
  return exportSection;
}

describe('ConnectBits Log Reader export validator', () => {
  it('accepts formatVersion 1 and freezes the validated source', () => {
    const result = validateObservationLogExport(fixture('observation-log-format-v1.json'));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.export.format).toBe('dssi-observation-log');
      expect(result.value.records).toHaveLength(8);
      expect(Object.isFrozen(result.value)).toBe(true);
      expect(Object.isFrozen(result.value.records[0])).toBe(true);
    }
  });

  it('rejects non-DSSI and non-array records', () => {
    const result = validateObservationLogExport(fixture('observation-log-invalid.json'));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.map((error) => error.code)).toContain('unsupported_format');
      expect(result.errors.map((error) => error.code)).toContain('records_not_array');
    }
  });

  it('rejects unknown record schema versions', () => {
    const value = fixture('observation-log-format-v1.json');
    const records = fixtureRecords(value);
    const first = records[0];
    if (first === undefined) throw new Error('Fixture has no records.');
    first.schemaVersion = 11;
    const result = validateObservationLogExport(value);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.map((error) => error.code)).toContain(
        'unsupported_record_schema_version',
      );
    }
  });

  it('reports recordCount mismatch as a non-blocking notice', () => {
    const value = fixture('observation-log-format-v1.json');
    fixtureExport(value).recordCount = 99;
    const result = validateObservationLogExport(value);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.notices.map((notice) => notice.code)).toContain('record_count_mismatch');
    }
  });

  it('rejects duplicate eventId values', () => {
    const value = fixture('observation-log-format-v1.json');
    const records = fixtureRecords(value);
    const first = records[0];
    const second = records[1];
    if (first === undefined || second === undefined) {
      throw new Error('Fixture needs at least two records.');
    }
    second.eventId = first.eventId;
    const result = validateObservationLogExport(value);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.map((error) => error.code)).toContain('duplicate_event_id');
    }
  });
});
