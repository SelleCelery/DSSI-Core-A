import type { ObservationLogRecord } from '../core/models/observation';
import { createPrivacySafeRecord } from '../core/privacy-safe-logger';

const SESSION_LOG_KEY = 'dssiSessionLog';
const MAX_SESSION_RECORDS = 500;

async function readSessionRecords(): Promise<ObservationLogRecord[]> {
  const result = await chrome.storage.session.get(SESSION_LOG_KEY);
  return (result[SESSION_LOG_KEY] as ObservationLogRecord[] | undefined) ?? [];
}

export async function appendSessionRecord(record: ObservationLogRecord): Promise<void> {
  const safeRecord = createPrivacySafeRecord(record);
  const current = await readSessionRecords();
  const next = [...current, safeRecord].slice(-MAX_SESSION_RECORDS);
  await chrome.storage.session.set({ [SESSION_LOG_KEY]: next });
}

export async function clearSessionRecords(): Promise<void> {
  await chrome.storage.session.remove(SESSION_LOG_KEY);
}

export async function getSessionRecords(): Promise<ObservationLogRecord[]> {
  return [...(await readSessionRecords())];
}

export async function getSessionRecordCount(): Promise<number> {
  return (await readSessionRecords()).length;
}
