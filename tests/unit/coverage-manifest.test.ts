import { describe, expect, it } from 'vitest';
import { buildCoverageManifest } from '../../src/core/coverage-manifest';

describe('coverage manifest', () => {
  it('separates observation, reduction, design refusal, current limits and unknown residual', () => {
    const entries = buildCoverageManifest({
      observationEnabled: true,
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
      observationEnabled: true,
      networkObservationEnabled: true,
      networkPermissionGranted: false,
    }).find((candidate) => candidate.capabilityId === 'network-metadata');

    expect(entry?.enabled).toBe(false);
    expect(entry?.permissionGranted).toBe(false);
    expect(entry?.reason).toBe('permission_boundary');
  });

  it('shows DOM and network observation as paused by user selection', () => {
    const entries = buildCoverageManifest({
      observationEnabled: false,
      networkObservationEnabled: false,
      networkPermissionGranted: false,
    });
    const dom = entries.find((candidate) => candidate.capabilityId === 'trusted-dom-events');
    const network = entries.find((candidate) => candidate.capabilityId === 'network-metadata');

    expect(dom).toMatchObject({
      status: 'not_observed_currently',
      reason: 'user_selection',
      enabled: false,
    });
    expect(network).toMatchObject({
      status: 'not_observed_currently',
      reason: 'user_selection',
      enabled: false,
    });
  });
});
