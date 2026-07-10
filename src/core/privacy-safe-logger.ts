import type { ObservationLogRecord } from './models/observation';

const PROHIBITED_KEY_PARTS = [
  'value',
  'content',
  'body',
  'clipboard',
  'password',
  'paymentnumber',
  'prompt',
  'messagebody',
  'requestbody',
] as const;

export class PrivacyBoundaryError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'PrivacyBoundaryError';
  }
}

function normalizeKey(key: string): string {
  return key.toLowerCase().replaceAll(/[^a-z0-9]/g, '');
}

export function assertPrivacySafePayload(
  payload: unknown,
): asserts payload is ObservationLogRecord {
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    throw new PrivacyBoundaryError('Observation log payload must be a plain object.');
  }

  for (const key of Object.keys(payload)) {
    const normalized = normalizeKey(key);
    if (PROHIBITED_KEY_PARTS.some((part) => normalized.includes(part))) {
      throw new PrivacyBoundaryError(`Prohibited raw-data field detected: ${key}`);
    }
  }
}

export function createPrivacySafeRecord(record: ObservationLogRecord): ObservationLogRecord {
  assertPrivacySafePayload(record);
  return Object.freeze({ ...record });
}
