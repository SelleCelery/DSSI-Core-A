import { legacySettingsFromConfiguration } from '../core/models/configuration';
import {
  displayBundleWithPatch,
  displayDraftAgainstBundle,
  displaySettingsBundleFromSettings,
  migrateDisplaySettingsBundle,
  type DisplayMemoryReaction,
  type DisplaySettingsBundle,
} from '../core/models/display-memory';
import type {
  HostDisplayMemoryWriteMessage,
  SessionDisplayDraftWriteMessage,
  SettingsMemoryResponse,
  SettingsMemoryWriteMessage,
} from '../core/models/settings-memory';
import { loadConfiguration } from './configuration-store';
import {
  applyHostDisplayProfile,
  loadHostDisplayProfile,
  removeHostDisplayProfile,
} from './host-display-profile-store';
import { saveSettings } from './settings-store';
import {
  readSessionDisplayDraft,
  removeSessionDisplayDraft,
  writeSessionDisplayDraft as persistSessionDisplayDraft,
} from './session-display-draft-store';

const HOST_DISPLAY_MEMORIES_KEY = 'connectBitsHostDisplayMemories';
const MAX_HOST_DISPLAY_MEMORIES = 300;

interface HostDisplayMemory {
  schemaVersion: 2;
  hostname: string;
  revision: string;
  bundle: DisplaySettingsBundle;
  updatedAt: number;
}

type HostDisplayMemoryMap = Record<string, HostDisplayMemory>;

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeHostname(hostname: string): string {
  const normalized = hostname.trim().toLowerCase();
  if (normalized.length === 0 || normalized.length > 253 || /[/?#@\s]/u.test(normalized)) {
    return 'unknown';
  }
  return normalized;
}

function normalizeMemory(value: unknown, hostname: string): HostDisplayMemory | undefined {
  const bundle = isObject(value) ? migrateDisplaySettingsBundle(value.bundle) : undefined;
  if (
    !isObject(value) ||
    (value.schemaVersion !== 1 && value.schemaVersion !== 2) ||
    typeof value.revision !== 'string' ||
    value.revision.length === 0 ||
    typeof value.updatedAt !== 'number' ||
    !Number.isFinite(value.updatedAt) ||
    bundle === undefined
  ) {
    return undefined;
  }
  return {
    schemaVersion: 2,
    hostname: normalizeHostname(hostname),
    revision: value.revision,
    bundle,
    updatedAt: value.updatedAt,
  };
}

export function migrateHostDisplayMemories(value: unknown): HostDisplayMemoryMap {
  if (!isObject(value)) return {};
  const memories: HostDisplayMemoryMap = {};
  for (const [hostname, candidate] of Object.entries(value)) {
    const memory = normalizeMemory(candidate, hostname);
    if (memory) memories[memory.hostname] = memory;
  }
  return memories;
}

function newestMemories(memories: HostDisplayMemoryMap): HostDisplayMemoryMap {
  return Object.fromEntries(
    Object.entries(memories)
      .sort(([, a], [, b]) => b.updatedAt - a.updatedAt)
      .slice(0, MAX_HOST_DISPLAY_MEMORIES),
  );
}

async function loadHostMemories(): Promise<HostDisplayMemoryMap> {
  const result = await chrome.storage.local.get(HOST_DISPLAY_MEMORIES_KEY);
  const stored = result[HOST_DISPLAY_MEMORIES_KEY];
  const migrated = migrateHostDisplayMemories(stored);
  if (JSON.stringify(stored ?? {}) !== JSON.stringify(migrated)) {
    await chrome.storage.local.set({ [HOST_DISPLAY_MEMORIES_KEY]: migrated });
  }
  return migrated;
}

async function saveHostMemory(memory: HostDisplayMemory): Promise<void> {
  const memories = await loadHostMemories();
  await chrome.storage.local.set({
    [HOST_DISPLAY_MEMORIES_KEY]: newestMemories({ ...memories, [memory.hostname]: memory }),
  });
}

async function removeHostMemory(hostname: string): Promise<void> {
  const key = normalizeHostname(hostname);
  const memories = await loadHostMemories();
  if (memories[key] === undefined) return;
  delete memories[key];
  await chrome.storage.local.set({ [HOST_DISPLAY_MEMORIES_KEY]: memories });
}

async function migrateLegacyHostMemory(
  hostname: string,
  globalSettings: Awaited<ReturnType<typeof readGlobalSettings>>['settings'],
): Promise<HostDisplayMemory | undefined> {
  const legacy = await loadHostDisplayProfile(hostname);
  if (!legacy) return undefined;
  const effective = applyHostDisplayProfile(globalSettings, legacy);
  const memory: HostDisplayMemory = {
    schemaVersion: 2,
    hostname: normalizeHostname(hostname),
    revision: crypto.randomUUID(),
    bundle: displaySettingsBundleFromSettings(effective),
    updatedAt: legacy.updatedAt,
  };
  await saveHostMemory(memory);
  return memory;
}

async function readGlobalSettings(): Promise<{
  settings: ReturnType<typeof legacySettingsFromConfiguration>;
  reaction: DisplayMemoryReaction;
}> {
  const configuration = await loadConfiguration();
  const settings = legacySettingsFromConfiguration(configuration);
  return {
    settings,
    reaction: {
      source: { kind: 'global' },
      revision: configuration.revision,
      bundle: displaySettingsBundleFromSettings(settings),
      updatedAt: configuration.observation.changedAt,
    },
  };
}

async function readCommittedSettingsMemory(hostname?: string): Promise<SettingsMemoryResponse> {
  const global = await readGlobalSettings();
  if (hostname === undefined) return { ok: true, ...global };

  const key = normalizeHostname(hostname);
  const memories = await loadHostMemories();
  const memory = memories[key] ?? (await migrateLegacyHostMemory(key, global.settings));
  if (!memory) return { ok: true, ...global };
  return {
    ok: true,
    settings: global.settings,
    reaction: {
      source: { kind: 'host', hostname: key },
      revision: memory.revision,
      bundle: memory.bundle,
      updatedAt: memory.updatedAt,
    },
  };
}

export async function readSettingsMemory(hostname?: string): Promise<SettingsMemoryResponse> {
  const committed = await readCommittedSettingsMemory(hostname);
  if (hostname === undefined) return committed;
  try {
    const sessionDraft = await readSessionDisplayDraft(hostname, committed.reaction.revision);
    return sessionDraft === undefined ? committed : { ...committed, sessionDraft };
  } catch {
    return committed;
  }
}

async function writeGlobalSettingsMemory(
  message: Extract<SettingsMemoryWriteMessage, { destination: { kind: 'global' } }>,
): Promise<SettingsMemoryResponse> {
  const current = await readGlobalSettings();
  await saveSettings({ ...current.settings, ...message.patch }, message.changedFrom);
  return { ...(await readSettingsMemory()), operationId: message.operationId };
}

async function hostConflictResponse(
  message: HostDisplayMemoryWriteMessage,
): Promise<SettingsMemoryResponse> {
  return {
    ...(await readCommittedSettingsMemory(message.destination.hostname)),
    ok: false,
    operationId: message.operationId,
    reason: 'conflict',
  };
}

async function writeHostDisplayMemory(
  message: HostDisplayMemoryWriteMessage,
): Promise<SettingsMemoryResponse> {
  const hostname = normalizeHostname(message.destination.hostname);
  const current = await readCommittedSettingsMemory(hostname);
  if (current.reaction.revision !== message.baseRevision) {
    return hostConflictResponse(message);
  }

  if (message.action === 'remove') {
    await removeHostMemory(hostname);
    await removeHostDisplayProfile(hostname);
    await removeSessionDisplayDraft(hostname).catch(() => undefined);
    return { ...(await readSettingsMemory(hostname)), operationId: message.operationId };
  }

  const memory: HostDisplayMemory = {
    schemaVersion: 2,
    hostname,
    revision: crypto.randomUUID(),
    bundle: displayBundleWithPatch(current.reaction.bundle, message.patch),
    updatedAt: Date.now(),
  };
  await saveHostMemory(memory);
  await removeSessionDisplayDraft(hostname).catch(() => undefined);
  return { ...(await readSettingsMemory(hostname)), operationId: message.operationId };
}

export async function writeSessionDisplayDraft(
  message: SessionDisplayDraftWriteMessage,
): Promise<SettingsMemoryResponse> {
  const hostname = normalizeHostname(message.hostname);
  const current = await readCommittedSettingsMemory(hostname);
  if (current.reaction.revision !== message.baseRevision) {
    return {
      ...(await readSettingsMemory(hostname)),
      ok: false,
      operationId: message.operationId,
      reason: 'conflict',
    };
  }

  if (message.action === 'remove') {
    await removeSessionDisplayDraft(hostname);
    return { ...current, operationId: message.operationId };
  }

  const patch = displayDraftAgainstBundle(current.reaction.bundle, message.patch);
  if (Object.keys(patch).length === 0) {
    await removeSessionDisplayDraft(hostname);
    return { ...current, operationId: message.operationId };
  }

  const sessionDraft = await persistSessionDisplayDraft(hostname, message.baseRevision, patch);
  return { ...current, sessionDraft, operationId: message.operationId };
}

export async function writeSettingsMemory(
  message: SettingsMemoryWriteMessage,
): Promise<SettingsMemoryResponse> {
  return 'changedFrom' in message
    ? writeGlobalSettingsMemory(message)
    : writeHostDisplayMemory(message);
}
