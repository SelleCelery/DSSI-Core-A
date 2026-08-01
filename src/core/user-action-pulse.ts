import type { UserActionPulse, UserActionType } from './models/network';

const ACTION_TYPES: ReadonlySet<UserActionType> = new Set([
  'form_submit',
  'submit_control',
  'enter_candidate',
]);

function isHostLike(value: unknown): value is string {
  return (
    typeof value === 'string' && value.length > 0 && value.length <= 253 && !/[/?#@\s]/u.test(value)
  );
}

/**
 * Validates the transient standard-form-operation-to-network correlation message.
 * The pulse is never persisted and must remain a closed metadata-only shape.
 */
export function isPrivacySafeUserActionPulse(value: unknown): value is UserActionPulse {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;

  const allowedKeys = new Set([
    'sessionId',
    'domainKey',
    'viscosityLevel',
    'actionType',
    'observedAt',
  ]);
  if (Object.keys(value).some((key) => !allowedKeys.has(key))) return false;

  const pulse = value as Partial<UserActionPulse>;
  return (
    typeof pulse.sessionId === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(
      pulse.sessionId,
    ) &&
    isHostLike(pulse.domainKey) &&
    typeof pulse.observedAt === 'number' &&
    Number.isFinite(pulse.observedAt) &&
    pulse.observedAt >= 0 &&
    (pulse.viscosityLevel === 1 || pulse.viscosityLevel === 2 || pulse.viscosityLevel === 3) &&
    typeof pulse.actionType === 'string' &&
    ACTION_TYPES.has(pulse.actionType)
  );
}
