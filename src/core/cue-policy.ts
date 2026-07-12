import type { SurfaceType } from './models/observation';
import type { ViscosityLevel } from './models/settings';

const SILENT_MODE_VISIBLE_SURFACES: ReadonlySet<SurfaceType> = new Set(['password', 'payment']);

export function shouldPresentCue(
  viscosityLevel: ViscosityLevel,
  surfaceType: SurfaceType,
): boolean {
  if (viscosityLevel === 1) {
    return SILENT_MODE_VISIBLE_SURFACES.has(surfaceType);
  }

  if (viscosityLevel === 2) {
    return surfaceType !== 'unknown' && surfaceType !== 'page';
  }

  return surfaceType !== 'page';
}
