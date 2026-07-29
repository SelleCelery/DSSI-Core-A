import type { InputActivityPulse, NetworkDescriptor } from '../core/models/network';
import type { ObservationLogRecord } from '../core/models/observation';
import { isPrivacySafeInputActivityPulse } from '../core/input-activity-pulse';
import { analyzeNetworkRequest } from '../core/network-analyzer';
import { NETWORK_PERMISSION_REQUEST } from '../core/network-permission';
import {
  NETWORK_EXTRA_INFO_SPEC,
  NETWORK_RESOURCE_TYPES,
  NETWORK_URL_PATTERNS,
} from '../core/network-observation-policy';
import {
  isRecentInputActivity,
  shouldSuppressDuplicateNetworkRecord,
} from '../core/network-correlation';
import { createObservationRecord } from '../core/observation-factory';
import { createPrivacySafeRecord } from '../core/privacy-safe-logger';
import { ensureDefaultSettings, loadSettings, saveSettings } from '../storage/settings-store';
import {
  appendSessionRecord,
  clearSessionRecords,
  getSessionRecordCount,
} from '../storage/session-buffer';

interface ObservationMessage {
  type: 'DSSI_OBSERVATION_RECORD';
  record: ObservationLogRecord;
}

interface InputActivityPulseMessage {
  type: 'DSSI_INPUT_ACTIVITY_PULSE';
  pulse: InputActivityPulse;
}

interface ClearLogMessage {
  type: 'DSSI_CLEAR_SESSION_LOG';
}

interface CountLogMessage {
  type: 'DSSI_GET_SESSION_LOG_COUNT';
}

type RuntimeMessage =
  ObservationMessage | InputActivityPulseMessage | ClearLogMessage | CountLogMessage;

interface RecentInputActivity extends InputActivityPulse {
  observedAt: number;
  documentId?: string;
}

const PAGE_START_DEDUP_WINDOW_MS = 5000;
const recentPageStarts = new Map<string, number>();
const recentInputByFrame = new Map<string, RecentInputActivity>();
const recentNetworkRecords = new Map<string, number>();
let networkSettingPromise = loadSettings().then((settings) => settings.networkObservationEnabled);

chrome.runtime.onInstalled.addListener(() => {
  void ensureDefaultSettings();
});

chrome.runtime.onStartup.addListener(() => {
  void ensureDefaultSettings();
});

chrome.storage.onChanged.addListener(
  (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
    if (areaName !== 'local' || changes.dssiSettings === undefined) return;
    networkSettingPromise = loadSettings().then((settings) => settings.networkObservationEnabled);
  },
);

chrome.permissions.onRemoved.addListener(() => {
  void syncNetworkListener().then(async (granted) => {
    if (granted) return;
    const settings = await loadSettings();
    if (!settings.networkObservationEnabled) return;
    await saveSettings({ ...settings, networkObservationEnabled: false });
  });
});

chrome.permissions.onAdded.addListener(() => {
  void syncNetworkListener();
});

function hostnameFromUrl(url: string | undefined): string {
  if (!url) return 'unknown';
  try {
    return new URL(url).hostname || 'unknown';
  } catch {
    return 'unknown';
  }
}

function frameKey(tabId: number, frameId: number): string {
  return `${tabId}:${frameId}`;
}

function purgeTransientMaps(now: number): void {
  for (const [key, activity] of recentInputByFrame) {
    if (now - activity.observedAt > 10_000) recentInputByFrame.delete(key);
  }
  for (const [key, observedAt] of recentNetworkRecords) {
    if (now - observedAt > 10_000) recentNetworkRecords.delete(key);
  }
}

function shouldSuppressTopPageStart(
  record: ObservationLogRecord,
  sender: chrome.runtime.MessageSender,
): boolean {
  if (record.frameType !== 'top' || record.triggerType !== 'page_observation_started') return false;

  const tabId = sender.tab?.id ?? -1;
  const key = `${tabId}:${record.topLevelDomain ?? record.domainKey}`;
  const now = Date.now();
  const previous = recentPageStarts.get(key);
  recentPageStarts.set(key, now);

  for (const [candidate, observedAt] of recentPageStarts) {
    if (now - observedAt > PAGE_START_DEDUP_WINDOW_MS * 3) recentPageStarts.delete(candidate);
  }

  return previous !== undefined && now - previous <= PAGE_START_DEDUP_WINDOW_MS;
}

function enrichFrameContext(
  record: ObservationLogRecord,
  sender: chrome.runtime.MessageSender,
): ObservationLogRecord {
  const frameType = sender.frameId === 0 ? 'top' : 'iframe';
  const topLevelDomain = hostnameFromUrl(sender.tab?.url);
  return {
    ...record,
    frameType,
    topLevelDomain,
    frameDomain: record.domainKey,
  };
}

function shouldPresentNetworkCue(
  descriptor: NetworkDescriptor,
  viscosityLevel: 1 | 2 | 3,
): boolean {
  if (viscosityLevel >= 2) return true;
  return (
    descriptor.destinationRelation === 'cross_origin' || descriptor.destinationScheme === 'http'
  );
}

async function sendNetworkNotice(
  tabId: number,
  frameId: number,
  descriptor: NetworkDescriptor,
  viscosityLevel: 1 | 2 | 3,
): Promise<boolean> {
  if (!shouldPresentNetworkCue(descriptor, viscosityLevel)) return false;
  try {
    await chrome.tabs.sendMessage(
      tabId,
      {
        type: 'DSSI_NETWORK_ACTIVITY_NOTICE',
        descriptor,
        viscosityLevel,
      },
      { frameId },
    );
    return true;
  } catch {
    return false;
  }
}

async function topLevelDomainForTab(tabId: number): Promise<string> {
  try {
    const tab = await chrome.tabs.get(tabId);
    return hostnameFromUrl(tab.url);
  } catch {
    return 'unknown';
  }
}

type OnBeforeRequestListener = Parameters<typeof chrome.webRequest.onBeforeRequest.addListener>[0];

type OnBeforeRequestDetails = Parameters<OnBeforeRequestListener>[0];

async function handleNetworkRequest(details: OnBeforeRequestDetails): Promise<void> {
  if (!(await networkSettingPromise)) return;
  if (details.tabId < 0 || details.frameId < 0) return;

  const now = Date.now();
  purgeTransientMaps(now);
  const input = recentInputByFrame.get(frameKey(details.tabId, details.frameId));
  if (!isRecentInputActivity(input?.observedAt, now) || input === undefined) return;
  if (
    input.documentId !== undefined &&
    details.documentId !== undefined &&
    input.documentId !== details.documentId
  ) {
    return;
  }

  const descriptor = analyzeNetworkRequest({
    requestUrl: details.url,
    method: details.method,
    ...(details.initiator === undefined ? {} : { initiator: details.initiator }),
    resourceType: details.type,
  });
  if (!descriptor) return;

  const dedupeKey = [
    details.tabId,
    details.frameId,
    details.documentId ?? 'unknown-document',
    descriptor.destinationHost,
    descriptor.method,
    descriptor.mechanism,
  ].join(':');
  const previous = recentNetworkRecords.get(dedupeKey);
  recentNetworkRecords.set(dedupeKey, now);
  if (shouldSuppressDuplicateNetworkRecord(previous, now)) return;

  const cuePresented = await sendNetworkNotice(
    details.tabId,
    details.frameId,
    descriptor,
    input.viscosityLevel,
  );
  const topLevelDomain = await topLevelDomainForTab(details.tabId);
  const frameType = details.frameId === 0 ? 'top' : 'iframe';
  const record = createPrivacySafeRecord({
    ...createObservationRecord(
      {
        sessionId: input.sessionId,
        domainKey: input.domainKey,
        viscosityLevel: input.viscosityLevel,
      },
      {
        surfaceType: input.surfaceType,
        triggerType: 'network_activity_during_input',
        observationScope: 'network_metadata_only',
        operationEvidence: 'browser_network_api_observation',
        cuePresented,
        classificationConfidence: input.classificationConfidence,
        network: descriptor,
      },
    ),
    frameType,
    topLevelDomain,
    frameDomain: input.domainKey,
  });

  await appendSessionRecord(record);
}

const networkRequestListener: OnBeforeRequestListener = (details) => {
  void handleNetworkRequest(details);
  return undefined;
};

let networkListenerRegistered = false;

function registerNetworkListener(): void {
  if (networkListenerRegistered) return;
  chrome.webRequest.onBeforeRequest.addListener(
    networkRequestListener,
    {
      urls: [...NETWORK_URL_PATTERNS],
      types: [...NETWORK_RESOURCE_TYPES],
    },
    [...NETWORK_EXTRA_INFO_SPEC],
  );
  networkListenerRegistered = true;
}

function unregisterNetworkListener(): void {
  if (!networkListenerRegistered) return;
  chrome.webRequest.onBeforeRequest.removeListener(networkRequestListener);
  networkListenerRegistered = false;
}

async function syncNetworkListener(): Promise<boolean> {
  const granted = await chrome.permissions.contains(NETWORK_PERMISSION_REQUEST);
  if (granted) registerNetworkListener();
  else unregisterNetworkListener();
  return granted;
}

void syncNetworkListener();

chrome.runtime.onMessage.addListener(
  (
    message: RuntimeMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void,
  ) => {
    if (message.type === 'DSSI_INPUT_ACTIVITY_PULSE') {
      if (!isPrivacySafeInputActivityPulse(message.pulse) || sender.tab?.id === undefined) {
        sendResponse({ ok: false });
        return false;
      }

      recentInputByFrame.set(frameKey(sender.tab.id, sender.frameId ?? 0), {
        ...message.pulse,
        observedAt: Date.now(),
        ...(sender.documentId === undefined ? {} : { documentId: sender.documentId }),
      });
      sendResponse({ ok: true });
      return false;
    }

    if (message.type === 'DSSI_OBSERVATION_RECORD') {
      try {
        const boundaryChecked = createPrivacySafeRecord(message.record);
        const enriched = createPrivacySafeRecord(enrichFrameContext(boundaryChecked, sender));

        // Subframe initialization is extremely noisy on real pages. Keep actual
        // subframe interactions, but suppress page-start-only records.
        if (
          enriched.frameType === 'iframe' &&
          enriched.triggerType === 'page_observation_started'
        ) {
          sendResponse({ ok: true, suppressed: true });
          return false;
        }

        if (shouldSuppressTopPageStart(enriched, sender)) {
          sendResponse({ ok: true, suppressed: true, reason: 'duplicate-page-start' });
          return false;
        }

        void appendSessionRecord(enriched)
          .then(() => sendResponse({ ok: true }))
          .catch(() => sendResponse({ ok: false }));
        return true;
      } catch {
        sendResponse({ ok: false, reason: 'privacy-boundary-rejected' });
        return false;
      }
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
  },
);
