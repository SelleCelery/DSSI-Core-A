import { describe, expect, it } from 'vitest';
import {
  initializeTransientDisplayState,
  setPulsePaused,
  setPulseVisible,
  transientDisplayState,
} from '../../src/ui/transient-display-state';

describe('transient display state', () => {
  it('resets a paused pulse when display state is initialized again', () => {
    initializeTransientDisplayState({ communicationTextVisible: true, pulseVisible: true });
    setPulsePaused(true);
    expect(transientDisplayState().pulsePaused).toBe(true);

    initializeTransientDisplayState({ communicationTextVisible: false, pulseVisible: true });
    expect(transientDisplayState()).toMatchObject({
      communicationTextVisible: false,
      pulseVisible: true,
      pulsePaused: false,
    });
  });

  it('clears a stale pause latch when a confirmed visibility change resumes pulses', () => {
    initializeTransientDisplayState({ communicationTextVisible: true, pulseVisible: true });
    setPulsePaused(true);
    setPulseVisible(false);
    setPulseVisible(true);

    expect(transientDisplayState()).toMatchObject({ pulseVisible: true, pulsePaused: false });
  });
});
