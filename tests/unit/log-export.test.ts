import { describe, expect, it } from 'vitest';
import { buildDssiObservationLogExport, observationRecordsToCsv } from '../../src/core/log-export';
import type { ObservationLogRecord } from '../../src/core/models/observation';
import { DEFAULT_SETTINGS } from '../../src/core/models/settings';

const record: ObservationLogRecord = {
  schemaVersion: 10,
  eventId: '123e4567-e89b-42d3-a456-426614174000',
  timestamp: 1000,
  sessionId: '123e4567-e89b-42d3-a456-426614174001',
  settingsSnapshotId: '123e4567-e89b-42d3-a456-426614174002',
  domainKey: 'example.test',
  logLayer: 'diagnostic',
  surfaceType: 'page',
  triggerType: 'network_activity_without_correlated_operation',
  observationScope: 'network_metadata_only',
  operationEvidence: 'browser_network_api_observation',
  viscosityLevel: 3,
  cuePresented: false,
  networkMethod: 'POST',
  networkMechanism: 'fetch_or_xhr',
  networkCorrelation: 'no_correlated_user_operation',
  networkPayloadObservation: 'not_requested',
  cookieHeaderDetection: 'not_detected',
  pageObservationTiming: 'within_5s_of_page_observation',
  destinationRelation: 'cross_origin',
  destinationScheme: 'https',
  destinationHost: 'analytics.example.test',
};

describe('observation log export', () => {
  it('keeps primary records and declares the use boundary', () => {
    const exported = buildDssiObservationLogExport({
      records: [record],
      settings: { ...DEFAULT_SETTINGS },
      settingsSnapshots: [
        {
          id: record.settingsSnapshotId!,
          capturedAt: 900,
          hostname: 'example.test',
          viscosityLevel: 3,
          reportingMode: 'max_coverage',
          factChipPosition: 'right',
          communicationPulseEnabled: true,
          communicationTextChipEnabled: false,
          communicationPulseDurationMs: 700,
          communicationPulseSize: 'small',
          communicationPulseDomColor: 'magenta',
          communicationPulseWebRequestColor: 'cyan',
          communicationPulseOpacity: 0.8,
          localClassificationEnabled: false,
          networkObservationEnabled: true,
          hostProfileApplied: false,
        },
      ],
      coverageManifest: [],
      applicationVersion: '0.4.6',
      scope: { type: 'all_records', viewMode: 'all', filterApplied: false },
      exportedAt: new Date('2026-08-01T10:00:00.000Z'),
    });

    expect(exported.records).toEqual([record]);
    expect(exported.export.recordOrder).toBe('timestamp_descending');
    expect(exported.export.semanticProcessing).toBe('selection_and_order_only');
    expect(exported.observationContext.recordTimeSettingsAvailability).toBe('complete');
    expect(exported.observationContext.recordNature).toBe('dssi_primary_observation_records');
    expect(exported.useBoundary.nonProofClaims).toContain('利用者の意図を証明しない');
    expect(exported.integrity.status).toBe('not_provided');
  });

  it('exports flat CSV columns without presentation labels or aggregation', () => {
    const csv = observationRecordsToCsv([record]);
    expect(csv).toContain('"settingsSnapshotId"');
    expect(csv).toContain('"analytics.example.test"');
    expect(csv).toContain('"no_correlated_user_operation"');
    expect(csv.split('\r\n')).toHaveLength(2);
  });
});
