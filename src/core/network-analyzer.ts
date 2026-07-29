import type { NetworkDescriptor, NetworkMechanism, NetworkMethod } from './models/network';
import type { DestinationRelation } from './models/submission';

export interface NetworkRequestSnapshot {
  requestUrl: string;
  method: string;
  initiator?: string;
  resourceType: string;
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

/**
 * Converts a raw browser request URL into the minimum metadata DSSI may retain.
 * Path, query, fragment, credentials, headers and request body are not returned.
 */
export function analyzeNetworkRequest(
  snapshot: NetworkRequestSnapshot,
): NetworkDescriptor | undefined {
  const mechanism = normalizeMechanism(snapshot.resourceType);
  if (!mechanism) return undefined;

  try {
    const destination = new URL(snapshot.requestUrl);
    return {
      method: normalizeMethod(snapshot.method),
      destinationRelation: relationFor(destination, snapshot.initiator),
      destinationScheme: destination.protocol.replace(':', ''),
      destinationHost: destination.host || 'unknown',
      mechanism,
      correlation: 'recent_input_activity',
      payloadObservation: 'not_requested',
    };
  } catch {
    return {
      method: normalizeMethod(snapshot.method),
      destinationRelation: 'unknown',
      destinationScheme: 'unknown',
      destinationHost: 'unknown',
      mechanism,
      correlation: 'recent_input_activity',
      payloadObservation: 'not_requested',
    };
  }
}
