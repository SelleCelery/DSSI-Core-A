import type { InputOrigin } from './models/observation';

export interface InputOriginEvidence {
  now: number;
  lastKeyboardAt?: number;
  lastPasteAt?: number;
  inputType?: string;
  isTrusted: boolean;
}

const RECENT_INPUT_WINDOW_MS = 1200;

function isRecent(now: number, timestamp: number | undefined): boolean {
  return (
    timestamp !== undefined && now - timestamp >= 0 && now - timestamp <= RECENT_INPUT_WINDOW_MS
  );
}

export function inferInputOrigin(evidence: InputOriginEvidence): InputOrigin {
  const inputType = evidence.inputType?.toLowerCase() ?? '';

  if (inputType.includes('paste') || isRecent(evidence.now, evidence.lastPasteAt)) {
    return 'paste_confirmed';
  }

  if (isRecent(evidence.now, evidence.lastKeyboardAt)) {
    return 'keyboard_confirmed';
  }

  if (!evidence.isTrusted) {
    return 'script_or_unknown_update';
  }

  if (inputType === '' || inputType === 'insertreplacementtext' || inputType === 'insertfromdrop') {
    return 'autofill_or_manager_suspected';
  }

  return 'unknown';
}
