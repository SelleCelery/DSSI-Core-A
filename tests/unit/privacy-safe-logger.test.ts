import { describe, expect, it } from 'vitest';
import {
  PrivacyBoundaryError,
  assertPrivacySafePayload,
  createPrivacySafeRecord,
} from '../../src/core/privacy-safe-logger';
import type { ObservationLogRecord } from '../../src/core/models/observation';

const validRecord: ObservationLogRecord = {
  schemaVersion: 2,
  eventId: 'event-1',
  timestamp: 1,
  sessionId: 'session-1',
  domainKey: 'example.test',
  surfaceType: 'page',
  triggerType: 'page_observation_started',
  observationScope: 'page_surface_partial',
  operationEvidence: 'extension_observation',
  viscosityLevel: 1,
  cuePresented: false,
};

describe('privacy-safe logger', () => {
  it('accepts metadata-only records', () => {
    expect(createPrivacySafeRecord(validRecord)).toEqual(validRecord);
  });

  it.each(['fieldValue', 'promptBody', 'clipboardContent', 'requestBody', 'password'])(
    'rejects prohibited raw-data key %s',
    (key) => {
      expect(() => assertPrivacySafePayload({ ...validRecord, [key]: 'secret' })).toThrow(
        PrivacyBoundaryError,
      );
    },
  );
});
