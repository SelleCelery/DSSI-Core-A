import { describe, expect, it } from 'vitest';
import type { ObservationLogRecord } from '../../src/core/models/observation';
import { analyzeObservationTips } from '../../src/core/log-reader/observation-tips';

function networkRecord(
  eventId: string,
  timestamp: number,
  destinationHost: string,
  overrides: Partial<ObservationLogRecord> = {},
): ObservationLogRecord {
  return {
    schemaVersion: 10,
    eventId,
    timestamp,
    sessionId: 'session',
    domainKey: 'example.test',
    surfaceType: 'page',
    triggerType: 'network_activity_without_correlated_operation',
    viscosityLevel: 3,
    cuePresented: false,
    destinationHost,
    destinationRelation: 'cross_origin',
    networkMethod: 'POST',
    networkMechanism: 'fetch_or_xhr',
    networkCorrelation: 'no_correlated_user_operation',
    ...overrides,
  };
}

describe('ConnectBits observation tips', () => {
  it('makes cross-origin and uncorrelated tips available without declaring danger', () => {
    const analyses = analyzeObservationTips([networkRecord('a', 1000, 'third.example')]);
    const crossOrigin = analyses.find((analysis) => analysis.tip.id === 'cross_origin_activity');
    const uncorrelated = analyses.find(
      (analysis) => analysis.tip.id === 'operation_not_correlated',
    );
    expect(crossOrigin?.status).toBe('available');
    expect(uncorrelated?.status).toBe('available');
    expect(crossOrigin?.tip.observedFact).not.toMatch(/危険|違法|悪質/);
  });

  it('identifies short-interval repetition only as a candidate pattern', () => {
    const analyses = analyzeObservationTips([
      networkRecord('a', 1000, 'api.example'),
      networkRecord('b', 3000, 'api.example'),
    ]);
    const repetition = analyses.find((analysis) => analysis.tip.id === 'short_interval_repetition');
    expect(repetition?.status).toBe('available');
    expect(repetition?.tip.notEstablished).toContain('異常動作');
  });

  it('marks a tip unavailable when no supporting observation exists', () => {
    const record = networkRecord('a', 1000, 'example.test', {
      destinationRelation: 'same_origin',
      networkCorrelation: 'recent_content_edit',
      triggerType: 'network_activity_after_content_edit',
    });
    const analyses = analyzeObservationTips([record]);
    const crossOrigin = analyses.find((analysis) => analysis.tip.id === 'cross_origin_activity');
    expect(crossOrigin?.status).toBe('not_applicable');
  });
});
