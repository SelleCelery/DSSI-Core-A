import { describe, expect, it } from 'vitest';
import {
  NETWORK_DATA_POLICY,
  NETWORK_EXTRA_INFO_SPEC,
  NETWORK_RESOURCE_TYPES,
} from '../../src/core/network-observation-policy';

describe('network observation policy', () => {
  it('does not request request bodies or headers', () => {
    expect(NETWORK_EXTRA_INFO_SPEC).toEqual([]);
    expect(NETWORK_DATA_POLICY).toEqual({
      requestBody: 'not_requested',
      requestHeaders: 'not_requested',
      responseHeaders: 'not_requested',
      responseBody: 'not_observable',
      rawUrlPersistence: 'prohibited',
      retainedLocator: 'scheme_and_host_only',
    });
  });

  it('limits Sprint 3 to fetch/XHR and Beacon/Ping request classes', () => {
    expect(NETWORK_RESOURCE_TYPES).toEqual(['xmlhttprequest', 'ping']);
  });
});
