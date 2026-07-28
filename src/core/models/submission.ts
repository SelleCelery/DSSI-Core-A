export type SubmissionMethod = 'GET' | 'POST' | 'DIALOG' | 'UNKNOWN';

export type SubmissionEncoding =
  'application/x-www-form-urlencoded' | 'multipart/form-data' | 'text/plain' | 'unknown';

export type DestinationRelation = 'same_origin' | 'cross_origin' | 'non_http' | 'unknown';

export type SubmissionMechanism =
  'form_submit_event' | 'submitter_activation' | 'enter_key_candidate';

export interface SubmissionDescriptor {
  method: SubmissionMethod;
  encoding: SubmissionEncoding;
  destinationRelation: DestinationRelation;
  destinationScheme: string;
  destinationHost: string;
  mechanism: SubmissionMechanism;
  declaredDestinationObservable: boolean;
}
