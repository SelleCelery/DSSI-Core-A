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

export interface HostDisplayOverrides {
  pulseVisible?: boolean;
  communicationTextVisible?: boolean;
  position?: FactChipPosition;
  pulseDurationMs?: CommunicationPulseDurationMs;
  pulseOpacity?: CommunicationPulseOpacity;
  domColor?: CommunicationPulseColor;
  webRequestColor?: CommunicationPulseColor;
}

export interface HostDisplayProfile {
  schemaVersion: 1;
  hostname: string;
  overrides: HostDisplayOverrides;
  updatedAt: number;
}

interface HostDisplaySettings {
  communicationPulseEnabled: boolean;
  communicationTextChipEnabled: boolean;
  factChipPosition: FactChipPosition;
  communicationPulseDurationMs: CommunicationPulseDurationMs;
  communicationPulseOpacity: CommunicationPulseOpacity;
  communicationPulseDomColor: CommunicationPulseColor;
  communicationPulseWebRequestColor: CommunicationPulseColor;
}

interface ObservedHostRecord {
  hostname: string;
  firstObservedAt: number;
  lastObservedAt: number;
}

type HostDisplayProfileMap = Record<string, HostDisplayProfile>;
type ObservedHostMap = Record<string, ObservedHostRecord>;

let profileCache: HostDisplayProfileMap | undefined;

const FACT_CHIP_POSITIONS: readonly FactChipPosition[] = [
  'top',
  'top_right',
  'right',
  'bottom_right',
  'bottom',
  'bottom_left',
  'left',
  'top_left',
];
const PULSE_DURATIONS: readonly CommunicationPulseDurationMs[] = [
  0, 300, 700, 1500, 3000, 10000, 30000, 60000,
];
const PULSE_OPACITIES: readonly CommunicationPulseOpacity[] = [1, 0.8, 0.6, 0.4];
const PULSE_COLORS: readonly CommunicationPulseColor[] = ['magenta', 'cyan', 'yellow', 'neutral'];

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isMember<T extends string | number>(values: readonly T[], value: unknown): value is T {
  return values.some((candidate) => candidate === value);
}

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

function normalizedOverrides(value: unknown): HostDisplayOverrides {
  if (!isObject(value)) return {};
  const overrides: HostDisplayOverrides = {};
  if (typeof value.pulseVisible === 'boolean') overrides.pulseVisible = value.pulseVisible;
  if (typeof value.communicationTextVisible === 'boolean') {
    overrides.communicationTextVisible = value.communicationTextVisible;
  }
  if (isMember(FACT_CHIP_POSITIONS, value.position)) overrides.position = value.position;
  if (isMember(PULSE_DURATIONS, value.pulseDurationMs)) {
    overrides.pulseDurationMs = value.pulseDurationMs;
  }
  if (isMember(PULSE_OPACITIES, value.pulseOpacity)) {
    overrides.pulseOpacity = value.pulseOpacity;
  }
  if (isMember(PULSE_COLORS, value.domColor)) overrides.domColor = value.domColor;
  if (isMember(PULSE_COLORS, value.webRequestColor)) {
    overrides.webRequestColor = value.webRequestColor;
  }
  return overrides;
}

function hasOverrides(overrides: HostDisplayOverrides): boolean {
  return Object.keys(overrides).length > 0;
}

function normalizedProfile(value: unknown, hostname: string): HostDisplayProfile | undefined {
  if (
    !isObject(value) ||
    typeof value.updatedAt !== 'number' ||
    !Number.isFinite(value.updatedAt)
  ) {
    return undefined;
  }
  const overrides = normalizedOverrides(value.schemaVersion === 1 ? value.overrides : value);
  if (!hasOverrides(overrides)) return undefined;
  return {
    schemaVersion: 1,
    hostname: normalizeHostname(hostname),
    overrides,
    updatedAt: value.updatedAt,
  };
}

export function migrateHostDisplayProfiles(value: unknown): HostDisplayProfileMap {
  if (!isObject(value)) return {};
  const profiles: HostDisplayProfileMap = {};
  for (const [hostname, candidate] of Object.entries(value)) {
    const profile = normalizedProfile(candidate, hostname);
    if (profile !== undefined) profiles[profile.hostname] = profile;
  }
  return profiles;
}

async function loadProfiles(): Promise<HostDisplayProfileMap> {
  if (profileCache !== undefined) return { ...profileCache };
  const result = await chrome.storage.local.get(HOST_PROFILES_KEY);
  const stored = result[HOST_PROFILES_KEY];
  const migrated = migrateHostDisplayProfiles(stored);
  profileCache = migrated;
  if (JSON.stringify(stored ?? {}) !== JSON.stringify(migrated)) {
    await chrome.storage.local.set({ [HOST_PROFILES_KEY]: migrated });
  }
  return { ...migrated };
}

export async function loadHostDisplayProfile(
  hostname: string,
): Promise<HostDisplayProfile | undefined> {
  const key = normalizeHostname(hostname);
  const profiles = await loadProfiles();
  return profiles[key];
}

export async function replaceHostDisplayProfile(
  hostname: string,
  overrides: HostDisplayOverrides,
): Promise<HostDisplayProfile | undefined> {
  const key = normalizeHostname(hostname);
  const normalized = normalizedOverrides(overrides);
  if (!hasOverrides(normalized)) {
    await removeHostDisplayProfile(key);
    return undefined;
  }
  const profiles = await loadProfiles();
  const next: HostDisplayProfile = {
    schemaVersion: 1,
    hostname: key,
    overrides: normalized,
    updatedAt: Date.now(),
  };
  const bounded = newestEntries({ ...profiles, [key]: next }, MAX_HOST_PROFILES);
  profileCache = bounded;
  await chrome.storage.local.set({ [HOST_PROFILES_KEY]: bounded });
  return next;
}

export async function removeHostDisplayProfile(hostname: string): Promise<boolean> {
  const key = normalizeHostname(hostname);
  const profiles = await loadProfiles();
  if (profiles[key] === undefined) return false;
  delete profiles[key];
  profileCache = profiles;
  await chrome.storage.local.set({ [HOST_PROFILES_KEY]: profiles });
  return true;
}

export function invalidateHostDisplayProfileCache(): void {
  profileCache = undefined;
}

export function isHostDisplayProfileStale(profile: HostDisplayProfile, now = Date.now()): boolean {
  return now - profile.updatedAt >= HOST_PROFILE_REVIEW_AFTER_MS;
}

export function hostDisplayOverridesFromEffectiveSettings(
  globalSettings: HostDisplaySettings,
  effectiveSettings: HostDisplaySettings,
): HostDisplayOverrides {
  const overrides: HostDisplayOverrides = {};
  if (effectiveSettings.communicationPulseEnabled !== globalSettings.communicationPulseEnabled) {
    overrides.pulseVisible = effectiveSettings.communicationPulseEnabled;
  }
  if (
    effectiveSettings.communicationTextChipEnabled !== globalSettings.communicationTextChipEnabled
  ) {
    overrides.communicationTextVisible = effectiveSettings.communicationTextChipEnabled;
  }
  if (effectiveSettings.factChipPosition !== globalSettings.factChipPosition) {
    overrides.position = effectiveSettings.factChipPosition;
  }
  if (
    effectiveSettings.communicationPulseDurationMs !== globalSettings.communicationPulseDurationMs
  ) {
    overrides.pulseDurationMs = effectiveSettings.communicationPulseDurationMs;
  }
  if (effectiveSettings.communicationPulseOpacity !== globalSettings.communicationPulseOpacity) {
    overrides.pulseOpacity = effectiveSettings.communicationPulseOpacity;
  }
  if (effectiveSettings.communicationPulseDomColor !== globalSettings.communicationPulseDomColor) {
    overrides.domColor = effectiveSettings.communicationPulseDomColor;
  }
  if (
    effectiveSettings.communicationPulseWebRequestColor !==
    globalSettings.communicationPulseWebRequestColor
  ) {
    overrides.webRequestColor = effectiveSettings.communicationPulseWebRequestColor;
  }
  return overrides;
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
  const overrides = profile.overrides;
  return {
    ...settings,
    communicationPulseEnabled: overrides.pulseVisible ?? settings.communicationPulseEnabled,
    communicationTextChipEnabled:
      overrides.communicationTextVisible ?? settings.communicationTextChipEnabled,
    factChipPosition: overrides.position ?? settings.factChipPosition,
    communicationPulseDurationMs:
      overrides.pulseDurationMs ?? settings.communicationPulseDurationMs,
    communicationPulseOpacity: overrides.pulseOpacity ?? settings.communicationPulseOpacity,
    communicationPulseDomColor: overrides.domColor ?? settings.communicationPulseDomColor,
    communicationPulseWebRequestColor:
      overrides.webRequestColor ?? settings.communicationPulseWebRequestColor,
  };
}
