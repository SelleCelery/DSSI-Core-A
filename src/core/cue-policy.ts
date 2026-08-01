import type { SurfaceType } from './models/observation';
import type { ViscosityLevel } from './models/settings';

const LEVEL_2_SENSITIVE_FOCUS_SURFACES: ReadonlySet<SurfaceType> = new Set([
  'password',
  'payment',
  'personal_information',
]);

/**
 * Focus is a transient awareness cue, not an activity-log fact and not a
 * network-correlation pulse. Level 3 shows all input-surface focus cues;
 * Level 2 shows only sensitive surfaces; Level 1 stays silent.
 */
export function shouldPresentFocusCue(
  viscosityLevel: ViscosityLevel,
  surfaceType: SurfaceType,
): boolean {
  if (viscosityLevel === 3) return surfaceType !== 'page';
  if (viscosityLevel === 2) return LEVEL_2_SENSITIVE_FOCUS_SURFACES.has(surfaceType);
  return false;
}
