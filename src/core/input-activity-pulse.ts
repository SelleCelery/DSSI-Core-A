import type { InputActivityPulse } from './models/network';
import type { ClassificationConfidence, SurfaceType } from './models/observation';

const SURFACE_TYPES = new Set<SurfaceType>([
  'page',
  'password',
  'email_or_id',
  'payment',
  'personal_information',
  'free_text',
  'ai_prompt',
  'comment',
  'chat',
  'webmail',
  'cloud_editor',
  'consent',
  'download_link',
  'external_navigation',
  'unknown',
]);

const CLASSIFICATION_CONFIDENCE = new Set<ClassificationConfidence>([
  'explicit',
  'heuristic',
  'generic',
  'unknown',
]);

function isHostLike(value: unknown): value is string {
  return (
    typeof value === 'string' && value.length > 0 && value.length <= 253 && !/[/?#@\s]/u.test(value)
  );
}

/**
 * Validates the transient input-to-network correlation message.
 * This message is never persisted, but it still uses a closed metadata shape.
 */
export function isPrivacySafeInputActivityPulse(value: unknown): value is InputActivityPulse {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;

  const entries = Object.entries(value);
  const allowedKeys = new Set([
    'sessionId',
    'domainKey',
    'surfaceType',
    'classificationConfidence',
    'viscosityLevel',
    'observedAt',
  ]);
  if (entries.some(([key]) => !allowedKeys.has(key))) return false;

  const candidate = value as Partial<InputActivityPulse>;
  return (
    typeof candidate.sessionId === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(
      candidate.sessionId,
    ) &&
    isHostLike(candidate.domainKey) &&
    SURFACE_TYPES.has(candidate.surfaceType as SurfaceType) &&
    CLASSIFICATION_CONFIDENCE.has(candidate.classificationConfidence as ClassificationConfidence) &&
    [1, 2, 3].includes(candidate.viscosityLevel ?? 0) &&
    typeof candidate.observedAt === 'number' &&
    Number.isFinite(candidate.observedAt) &&
    candidate.observedAt >= 0
  );
}
