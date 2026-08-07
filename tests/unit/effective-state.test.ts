import { describe, expect, it } from 'vitest';
import { deriveEffectiveState } from '../../src/core/effective-state';
import { configurationFromLegacySettings } from '../../src/core/models/configuration';
import { DEFAULT_SETTINGS, settingsForObservationSelection } from '../../src/core/models/settings';

const MODES = ['standard', 'dom_only', 'paused'] as const;
const BOOLEANS = [false, true] as const;

describe('effective observation state', () => {
  for (const requestedMode of MODES) {
    for (const networkMetadataGranted of BOOLEANS) {
      for (const networkListenerRegistered of BOOLEANS) {
        it(`${requestedMode}, permission=${networkMetadataGranted}, listener=${networkListenerRegistered}`, () => {
          const legacy = settingsForObservationSelection({ ...DEFAULT_SETTINGS }, requestedMode);
          const configuration = configurationFromLegacySettings(legacy, {
            changedAt: 10,
            changedFrom: 'migration',
            revision: 'configuration-revision',
          });
          const snapshot = deriveEffectiveState(
            configuration,
            { networkMetadataGranted, networkListenerRegistered },
            { observedAt: 20, snapshotId: 'snapshot' },
          );

          const standardActive =
            requestedMode === 'standard' && networkMetadataGranted && networkListenerRegistered;
          expect(snapshot.effectiveMode).toBe(
            requestedMode === 'paused' ? 'paused' : standardActive ? 'standard' : 'dom_only',
          );

          const expectedConfirmed =
            requestedMode === 'standard'
              ? networkMetadataGranted && networkListenerRegistered
              : !networkMetadataGranted && !networkListenerRegistered;
          expect(snapshot.transitionStatus).toBe(expectedConfirmed ? 'confirmed' : 'degraded');
          expect(snapshot.configurationRevision).toBe('configuration-revision');
        });
      }
    }
  }

  it('reports requested standard separately from permission-limited DOM-only operation', () => {
    const configuration = configurationFromLegacySettings(
      settingsForObservationSelection({ ...DEFAULT_SETTINGS }, 'standard'),
      { changedAt: 10, revision: 'configuration-revision' },
    );
    const snapshot = deriveEffectiveState(
      configuration,
      { networkMetadataGranted: false, networkListenerRegistered: false },
      { observedAt: 20, snapshotId: 'snapshot' },
    );

    expect(snapshot).toMatchObject({
      requestedMode: 'standard',
      effectiveMode: 'dom_only',
      transitionStatus: 'degraded',
      discrepancies: [
        { code: 'network_permission_missing', scope: 'permission' },
        { code: 'network_listener_missing', scope: 'background' },
      ],
    });
  });
});
