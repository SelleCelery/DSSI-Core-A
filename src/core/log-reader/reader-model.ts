import type { DssiObservationLogExport } from '../log-export';
import type { ObservationLogRecord } from '../models/observation';

export type ReaderSort =
  | 'timestamp_descending'
  | 'timestamp_ascending'
  | 'domain_ascending'
  | 'destination_ascending'
  | 'trigger_ascending';

export interface ReaderQuery {
  searchText: string;
  domainKeys: readonly string[];
  destinationHosts: readonly string[];
  triggerTypes: readonly string[];
  surfaceTypes: readonly string[];
  logLayers: readonly string[];
  frameTypes: readonly string[];
  destinationRelations: readonly string[];
  networkMechanisms: readonly string[];
  networkCorrelations: readonly string[];
  pageObservationTimings: readonly string[];
  cuePresented: 'all' | 'true' | 'false';
  viscosityLevels: readonly (1 | 2 | 3)[];
  timestampFrom?: number;
  timestampTo?: number;
  sort: ReaderSort;
}

export interface ReaderSummary {
  sourceRecordCount: number;
  visibleRecordCount: number;
  timestampMin?: number;
  timestampMax?: number;
  domainCount: number;
  destinationHostCount: number;
  sameOriginCount: number;
  crossOriginCount: number;
  unknownRelationCount: number;
  correlatedCount: number;
  uncorrelatedCount: number;
  correlationUnavailableCount: number;
  cuePresentedCount: number;
  cueNotPresentedCount: number;
  mechanismCounts: Readonly<Record<string, number>>;
}

export interface ReaderGroupValue {
  value: string;
  count: number;
}

export interface ReaderGroups {
  domains: readonly ReaderGroupValue[];
  destinations: readonly ReaderGroupValue[];
  correlations: readonly ReaderGroupValue[];
  mechanisms: readonly ReaderGroupValue[];
  relations: readonly ReaderGroupValue[];
  cuePresentation: readonly ReaderGroupValue[];
}

export type ValidatedObservationLogExport = Readonly<{
  export: Readonly<DssiObservationLogExport['export']>;
  observationContext: Readonly<DssiObservationLogExport['observationContext']>;
  useBoundary: Readonly<DssiObservationLogExport['useBoundary']>;
  records: readonly Readonly<ObservationLogRecord>[];
  integrity: Readonly<DssiObservationLogExport['integrity']>;
}>;

export function createDefaultReaderQuery(): ReaderQuery {
  return {
    searchText: '',
    domainKeys: [],
    destinationHosts: [],
    triggerTypes: [],
    surfaceTypes: [],
    logLayers: [],
    frameTypes: [],
    destinationRelations: [],
    networkMechanisms: [],
    networkCorrelations: [],
    pageObservationTimings: [],
    cuePresented: 'all',
    viscosityLevels: [],
    sort: 'timestamp_descending',
  };
}

export function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const nested of Object.values(value as Record<string, unknown>)) deepFreeze(nested);
  return value;
}
