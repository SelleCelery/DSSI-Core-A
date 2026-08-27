import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  completeTutorialState,
  loadTutorialState,
  recordTutorialPresentation,
  recordTutorialProgress,
  TUTORIAL_VERSION,
} from '../../src/storage/tutorial-store';

describe('ConnectBits tutorial state', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('starts a new tutorial at the first frame', () => {
    expect(recordTutorialPresentation(undefined, 100, 28)).toEqual({
      version: TUTORIAL_VERSION,
      firstPresentedAt: 100,
      lastPresentedAt: 100,
      lastFrameIndex: 0,
    });
  });

  it('keeps the last frame when the tutorial is opened again', () => {
    const presented = recordTutorialPresentation(undefined, 100, 28);
    const progressed = recordTutorialProgress(presented, 12, 28);

    expect(recordTutorialPresentation(progressed, 200, 28)).toMatchObject({
      firstPresentedAt: 100,
      lastPresentedAt: 200,
      lastFrameIndex: 12,
    });
  });

  it('clamps saved progress when the tutorial frame count changes', () => {
    const presented = recordTutorialPresentation(undefined, 100, 28);
    const progressed = recordTutorialProgress(presented, 27, 28);

    expect(recordTutorialPresentation(progressed, 200, 20).lastFrameIndex).toBe(19);
  });

  it('records completion once without changing the original completion time', () => {
    const presented = recordTutorialPresentation(undefined, 100, 28);
    const completed = completeTutorialState(presented, 200);

    expect(completeTutorialState(completed, 300).completedAt).toBe(200);
  });

  it('ignores state from an older tutorial version', async () => {
    vi.stubGlobal('chrome', {
      storage: {
        local: {
          get: vi.fn().mockResolvedValue({
            connectBitsTutorialState: { version: 0, lastFrameIndex: 9 },
          }),
        },
      },
    });

    await expect(loadTutorialState()).resolves.toBeUndefined();
  });
});
