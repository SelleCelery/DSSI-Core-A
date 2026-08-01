import type {
  CookieHeaderDetection,
  NetworkCorrelation,
  NetworkDescriptor,
  NetworkMechanism,
  NetworkMethod,
  PageObservationTiming,
} from './models/network';
import type { DestinationRelation } from './models/submission';

export interface NetworkRequestSnapshot {
  requestUrl: string;
  method: string;
  initiator?: string;
  resourceType: string;
  correlation?: NetworkCorrelation;
  cookieHeaderDetection?: CookieHeaderDetection;
  pageObservationTiming?: PageObservationTiming;
}

function normalizeMethod(method: string): NetworkMethod {
  switch (method.trim().toUpperCase()) {
    case 'GET':
    case 'POST':
    case 'PUT':
    case 'PATCH':
    case 'DELETE':
    case 'HEAD':
    case 'OPTIONS':
    case 'CONNECT':
    case 'TRACE':
      return method.trim().toUpperCase() as NetworkMethod;
    default:
      return 'UNKNOWN';
  }
}

function normalizeMechanism(resourceType: string): NetworkMechanism | undefined {
  if (resourceType === 'xmlhttprequest') return 'fetch_or_xhr';
  if (resourceType === 'ping') return 'beacon_or_ping';
  return undefined;
}

function relationFor(destination: URL, initiator: string | undefined): DestinationRelation {
  if (!['http:', 'https:'].includes(destination.protocol)) return 'non_http';
  if (!initiator) return 'unknown';

  try {
    const source = new URL(initiator);
    if (!['http:', 'https:'].includes(source.protocol)) return 'unknown';
    return source.origin === destination.origin ? 'same_origin' : 'cross_origin';
  } catch {
    return 'unknown';
  }
}

function observationContext(
  snapshot: NetworkRequestSnapshot,
): Pick<NetworkDescriptor, 'cookieHeaderDetection' | 'pageObservationTiming' | 'correlation'> {
  return {
    correlation: snapshot.correlation ?? 'recent_content_edit',
    cookieHeaderDetection: snapshot.cookieHeaderDetection ?? 'not_observed',
    pageObservationTiming: snapshot.pageObservationTiming ?? 'unknown',
  };
}

/**
 * Converts a raw browser request URL into the minimum metadata DSSI may retain.
 * Path, query, fragment, credentials, header values and request body are not returned.
 */
export function analyzeNetworkRequest(
  snapshot: NetworkRequestSnapshot,
): NetworkDescriptor | undefined {
  const mechanism = normalizeMechanism(snapshot.resourceType);
  if (!mechanism) return undefined;

  const context = observationContext(snapshot);

  try {
    const destination = new URL(snapshot.requestUrl);
    return {
      method: normalizeMethod(snapshot.method),
      destinationRelation: relationFor(destination, snapshot.initiator),
      destinationScheme: destination.protocol.replace(':', ''),
      destinationHost: destination.host || 'unknown',
      mechanism,
      payloadObservation: 'not_requested',
      ...context,
    };
  } catch {
    return {
      method: normalizeMethod(snapshot.method),
      destinationRelation: 'unknown',
      destinationScheme: 'unknown',
      destinationHost: 'unknown',
      mechanism,
      payloadObservation: 'not_requested',
      ...context,
    };
  }
}
