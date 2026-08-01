import { describe, expect, it } from 'vitest';
import {
  communicationPulseAriaLabel,
  communicationPulseFromNetwork,
  communicationPulseFromSubmission,
  communicationPulseMethodGlyph,
} from '../../src/core/communication-pulse';

describe('communication pulse descriptors', () => {
  it('reduces a network record to visual metadata without body content', () => {
    const pulse = communicationPulseFromNetwork({
      method: 'POST',
      destinationRelation: 'cross_origin',
      destinationScheme: 'https',
      destinationHost: 'example.test',
      mechanism: 'fetch_or_xhr',
      correlation: 'recent_content_edit',
      payloadObservation: 'not_requested',
      cookieHeaderDetection: 'detected',
      pageObservationTiming: 'after_5s_of_page_observation',
    });

    expect(pulse).toEqual({
      kind: 'fetch_or_xhr',
      method: 'POST',
      cookieState: 'detected',
      destinationRelation: 'cross_origin',
      bodyObservation: 'not_observed',
    });
    expect(communicationPulseAriaLabel(pulse)).toContain('本文未観測');
  });

  it('marks standard form submit as a DOM boundary without a cookie claim', () => {
    expect(
      communicationPulseFromSubmission({
        method: 'GET',
        encoding: 'application/x-www-form-urlencoded',
        destinationRelation: 'same_origin',
        destinationScheme: 'https',
        destinationHost: 'example.test',
        mechanism: 'form_submit_event',
        declaredDestinationObservable: true,
        association: 'correlated_submit_event',
      }),
    ).toEqual({
      kind: 'dom_submit',
      method: 'GET',
      cookieState: 'not_applicable',
      destinationRelation: 'same_origin',
      bodyObservation: 'not_observed',
    });
  });

  it('uses compact method glyphs without safety semantics', () => {
    expect(communicationPulseMethodGlyph('GET')).toBe('G');
    expect(communicationPulseMethodGlyph('POST')).toBe('P');
    expect(communicationPulseMethodGlyph('UNKNOWN')).toBe('·');
  });
});
