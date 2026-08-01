import type { CookieHeaderDetection, NetworkDescriptor, NetworkMethod } from './models/network';
import type { SubmissionDescriptor, SubmissionMethod } from './models/submission';

export type CommunicationPulseKind = 'dom_submit' | 'fetch_or_xhr' | 'beacon_or_ping';
export type CommunicationPulseMethod = NetworkMethod | SubmissionMethod;
export type CommunicationPulseCookieState = CookieHeaderDetection | 'not_applicable';
export type CommunicationPulseObservationRoute = 'dom' | 'web_request';
export type CommunicationPulseMethodShape =
  | 'circle'
  | 'square'
  | 'diamond'
  | 'hexagon'
  | 'triangle'
  | 'capsule'
  | 'octagon'
  | 'double_ring'
  | 'vertical_rect'
  | 'dialog'
  | 'unknown';

export interface CommunicationPulseDescriptor {
  kind: CommunicationPulseKind;
  method: CommunicationPulseMethod;
  cookieState: CommunicationPulseCookieState;
  destinationRelation: NetworkDescriptor['destinationRelation'];
  bodyObservation: 'not_observed';
}

export function communicationPulseFromNetwork(
  descriptor: NetworkDescriptor,
): CommunicationPulseDescriptor {
  return {
    kind: descriptor.mechanism,
    method: descriptor.method,
    cookieState: descriptor.cookieHeaderDetection,
    destinationRelation: descriptor.destinationRelation,
    bodyObservation: 'not_observed',
  };
}

export function communicationPulseFromSubmission(
  descriptor: SubmissionDescriptor,
): CommunicationPulseDescriptor {
  return {
    kind: 'dom_submit',
    method: descriptor.method,
    cookieState: 'not_applicable',
    destinationRelation: descriptor.destinationRelation,
    bodyObservation: 'not_observed',
  };
}

/**
 * Center glyphs identify the communication mechanism. The HTTP method is
 * carried by the outer geometry instead of another letter.
 */
export function communicationPulseKindGlyph(kind: CommunicationPulseKind): string {
  switch (kind) {
    case 'dom_submit':
      return 'S';
    case 'fetch_or_xhr':
      return 'F';
    case 'beacon_or_ping':
      return 'B';
  }
}

export function communicationPulseObservationRoute(
  kind: CommunicationPulseKind,
): CommunicationPulseObservationRoute {
  return kind === 'dom_submit' ? 'dom' : 'web_request';
}

export function communicationPulseMethodShape(
  method: CommunicationPulseMethod,
): CommunicationPulseMethodShape {
  switch (method) {
    case 'GET':
      return 'circle';
    case 'POST':
      return 'square';
    case 'PUT':
      return 'diamond';
    case 'PATCH':
      return 'hexagon';
    case 'DELETE':
      return 'triangle';
    case 'HEAD':
      return 'capsule';
    case 'OPTIONS':
      return 'octagon';
    case 'CONNECT':
      return 'double_ring';
    case 'TRACE':
      return 'vertical_rect';
    case 'DIALOG':
      return 'dialog';
    case 'UNKNOWN':
      return 'unknown';
  }
}

/**
 * Compact top-right marker. `not_detected` is not proof of Cookie absence;
 * it only reports that the header name was not found in Chrome's exposed set.
 */
export function communicationPulseCookieGlyph(state: CommunicationPulseCookieState): string {
  switch (state) {
    case 'detected':
      return '●';
    case 'not_detected':
      return '−';
    case 'not_observed':
      return '·';
    case 'unavailable':
      return '?';
    case 'not_applicable':
      return '';
  }
}

export function communicationPulseKindLabel(kind: CommunicationPulseKind): string {
  switch (kind) {
    case 'dom_submit':
      return 'DOM上の標準form送信境界';
    case 'fetch_or_xhr':
      return 'webRequestで観測したfetch/XHR系通信';
    case 'beacon_or_ping':
      return 'webRequestで観測したBeacon/Ping系通信';
  }
}

export function communicationPulseCookieLabel(state: CommunicationPulseCookieState): string {
  switch (state) {
    case 'detected':
      return 'Cookieヘッダー名を検出';
    case 'not_detected':
      return 'Cookieヘッダー名は観測範囲内で未検出';
    case 'not_observed':
      return 'Cookieヘッダーは未観測';
    case 'unavailable':
      return 'Cookieヘッダーは判定不能';
    case 'not_applicable':
      return 'DOM観測のためCookieヘッダー判定なし';
  }
}

export function communicationPulseDestinationLabel(
  relation: CommunicationPulseDescriptor['destinationRelation'],
): string {
  switch (relation) {
    case 'same_origin':
      return '同一オリジン';
    case 'cross_origin':
      return '別オリジン';
    case 'non_http':
      return 'HTTP以外';
    case 'unknown':
      return '通信先関係不明';
  }
}

export function communicationPulseAriaLabel(descriptor: CommunicationPulseDescriptor): string {
  return [
    communicationPulseKindLabel(descriptor.kind),
    descriptor.method,
    communicationPulseDestinationLabel(descriptor.destinationRelation),
    communicationPulseCookieLabel(descriptor.cookieState),
    '本文未観測',
  ].join('、');
}
