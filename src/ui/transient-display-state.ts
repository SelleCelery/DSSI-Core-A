export interface TransientDisplayState {
  communicationTextVisible: boolean;
  pulseVisible: boolean;
  pulsePaused: boolean;
}

const state: TransientDisplayState = {
  communicationTextVisible: true,
  pulseVisible: true,
  pulsePaused: false,
};

const listeners = new Set<(next: Readonly<TransientDisplayState>) => void>();

function notify(): void {
  const snapshot = { ...state };
  for (const listener of listeners) listener(snapshot);
}

export function initializeTransientDisplayState(
  initial: Pick<TransientDisplayState, 'communicationTextVisible' | 'pulseVisible'>,
): void {
  state.communicationTextVisible = initial.communicationTextVisible;
  state.pulseVisible = initial.pulseVisible;
  state.pulsePaused = false;
  notify();
}

export function transientDisplayState(): Readonly<TransientDisplayState> {
  return state;
}

export function setCommunicationTextVisible(visible: boolean): void {
  if (state.communicationTextVisible === visible) return;
  state.communicationTextVisible = visible;
  notify();
}

export function setPulseVisible(visible: boolean): void {
  if (state.pulseVisible === visible) return;
  state.pulseVisible = visible;
  notify();
}

export function setPulsePaused(paused: boolean): void {
  if (state.pulsePaused === paused) return;
  state.pulsePaused = paused;
  notify();
}

export function subscribeTransientDisplayState(
  listener: (next: Readonly<TransientDisplayState>) => void,
): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
