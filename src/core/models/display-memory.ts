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

export interface DisplayTransientMemory {
  committed: DisplayMemoryReaction;
  draft: Partial<DisplaySettingsBundle>;
  draftRevision: number;
  appliedReadSequence: number;
}

export interface DisplayMemorySnapshot {
  committed: DisplayMemoryReaction;
  current: DisplaySettingsBundle;
  draft: Partial<DisplaySettingsBundle>;
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
  return { ...settings, ...bundle };
}

export function isDisplaySettingsBundle(value: unknown): value is DisplaySettingsBundle {
  if (!isObject(value)) return false;
  return (
    typeof value.communicationPulseEnabled === 'boolean' &&
    typeof value.communicationTextChipEnabled === 'boolean' &&
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
    factChipPosition: value.factChipPosition ?? 'right',
    communicationPulseDurationMs: value.communicationPulseDurationMs ?? 700,
    communicationPulseOpacity: value.communicationPulseOpacity ?? 0.8,
    communicationPulseDomColor: value.communicationPulseDomColor ?? 'magenta',
    communicationPulseWebRequestColor: value.communicationPulseWebRequestColor ?? 'cyan',
  });
}

export function displayBundleWithPatch(
  bundle: DisplaySettingsBundle,
  patch: Partial<DisplaySettingsBundle>,
): DisplaySettingsBundle {
  return { ...bundle, ...patch };
}

export function createDisplayTransientMemory(
  reaction: DisplayMemoryReaction,
): DisplayTransientMemory {
  return {
    committed: reaction,
    draft: {},
    draftRevision: 0,
    appliedReadSequence: 0,
  };
}

export function updateDisplayDraft(
  memory: DisplayTransientMemory,
  patch: Partial<DisplaySettingsBundle>,
): DisplayTransientMemory {
  if (!isDisplaySettingsPatch(patch)) throw new TypeError('Invalid display settings patch');
  return {
    ...memory,
    draft: { ...memory.draft, ...patch },
    draftRevision: memory.draftRevision + 1,
  };
}

export function acceptDisplayReaction(
  memory: DisplayTransientMemory,
  reaction: DisplayMemoryReaction,
  readSequence: number,
  clearDraftAtRevision?: number,
): DisplayTransientMemory {
  if (readSequence < memory.appliedReadSequence) return memory;
  const shouldClearDraft =
    clearDraftAtRevision !== undefined && clearDraftAtRevision === memory.draftRevision;
  return {
    committed: reaction,
    draft: shouldClearDraft ? {} : memory.draft,
    draftRevision: memory.draftRevision,
    appliedReadSequence: readSequence,
  };
}

export function clearDisplayDraftAtRevision(
  memory: DisplayTransientMemory,
  draftRevision: number,
): DisplayTransientMemory {
  if (draftRevision !== memory.draftRevision) return memory;
  return { ...memory, draft: {} };
}

export function displayMemorySnapshot(memory: DisplayTransientMemory): DisplayMemorySnapshot {
  return {
    committed: memory.committed,
    current: displayBundleWithPatch(memory.committed.bundle, memory.draft),
    draft: { ...memory.draft },
    draftRevision: memory.draftRevision,
    dirty: Object.keys(memory.draft).length > 0,
  };
}
