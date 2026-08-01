import type { CookieHeaderDetection, NetworkDescriptor, NetworkMethod } from './models/network';
import type { SubmissionDescriptor, SubmissionMethod } from './models/submission';

export type CommunicationPulseKind = 'dom_submit' | 'fetch_or_xhr' | 'beacon_or_ping';
export type CommunicationPulseMethod = NetworkMethod | SubmissionMethod;
export type CommunicationPulseCookieState = CookieHeaderDetection | 'not_applicable';

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

export function communicationPulseMethodGlyph(method: CommunicationPulseMethod): string {
  switch (method) {
    case 'GET':
      return 'G';
    case 'POST':
      return 'P';
    case 'PUT':
      return 'U';
    case 'PATCH':
      return 'A';
    case 'DELETE':
      return 'D';
    case 'HEAD':
      return 'H';
    case 'OPTIONS':
      return 'O';
    case 'CONNECT':
      return 'C';
    case 'TRACE':
      return 'T';
    case 'DIALOG':
      return 'L';
    case 'UNKNOWN':
      return '·';
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
