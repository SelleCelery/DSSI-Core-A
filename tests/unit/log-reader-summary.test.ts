import { describe, expect, it } from 'vitest';
import type { ObservationLogRecord } from '../../src/core/models/observation';
import { buildReaderGroups, buildReaderSummary } from '../../src/core/log-reader/reader-summary';

const records: readonly ObservationLogRecord[] = [
  {
    schemaVersion: 10,
    eventId: 'a',
    timestamp: 1000,
    sessionId: 's',
    domainKey: 'one.test',
    surfaceType: 'page',
    triggerType: 'network_activity_without_correlated_operation',
    viscosityLevel: 2,
    cuePresented: false,
    destinationHost: 'api.one.test',
    destinationRelation: 'same_origin',
    networkMechanism: 'fetch_or_xhr',
    networkCorrelation: 'no_correlated_user_operation',
  },
  {
    schemaVersion: 10,
    eventId: 'b',
    timestamp: 2000,
    sessionId: 's',
    domainKey: 'two.test',
    surfaceType: 'page',
    triggerType: 'network_activity_after_submit_operation',
    viscosityLevel: 3,
    cuePresented: true,
    destinationHost: 'third.example',
    destinationRelation: 'cross_origin',
    networkMechanism: 'beacon_or_ping',
    networkCorrelation: 'recent_submit_operation',
  },
  {
    schemaVersion: 10,
    eventId: 'c',
    timestamp: 3000,
    sessionId: 's',
    domainKey: 'two.test',
    surfaceType: 'page',
    triggerType: 'page_observation_started',
    viscosityLevel: 1,
    cuePresented: false,
  },
];

describe('ConnectBits Log Reader summary', () => {
  it('separates source and visible counts', () => {
    const summary = buildReaderSummary(records, records.slice(0, 2));
    expect(summary.sourceRecordCount).toBe(3);
    expect(summary.visibleRecordCount).toBe(2);
    expect(summary.domainCount).toBe(2);
    expect(summary.destinationHostCount).toBe(2);
    expect(summary.sameOriginCount).toBe(1);
    expect(summary.crossOriginCount).toBe(1);
  });

  it('groups undefined values without fabricating a value', () => {
    const groups = buildReaderGroups(records);
    expect(groups.destinations).toContainEqual({ value: '__missing__', count: 1 });
    expect(groups.correlations).toContainEqual({ value: '__missing__', count: 1 });
  });
});
