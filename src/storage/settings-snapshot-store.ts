import type { ObservationSettingsSnapshot } from '../core/models/settings-snapshot';
import type { DssiSettings } from '../core/models/settings';
import { settingsWithDisplayBundle } from '../core/models/display-memory';
import { readSettingsMemory } from './settings-memory-store';

const SETTINGS_SNAPSHOTS_KEY = 'dssiObservationSettingsSnapshots';
const MAX_SETTINGS_SNAPSHOTS = 64;

interface SnapshotStore {
  snapshots: ObservationSettingsSnapshot[];
}

let lastFingerprint: string | undefined;
let lastSnapshot: ObservationSettingsSnapshot | undefined;

function snapshotFingerprint(
  hostname: string,
  settings: DssiSettings,
  hostProfileApplied: boolean,
): string {
  return JSON.stringify({
    hostname,
    viscosityLevel: settings.viscosityLevel,
    reportingMode: settings.reportingMode,
    factChipPosition: settings.factChipPosition,
    communicationPulseEnabled: settings.communicationPulseEnabled,
    communicationTextChipEnabled: settings.communicationTextChipEnabled,
    communicationPulseDurationMs: settings.communicationPulseDurationMs,
    communicationPulseSize: settings.communicationPulseSize,
    communicationPulseDomColor: settings.communicationPulseDomColor,
    communicationPulseWebRequestColor: settings.communicationPulseWebRequestColor,
    communicationPulseOpacity: settings.communicationPulseOpacity,
    localClassificationEnabled: settings.localClassificationEnabled,
    networkObservationEnabled: settings.networkObservationEnabled,
    hostProfileApplied,
  });
}

async function loadStore(): Promise<SnapshotStore> {
  const result = await chrome.storage.session.get(SETTINGS_SNAPSHOTS_KEY);
  const stored = result[SETTINGS_SNAPSHOTS_KEY];
  if (typeof stored !== 'object' || stored === null || Array.isArray(stored)) {
    return { snapshots: [] };
  }
  const snapshots = (stored as Partial<SnapshotStore>).snapshots;
  return { snapshots: Array.isArray(snapshots) ? snapshots : [] };
}

export async function captureObservationSettingsSnapshot(
  hostname: string,
  globalSettings: DssiSettings,
): Promise<ObservationSettingsSnapshot> {
  const memory = await readSettingsMemory(hostname);
  const effectiveSettings = settingsWithDisplayBundle(globalSettings, memory.reaction.bundle);
  const hostMemoryApplied = memory.reaction.source.kind === 'host';
  const fingerprint = snapshotFingerprint(hostname, effectiveSettings, hostMemoryApplied);

  if (lastFingerprint === fingerprint && lastSnapshot !== undefined) {
    return lastSnapshot;
  }

  const store = await loadStore();
  const existing = store.snapshots.find(
    (snapshot) =>
      snapshotFingerprint(
        snapshot.hostname,
        {
          ...globalSettings,
          viscosityLevel: snapshot.viscosityLevel,
          reportingMode: snapshot.reportingMode,
          factChipPosition: snapshot.factChipPosition,
          communicationPulseEnabled: snapshot.communicationPulseEnabled,
          communicationTextChipEnabled: snapshot.communicationTextChipEnabled,
          communicationPulseDurationMs: snapshot.communicationPulseDurationMs,
          communicationPulseSize: snapshot.communicationPulseSize,
          communicationPulseDomColor: snapshot.communicationPulseDomColor,
          communicationPulseWebRequestColor: snapshot.communicationPulseWebRequestColor,
          communicationPulseOpacity: snapshot.communicationPulseOpacity,
          localClassificationEnabled: snapshot.localClassificationEnabled,
          networkObservationEnabled: snapshot.networkObservationEnabled,
        },
        snapshot.hostProfileApplied,
      ) === fingerprint,
  );
  if (existing) {
    lastFingerprint = fingerprint;
    lastSnapshot = existing;
    return existing;
  }

  const snapshot: ObservationSettingsSnapshot = {
    id: crypto.randomUUID(),
    capturedAt: Date.now(),
    hostname,
    viscosityLevel: effectiveSettings.viscosityLevel,
    reportingMode: effectiveSettings.reportingMode,
    factChipPosition: effectiveSettings.factChipPosition,
    communicationPulseEnabled: effectiveSettings.communicationPulseEnabled,
    communicationTextChipEnabled: effectiveSettings.communicationTextChipEnabled,
    communicationPulseDurationMs: effectiveSettings.communicationPulseDurationMs,
    communicationPulseSize: effectiveSettings.communicationPulseSize,
    communicationPulseDomColor: effectiveSettings.communicationPulseDomColor,
    communicationPulseWebRequestColor: effectiveSettings.communicationPulseWebRequestColor,
    communicationPulseOpacity: effectiveSettings.communicationPulseOpacity,
    localClassificationEnabled: effectiveSettings.localClassificationEnabled,
    networkObservationEnabled: effectiveSettings.networkObservationEnabled,
    hostProfileApplied: hostMemoryApplied,
  };
  const next = [...store.snapshots, snapshot].slice(-MAX_SETTINGS_SNAPSHOTS);
  await chrome.storage.session.set({
    [SETTINGS_SNAPSHOTS_KEY]: { snapshots: next } satisfies SnapshotStore,
  });
  lastFingerprint = fingerprint;
  lastSnapshot = snapshot;
  return snapshot;
}

export async function getObservationSettingsSnapshots(
  ids?: ReadonlySet<string>,
): Promise<ObservationSettingsSnapshot[]> {
  const store = await loadStore();
  if (!ids) return [...store.snapshots];
  return store.snapshots.filter((snapshot) => ids.has(snapshot.id));
}

export async function clearObservationSettingsSnapshots(): Promise<void> {
  lastFingerprint = undefined;
  lastSnapshot = undefined;
  await chrome.storage.session.remove(SETTINGS_SNAPSHOTS_KEY);
}
