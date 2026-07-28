export type SubmissionMethod = 'GET' | 'POST' | 'DIALOG' | 'UNKNOWN';

export type SubmissionEncoding =
  'application/x-www-form-urlencoded' | 'multipart/form-data' | 'text/plain' | 'unknown';

export type DestinationRelation = 'same_origin' | 'cross_origin' | 'non_http' | 'unknown';

export type SubmissionMechanism =
  'form_submit_event' | 'submitter_activation' | 'enter_key_candidate';

/**
 * How strongly a UI action was connected to a later submit event.
 * This does not assert that a network request was sent or received.
 */
export type SubmissionAssociation =
  | 'declared_submit_control'
  | 'enter_key_candidate'
  | 'correlated_submit_event'
  | 'submit_event_without_prior_candidate';

export interface SubmissionDescriptor {
  method: SubmissionMethod;
  encoding: SubmissionEncoding;
  destinationRelation: DestinationRelation;
  destinationScheme: string;
  destinationHost: string;
  mechanism: SubmissionMechanism;
  declaredDestinationObservable: boolean;
  association: SubmissionAssociation;
}
