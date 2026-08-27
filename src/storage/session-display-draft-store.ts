import {
  isDisplaySessionDraftReaction,
  isDisplaySettingsPatch,
  type DisplaySessionDraftReaction,
  type DisplaySettingsBundle,
} from '../core/models/display-memory';

export const SESSION_DISPLAY_DRAFTS_KEY = 'connectBitsSessionDisplayDrafts';
const MAX_SESSION_DISPLAY_DRAFTS = 300;

interface StoredSessionDisplayDraft extends DisplaySessionDraftReaction {
  schemaVersion: 1;
  hostname: string;
}

type SessionDisplayDraftMap = Record<string, StoredSessionDisplayDraft>;

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

function normalizeDraft(value: unknown, hostname: string): StoredSessionDisplayDraft | undefined {
  if (!isObject(value) || value.schemaVersion !== 1 || !isDisplaySessionDraftReaction(value)) {
    return undefined;
  }
  return {
    schemaVersion: 1,
    hostname: normalizeHostname(hostname),
    revision: value.revision,
    baseRevision: value.baseRevision,
    patch: { ...value.patch },
    updatedAt: value.updatedAt,
  };
}

export function migrateSessionDisplayDrafts(value: unknown): SessionDisplayDraftMap {
  if (!isObject(value)) return {};
  const drafts = new Map<string, StoredSessionDisplayDraft>();
  for (const [hostname, candidate] of Object.entries(value)) {
    const draft = normalizeDraft(candidate, hostname);
    if (draft) drafts.set(draft.hostname, draft);
  }
  return newestDrafts(Object.fromEntries(drafts));
}

function newestDrafts(drafts: SessionDisplayDraftMap): SessionDisplayDraftMap {
  return Object.fromEntries(
    Object.entries(drafts)
      .sort(([, a], [, b]) => b.updatedAt - a.updatedAt)
      .slice(0, MAX_SESSION_DISPLAY_DRAFTS),
  );
}

async function loadDrafts(): Promise<SessionDisplayDraftMap> {
  const result = await chrome.storage.session.get(SESSION_DISPLAY_DRAFTS_KEY);
  const stored = result[SESSION_DISPLAY_DRAFTS_KEY];
  const migrated = migrateSessionDisplayDrafts(stored);
  if (JSON.stringify(stored ?? {}) !== JSON.stringify(migrated)) {
    await chrome.storage.session.set({ [SESSION_DISPLAY_DRAFTS_KEY]: migrated });
  }
  return migrated;
}

async function saveDrafts(drafts: SessionDisplayDraftMap): Promise<void> {
  await chrome.storage.session.set({
    [SESSION_DISPLAY_DRAFTS_KEY]: newestDrafts(drafts),
  });
}

export async function readSessionDisplayDraft(
  hostname: string,
  baseRevision: string,
): Promise<DisplaySessionDraftReaction | undefined> {
  const key = normalizeHostname(hostname);
  const drafts = await loadDrafts();
  const draft = Object.hasOwn(drafts, key) ? drafts[key] : undefined;
  if (!draft) return undefined;
  if (draft.baseRevision === baseRevision) return draft;

  delete drafts[key];
  await saveDrafts(drafts);
  return undefined;
}

export async function writeSessionDisplayDraft(
  hostname: string,
  baseRevision: string,
  patch: Partial<DisplaySettingsBundle>,
): Promise<DisplaySessionDraftReaction> {
  if (!isDisplaySettingsPatch(patch) || Object.keys(patch).length === 0) {
    throw new TypeError('Invalid session display draft');
  }
  const key = normalizeHostname(hostname);
  const drafts = await loadDrafts();
  const draft: StoredSessionDisplayDraft = {
    schemaVersion: 1,
    hostname: key,
    revision: crypto.randomUUID(),
    baseRevision,
    patch: { ...patch },
    updatedAt: Date.now(),
  };
  await saveDrafts(Object.fromEntries([...Object.entries(drafts), [key, draft]]));
  return draft;
}

export async function removeSessionDisplayDraft(hostname: string): Promise<void> {
  const key = normalizeHostname(hostname);
  const drafts = await loadDrafts();
  if (!Object.hasOwn(drafts, key)) return;
  delete drafts[key];
  await saveDrafts(drafts);
}
