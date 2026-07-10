import type { ObservationLogRecord } from '../core/models/observation';
import { ensureDefaultSettings } from '../storage/settings-store';
import {
  appendSessionRecord,
  clearSessionRecords,
  getSessionRecordCount,
} from '../storage/session-buffer';

interface ObservationMessage {
  type: 'DSSI_OBSERVATION_RECORD';
  record: ObservationLogRecord;
}

interface ClearLogMessage {
  type: 'DSSI_CLEAR_SESSION_LOG';
}

interface CountLogMessage {
  type: 'DSSI_GET_SESSION_LOG_COUNT';
}

type RuntimeMessage = ObservationMessage | ClearLogMessage | CountLogMessage;

chrome.runtime.onInstalled.addListener(() => {
  void ensureDefaultSettings();
});

chrome.runtime.onStartup.addListener(() => {
  void ensureDefaultSettings();
});

chrome.runtime.onMessage.addListener((message: RuntimeMessage, _sender, sendResponse) => {
  if (message.type === 'DSSI_OBSERVATION_RECORD') {
    void appendSessionRecord(message.record)
      .then(() => sendResponse({ ok: true }))
      .catch(() => sendResponse({ ok: false }));
    return true;
  }

  if (message.type === 'DSSI_CLEAR_SESSION_LOG') {
    void clearSessionRecords()
      .then(() => sendResponse({ ok: true }))
      .catch(() => sendResponse({ ok: false }));
    return true;
  }

  if (message.type === 'DSSI_GET_SESSION_LOG_COUNT') {
    void getSessionRecordCount()
      .then((count) => sendResponse({ ok: true, count }))
      .catch(() => sendResponse({ ok: false, count: 0 }));
    return true;
  }

  return false;
});
