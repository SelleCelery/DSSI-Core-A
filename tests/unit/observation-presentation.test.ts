import { describe, expect, it } from 'vitest';
import {
  classificationConfidenceLabel,
  inputOriginLabel,
  isUserInputObservation,
  observationActionLabel,
  observationScopeLabel,
  operationEvidenceLabel,
  surfaceTypeLabel,
  triggerTypeLabel,
} from '../../src/core/observation-presentation';
import type { ObservationLogRecord } from '../../src/core/models/observation';

function makeRecord(overrides: Partial<ObservationLogRecord> = {}): ObservationLogRecord {
  return {
    schemaVersion: 2,
    eventId: 'event-1',
    timestamp: 1,
    sessionId: 'session-1',
    domainKey: 'example.test',
    surfaceType: 'free_text',
    triggerType: 'free_text_surface_focus',
    observationScope: 'input_surface_and_dom_events',
    operationEvidence: 'direct_trusted_event',
    viscosityLevel: 2,
    cuePresented: true,
    classificationConfidence: 'generic',
    ...overrides,
  };
}

describe('observation presentation', () => {
  it('maps separated observation dimensions to Japanese labels', () => {
    expect(surfaceTypeLabel('payment')).toBe('決済情報');
    expect(triggerTypeLabel('paste_event_observed')).toBe('貼り付けイベントを観測');
    expect(inputOriginLabel('paste_confirmed')).toBe('貼り付け反映を確認');
    expect(operationEvidenceLabel('correlated_trusted_events')).toBe('信頼済みイベント列を相関');
    expect(classificationConfidenceLabel('heuristic')).toBe('推定による分類');
    expect(observationScopeLabel(makeRecord())).toBe('入力面・DOMイベントを観測');
  });

  it('prefers the input-origin label when origin evidence exists', () => {
    const record = makeRecord({
      triggerType: 'script_or_unknown_value_change',
      inputOrigin: 'autofill_or_manager_suspected',
    });

    expect(observationActionLabel(record)).toBe('自動入力または入力支援の可能性');
  });

  it('uses the trigger label when input-origin evidence is absent', () => {
    expect(observationActionLabel(makeRecord())).toBe('自由記述欄へフォーカス');
  });

  it('renders Sprint 1 legacy records without treating old uncertainty as a new scope', () => {
    const legacy: ObservationLogRecord = {
      eventId: 'legacy-event',
      timestamp: 1,
      sessionId: 'legacy-session',
      domainKey: 'example.test',
      surfaceType: 'free_text',
      triggerType: 'free_text_surface_focus',
      observability: 'high_uncertainty',
      viscosityLevel: 2,
      cuePresented: false,
      classificationConfidence: 'generic',
    };

    expect(observationScopeLabel(legacy)).toBe('旧形式（用途不明と境界不明が混在）');
    expect(operationEvidenceLabel(legacy.operationEvidence)).toBe('旧形式（証拠未分離）');
  });

  it('separates page-start records from user-input observations', () => {
    expect(isUserInputObservation(makeRecord({ triggerType: 'page_observation_started' }))).toBe(
      false,
    );
    expect(isUserInputObservation(makeRecord())).toBe(true);
  });
});
