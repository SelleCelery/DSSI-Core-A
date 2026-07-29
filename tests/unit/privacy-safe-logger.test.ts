import { describe, expect, it } from 'vitest';
import {
  PrivacyBoundaryError,
  assertPrivacySafePayload,
  createPrivacySafeRecord,
} from '../../src/core/privacy-safe-logger';
import type { ObservationLogRecord } from '../../src/core/models/observation';

const validRecord: ObservationLogRecord = {
  schemaVersion: 6,
  eventId: '123e4567-e89b-42d3-a456-426614174000',
  timestamp: 1,
  sessionId: '123e4567-e89b-42d3-a456-426614174000',
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
    (key: string) => {
      expect(() => assertPrivacySafePayload({ ...validRecord, [key]: 'secret' })).toThrow(
        PrivacyBoundaryError,
      );
    },
  );

  it('rejects records that omit required identity or classification fields', () => {
    const withoutDomain: Record<string, unknown> = { ...validRecord };
    const withoutTrigger: Record<string, unknown> = { ...validRecord };
    delete withoutDomain.domainKey;
    delete withoutTrigger.triggerType;
    expect(() => assertPrivacySafePayload(withoutDomain)).toThrow(PrivacyBoundaryError);
    expect(() => assertPrivacySafePayload(withoutTrigger)).toThrow(PrivacyBoundaryError);
  });

  it('rejects raw text disguised inside allowed identifier or categorical fields', () => {
    expect(() =>
      assertPrivacySafePayload({ ...validRecord, eventId: 'private message body' }),
    ).toThrow(PrivacyBoundaryError);
    expect(() => assertPrivacySafePayload({ ...validRecord, triggerType: 'user secret' })).toThrow(
      PrivacyBoundaryError,
    );
  });

  it('rejects unknown fields even when their names are not obviously sensitive', () => {
    expect(() => assertPrivacySafePayload({ ...validRecord, note: 'secret' })).toThrow(
      PrivacyBoundaryError,
    );
  });

  it('rejects nested objects and unexpected arrays', () => {
    expect(() =>
      assertPrivacySafePayload({ ...validRecord, metadata: { value: 'secret' } }),
    ).toThrow(PrivacyBoundaryError);
    expect(() =>
      assertPrivacySafePayload({ ...validRecord, destinationHost: ['example.test'] }),
    ).toThrow(PrivacyBoundaryError);
  });

  it('rejects URL paths, queries and credentials disguised as a host', () => {
    for (const destinationHost of [
      'example.test/private',
      'example.test?token=secret',
      'user@example.test',
    ]) {
      expect(() => assertPrivacySafePayload({ ...validRecord, destinationHost })).toThrow(
        PrivacyBoundaryError,
      );
    }
  });

  it('accepts the explicitly safe unknown-surface structure', () => {
    expect(() =>
      assertPrivacySafePayload({
        ...validRecord,
        surfaceTagName: 'input',
        surfaceInputType: 'date',
        surfaceRole: '',
        surfaceIsContentEditable: false,
        surfaceAutocompleteTokens: ['bday'],
      }),
    ).not.toThrow();
  });

  it('accepts network metadata only when payload observation remains not_requested', () => {
    expect(() =>
      assertPrivacySafePayload({
        ...validRecord,
        triggerType: 'network_activity_during_input',
        observationScope: 'network_metadata_only',
        operationEvidence: 'browser_network_api_observation',
        networkMethod: 'POST',
        networkMechanism: 'fetch_or_xhr',
        networkCorrelation: 'recent_input_activity',
        networkPayloadObservation: 'not_requested',
        destinationRelation: 'cross_origin',
        destinationScheme: 'https',
        destinationHost: 'api.example.test',
      }),
    ).not.toThrow();

    expect(() =>
      assertPrivacySafePayload({
        ...validRecord,
        networkPayloadObservation: 'captured',
      }),
    ).toThrow(PrivacyBoundaryError);
  });
});
