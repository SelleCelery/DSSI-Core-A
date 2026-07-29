import type { LogLayer, ObservationLogRecord } from '../core/models/observation';
import { createPrivacySafeRecord } from '../core/privacy-safe-logger';

const ACTIVITY_LOG_KEY = 'dssiSessionLog';
const DIAGNOSTIC_LOG_KEY = 'dssiDiagnosticLog';
const MAX_ACTIVITY_RECORDS = 500;
const MAX_DIAGNOSTIC_RECORDS = 250;

function keyFor(layer: LogLayer): string {
  return layer === 'diagnostic' ? DIAGNOSTIC_LOG_KEY : ACTIVITY_LOG_KEY;
}

async function readRecords(layer: LogLayer): Promise<ObservationLogRecord[]> {
  const key = keyFor(layer);
  const result = await chrome.storage.session.get(key);
  const stored = result[key];
  if (!Array.isArray(stored)) return [];

  const safeRecords: ObservationLogRecord[] = [];
  for (const candidate of stored) {
    try {
      safeRecords.push(createPrivacySafeRecord(candidate as ObservationLogRecord));
    } catch {
      // Malformed or privacy-unsafe stored records are not returned to the UI
      // and are omitted on the next successful append.
    }
  }
  return safeRecords;
}

export async function appendSessionRecord(record: ObservationLogRecord): Promise<void> {
  const safeRecord = createPrivacySafeRecord(record);
  const layer = safeRecord.logLayer ?? 'activity';
  const key = keyFor(layer);
  const current = await readRecords(layer);
  const limit = layer === 'diagnostic' ? MAX_DIAGNOSTIC_RECORDS : MAX_ACTIVITY_RECORDS;
  const next = [...current, safeRecord].slice(-limit);
  await chrome.storage.session.set({ [key]: next });
}

export async function clearSessionRecords(): Promise<void> {
  await chrome.storage.session.remove([ACTIVITY_LOG_KEY, DIAGNOSTIC_LOG_KEY]);
}

export async function clearActivityRecords(): Promise<void> {
  await chrome.storage.session.remove(ACTIVITY_LOG_KEY);
}

export async function clearDiagnosticRecords(): Promise<void> {
  await chrome.storage.session.remove(DIAGNOSTIC_LOG_KEY);
}

export async function getSessionRecords(): Promise<ObservationLogRecord[]> {
  return [...(await readRecords('activity'))];
}

export async function getDiagnosticRecords(): Promise<ObservationLogRecord[]> {
  return [...(await readRecords('diagnostic'))];
}

export async function getSessionRecordCount(): Promise<number> {
  return (await readRecords('activity')).length;
}
