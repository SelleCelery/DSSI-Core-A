import { describe, expect, it } from 'vitest';
import {
  communicationPulseAriaLabel,
  communicationPulseCookieGlyph,
  communicationPulseFromNetwork,
  communicationPulseFromSubmission,
  communicationPulseKindGlyph,
  communicationPulseMethodShape,
  communicationPulseObservationRoute,
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

  it('uses outer geometry for method and center text for mechanism', () => {
    expect(communicationPulseMethodShape('GET')).toBe('circle');
    expect(communicationPulseMethodShape('POST')).toBe('square');
    expect(communicationPulseMethodShape('PUT')).toBe('diamond');
    expect(communicationPulseMethodShape('PATCH')).toBe('hexagon');
    expect(communicationPulseMethodShape('DELETE')).toBe('triangle');
    expect(communicationPulseMethodShape('UNKNOWN')).toBe('unknown');

    expect(communicationPulseKindGlyph('dom_submit')).toBe('S');
    expect(communicationPulseKindGlyph('fetch_or_xhr')).toBe('F');
    expect(communicationPulseKindGlyph('beacon_or_ping')).toBe('B');
    expect(communicationPulseObservationRoute('dom_submit')).toBe('dom');
    expect(communicationPulseObservationRoute('fetch_or_xhr')).toBe('web_request');
  });

  it('uses explicit cookie markers without claiming absence', () => {
    expect(communicationPulseCookieGlyph('detected')).toBe('●');
    expect(communicationPulseCookieGlyph('not_detected')).toBe('−');
    expect(communicationPulseCookieGlyph('not_observed')).toBe('·');
    expect(communicationPulseCookieGlyph('unavailable')).toBe('?');
    expect(communicationPulseCookieGlyph('not_applicable')).toBe('');
  });
});
