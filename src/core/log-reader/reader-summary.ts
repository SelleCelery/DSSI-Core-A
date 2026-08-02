import type { ObservationLogRecord } from '../models/observation';
import type { ReaderGroups, ReaderGroupValue, ReaderSummary } from './reader-model';

function count(values: readonly (string | undefined)[]): readonly ReaderGroupValue[] {
  const map = new Map<string, number>();
  for (const value of values) {
    const key = value ?? '__missing__';
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([value, itemCount]) => ({ value, count: itemCount }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value, 'ja-JP'));
}

export function buildReaderSummary(
  sourceRecords: readonly Readonly<ObservationLogRecord>[],
  visibleRecords: readonly Readonly<ObservationLogRecord>[],
): ReaderSummary {
  const times = visibleRecords.map((record) => record.timestamp);
  const domains = new Set(visibleRecords.map((record) => record.domainKey));
  const hosts = new Set(
    visibleRecords
      .map((record) => record.destinationHost)
      .filter((host): host is string => host !== undefined && host !== 'unknown'),
  );
  let sameOriginCount = 0;
  let crossOriginCount = 0;
  let unknownRelationCount = 0;
  let correlatedCount = 0;
  let uncorrelatedCount = 0;
  let correlationUnavailableCount = 0;
  let cuePresentedCount = 0;
  let cueNotPresentedCount = 0;
  const mechanismCounts = new Map<string, number>();

  for (const record of visibleRecords) {
    if (record.destinationRelation === 'same_origin') sameOriginCount += 1;
    else if (record.destinationRelation === 'cross_origin') crossOriginCount += 1;
    else unknownRelationCount += 1;

    if (
      record.networkCorrelation === 'recent_input_activity' ||
      record.networkCorrelation === 'recent_content_edit' ||
      record.networkCorrelation === 'recent_submit_operation'
    )
      correlatedCount += 1;
    else if (record.networkCorrelation === 'no_correlated_user_operation') uncorrelatedCount += 1;
    else if (record.networkCorrelation === 'correlation_unavailable')
      correlationUnavailableCount += 1;

    if (record.cuePresented) cuePresentedCount += 1;
    else cueNotPresentedCount += 1;

    const mechanism = record.networkMechanism ?? record.submissionMechanism ?? 'none';
    mechanismCounts.set(mechanism, (mechanismCounts.get(mechanism) ?? 0) + 1);
  }

  return {
    sourceRecordCount: sourceRecords.length,
    visibleRecordCount: visibleRecords.length,
    ...(times.length === 0
      ? {}
      : { timestampMin: Math.min(...times), timestampMax: Math.max(...times) }),
    domainCount: domains.size,
    destinationHostCount: hosts.size,
    sameOriginCount,
    crossOriginCount,
    unknownRelationCount,
    correlatedCount,
    uncorrelatedCount,
    correlationUnavailableCount,
    cuePresentedCount,
    cueNotPresentedCount,
    mechanismCounts: Object.freeze(Object.fromEntries(mechanismCounts)),
  };
}

export function buildReaderGroups(
  records: readonly Readonly<ObservationLogRecord>[],
): ReaderGroups {
  return {
    domains: count(records.map((record) => record.domainKey)),
    destinations: count(records.map((record) => record.destinationHost)),
    correlations: count(records.map((record) => record.networkCorrelation)),
    mechanisms: count(records.map((record) => record.networkMechanism)),
    relations: count(records.map((record) => record.destinationRelation)),
    cuePresentation: count(records.map((record) => String(record.cuePresented))),
  };
}
