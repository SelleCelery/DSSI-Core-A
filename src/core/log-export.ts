import type { UiLanguage } from '../i18n/ui';
import type { CoverageManifestEntry } from './coverage-manifest';
import type { ObservationLogRecord } from './models/observation';
import type { DssiSettings } from './models/settings';
import type { ObservationSettingsSnapshot } from './models/settings-snapshot';

export type LogExportScopeType = 'all_records' | 'current_view';

export interface LogExportScope {
  type: LogExportScopeType;
  viewMode: 'all' | 'activity' | 'diagnostic';
  filterApplied: boolean;
}

export interface DssiObservationLogExport {
  export: {
    format: 'dssi-observation-log';
    formatVersion: 1;
    exportedAt: string;
    applicationVersion: string;
    recordSchemaVersion: number;
    scope: LogExportScope;
    recordCount: number;
    recordOrder: 'timestamp_descending';
    semanticProcessing: 'selection_and_order_only';
  };
  observationContext: {
    exportTimeSettings: DssiSettings;
    recordTimeSettingsAvailability: 'complete' | 'partial' | 'unavailable';
    settingsSnapshots: ObservationSettingsSnapshot[];
    coverageManifest: CoverageManifestEntry[];
    recordNature: 'dssi_primary_observation_records';
    exclusions: string[];
  };
  useBoundary: {
    primaryPurpose: string;
    nonProofClaims: string[];
    transferNotice: string;
  };
  records: ObservationLogRecord[];
  integrity: {
    status: 'not_provided';
  };
}

export interface BuildLogExportInput {
  records: ObservationLogRecord[];
  settings: DssiSettings;
  settingsSnapshots: ObservationSettingsSnapshot[];
  coverageManifest: CoverageManifestEntry[];
  applicationVersion: string;
  scope: LogExportScope;
  exportedAt?: Date;
  language?: UiLanguage;
}

function recordSchemaVersion(records: ObservationLogRecord[]): number {
  let highest = 0;
  for (const record of records) highest = Math.max(highest, record.schemaVersion ?? 0);
  return highest;
}

function settingsAvailability(
  records: ObservationLogRecord[],
  snapshots: ObservationSettingsSnapshot[],
): 'complete' | 'partial' | 'unavailable' {
  if (records.length === 0) return 'unavailable';
  const ids = new Set(snapshots.map((snapshot) => snapshot.id));
  let linked = 0;
  for (const record of records) {
    if (record.settingsSnapshotId && ids.has(record.settingsSnapshotId)) linked += 1;
  }
  if (linked === 0) return 'unavailable';
  return linked === records.length ? 'complete' : 'partial';
}

export function buildDssiObservationLogExport(
  input: BuildLogExportInput,
): DssiObservationLogExport {
  const exportedAt = input.exportedAt ?? new Date();
  return {
    export: {
      format: 'dssi-observation-log',
      formatVersion: 1,
      exportedAt: exportedAt.toISOString(),
      applicationVersion: input.applicationVersion,
      recordSchemaVersion: recordSchemaVersion(input.records),
      scope: { ...input.scope },
      recordCount: input.records.length,
      recordOrder: 'timestamp_descending',
      semanticProcessing: 'selection_and_order_only',
    },
    observationContext: {
      exportTimeSettings: { ...input.settings },
      recordTimeSettingsAvailability: settingsAvailability(input.records, input.settingsSnapshots),
      settingsSnapshots: input.settingsSnapshots.map((snapshot) => ({ ...snapshot })),
      coverageManifest: input.coverageManifest.map((entry) => ({ ...entry })),
      recordNature: 'dssi_primary_observation_records',
      exclusions: [
        'input_content',
        'password_content',
        'payment_number_content',
        'clipboard_content',
        'cookie_values',
        'request_body',
        'url_path_query_fragment',
      ],
    },
    useBoundary:
      input.language === 'en'
        ? {
            primaryPurpose: 'User-controlled collation and decision support',
            nonProofClaims: [
              'Does not prove user intent',
              'Does not prove user responsibility',
              'Does not prove communication payload contents',
              'Does not prove harmfulness or safety',
            ],
            transferNotice:
              'After export, the file enters the user’s management boundary. The effects of sharing, submission, or third-party use depend on how the exported file is managed.',
          }
        : {
            primaryPurpose: '利用者自身による照合と判断支援',
            nonProofClaims: [
              '利用者の意図を証明しない',
              '利用者の責任を証明しない',
              '通信内容を証明しない',
              '有害性または安全性を証明しない',
            ],
            transferNotice:
              '保存後のファイルは利用者の管理領域へ移り、共有・提出・第三者利用の影響は保存ファイルの管理条件に依存します。',
          },
    records: input.records.map((record) => ({ ...record })),
    integrity: { status: 'not_provided' },
  };
}

export const OBSERVATION_CSV_COLUMNS = [
  'schemaVersion',
  'eventId',
  'timestamp',
  'sessionId',
  'settingsSnapshotId',
  'domainKey',
  'logLayer',
  'frameType',
  'topLevelDomain',
  'frameDomain',
  'surfaceType',
  'triggerType',
  'observationScope',
  'operationEvidence',
  'observability',
  'viscosityLevel',
  'cuePresented',
  'inputOrigin',
  'classificationConfidence',
  'submissionMethod',
  'submissionEncoding',
  'destinationRelation',
  'destinationScheme',
  'destinationHost',
  'submissionMechanism',
  'submissionAssociation',
  'declaredDestinationObservable',
  'networkMethod',
  'networkMechanism',
  'networkCorrelation',
  'networkPayloadObservation',
  'cookieHeaderDetection',
  'pageObservationTiming',
  'surfaceTagName',
  'surfaceInputType',
  'surfaceRole',
  'surfaceIsContentEditable',
  'surfaceAutocompleteTokens',
] as const satisfies readonly (keyof ObservationLogRecord)[];

function csvCell(value: unknown): string {
  const text = serializeCsvValue(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function serializeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  if (value instanceof Date) return value.toISOString();
  return JSON.stringify(value) ?? '';
}

export function observationRecordsToCsv(records: ObservationLogRecord[]): string {
  const header = OBSERVATION_CSV_COLUMNS.map(csvCell).join(',');
  const rows = records.map((record) =>
    OBSERVATION_CSV_COLUMNS.map((column) => csvCell(record[column])).join(','),
  );
  return [header, ...rows].join('\r\n');
}

export function exportFilenameTimestamp(date: Date): string {
  const pad = (value: number): string => String(value).padStart(2, '0');
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    '_',
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join('');
}
