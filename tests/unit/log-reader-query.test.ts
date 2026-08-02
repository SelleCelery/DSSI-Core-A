import { describe, expect, it } from 'vitest';
import type { ObservationLogRecord } from '../../src/core/models/observation';
import { createDefaultReaderQuery } from '../../src/core/log-reader/reader-model';
import { applyReaderQuery } from '../../src/core/log-reader/reader-query';

const records: readonly ObservationLogRecord[] = [
  {
    schemaVersion: 10,
    eventId: 'a',
    timestamp: 3000,
    sessionId: 's',
    domainKey: 'alpha.test',
    surfaceType: 'page',
    triggerType: 'network_activity_without_correlated_operation',
    viscosityLevel: 2,
    cuePresented: false,
    destinationHost: 'api.alpha.test',
    destinationRelation: 'same_origin',
    networkMechanism: 'fetch_or_xhr',
    networkCorrelation: 'no_correlated_user_operation',
  },
  {
    schemaVersion: 10,
    eventId: 'b',
    timestamp: 1000,
    sessionId: 's',
    domainKey: 'beta.test',
    surfaceType: 'free_text',
    triggerType: 'network_activity_after_content_edit',
    viscosityLevel: 3,
    cuePresented: true,
    destinationHost: 'shared.example',
    destinationRelation: 'cross_origin',
    networkMechanism: 'fetch_or_xhr',
    networkCorrelation: 'recent_content_edit',
  },
  {
    schemaVersion: 10,
    eventId: 'c',
    timestamp: 2000,
    sessionId: 's',
    domainKey: 'gamma.test',
    surfaceType: 'page',
    triggerType: 'page_observation_started',
    viscosityLevel: 1,
    cuePresented: false,
  },
];

describe('ConnectBits Log Reader query', () => {
  it('does not mutate the source and sorts stably', () => {
    const before = records.map((record) => record.eventId);
    const result = applyReaderQuery(records, createDefaultReaderQuery());
    expect(result.map((record) => record.eventId)).toEqual(['a', 'c', 'b']);
    expect(records.map((record) => record.eventId)).toEqual(before);
  });

  it('uses OR inside one category', () => {
    const query = {
      ...createDefaultReaderQuery(),
      domainKeys: ['alpha.test', 'beta.test'],
    };
    expect(applyReaderQuery(records, query).map((record) => record.eventId)).toEqual(['a', 'b']);
  });

  it('uses AND across different categories', () => {
    const query = {
      ...createDefaultReaderQuery(),
      domainKeys: ['alpha.test', 'beta.test'],
      destinationRelations: ['cross_origin'],
    };
    expect(applyReaderQuery(records, query).map((record) => record.eventId)).toEqual(['b']);
  });

  it('applies date range and missing-value filters', () => {
    const ranged = applyReaderQuery(records, {
      ...createDefaultReaderQuery(),
      timestampFrom: 1500,
      timestampTo: 2500,
    });
    expect(ranged.map((record) => record.eventId)).toEqual(['c']);

    const missing = applyReaderQuery(records, {
      ...createDefaultReaderQuery(),
      destinationHosts: ['__missing__'],
    });
    expect(missing.map((record) => record.eventId)).toEqual(['c']);
  });
});
