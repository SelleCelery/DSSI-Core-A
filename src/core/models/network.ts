import type { DestinationRelation } from './submission';
import type { ClassificationConfidence, SurfaceType } from './observation';
import type { ViscosityLevel } from './settings';

export type NetworkMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'HEAD'
  | 'OPTIONS'
  | 'CONNECT'
  | 'TRACE'
  | 'UNKNOWN';

export type NetworkMechanism = 'fetch_or_xhr' | 'beacon_or_ping';

export type NetworkCorrelation = 'recent_input_activity' | 'recent_content_edit';

export type NetworkPayloadObservation = 'not_requested';

/**
 * Detection result for the Cookie request-header name.
 * `not_detected` means only that the header name was not present in the
 * header set Chrome exposed to DSSI. It is not proof that no cookie existed.
 */
export type CookieHeaderDetection = 'detected' | 'not_detected' | 'not_observed' | 'unavailable';

/**
 * Neutral relation to DSSI's own page-observation start, not a claim about
 * page initialization, authentication, or application intent.
 */
export type PageObservationTiming =
  'within_5s_of_page_observation' | 'after_5s_of_page_observation' | 'unknown';

export interface NetworkDescriptor {
  method: NetworkMethod;
  destinationRelation: DestinationRelation;
  destinationScheme: string;
  destinationHost: string;
  mechanism: NetworkMechanism;
  correlation: NetworkCorrelation;
  payloadObservation: NetworkPayloadObservation;
  cookieHeaderDetection: CookieHeaderDetection;
  pageObservationTiming: PageObservationTiming;
}

/**
 * Ephemeral metadata used only to correlate a later browser network event.
 * It must never be written to the session log directly.
 */
export interface InputActivityPulse {
  sessionId: string;
  domainKey: string;
  surfaceType: SurfaceType;
  classificationConfidence: ClassificationConfidence;
  viscosityLevel: ViscosityLevel;
  /** Wall-clock time assigned in the content script when the trusted edit was observed. */
  observedAt: number;
}
