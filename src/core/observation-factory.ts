import type {
  ClassificationConfidence,
  InputOrigin,
  ObservationLogRecord,
  ObservabilityState,
  SurfaceType,
  TriggerType,
} from './models/observation';
import type { ViscosityLevel } from './models/settings';

export interface ObservationFactoryContext {
  sessionId: string;
  domainKey: string;
  viscosityLevel: ViscosityLevel;
}

export interface ObservationRecordInput {
  surfaceType: SurfaceType;
  triggerType: TriggerType;
  observability: ObservabilityState;
  cuePresented: boolean;
  inputOrigin?: InputOrigin;
  classificationConfidence?: ClassificationConfidence;
}

export function createObservationRecord(
  context: ObservationFactoryContext,
  input: ObservationRecordInput,
): ObservationLogRecord {
  const record: ObservationLogRecord = {
    eventId: crypto.randomUUID(),
    timestamp: Date.now(),
    sessionId: context.sessionId,
    domainKey: context.domainKey,
    surfaceType: input.surfaceType,
    triggerType: input.triggerType,
    observability: input.observability,
    viscosityLevel: context.viscosityLevel,
    cuePresented: input.cuePresented,
  };

  if (input.inputOrigin !== undefined) {
    record.inputOrigin = input.inputOrigin;
  }

  if (input.classificationConfidence !== undefined) {
    record.classificationConfidence = input.classificationConfidence;
  }

  return record;
}
