import type { ObservationLogRecord } from '../models/observation';
import type { ReaderQuery } from './reader-model';

function matches(value: string | undefined, selected: readonly string[]): boolean {
  if (selected.length === 0) return true;
  return value === undefined ? selected.includes('__missing__') : selected.includes(value);
}

export function applyReaderQuery(
  records: readonly Readonly<ObservationLogRecord>[],
  query: ReaderQuery,
): readonly Readonly<ObservationLogRecord>[] {
  const search = query.searchText.trim().toLocaleLowerCase('ja-JP');
  const filtered = records.filter((record) => {
    const searchable = [record.domainKey, record.destinationHost ?? '', record.triggerType]
      .join('\n')
      .toLocaleLowerCase('ja-JP');
    return (
      (search.length === 0 || searchable.includes(search)) &&
      matches(record.domainKey, query.domainKeys) &&
      matches(record.destinationHost, query.destinationHosts) &&
      matches(record.triggerType, query.triggerTypes) &&
      matches(record.surfaceType, query.surfaceTypes) &&
      matches(record.logLayer, query.logLayers) &&
      matches(record.frameType, query.frameTypes) &&
      matches(record.destinationRelation, query.destinationRelations) &&
      matches(record.networkMechanism, query.networkMechanisms) &&
      matches(record.networkCorrelation, query.networkCorrelations) &&
      matches(record.pageObservationTiming, query.pageObservationTimings) &&
      (query.viscosityLevels.length === 0 ||
        query.viscosityLevels.includes(record.viscosityLevel)) &&
      (query.cuePresented === 'all' || String(record.cuePresented) === query.cuePresented) &&
      (query.timestampFrom === undefined || record.timestamp >= query.timestampFrom) &&
      (query.timestampTo === undefined || record.timestamp <= query.timestampTo)
    );
  });

  return filtered
    .map((record, index) => ({ record, index }))
    .sort((left, right) => {
      let result = 0;
      switch (query.sort) {
        case 'timestamp_descending':
          result = right.record.timestamp - left.record.timestamp;
          break;
        case 'timestamp_ascending':
          result = left.record.timestamp - right.record.timestamp;
          break;
        case 'domain_ascending':
          result = left.record.domainKey.localeCompare(right.record.domainKey, 'ja-JP');
          break;
        case 'destination_ascending':
          result = (left.record.destinationHost ?? '').localeCompare(
            right.record.destinationHost ?? '',
            'ja-JP',
          );
          break;
        case 'trigger_ascending':
          result = left.record.triggerType.localeCompare(right.record.triggerType, 'ja-JP');
          break;
      }
      return result === 0 ? left.index - right.index : result;
    })
    .map(({ record }) => record);
}
