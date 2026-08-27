import type { UiLanguage } from '../i18n/ui';
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

export function communicationPulseKindLabel(
  kind: CommunicationPulseKind,
  language: UiLanguage = 'ja',
): string {
  switch (kind) {
    case 'dom_submit':
      return language === 'ja'
        ? 'DOM上の標準form送信境界'
        : 'Standard-form submission boundary observed in the DOM';
    case 'fetch_or_xhr':
      return language === 'ja'
        ? 'webRequestで観測したfetch/XHR系通信'
        : 'fetch/XHR request observed through webRequest';
    case 'beacon_or_ping':
      return language === 'ja'
        ? 'webRequestで観測したBeacon/Ping系通信'
        : 'Beacon/Ping request observed through webRequest';
  }
}

export function communicationPulseCookieLabel(
  state: CommunicationPulseCookieState,
  language: UiLanguage = 'ja',
): string {
  switch (state) {
    case 'detected':
      return language === 'ja'
        ? 'Cookieヘッダーの存在を検出。値は未取得'
        : 'Cookie header presence detected; values not collected';
    case 'not_detected':
      return language === 'ja'
        ? 'Cookieヘッダーは観測範囲内で未検出。不在の証明ではない'
        : 'Cookie header not detected in the observed set; not proof of absence';
    case 'not_observed':
      return language === 'ja' ? 'Cookieヘッダーは未観測' : 'Cookie header not observed';
    case 'unavailable':
      return language === 'ja' ? 'Cookieヘッダーは判定不能' : 'Cookie-header state unavailable';
    case 'not_applicable':
      return language === 'ja'
        ? 'DOM観測のためCookieヘッダー判定なし'
        : 'Cookie-header state not applicable to DOM observation';
  }
}

export function communicationPulseDestinationLabel(
  relation: CommunicationPulseDescriptor['destinationRelation'],
  language: UiLanguage = 'ja',
): string {
  switch (relation) {
    case 'same_origin':
      return language === 'ja' ? '同一オリジン' : 'Same origin';
    case 'cross_origin':
      return language === 'ja' ? '別オリジン' : 'Cross origin';
    case 'non_http':
      return language === 'ja' ? 'HTTP以外' : 'Non-HTTP';
    case 'unknown':
      return language === 'ja' ? '通信先関係不明' : 'Destination relation unknown';
  }
}

export function communicationPulseAriaLabel(
  descriptor: CommunicationPulseDescriptor,
  language: UiLanguage = 'ja',
): string {
  const separator = language === 'ja' ? '、' : ', ';
  return [
    communicationPulseKindLabel(descriptor.kind, language),
    descriptor.method,
    communicationPulseDestinationLabel(descriptor.destinationRelation, language),
    communicationPulseCookieLabel(descriptor.cookieState, language),
    language === 'ja'
      ? 'ConnectBitsでは通信本文を観測対象としていない'
      : "Network payload is outside ConnectBits' observation scope",
  ].join(separator);
}
