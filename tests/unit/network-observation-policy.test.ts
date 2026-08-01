import { describe, expect, it } from 'vitest';
import {
  NETWORK_DATA_POLICY,
  NETWORK_REQUEST_HEADER_EXTRA_INFO_SPEC,
  NETWORK_RESOURCE_TYPES,
} from '../../src/core/network-observation-policy';

describe('network observation policy', () => {
  it('requests no body and limits header handling to transient Cookie-name detection', () => {
    expect(NETWORK_REQUEST_HEADER_EXTRA_INFO_SPEC).toEqual(['requestHeaders', 'extraHeaders']);
    expect(NETWORK_DATA_POLICY).toEqual({
      requestBody: 'not_requested',
      requestHeaders: 'transient_name_inspection_only',
      requestHeaderValues: 'not_accessed_or_retained_by_dssi_logic',
      responseHeaders: 'not_requested',
      responseBody: 'not_observable',
      rawUrlPersistence: 'prohibited',
      retainedLocator: 'scheme_and_host_only',
      cookieRetention: 'detection_state_only',
    });
  });

  it('limits Sprint 3.1 to fetch/XHR and Beacon/Ping request classes', () => {
    expect(NETWORK_RESOURCE_TYPES).toEqual(['xmlhttprequest', 'ping']);
  });
});
