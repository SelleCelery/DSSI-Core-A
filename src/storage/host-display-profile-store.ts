import type {
  CommunicationPulseColor,
  CommunicationPulseDurationMs,
  CommunicationPulseOpacity,
  FactChipPosition,
} from '../core/models/settings';

const HOST_PROFILES_KEY = 'dssiHostDisplayProfiles';
const OBSERVED_HOSTS_KEY = 'dssiObservedHosts';
const MAX_HOST_PROFILES = 300;
const MAX_OBSERVED_HOSTS = 500;
const OBSERVED_HOST_TOUCH_INTERVAL_MS = 60 * 60 * 1000;
export const HOST_PROFILE_REVIEW_AFTER_MS = 90 * 24 * 60 * 60 * 1000;

export interface HostDisplayProfile {
  hostname: string;
  pulseVisible?: boolean;
  communicationTextVisible?: boolean;
  position?: FactChipPosition;
  pulseDurationMs?: CommunicationPulseDurationMs;
  pulseOpacity?: CommunicationPulseOpacity;
  domColor?: CommunicationPulseColor;
  webRequestColor?: CommunicationPulseColor;
  updatedAt: number;
}

interface ObservedHostRecord {
  hostname: string;
  firstObservedAt: number;
  lastObservedAt: number;
}

type HostDisplayProfileMap = Record<string, HostDisplayProfile>;
type ObservedHostMap = Record<string, ObservedHostRecord>;

let profileCache: HostDisplayProfileMap | undefined;

function normalizeHostname(hostname: string): string {
  const normalized = hostname.trim().toLowerCase();
  if (normalized.length === 0 || normalized.length > 253 || /[/?#@\s]/u.test(normalized)) {
    return 'unknown';
  }
  return normalized;
}

function newestEntries<T extends { updatedAt?: number; lastObservedAt?: number }>(
  map: Record<string, T>,
  limit: number,
): Record<string, T> {
  return Object.fromEntries(
    Object.entries(map)
      .sort(([, a], [, b]) => {
        const aTime = a.updatedAt ?? a.lastObservedAt ?? 0;
        const bTime = b.updatedAt ?? b.lastObservedAt ?? 0;
        return bTime - aTime;
      })
      .slice(0, limit),
  );
}

async function loadProfiles(): Promise<HostDisplayProfileMap> {
  if (profileCache !== undefined) return { ...profileCache };
  const result = await chrome.storage.local.get(HOST_PROFILES_KEY);
  const stored = result[HOST_PROFILES_KEY];
  if (typeof stored !== 'object' || stored === null || Array.isArray(stored)) {
    profileCache = {};
    return {};
  }
  profileCache = stored as HostDisplayProfileMap;
  return { ...profileCache };
}

export async function loadHostDisplayProfile(
  hostname: string,
): Promise<HostDisplayProfile | undefined> {
  const key = normalizeHostname(hostname);
  const profiles = await loadProfiles();
  return profiles[key];
}

export async function saveHostDisplayProfile(
  hostname: string,
  patch: Omit<Partial<HostDisplayProfile>, 'hostname' | 'updatedAt'>,
): Promise<HostDisplayProfile> {
  const key = normalizeHostname(hostname);
  const profiles = await loadProfiles();
  const next: HostDisplayProfile = {
    ...(profiles[key] ?? { hostname: key, updatedAt: Date.now() }),
    ...patch,
    hostname: key,
    updatedAt: Date.now(),
  };
  const bounded = newestEntries({ ...profiles, [key]: next }, MAX_HOST_PROFILES);
  profileCache = bounded;
  await chrome.storage.local.set({ [HOST_PROFILES_KEY]: bounded });
  return next;
}

export async function removeHostDisplayProfile(hostname: string): Promise<void> {
  const key = normalizeHostname(hostname);
  const profiles = await loadProfiles();
  if (profiles[key] === undefined) return;
  delete profiles[key];
  profileCache = profiles;
  await chrome.storage.local.set({ [HOST_PROFILES_KEY]: profiles });
}

export function invalidateHostDisplayProfileCache(): void {
  profileCache = undefined;
}

export function isHostDisplayProfileStale(profile: HostDisplayProfile, now = Date.now()): boolean {
  return now - profile.updatedAt >= HOST_PROFILE_REVIEW_AFTER_MS;
}

export async function markHostObserved(
  hostname: string,
): Promise<{ firstObservation: boolean; record: ObservedHostRecord }> {
  const key = normalizeHostname(hostname);
  const result = await chrome.storage.local.get(OBSERVED_HOSTS_KEY);
  const stored = result[OBSERVED_HOSTS_KEY];
  const records: ObservedHostMap =
    typeof stored === 'object' && stored !== null && !Array.isArray(stored)
      ? (stored as ObservedHostMap)
      : {};
  const now = Date.now();
  const previous = records[key];
  if (previous !== undefined && now - previous.lastObservedAt < OBSERVED_HOST_TOUCH_INTERVAL_MS) {
    return { firstObservation: false, record: previous };
  }

  const record: ObservedHostRecord = previous
    ? { ...previous, lastObservedAt: now }
    : { hostname: key, firstObservedAt: now, lastObservedAt: now };
  const bounded = newestEntries({ ...records, [key]: record }, MAX_OBSERVED_HOSTS);
  await chrome.storage.local.set({ [OBSERVED_HOSTS_KEY]: bounded });
  return { firstObservation: previous === undefined, record };
}

export function applyHostDisplayProfile<
  T extends {
    communicationPulseEnabled: boolean;
    communicationTextChipEnabled: boolean;
    factChipPosition: FactChipPosition;
    communicationPulseDurationMs: CommunicationPulseDurationMs;
    communicationPulseOpacity: CommunicationPulseOpacity;
    communicationPulseDomColor: CommunicationPulseColor;
    communicationPulseWebRequestColor: CommunicationPulseColor;
  },
>(settings: T, profile: HostDisplayProfile | undefined): T {
  if (!profile) return settings;
  return {
    ...settings,
    communicationPulseEnabled: profile.pulseVisible ?? settings.communicationPulseEnabled,
    communicationTextChipEnabled:
      profile.communicationTextVisible ?? settings.communicationTextChipEnabled,
    factChipPosition: profile.position ?? settings.factChipPosition,
    communicationPulseDurationMs: profile.pulseDurationMs ?? settings.communicationPulseDurationMs,
    communicationPulseOpacity: profile.pulseOpacity ?? settings.communicationPulseOpacity,
    communicationPulseDomColor: profile.domColor ?? settings.communicationPulseDomColor,
    communicationPulseWebRequestColor:
      profile.webRequestColor ?? settings.communicationPulseWebRequestColor,
  };
}
