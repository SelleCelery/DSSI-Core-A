import { describe, expect, it } from 'vitest';
import { analyzeSubmission } from '../../src/core/submission-analyzer';

describe('submission analyzer', () => {
  it('classifies a same-origin POST form without retaining query values', () => {
    expect(
      analyzeSubmission({
        action: '/submit?token=secret',
        method: 'post',
        encoding: 'multipart/form-data',
        currentUrl: 'https://example.test/form',
        mechanism: 'form_submit_event',
      }),
    ).toEqual({
      method: 'POST',
      encoding: 'multipart/form-data',
      destinationRelation: 'same_origin',
      destinationScheme: 'https',
      destinationHost: 'example.test',
      mechanism: 'form_submit_event',
      declaredDestinationObservable: true,
    });
  });

  it('classifies a cross-origin destination', () => {
    expect(
      analyzeSubmission({
        action: 'https://receiver.test/intake',
        method: 'get',
        encoding: 'application/x-www-form-urlencoded',
        currentUrl: 'https://example.test/form',
        mechanism: 'submitter_activation',
      }).destinationRelation,
    ).toBe('cross_origin');
  });

  it('marks non-http destinations separately', () => {
    expect(
      analyzeSubmission({
        action: 'mailto:test@example.test',
        method: 'post',
        encoding: 'text/plain',
        currentUrl: 'https://example.test/form',
        mechanism: 'form_submit_event',
      }).destinationRelation,
    ).toBe('non_http');
  });

  it('falls back without throwing for an invalid current URL', () => {
    expect(
      analyzeSubmission({
        action: '/submit',
        method: 'custom',
        encoding: 'custom',
        currentUrl: 'not a url',
        mechanism: 'enter_key_candidate',
      }),
    ).toMatchObject({
      method: 'UNKNOWN',
      encoding: 'unknown',
      destinationRelation: 'unknown',
      declaredDestinationObservable: false,
    });
  });
});
