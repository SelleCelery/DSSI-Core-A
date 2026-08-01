import type {
  ClassificationConfidence,
  InputOrigin,
  ObservationLogRecord,
  ObservationScope,
  OperationEvidence,
  SurfaceType,
  LogLayer,
  TriggerType,
} from './models/observation';
import type { SafeInputSurfaceStructure } from './models/input-surface';
import type { NetworkDescriptor } from './models/network';
import type { SubmissionDescriptor } from './models/submission';
import type { ViscosityLevel } from './models/settings';

export interface ObservationFactoryContext {
  sessionId: string;
  domainKey: string;
  viscosityLevel: ViscosityLevel;
}

export interface ObservationRecordInput {
  surfaceType: SurfaceType;
  triggerType: TriggerType;
  observationScope: ObservationScope;
  operationEvidence: OperationEvidence;
  cuePresented: boolean;
  inputOrigin?: InputOrigin;
  classificationConfidence?: ClassificationConfidence;
  submission?: SubmissionDescriptor;
  network?: NetworkDescriptor;
  logLayer?: LogLayer;
  surfaceStructure?: SafeInputSurfaceStructure;
}

export function createObservationRecord(
  context: ObservationFactoryContext,
  input: ObservationRecordInput,
): ObservationLogRecord {
  const record: ObservationLogRecord = {
    schemaVersion: 9,
    eventId: crypto.randomUUID(),
    timestamp: Date.now(),
    sessionId: context.sessionId,
    domainKey: context.domainKey,
    logLayer: input.logLayer ?? 'activity',
    surfaceType: input.surfaceType,
    triggerType: input.triggerType,
    observationScope: input.observationScope,
    operationEvidence: input.operationEvidence,
    viscosityLevel: context.viscosityLevel,
    cuePresented: input.cuePresented,
  };

  if (input.inputOrigin !== undefined) {
    record.inputOrigin = input.inputOrigin;
  }

  if (input.classificationConfidence !== undefined) {
    record.classificationConfidence = input.classificationConfidence;
  }

  if (input.surfaceStructure !== undefined) {
    record.surfaceTagName = input.surfaceStructure.tagName;
    record.surfaceInputType = input.surfaceStructure.inputType;
    record.surfaceRole = input.surfaceStructure.role;
    record.surfaceIsContentEditable = input.surfaceStructure.isContentEditable;
    record.surfaceAutocompleteTokens = [...input.surfaceStructure.autocompleteTokens];
  }

  if (input.submission !== undefined) {
    record.submissionMethod = input.submission.method;
    record.submissionEncoding = input.submission.encoding;
    record.destinationRelation = input.submission.destinationRelation;
    record.destinationScheme = input.submission.destinationScheme;
    record.destinationHost = input.submission.destinationHost;
    record.submissionMechanism = input.submission.mechanism;
    record.submissionAssociation = input.submission.association;
    record.declaredDestinationObservable = input.submission.declaredDestinationObservable;
  }

  if (input.network !== undefined) {
    record.networkMethod = input.network.method;
    record.destinationRelation = input.network.destinationRelation;
    record.destinationScheme = input.network.destinationScheme;
    record.destinationHost = input.network.destinationHost;
    record.networkMechanism = input.network.mechanism;
    record.networkCorrelation = input.network.correlation;
    record.networkPayloadObservation = input.network.payloadObservation;
    record.cookieHeaderDetection = input.network.cookieHeaderDetection;
    record.pageObservationTiming = input.network.pageObservationTiming;
  }

  return record;
}
