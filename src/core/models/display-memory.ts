import type {
  CommunicationPulseColor,
  CommunicationPulseDurationMs,
  CommunicationPulseOpacity,
  DssiSettings,
  FactChipPosition,
} from './settings';

export interface DisplaySettingsBundle {
  communicationPulseEnabled: boolean;
  communicationTextChipEnabled: boolean;
  observationSettingsPanelVisible: boolean;
  factChipPosition: FactChipPosition;
  communicationPulseDurationMs: CommunicationPulseDurationMs;
  communicationPulseOpacity: CommunicationPulseOpacity;
  communicationPulseDomColor: CommunicationPulseColor;
  communicationPulseWebRequestColor: CommunicationPulseColor;
}

export type DisplayMemorySource = { kind: 'global' } | { kind: 'host'; hostname: string };

export interface DisplayMemoryReaction {
  source: DisplayMemorySource;
  revision: string;
  bundle: DisplaySettingsBundle;
  updatedAt: number;
}

export interface DisplaySessionDraftReaction {
  revision: string;
  baseRevision: string;
  patch: Partial<DisplaySettingsBundle>;
  updatedAt: number;
}

export interface DisplayTransientMemory {
  committed: DisplayMemoryReaction;
  draft: Partial<DisplaySettingsBundle>;
  draftBaseRevision: string;
  draftRevision: number;
  appliedReadSequence: number;
}

export interface DisplayMemorySnapshot {
  committed: DisplayMemoryReaction;
  current: DisplaySettingsBundle;
  draft: Partial<DisplaySettingsBundle>;
  draftBaseRevision: string;
  draftRevision: number;
  dirty: boolean;
}

const DISPLAY_POSITIONS: readonly FactChipPosition[] = [
  'top',
  'top_right',
  'right',
  'bottom_right',
  'bottom',
  'bottom_left',
  'left',
  'top_left',
];
const DISPLAY_DURATIONS: readonly CommunicationPulseDurationMs[] = [
  0, 300, 700, 1500, 3000, 10000, 30000, 60000,
];
const DISPLAY_OPACITIES: readonly CommunicationPulseOpacity[] = [1, 0.8, 0.6, 0.4];
const DISPLAY_COLORS: readonly CommunicationPulseColor[] = ['magenta', 'cyan', 'yellow', 'neutral'];

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isMember<T extends string | number>(values: readonly T[], value: unknown): value is T {
  return values.some((candidate) => candidate === value);
}

export function displaySettingsBundleFromSettings(
  settings: Pick<
    DssiSettings,
    | 'communicationPulseEnabled'
    | 'communicationTextChipEnabled'
    | 'factChipPosition'
    | 'communicationPulseDurationMs'
    | 'communicationPulseOpacity'
    | 'communicationPulseDomColor'
    | 'communicationPulseWebRequestColor'
  >,
): DisplaySettingsBundle {
  return {
    communicationPulseEnabled: settings.communicationPulseEnabled,
    communicationTextChipEnabled: settings.communicationTextChipEnabled,
    observationSettingsPanelVisible: true,
    factChipPosition: settings.factChipPosition,
    communicationPulseDurationMs: settings.communicationPulseDurationMs,
    communicationPulseOpacity: settings.communicationPulseOpacity,
    communicationPulseDomColor: settings.communicationPulseDomColor,
    communicationPulseWebRequestColor: settings.communicationPulseWebRequestColor,
  };
}

export function settingsWithDisplayBundle(
  settings: DssiSettings,
  bundle: DisplaySettingsBundle,
): DssiSettings {
  return {
    ...settings,
    communicationPulseEnabled: bundle.communicationPulseEnabled,
    communicationTextChipEnabled: bundle.communicationTextChipEnabled,
    factChipPosition: bundle.factChipPosition,
    communicationPulseDurationMs: bundle.communicationPulseDurationMs,
    communicationPulseOpacity: bundle.communicationPulseOpacity,
    communicationPulseDomColor: bundle.communicationPulseDomColor,
    communicationPulseWebRequestColor: bundle.communicationPulseWebRequestColor,
  };
}

export function isDisplaySettingsBundle(value: unknown): value is DisplaySettingsBundle {
  if (!isObject(value)) return false;
  return (
    typeof value.communicationPulseEnabled === 'boolean' &&
    typeof value.communicationTextChipEnabled === 'boolean' &&
    typeof value.observationSettingsPanelVisible === 'boolean' &&
    isMember(DISPLAY_POSITIONS, value.factChipPosition) &&
    isMember(DISPLAY_DURATIONS, value.communicationPulseDurationMs) &&
    isMember(DISPLAY_OPACITIES, value.communicationPulseOpacity) &&
    isMember(DISPLAY_COLORS, value.communicationPulseDomColor) &&
    isMember(DISPLAY_COLORS, value.communicationPulseWebRequestColor)
  );
}

export function isDisplaySettingsPatch(value: unknown): value is Partial<DisplaySettingsBundle> {
  if (!isObject(value)) return false;
  const allowed = new Set<keyof DisplaySettingsBundle>([
    'communicationPulseEnabled',
    'communicationTextChipEnabled',
    'observationSettingsPanelVisible',
    'factChipPosition',
    'communicationPulseDurationMs',
    'communicationPulseOpacity',
    'communicationPulseDomColor',
    'communicationPulseWebRequestColor',
  ]);
  if (Object.keys(value).some((key) => !allowed.has(key as keyof DisplaySettingsBundle))) {
    return false;
  }
  return isDisplaySettingsBundle({
    communicationPulseEnabled: value.communicationPulseEnabled ?? true,
    communicationTextChipEnabled: value.communicationTextChipEnabled ?? true,
    observationSettingsPanelVisible: value.observationSettingsPanelVisible ?? true,
    factChipPosition: value.factChipPosition ?? 'right',
    communicationPulseDurationMs: value.communicationPulseDurationMs ?? 700,
    communicationPulseOpacity: value.communicationPulseOpacity ?? 0.8,
    communicationPulseDomColor: value.communicationPulseDomColor ?? 'magenta',
    communicationPulseWebRequestColor: value.communicationPulseWebRequestColor ?? 'cyan',
  });
}

export function migrateDisplaySettingsBundle(value: unknown): DisplaySettingsBundle | undefined {
  if (!isObject(value)) return undefined;
  const migrated = {
    ...value,
    observationSettingsPanelVisible: value.observationSettingsPanelVisible ?? true,
  };
  return isDisplaySettingsBundle(migrated) ? migrated : undefined;
}

export function isDisplaySessionDraftReaction(
  value: unknown,
): value is DisplaySessionDraftReaction {
  if (!isObject(value)) return false;
  return (
    typeof value.revision === 'string' &&
    value.revision.length > 0 &&
    typeof value.baseRevision === 'string' &&
    value.baseRevision.length > 0 &&
    isDisplaySettingsPatch(value.patch) &&
    Object.keys(value.patch).length > 0 &&
    typeof value.updatedAt === 'number' &&
    Number.isFinite(value.updatedAt)
  );
}

export function displayBundleWithPatch(
  bundle: DisplaySettingsBundle,
  patch: Partial<DisplaySettingsBundle>,
): DisplaySettingsBundle {
  return { ...bundle, ...patch };
}

export function displayDraftAgainstBundle(
  bundle: DisplaySettingsBundle,
  patch: Partial<DisplaySettingsBundle>,
): Partial<DisplaySettingsBundle> {
  const draft: Partial<DisplaySettingsBundle> = {};
  for (const [key, value] of Object.entries(patch) as Array<
    [keyof DisplaySettingsBundle, DisplaySettingsBundle[keyof DisplaySettingsBundle]]
  >) {
    if (value !== bundle[key]) Object.assign(draft, { [key]: value });
  }
  return draft;
}

export function createDisplayTransientMemory(
  reaction: DisplayMemoryReaction,
  sessionDraft?: DisplaySessionDraftReaction,
): DisplayTransientMemory {
  const draft =
    sessionDraft !== undefined &&
    isDisplaySessionDraftReaction(sessionDraft) &&
    sessionDraft.baseRevision === reaction.revision
      ? displayDraftAgainstBundle(reaction.bundle, sessionDraft.patch)
      : {};
  return {
    committed: reaction,
    draft,
    draftBaseRevision: reaction.revision,
    draftRevision: Object.keys(draft).length > 0 ? 1 : 0,
    appliedReadSequence: 0,
  };
}

export function updateDisplayDraft(
  memory: DisplayTransientMemory,
  patch: Partial<DisplaySettingsBundle>,
): DisplayTransientMemory {
  if (!isDisplaySettingsPatch(patch)) throw new TypeError('Invalid display settings patch');
  const currentDraft = memory.draftBaseRevision === memory.committed.revision ? memory.draft : {};
  const draft = displayDraftAgainstBundle(memory.committed.bundle, {
    ...currentDraft,
    ...patch,
  });
  return {
    ...memory,
    draft,
    draftBaseRevision: memory.committed.revision,
    draftRevision: memory.draftRevision + 1,
  };
}

export function acceptDisplayReaction(
  memory: DisplayTransientMemory,
  reaction: DisplayMemoryReaction,
  readSequence: number,
  clearDraftAtRevision?: number,
  sessionDraft?: DisplaySessionDraftReaction,
): DisplayTransientMemory {
  if (readSequence < memory.appliedReadSequence) return memory;
  const shouldClearDraft =
    clearDraftAtRevision !== undefined && clearDraftAtRevision === memory.draftRevision;
  const currentDraft =
    !shouldClearDraft && memory.draftBaseRevision === reaction.revision ? memory.draft : {};
  const restoredDraft =
    Object.keys(currentDraft).length === 0 &&
    sessionDraft !== undefined &&
    isDisplaySessionDraftReaction(sessionDraft) &&
    sessionDraft.baseRevision === reaction.revision
      ? displayDraftAgainstBundle(reaction.bundle, sessionDraft.patch)
      : {};
  return {
    committed: reaction,
    draft: { ...currentDraft, ...restoredDraft },
    draftBaseRevision: reaction.revision,
    draftRevision: memory.draftRevision,
    appliedReadSequence: readSequence,
  };
}

/**
 * Replaces the displayed draft with the exact state returned by storage.
 *
 * Unlike acceptDisplayReaction(), this deliberately does not preserve a local
 * draft. It is used for command reactions so that a surface never presents a
 * value that storage has not confirmed.
 */
export function acceptConfirmedDisplayState(
  memory: DisplayTransientMemory,
  reaction: DisplayMemoryReaction,
  readSequence: number,
  sessionDraft?: DisplaySessionDraftReaction,
): DisplayTransientMemory {
  if (readSequence < memory.appliedReadSequence) return memory;
  const confirmed = createDisplayTransientMemory(reaction, sessionDraft);
  return {
    ...confirmed,
    draftRevision: memory.draftRevision + 1,
    appliedReadSequence: readSequence,
  };
}

export function clearDisplayDraftAtRevision(
  memory: DisplayTransientMemory,
  draftRevision: number,
): DisplayTransientMemory {
  if (draftRevision !== memory.draftRevision) return memory;
  return { ...memory, draft: {}, draftBaseRevision: memory.committed.revision };
}

export function displayMemorySnapshot(memory: DisplayTransientMemory): DisplayMemorySnapshot {
  return {
    committed: memory.committed,
    current: displayBundleWithPatch(memory.committed.bundle, memory.draft),
    draft: { ...memory.draft },
    draftBaseRevision: memory.draftBaseRevision,
    draftRevision: memory.draftRevision,
    dirty: Object.keys(memory.draft).length > 0,
  };
}
