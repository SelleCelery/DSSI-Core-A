import type {
  DestinationRelation,
  SubmissionDescriptor,
  SubmissionEncoding,
  SubmissionMechanism,
  SubmissionMethod,
} from './models/submission';

export interface FormSubmissionSnapshot {
  action: string;
  method: string;
  encoding: string;
  currentUrl: string;
  mechanism: SubmissionMechanism;
}

function normalizeMethod(method: string): SubmissionMethod {
  switch (method.trim().toUpperCase()) {
    case 'GET':
      return 'GET';
    case 'POST':
      return 'POST';
    case 'DIALOG':
      return 'DIALOG';
    default:
      return 'UNKNOWN';
  }
}

function normalizeEncoding(encoding: string): SubmissionEncoding {
  const normalized = encoding.trim().toLowerCase();
  if (normalized === 'application/x-www-form-urlencoded') return normalized;
  if (normalized === 'multipart/form-data') return normalized;
  if (normalized === 'text/plain') return normalized;
  return 'unknown';
}

function destinationRelation(current: URL, destination: URL): DestinationRelation {
  if (!['http:', 'https:'].includes(destination.protocol)) return 'non_http';
  return current.origin === destination.origin ? 'same_origin' : 'cross_origin';
}

export function analyzeSubmission(snapshot: FormSubmissionSnapshot): SubmissionDescriptor {
  try {
    const current = new URL(snapshot.currentUrl);
    const destination = new URL(snapshot.action || snapshot.currentUrl, current);

    return {
      method: normalizeMethod(snapshot.method),
      encoding: normalizeEncoding(snapshot.encoding),
      destinationRelation: destinationRelation(current, destination),
      destinationScheme: destination.protocol.replace(':', ''),
      destinationHost: destination.host,
      mechanism: snapshot.mechanism,
      declaredDestinationObservable: true,
    };
  } catch {
    return {
      method: normalizeMethod(snapshot.method),
      encoding: normalizeEncoding(snapshot.encoding),
      destinationRelation: 'unknown',
      destinationScheme: 'unknown',
      destinationHost: 'unknown',
      mechanism: snapshot.mechanism,
      declaredDestinationObservable: false,
    };
  }
}
