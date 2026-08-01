import { describe, expect, it } from 'vitest';
import { buildCoverageManifest } from '../../src/core/coverage-manifest';

describe('coverage manifest', () => {
  it('separates observation, reduction, design refusal, current limits and unknown residual', () => {
    const entries = buildCoverageManifest({
      networkObservationEnabled: true,
      networkPermissionGranted: true,
    });
    const statuses = new Set(entries.map((entry) => entry.status));

    expect(statuses).toEqual(
      new Set([
        'observed',
        'observed_then_reduced',
        'not_observed_by_design',
        'not_observable_currently',
        'unknown_residual',
      ]),
    );
  });

  it('shows network observation as disconnected when permission is absent', () => {
    const entry = buildCoverageManifest({
      networkObservationEnabled: true,
      networkPermissionGranted: false,
    }).find((candidate) => candidate.capabilityId === 'network-metadata');

    expect(entry?.enabled).toBe(false);
    expect(entry?.permissionGranted).toBe(false);
    expect(entry?.reason).toBe('permission_boundary');
  });
});
