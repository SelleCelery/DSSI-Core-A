import { describe, expect, it } from 'vitest';
import {
  acceptConfirmedDisplayState,
  acceptDisplayReaction,
  clearDisplayDraftAtRevision,
  createDisplayTransientMemory,
  displayMemorySnapshot,
  updateDisplayDraft,
  type DisplayMemoryReaction,
} from '../../src/core/models/display-memory';

function reaction(revision: string, position: 'right' | 'left' | 'top'): DisplayMemoryReaction {
  return {
    source: { kind: 'global' },
    revision,
    updatedAt: 1,
    bundle: {
      communicationPulseEnabled: true,
      communicationTextChipEnabled: false,
      observationSettingsPanelVisible: true,
      factChipPosition: position,
      communicationPulseDurationMs: 700,
      communicationPulseOpacity: 0.8,
      communicationPulseDomColor: 'magenta',
      communicationPulseWebRequestColor: 'cyan',
    },
  };
}

describe('display transient memory', () => {
  it('renders a draft over one source bundle without combining global and host memories', () => {
    let memory = createDisplayTransientMemory(reaction('g:1', 'right'));
    memory = updateDisplayDraft(memory, {
      factChipPosition: 'left',
      communicationTextChipEnabled: true,
    });

    expect(displayMemorySnapshot(memory)).toMatchObject({
      committed: { revision: 'g:1', bundle: { factChipPosition: 'right' } },
      current: { factChipPosition: 'left', communicationTextChipEnabled: true },
      dirty: true,
    });
  });

  it('does not let a late read reaction roll a newer reaction back', () => {
    let memory = createDisplayTransientMemory(reaction('g:1', 'right'));
    memory = acceptDisplayReaction(memory, reaction('g:3', 'top'), 3);
    memory = acceptDisplayReaction(memory, reaction('g:2', 'left'), 2);

    expect(displayMemorySnapshot(memory).committed.revision).toBe('g:3');
    expect(displayMemorySnapshot(memory).current.factChipPosition).toBe('top');
  });

  it('clears only the draft revision that was actually saved', () => {
    let memory = createDisplayTransientMemory(reaction('g:1', 'right'));
    memory = updateDisplayDraft(memory, { factChipPosition: 'left' });
    const savedRevision = memory.draftRevision;
    memory = updateDisplayDraft(memory, { communicationTextChipEnabled: true });
    memory = clearDisplayDraftAtRevision(memory, savedRevision);

    expect(displayMemorySnapshot(memory).dirty).toBe(true);
    expect(displayMemorySnapshot(memory).current).toMatchObject({
      factChipPosition: 'left',
      communicationTextChipEnabled: true,
    });
  });

  it('keeps a current-revision session draft in the display memory', () => {
    let memory = createDisplayTransientMemory(reaction('g:1', 'right'));
    memory = updateDisplayDraft(memory, {
      observationSettingsPanelVisible: false,
      communicationPulseOpacity: 1,
    });
    memory = acceptDisplayReaction(memory, reaction('g:1', 'right'), 2);

    expect(displayMemorySnapshot(memory)).toMatchObject({
      current: {
        observationSettingsPanelVisible: false,
        communicationPulseOpacity: 1,
      },
      draft: {
        observationSettingsPanelVisible: false,
        communicationPulseOpacity: 1,
      },
    });
  });

  it('restores only a session draft bound to the confirmed revision', () => {
    const matching = createDisplayTransientMemory(reaction('g:1', 'right'), {
      revision: 'draft:matching',
      baseRevision: 'g:1',
      patch: { communicationPulseOpacity: 1 },
      updatedAt: 100,
    });
    const stale = createDisplayTransientMemory(reaction('g:2', 'right'), {
      revision: 'draft:stale',
      baseRevision: 'g:1',
      patch: { communicationPulseOpacity: 1 },
      updatedAt: 100,
    });

    expect(displayMemorySnapshot(matching).current.communicationPulseOpacity).toBe(1);
    expect(displayMemorySnapshot(stale)).toMatchObject({
      current: { communicationPulseOpacity: 0.8 },
      draft: {},
    });
  });

  it('drops an unsaved draft if its confirmed base changes', () => {
    let memory = createDisplayTransientMemory(reaction('g:1', 'right'));
    memory = updateDisplayDraft(memory, { factChipPosition: 'left' });
    memory = acceptDisplayReaction(memory, reaction('g:2', 'top'), 2);

    expect(displayMemorySnapshot(memory)).toMatchObject({
      current: { factChipPosition: 'top' },
      draft: {},
      draftBaseRevision: 'g:2',
    });
  });

  it('removes draft keys that the user returns to the confirmed value', () => {
    let memory = createDisplayTransientMemory(reaction('g:1', 'right'));
    memory = updateDisplayDraft(memory, { communicationPulseOpacity: 1 });
    memory = updateDisplayDraft(memory, { communicationPulseOpacity: 0.8 });

    expect(displayMemorySnapshot(memory)).toMatchObject({
      current: { communicationPulseOpacity: 0.8 },
      draft: {},
      dirty: false,
    });
  });

  it('replaces an optimistic draft with the exact storage-confirmed session state', () => {
    let memory = createDisplayTransientMemory(reaction('g:1', 'right'));
    memory = updateDisplayDraft(memory, { factChipPosition: 'left' });
    memory = acceptConfirmedDisplayState(memory, reaction('g:1', 'right'), 1, {
      revision: 'draft:confirmed',
      baseRevision: 'g:1',
      patch: { communicationPulseOpacity: 1 },
      updatedAt: 10,
    });

    expect(displayMemorySnapshot(memory)).toMatchObject({
      current: { factChipPosition: 'right', communicationPulseOpacity: 1 },
      draft: { communicationPulseOpacity: 1 },
    });
  });
});
