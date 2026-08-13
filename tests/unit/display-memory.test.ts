import { describe, expect, it } from 'vitest';
import {
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
});
