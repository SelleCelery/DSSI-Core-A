import { describe, expect, it } from 'vitest';
import { analyzeNetworkRequest } from '../../src/core/network-analyzer';

describe('network analyzer', () => {
  it('reduces fetch/XHR metadata to method, relation, scheme and host', () => {
    expect(
      analyzeNetworkRequest({
        requestUrl: 'https://api.example.test/v1/messages?token=secret#fragment',
        method: 'post',
        initiator: 'https://app.example.test',
        resourceType: 'xmlhttprequest',
      }),
    ).toEqual({
      method: 'POST',
      destinationRelation: 'cross_origin',
      destinationScheme: 'https',
      destinationHost: 'api.example.test',
      mechanism: 'fetch_or_xhr',
      correlation: 'recent_content_edit',
      payloadObservation: 'not_requested',
      cookieHeaderDetection: 'not_observed',
      pageObservationTiming: 'unknown',
    });
  });

  it('recognizes same-origin requests without retaining path or query', () => {
    const result = analyzeNetworkRequest({
      requestUrl: 'https://example.test/private/path?account=123',
      method: 'GET',
      initiator: 'https://example.test/editor',
      resourceType: 'xmlhttprequest',
    });

    expect(result?.destinationRelation).toBe('same_origin');
    expect(result?.destinationHost).toBe('example.test');
    expect(JSON.stringify(result)).not.toContain('/private/path');
    expect(JSON.stringify(result)).not.toContain('account=123');
  });

  it('maps ping requests without reading a body', () => {
    expect(
      analyzeNetworkRequest({
        requestUrl: 'https://metrics.example.test/collect',
        method: 'POST',
        initiator: 'https://example.test',
        resourceType: 'ping',
      }),
    ).toMatchObject({
      mechanism: 'beacon_or_ping',
      payloadObservation: 'not_requested',
      cookieHeaderDetection: 'not_observed',
      pageObservationTiming: 'unknown',
    });
  });

  it('ignores resource types outside the Sprint 3 scope', () => {
    expect(
      analyzeNetworkRequest({
        requestUrl: 'https://example.test/image.png',
        method: 'GET',
        initiator: 'https://example.test',
        resourceType: 'image',
      }),
    ).toBeUndefined();
  });

  it('returns unknown destination metadata for an invalid URL', () => {
    expect(
      analyzeNetworkRequest({
        requestUrl: 'not a url',
        method: 'CUSTOM',
        resourceType: 'xmlhttprequest',
      }),
    ).toEqual({
      method: 'UNKNOWN',
      destinationRelation: 'unknown',
      destinationScheme: 'unknown',
      destinationHost: 'unknown',
      mechanism: 'fetch_or_xhr',
      correlation: 'recent_content_edit',
      payloadObservation: 'not_requested',
      cookieHeaderDetection: 'not_observed',
      pageObservationTiming: 'unknown',
    });
  });
  it('retains only the closed Cookie detection state and neutral page timing category', () => {
    expect(
      analyzeNetworkRequest({
        requestUrl: 'https://example.test/private?secret=1',
        method: 'POST',
        initiator: 'https://example.test',
        resourceType: 'xmlhttprequest',
        cookieHeaderDetection: 'detected',
        pageObservationTiming: 'within_5s_of_page_observation',
      }),
    ).toMatchObject({
      cookieHeaderDetection: 'detected',
      pageObservationTiming: 'within_5s_of_page_observation',
    });
  });

  it('retains only the supplied closed correlation category', () => {
    expect(
      analyzeNetworkRequest({
        requestUrl: 'https://example.test/api',
        method: 'POST',
        initiator: 'https://example.test',
        resourceType: 'xmlhttprequest',
        correlation: 'no_correlated_user_operation',
      }),
    ).toMatchObject({ correlation: 'no_correlated_user_operation' });
  });
});
