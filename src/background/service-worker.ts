import type {
  InputActivityPulse,
  NetworkCorrelation,
  NetworkDescriptor,
  UserActionPulse,
} from '../core/models/network';
import type { ObservationLogRecord } from '../core/models/observation';
import {
  isSettingsMemoryReadMessage,
  isSettingsMemoryWriteMessage,
  isSessionDisplayDraftWriteMessage,
  type DisplayMemoryMessage,
} from '../core/models/settings-memory';
import { effectiveCueLevel, type DssiSettings, type ViscosityLevel } from '../core/models/settings';
import { detectCookieHeader } from '../core/cookie-header-detection';
import { isPrivacySafeInputActivityPulse } from '../core/input-activity-pulse';
import { analyzeNetworkRequest } from '../core/network-analyzer';
import { NETWORK_METADATA_PERMISSION_REQUEST } from '../core/network-permission';
import { classifyPageObservationTiming } from '../core/page-observation-timing';
import {
  NETWORK_REQUEST_HEADER_EXTRA_INFO_SPEC,
  NETWORK_RESOURCE_TYPES,
  NETWORK_URL_PATTERNS,
} from '../core/network-observation-policy';
import {
  isRecentInputActivity,
  isRecentUserAction,
  shouldSuppressDuplicateNetworkRecord,
} from '../core/network-correlation';
import { createObservationRecord } from '../core/observation-factory';
import { shouldOpenOnboarding } from '../core/onboarding-launch-policy';
import { createPrivacySafeRecord } from '../core/privacy-safe-logger';
import { SettingsMemoryQueue } from '../core/settings-memory-queue';
import { isPrivacySafeUserActionPulse } from '../core/user-action-pulse';
import { ensureDefaultSettings, loadSettings } from '../storage/settings-store';
import { captureObservationSettingsSnapshot } from '../storage/settings-snapshot-store';
import { invalidateHostDisplayProfileCache } from '../storage/host-display-profile-store';
import { onboardingPresentationRecorded } from '../storage/onboarding-store';
import {
  readSettingsMemory,
  writeSessionDisplayDraft,
  writeSettingsMemory,
} from '../storage/settings-memory-store';
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

interface UserActionPulseMessage {
  type: 'DSSI_USER_ACTION_PULSE';
  pulse: UserActionPulse;
}

interface ClearLogMessage {
  type: 'DSSI_CLEAR_SESSION_LOG';
}

interface CountLogMessage {
  type: 'DSSI_GET_SESSION_LOG_COUNT';
}

type RuntimeMessage =
  | ObservationMessage
  | InputActivityPulseMessage
  | UserActionPulseMessage
  | ClearLogMessage
  | CountLogMessage
  | DisplayMemoryMessage;

interface RecentInputActivity extends InputActivityPulse {
  documentId?: string;
}

interface RecentUserAction extends UserActionPulse {
  documentId?: string;
}

interface PageObservationContext {
  observedAt: number;
  sessionId: string;
  domainKey: string;
  viscosityLevel: ViscosityLevel;
  documentId?: string;
}

interface FallbackPageContext {
  sessionId: string;
  domainKey: string;
}

interface NetworkRecordContext {
  sessionId: string;
  domainKey: string;
  viscosityLevel: ViscosityLevel;
  surfaceType: ObservationLogRecord['surfaceType'];
  classificationConfidence: ObservationLogRecord['classificationConfidence'];
  correlation: NetworkCorrelation;
  logLayer: 'activity' | 'diagnostic';
}

async function attachSettingsSnapshot(
  record: ObservationLogRecord,
  settings: DssiSettings,
): Promise<ObservationLogRecord> {
  const snapshot = await captureObservationSettingsSnapshot(record.domainKey, settings);
  return createPrivacySafeRecord({ ...record, settingsSnapshotId: snapshot.id });
}

const PAGE_START_DEDUP_WINDOW_MS = 5000;
const recentPageStarts = new Map<string, number>();
const recentInputByFrame = new Map<string, RecentInputActivity>();
const recentActionByFrame = new Map<string, RecentUserAction>();
const pageObservationStartByFrame = new Map<string, PageObservationContext>();
const fallbackContextByFrame = new Map<string, FallbackPageContext>();
const recentNetworkRecords = new Map<string, number>();
let settingsPromise = loadSettings();
const settingsMemoryQueue = new SettingsMemoryQueue();

function readSettingsMemoryAfterWrites(hostname?: string) {
  return settingsMemoryQueue.afterWrites(() => readSettingsMemory(hostname));
}

function enqueueSettingsMemoryWrite(message: Parameters<typeof writeSettingsMemory>[0]) {
  return settingsMemoryQueue.enqueue(async () => {
    const response = await writeSettingsMemory(message);
    if (message.destination.kind === 'global' && response.ok) {
      settingsPromise = Promise.resolve(response.settings);
    }
    return response;
  });
}

function enqueueSessionDisplayDraftWrite(message: Parameters<typeof writeSessionDisplayDraft>[0]) {
  return settingsMemoryQueue.enqueue(() => writeSessionDisplayDraft(message));
}

function openOnboarding(): Promise<chrome.tabs.Tab> {
  return chrome.tabs.create({ url: chrome.runtime.getURL('onboarding.html') });
}

function openTutorial(): Promise<chrome.tabs.Tab> {
  return chrome.tabs.create({ url: chrome.runtime.getURL('video-tutorial.html') });
}

chrome.runtime.onInstalled.addListener((details) => {
  void ensureDefaultSettings();
  if (details.reason === 'install') {
    void openTutorial();
    return;
  }
  void onboardingPresentationRecorded()
    .then((recorded) => {
      if (shouldOpenOnboarding(details.reason, recorded)) return openOnboarding();
      return undefined;
    })
    .catch(() => openOnboarding());
});

chrome.runtime.onStartup.addListener(() => {
  void ensureDefaultSettings();
});

chrome.storage.onChanged.addListener(
  (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
    if (areaName !== 'local') return;
    if (changes.dssiHostDisplayProfiles !== undefined) {
      invalidateHostDisplayProfileCache();
    }
    if (changes.dssiSettings !== undefined) {
      settingsPromise = loadSettings();
    }
  },
);

chrome.permissions.onRemoved.addListener(() => {
  void syncNetworkListener();
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

function sameDocument(
  candidateDocumentId: string | undefined,
  requestDocumentId: string | undefined,
): boolean {
  return !(
    candidateDocumentId !== undefined &&
    requestDocumentId !== undefined &&
    candidateDocumentId !== requestDocumentId
  );
}

function purgeTransientMaps(now: number): void {
  for (const [key, activity] of recentInputByFrame) {
    if (now - activity.observedAt > 10_000) recentInputByFrame.delete(key);
  }
  for (const [key, action] of recentActionByFrame) {
    if (now - action.observedAt > 10_000) recentActionByFrame.delete(key);
  }
  for (const [key, observedAt] of recentNetworkRecords) {
    if (now - observedAt > 10_000) recentNetworkRecords.delete(key);
  }
  for (const [key, start] of pageObservationStartByFrame) {
    if (now - start.observedAt > 86_400_000) pageObservationStartByFrame.delete(key);
  }
}

function clearKeysWithPrefix<T>(collection: Map<string, T>, prefix: string): void {
  for (const key of collection.keys()) {
    if (key.startsWith(prefix)) collection.delete(key);
  }
}

function clearTabScopedState(tabId: number): void {
  const prefix = `${tabId}:`;
  clearKeysWithPrefix(recentInputByFrame, prefix);
  clearKeysWithPrefix(recentActionByFrame, prefix);
  clearKeysWithPrefix(pageObservationStartByFrame, prefix);
  clearKeysWithPrefix(fallbackContextByFrame, prefix);
  clearKeysWithPrefix(recentNetworkRecords, prefix);
  clearKeysWithPrefix(recentPageStarts, prefix);
}

chrome.tabs.onRemoved.addListener((tabId: number) => clearTabScopedState(tabId));

function rememberPageObservationStart(
  record: ObservationLogRecord,
  sender: chrome.runtime.MessageSender,
): void {
  if (sender.tab?.id === undefined) return;
  const key = frameKey(sender.tab.id, sender.frameId ?? 0);
  recentInputByFrame.delete(key);
  recentActionByFrame.delete(key);
  fallbackContextByFrame.delete(key);
  pageObservationStartByFrame.set(key, {
    observedAt: record.timestamp,
    sessionId: record.sessionId,
    domainKey: record.domainKey,
    viscosityLevel: record.viscosityLevel,
    ...(sender.documentId === undefined ? {} : { documentId: sender.documentId }),
  });
}

function pageTimingForRequest(
  tabId: number,
  frameId: number,
  documentId: string | undefined,
  now: number,
) {
  const start = pageObservationStartByFrame.get(frameKey(tabId, frameId));
  if (start === undefined) return classifyPageObservationTiming(undefined, now);
  if (!sameDocument(start.documentId, documentId)) {
    return classifyPageObservationTiming(undefined, now);
  }
  return classifyPageObservationTiming(start.observedAt, now);
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

function shouldPresentNetworkCue(descriptor: NetworkDescriptor, cueLevel: ViscosityLevel): boolean {
  if (descriptor.correlation === 'no_correlated_user_operation') return true;
  if (cueLevel >= 2) return true;
  return (
    descriptor.destinationRelation === 'cross_origin' || descriptor.destinationScheme === 'http'
  );
}

async function sendNetworkNotice(
  tabId: number,
  frameId: number,
  descriptor: NetworkDescriptor,
  cueLevel: ViscosityLevel,
): Promise<boolean> {
  if (!shouldPresentNetworkCue(descriptor, cueLevel)) return false;
  try {
    await chrome.tabs.sendMessage(
      tabId,
      {
        type: 'DSSI_NETWORK_ACTIVITY_NOTICE',
        descriptor,
        viscosityLevel: cueLevel,
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

function contextForUncorrelatedRequest(
  details: OnBeforeSendHeadersDetails,
  settings: DssiSettings,
): NetworkRecordContext {
  const key = frameKey(details.tabId, details.frameId);
  const page = pageObservationStartByFrame.get(key);
  if (page && sameDocument(page.documentId, details.documentId)) {
    return {
      sessionId: page.sessionId,
      domainKey: page.domainKey,
      viscosityLevel: page.viscosityLevel,
      surfaceType: 'page',
      classificationConfidence: 'unknown',
      correlation: 'no_correlated_user_operation',
      logLayer: 'diagnostic',
    };
  }

  const existing = fallbackContextByFrame.get(key);
  const fallback = existing ?? {
    sessionId: crypto.randomUUID(),
    domainKey: hostnameFromUrl(details.initiator),
  };
  fallbackContextByFrame.set(key, fallback);
  return {
    sessionId: fallback.sessionId,
    domainKey: fallback.domainKey,
    viscosityLevel: settings.viscosityLevel,
    surfaceType: 'page',
    classificationConfidence: 'unknown',
    correlation: 'no_correlated_user_operation',
    logLayer: 'diagnostic',
  };
}

function resolveNetworkRecordContext(
  details: OnBeforeSendHeadersDetails,
  settings: DssiSettings,
  now: number,
): NetworkRecordContext | undefined {
  const key = frameKey(details.tabId, details.frameId);
  const input = recentInputByFrame.get(key);
  if (
    input !== undefined &&
    isRecentInputActivity(input.observedAt, now) &&
    sameDocument(input.documentId, details.documentId)
  ) {
    return {
      sessionId: input.sessionId,
      domainKey: input.domainKey,
      viscosityLevel: input.viscosityLevel,
      surfaceType: input.surfaceType,
      classificationConfidence: input.classificationConfidence,
      correlation: 'recent_content_edit',
      logLayer: 'activity',
    };
  }

  const action = recentActionByFrame.get(key);
  if (
    action !== undefined &&
    isRecentUserAction(action.observedAt, now) &&
    sameDocument(action.documentId, details.documentId)
  ) {
    return {
      sessionId: action.sessionId,
      domainKey: action.domainKey,
      viscosityLevel: action.viscosityLevel,
      surfaceType: 'page',
      classificationConfidence: 'unknown',
      correlation: 'recent_submit_operation',
      logLayer: 'activity',
    };
  }

  if (settings.reportingMode !== 'max_coverage') return undefined;
  return contextForUncorrelatedRequest(details, settings);
}

type OnBeforeSendHeadersListener = Parameters<
  typeof chrome.webRequest.onBeforeSendHeaders.addListener
>[0];

type OnBeforeSendHeadersDetails = Parameters<OnBeforeSendHeadersListener>[0];

async function handleNetworkRequestHeaders(details: OnBeforeSendHeadersDetails): Promise<void> {
  const settings = await settingsPromise;
  if (!settings.enabled || !settings.networkObservationEnabled) return;
  if (details.tabId < 0 || details.frameId < 0) return;

  const now = Date.now();
  purgeTransientMaps(now);
  const context = resolveNetworkRecordContext(details, settings, now);
  if (!context) return;

  const descriptor = analyzeNetworkRequest({
    requestUrl: details.url,
    method: details.method,
    ...(details.initiator === undefined ? {} : { initiator: details.initiator }),
    resourceType: details.type,
    correlation: context.correlation,
    cookieHeaderDetection: detectCookieHeader(details.requestHeaders),
    pageObservationTiming: pageTimingForRequest(
      details.tabId,
      details.frameId,
      details.documentId,
      now,
    ),
  });
  if (!descriptor) return;

  if (context.logLayer === 'activity') {
    const dedupeKey = [
      details.tabId,
      details.frameId,
      details.documentId ?? 'unknown-document',
      descriptor.destinationHost,
      descriptor.method,
      descriptor.mechanism,
      descriptor.correlation,
    ].join(':');
    const previous = recentNetworkRecords.get(dedupeKey);
    recentNetworkRecords.set(dedupeKey, now);
    if (shouldSuppressDuplicateNetworkRecord(previous, now)) return;
  }

  const cueLevel = effectiveCueLevel(settings);
  const cuePresented = await sendNetworkNotice(
    details.tabId,
    details.frameId,
    descriptor,
    cueLevel,
  );
  const topLevelDomain = await topLevelDomainForTab(details.tabId);
  const frameType = details.frameId === 0 ? 'top' : 'iframe';
  const triggerType =
    context.correlation === 'recent_content_edit'
      ? 'network_activity_after_content_edit'
      : context.correlation === 'recent_submit_operation'
        ? 'network_activity_after_submit_operation'
        : 'network_activity_without_correlated_operation';

  const record = createPrivacySafeRecord({
    ...createObservationRecord(
      {
        sessionId: context.sessionId,
        domainKey: context.domainKey,
        viscosityLevel: context.viscosityLevel,
      },
      {
        surfaceType: context.surfaceType,
        triggerType,
        observationScope: 'network_metadata_only',
        operationEvidence: 'browser_network_api_observation',
        cuePresented,
        ...(context.classificationConfidence === undefined
          ? {}
          : { classificationConfidence: context.classificationConfidence }),
        network: descriptor,
        logLayer: context.logLayer,
      },
    ),
    frameType,
    topLevelDomain,
    frameDomain: context.domainKey,
  });

  await appendSessionRecord(await attachSettingsSnapshot(record, settings));
}

const networkRequestHeaderListener: OnBeforeSendHeadersListener = (details) => {
  void handleNetworkRequestHeaders(details);
  return undefined;
};

let networkListenerRegistered = false;

function registerNetworkListener(): void {
  if (networkListenerRegistered) return;
  chrome.webRequest.onBeforeSendHeaders.addListener(
    networkRequestHeaderListener,
    {
      urls: [...NETWORK_URL_PATTERNS],
      types: [...NETWORK_RESOURCE_TYPES],
    },
    [...NETWORK_REQUEST_HEADER_EXTRA_INFO_SPEC],
  );
  networkListenerRegistered = true;
}

function unregisterNetworkListener(): void {
  if (!networkListenerRegistered) return;
  chrome.webRequest.onBeforeSendHeaders.removeListener(networkRequestHeaderListener);
  networkListenerRegistered = false;
}

async function syncNetworkListener(): Promise<boolean> {
  const granted = await chrome.permissions.contains(NETWORK_METADATA_PERMISSION_REQUEST);
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
    if (isSettingsMemoryReadMessage(message)) {
      void readSettingsMemoryAfterWrites(message.hostname)
        .then((response) => sendResponse(response))
        .catch(() => sendResponse({ ok: false, reason: 'storage_error' }));
      return true;
    }

    if (isSettingsMemoryWriteMessage(message)) {
      void enqueueSettingsMemoryWrite(message)
        .then((response) => sendResponse(response))
        .catch(() => sendResponse({ ok: false, reason: 'storage_error' }));
      return true;
    }

    if (isSessionDisplayDraftWriteMessage(message)) {
      void enqueueSessionDisplayDraftWrite(message)
        .then((response) => sendResponse(response))
        .catch(() => sendResponse({ ok: false, reason: 'storage_error' }));
      return true;
    }

    if (message.type === 'DSSI_INPUT_ACTIVITY_PULSE') {
      if (!isPrivacySafeInputActivityPulse(message.pulse) || sender.tab?.id === undefined) {
        sendResponse({ ok: false });
        return false;
      }
      const tabId = sender.tab.id;

      void settingsPromise
        .then((settings) => {
          if (!settings.enabled) {
            sendResponse({ ok: false, reason: 'observation-paused' });
            return;
          }
          recentInputByFrame.set(frameKey(tabId, sender.frameId ?? 0), {
            ...message.pulse,
            ...(sender.documentId === undefined ? {} : { documentId: sender.documentId }),
          });
          sendResponse({ ok: true });
        })
        .catch(() => {
          sendResponse({ ok: false, reason: 'settings-unavailable' });
        });
      return true;
    }

    if (message.type === 'DSSI_USER_ACTION_PULSE') {
      if (!isPrivacySafeUserActionPulse(message.pulse) || sender.tab?.id === undefined) {
        sendResponse({ ok: false });
        return false;
      }
      const tabId = sender.tab.id;

      void settingsPromise
        .then((settings) => {
          if (!settings.enabled) {
            sendResponse({ ok: false, reason: 'observation-paused' });
            return;
          }
          recentActionByFrame.set(frameKey(tabId, sender.frameId ?? 0), {
            ...message.pulse,
            ...(sender.documentId === undefined ? {} : { documentId: sender.documentId }),
          });
          sendResponse({ ok: true });
        })
        .catch(() => {
          sendResponse({ ok: false, reason: 'settings-unavailable' });
        });
      return true;
    }

    if (message.type === 'DSSI_OBSERVATION_RECORD') {
      try {
        const boundaryChecked = createPrivacySafeRecord(message.record);
        void settingsPromise
          .then(async (settings) => {
            if (!settings.enabled) {
              sendResponse({ ok: false, reason: 'observation-paused' });
              return;
            }
            const enriched = createPrivacySafeRecord(enrichFrameContext(boundaryChecked, sender));

            if (enriched.triggerType === 'page_observation_started') {
              rememberPageObservationStart(enriched, sender);
            }

            // Subframe initialization is extremely noisy on real pages. Keep actual
            // subframe interactions, but suppress page-start-only records.
            if (
              enriched.frameType === 'iframe' &&
              enriched.triggerType === 'page_observation_started'
            ) {
              sendResponse({ ok: true, suppressed: true });
              return;
            }

            if (shouldSuppressTopPageStart(enriched, sender)) {
              sendResponse({ ok: true, suppressed: true, reason: 'duplicate-page-start' });
              return;
            }

            const record = await attachSettingsSnapshot(enriched, settings);
            await appendSessionRecord(record);
            sendResponse({ ok: true });
          })
          .catch((error: unknown) =>
            sendResponse({
              ok: false,
              reason: error instanceof Error ? error.message : 'observation-failed',
            }),
          );
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
