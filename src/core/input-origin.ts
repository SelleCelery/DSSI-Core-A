import type { InputOrigin, OperationEvidence } from './models/observation';

export interface InputOriginEvidence {
  now: number;
  lastKeyboardAt?: number;
  lastKeyboardTrusted?: boolean;
  lastPasteAt?: number;
  lastPasteTrusted?: boolean;
  inputType?: string;
  isTrusted: boolean;
}

export interface InputOriginAssessment {
  origin: InputOrigin;
  operationEvidence: OperationEvidence;
}

const KEYBOARD_INPUT_WINDOW_MS = 1200;
const PASTE_REFLECTION_WINDOW_MS = 300;

function isRecent(now: number, timestamp: number | undefined, windowMs: number): boolean {
  return timestamp !== undefined && now - timestamp >= 0 && now - timestamp <= windowMs;
}

export function assessInputOrigin(evidence: InputOriginEvidence): InputOriginAssessment {
  const inputType = evidence.inputType?.toLowerCase() ?? '';
  const trustedPasteEvent =
    evidence.lastPasteTrusted === true &&
    isRecent(evidence.now, evidence.lastPasteAt, PASTE_REFLECTION_WINDOW_MS);
  const trustedKeyboardEvent =
    evidence.lastKeyboardTrusted === true &&
    isRecent(evidence.now, evidence.lastKeyboardAt, KEYBOARD_INPUT_WINDOW_MS);

  if (!evidence.isTrusted) {
    return {
      origin: 'script_or_unknown_update',
      operationEvidence: 'untrusted_or_unknown',
    };
  }

  if (inputType.includes('paste') && trustedPasteEvent) {
    return {
      origin: 'paste_confirmed',
      operationEvidence: 'correlated_trusted_events',
    };
  }

  if (inputType.includes('paste')) {
    return {
      origin: 'paste_confirmed',
      operationEvidence: 'direct_trusted_event',
    };
  }

  if (trustedPasteEvent) {
    return {
      origin: 'paste_confirmed',
      operationEvidence: 'correlated_trusted_events',
    };
  }

  if (trustedKeyboardEvent) {
    return {
      origin: 'keyboard_confirmed',
      operationEvidence: 'correlated_trusted_events',
    };
  }

  if (inputType === '' || inputType === 'insertreplacementtext' || inputType === 'insertfromdrop') {
    return {
      origin: 'autofill_or_manager_suspected',
      operationEvidence: 'inferred_from_trusted_event',
    };
  }

  return {
    origin: 'unknown',
    operationEvidence: 'inferred_from_trusted_event',
  };
}

/** Backward-compatible convenience for callers that only need the origin. */
export function inferInputOrigin(evidence: InputOriginEvidence): InputOrigin {
  return assessInputOrigin(evidence).origin;
}
