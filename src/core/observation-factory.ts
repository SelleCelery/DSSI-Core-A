import type {
  ClassificationConfidence,
  InputOrigin,
  ObservationLogRecord,
  ObservationScope,
  OperationEvidence,
  SurfaceType,
  TriggerType,
} from './models/observation';
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
}

export function createObservationRecord(
  context: ObservationFactoryContext,
  input: ObservationRecordInput,
): ObservationLogRecord {
  const record: ObservationLogRecord = {
    schemaVersion: 3,
    eventId: crypto.randomUUID(),
    timestamp: Date.now(),
    sessionId: context.sessionId,
    domainKey: context.domainKey,
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

  if (input.submission !== undefined) {
    record.submissionMethod = input.submission.method;
    record.submissionEncoding = input.submission.encoding;
    record.destinationRelation = input.submission.destinationRelation;
    record.destinationScheme = input.submission.destinationScheme;
    record.destinationHost = input.submission.destinationHost;
    record.submissionMechanism = input.submission.mechanism;
    record.declaredDestinationObservable = input.submission.declaredDestinationObservable;
  }

  return record;
}
