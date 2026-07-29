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

export type NetworkCorrelation = 'recent_input_activity';

export type NetworkPayloadObservation = 'not_requested';

export interface NetworkDescriptor {
  method: NetworkMethod;
  destinationRelation: DestinationRelation;
  destinationScheme: string;
  destinationHost: string;
  mechanism: NetworkMechanism;
  correlation: NetworkCorrelation;
  payloadObservation: NetworkPayloadObservation;
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
}
