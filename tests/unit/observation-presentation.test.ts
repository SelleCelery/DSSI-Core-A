import { describe, expect, it } from 'vitest';
import {
  boundarySourceLabel,
  classificationConfidenceLabel,
  frameContextLabel,
  inputOriginLabel,
  networkCorrelationLabel,
  networkMechanismLabel,
  networkPayloadObservationLabel,
  isUserInputObservation,
  observationActionLabel,
  observationScopeLabel,
  operationEvidenceLabel,
  submissionAssociationLabel,
  surfaceStructureLabel,
  surfaceTypeLabel,
  triggerTypeLabel,
} from '../../src/core/observation-presentation';
import type { ObservationLogRecord } from '../../src/core/models/observation';

function makeRecord(overrides: Partial<ObservationLogRecord> = {}): ObservationLogRecord {
  return {
    schemaVersion: 2,
    eventId: '123e4567-e89b-42d3-a456-426614174000',
    timestamp: 1,
    sessionId: '123e4567-e89b-42d3-a456-426614174000',
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

  it('labels frame context and submission correlation independently', () => {
    const record = makeRecord({
      frameType: 'iframe',
      topLevelDomain: 'example.test',
      frameDomain: 'widget.test',
      submissionMethod: 'POST',
      submissionAssociation: 'correlated_submit_event',
    });

    expect(frameContextLabel(record)).toBe('埋め込みフレーム · example.test → widget.test');
    expect(submissionAssociationLabel(record)).toBe('同一フォームでsubmit成立と相関');
  });

  it('labels top frames with technical terminology', () => {
    expect(frameContextLabel(makeRecord({ frameType: 'top' }))).toBe('トップフレーム');
  });

  it('renders only privacy-safe structure metadata for unknown surfaces', () => {
    const record = makeRecord({
      surfaceType: 'unknown',
      surfaceTagName: 'input',
      surfaceInputType: 'date',
      surfaceRole: '',
      surfaceIsContentEditable: false,
      surfaceAutocompleteTokens: ['bday'],
    });

    expect(surfaceStructureLabel(record)).toBe('<input> · type=date · autocomplete=bday');
    expect(surfaceStructureLabel(makeRecord())).toBe('—');
  });

  it('separates page-start records from user-input observations', () => {
    expect(isUserInputObservation(makeRecord({ triggerType: 'page_observation_started' }))).toBe(
      false,
    );
    expect(isUserInputObservation(makeRecord())).toBe(true);
  });
  it('labels network metadata without implying payload transmission', () => {
    const record = makeRecord({
      triggerType: 'network_activity_during_input',
      observationScope: 'network_metadata_only',
      operationEvidence: 'browser_network_api_observation',
      networkMethod: 'POST',
      networkMechanism: 'fetch_or_xhr',
      networkCorrelation: 'recent_input_activity',
      networkPayloadObservation: 'not_requested',
      destinationRelation: 'cross_origin',
      destinationScheme: 'https',
      destinationHost: 'api.example.test',
    });

    expect(triggerTypeLabel(record.triggerType)).toBe('入力操作と近接した通信開始を観測');
    expect(observationScopeLabel(record)).toBe('通信開始メタデータのみを観測');
    expect(operationEvidenceLabel(record.operationEvidence)).toBe('ブラウザ通信APIの通知を観測');
    expect(boundarySourceLabel(record)).toBe('ブラウザ通信メタデータ');
    expect(networkMechanismLabel(record)).toBe('fetch/XHR系');
    expect(networkCorrelationLabel(record)).toBe('入力操作から2.5秒以内の時間相関');
    expect(networkPayloadObservationLabel(record)).toBe('本文を要求していない');
  });
});
