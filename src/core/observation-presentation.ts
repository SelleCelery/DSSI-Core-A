import type {
  ClassificationConfidence,
  InputOrigin,
  LegacyObservabilityState,
  ObservationLogRecord,
  ObservationScope,
  OperationEvidence,
  SurfaceType,
  TriggerType,
} from './models/observation';

const SURFACE_LABELS: Readonly<Record<SurfaceType, string>> = {
  page: 'ページ',
  password: 'パスワード',
  email_or_id: 'メールアドレス／ID',
  payment: '決済情報',
  personal_information: '個人情報',
  free_text: '自由記述',
  ai_prompt: '生成AI入力',
  comment: 'コメント',
  chat: 'チャット',
  webmail: 'メール本文',
  cloud_editor: 'クラウド編集',
  consent: '同意操作',
  download_link: 'ダウンロード',
  external_navigation: '外部遷移',
  unknown: '種類不明の入力面',
};

const TRIGGER_LABELS: Readonly<Record<TriggerType, string>> = {
  page_observation_started: 'ページ観測を開始',
  password_field_focus: 'パスワード欄へフォーカス',
  email_or_id_field_focus: 'メールアドレス／ID欄へフォーカス',
  payment_field_focus: '決済情報欄へフォーカス',
  personal_info_field_focus: '個人情報欄へフォーカス',
  free_text_surface_focus: '自由記述欄へフォーカス',
  unknown_input_surface_focus: '種類不明の入力面へフォーカス',
  paste_event_observed: '貼り付けイベントを観測',
  paste_into_field: '貼り付けを確認（旧形式）',
  paste_reflected_in_field: '貼り付け反映を確認',
  keyboard_input_started: 'キー入力開始を確認',
  autofill_or_manager_suspected: '自動入力または入力支援の可能性',
  script_or_unknown_value_change: '入力経路を特定できない更新',
  submit_attempt: '送信操作を検出',
  external_domain_click: '外部ドメインへの遷移を検出',
  download_attempt: 'ダウンロード操作を検出',
  consent_control_focus: '同意操作面へフォーカス',
  consent_control_checked: '同意操作を検出',
  live_sync_surface_detected: 'ライブ同期入力面を検出',
  network_activity_during_input: '入力中の通信活動を検出',
  partially_observable_surface: '部分的に観測可能な面を検出',
  unobservable_surface: '観測できない面を検出',
};

const INPUT_ORIGIN_LABELS: Readonly<Record<InputOrigin, string>> = {
  keyboard_confirmed: 'キー入力開始を確認',
  paste_confirmed: '貼り付け反映を確認',
  autofill_or_manager_suspected: '自動入力または入力支援の可能性',
  script_or_unknown_update: 'スクリプトまたは不明な更新',
  unknown: '入力経路不明',
};

const OBSERVATION_SCOPE_LABELS: Readonly<Record<ObservationScope, string>> = {
  input_surface_and_dom_events: '入力面・DOMイベントを観測',
  page_surface_partial: 'ページ面を部分観測',
  unobservable: '観測不能',
  unsupported: '未対応',
};

const OPERATION_EVIDENCE_LABELS: Readonly<Record<OperationEvidence, string>> = {
  extension_observation: '拡張機能が直接観測',
  direct_trusted_event: '信頼済みイベントを直接観測',
  correlated_trusted_events: '信頼済みイベント列を相関',
  inferred_from_trusted_event: '信頼済みイベントから推定',
  untrusted_or_unknown: '非信頼イベントまたは根拠不足',
};

const LEGACY_OBSERVABILITY_LABELS: Readonly<Record<LegacyObservabilityState, string>> = {
  observable: '旧形式（分類確度と混在）',
  partially_observable: 'ページ面を部分観測（旧形式）',
  high_uncertainty: '旧形式（用途不明と境界不明が混在）',
  unobservable: '観測不能（旧形式）',
  unsupported: '未対応（旧形式）',
};

const CONFIDENCE_LABELS: Readonly<Record<ClassificationConfidence, string>> = {
  explicit: '明示情報による分類',
  heuristic: '推定による分類',
  generic: '一般分類',
  unknown: '分類根拠なし',
};

export function surfaceTypeLabel(surfaceType: SurfaceType): string {
  return SURFACE_LABELS[surfaceType];
}

export function triggerTypeLabel(triggerType: TriggerType): string {
  return TRIGGER_LABELS[triggerType];
}

export function inputOriginLabel(inputOrigin: InputOrigin): string {
  return INPUT_ORIGIN_LABELS[inputOrigin];
}

export function observationScopeLabel(record: ObservationLogRecord): string {
  if (record.observationScope !== undefined) {
    return OBSERVATION_SCOPE_LABELS[record.observationScope];
  }

  if (record.observability !== undefined) {
    return LEGACY_OBSERVABILITY_LABELS[record.observability];
  }

  return '観測範囲情報なし';
}

export function operationEvidenceLabel(evidence: OperationEvidence | undefined): string {
  return evidence === undefined ? '旧形式（証拠未分離）' : OPERATION_EVIDENCE_LABELS[evidence];
}

/** Legacy helper retained for old tests and external references. */
export function observabilityLabel(observability: LegacyObservabilityState | undefined): string {
  return observability === undefined
    ? '観測範囲情報なし'
    : LEGACY_OBSERVABILITY_LABELS[observability];
}

export function classificationConfidenceLabel(
  confidence: ClassificationConfidence | undefined,
): string {
  return confidence === undefined ? '分類情報なし' : CONFIDENCE_LABELS[confidence];
}

export function observationActionLabel(record: ObservationLogRecord): string {
  return record.inputOrigin === undefined
    ? triggerTypeLabel(record.triggerType)
    : inputOriginLabel(record.inputOrigin);
}

export function isUserInputObservation(record: ObservationLogRecord): boolean {
  return record.triggerType !== 'page_observation_started';
}
