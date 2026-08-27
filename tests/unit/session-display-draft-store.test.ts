import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isSessionDisplayDraftWriteMessage } from '../../src/core/models/settings-memory';
import {
  migrateSessionDisplayDrafts,
  readSessionDisplayDraft,
  removeSessionDisplayDraft,
  SESSION_DISPLAY_DRAFTS_KEY,
  writeSessionDisplayDraft,
} from '../../src/storage/session-display-draft-store';

describe('session display draft storage', () => {
  let storage: Record<string, unknown>;

  beforeEach(() => {
    storage = {};
    vi.stubGlobal('chrome', {
      storage: {
        session: {
          get: vi.fn((key: string) => (key in storage ? { [key]: storage[key] } : {})),
          set: vi.fn((values: Record<string, unknown>) => {
            Object.assign(storage, values);
          }),
        },
      },
    });
    vi.stubGlobal('crypto', { randomUUID: vi.fn(() => 'draft-revision') });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('round-trips a valid draft only against its confirmed base revision', async () => {
    await writeSessionDisplayDraft('Example.Test', 'base:1', {
      communicationPulseOpacity: 1,
      observationSettingsPanelVisible: false,
    });

    await expect(readSessionDisplayDraft('example.test', 'base:1')).resolves.toMatchObject({
      revision: 'draft-revision',
      baseRevision: 'base:1',
      patch: {
        communicationPulseOpacity: 1,
        observationSettingsPanelVisible: false,
      },
    });
    await expect(readSessionDisplayDraft('example.test', 'base:2')).resolves.toBeUndefined();
    expect(storage[SESSION_DISPLAY_DRAFTS_KEY]).toEqual({});
  });

  it('removes corrupt and unknown fields instead of restoring them', () => {
    const migrated = migrateSessionDisplayDrafts({
      'valid.test': {
        schemaVersion: 1,
        revision: 'draft:1',
        baseRevision: 'base:1',
        patch: { factChipPosition: 'left' },
        updatedAt: 100,
      },
      'raw-payload.test': {
        schemaVersion: 1,
        revision: 'draft:2',
        baseRevision: 'base:1',
        patch: { communicationPulseOpacity: 1, rawValue: 'secret' },
        updatedAt: 101,
      },
      'broken.test': {
        schemaVersion: 1,
        revision: '',
        baseRevision: 'base:1',
        patch: { factChipPosition: 'left' },
        updatedAt: Number.POSITIVE_INFINITY,
      },
    });

    expect(migrated).toEqual({
      'valid.test': {
        schemaVersion: 1,
        hostname: 'valid.test',
        revision: 'draft:1',
        baseRevision: 'base:1',
        patch: { factChipPosition: 'left' },
        updatedAt: 100,
      },
    });
  });

  it('bounds storage growth and explicitly removes a host draft', async () => {
    storage[SESSION_DISPLAY_DRAFTS_KEY] = Object.fromEntries(
      Array.from({ length: 305 }, (_, index) => [
        `host-${index}.test`,
        {
          schemaVersion: 1,
          revision: `draft:${index}`,
          baseRevision: 'base:1',
          patch: { factChipPosition: 'left' },
          updatedAt: index,
        },
      ]),
    );

    await writeSessionDisplayDraft('current.test', 'base:1', {
      factChipPosition: 'bottom',
    });
    expect(Object.keys(storage[SESSION_DISPLAY_DRAFTS_KEY] as object)).toHaveLength(300);

    await removeSessionDisplayDraft('current.test');
    expect(storage[SESSION_DISPLAY_DRAFTS_KEY]).not.toHaveProperty('current.test');
  });

  it('rejects empty saves and fields outside the closed display schema', () => {
    expect(
      isSessionDisplayDraftWriteMessage({
        type: 'DSSI_SESSION_DISPLAY_DRAFT_WRITE',
        operationId: 'save:1',
        hostname: 'example.test',
        action: 'save',
        baseRevision: 'base:1',
        patch: {},
      }),
    ).toBe(false);
    expect(
      isSessionDisplayDraftWriteMessage({
        type: 'DSSI_SESSION_DISPLAY_DRAFT_WRITE',
        operationId: 'save:2',
        hostname: 'example.test',
        action: 'save',
        baseRevision: 'base:1',
        patch: { factChipPosition: 'left', rawValue: 'not-allowed' },
      }),
    ).toBe(false);
    expect(
      isSessionDisplayDraftWriteMessage({
        type: 'DSSI_SESSION_DISPLAY_DRAFT_WRITE',
        operationId: 'remove:1',
        hostname: 'example.test',
        action: 'remove',
        baseRevision: 'base:1',
        patch: {},
      }),
    ).toBe(true);
  });
});
