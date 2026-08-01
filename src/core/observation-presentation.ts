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
  submit_attempt: 'フォーム送信イベントを観測',
  submitter_activation_observed: 'フォーム関連submit操作面を観測',
  enter_submit_candidate: 'Enterによる送信候補を観測',
  external_domain_click: '外部ドメインへの遷移を検出',
  download_attempt: 'ダウンロード操作を検出',
  consent_control_focus: '同意操作面へフォーカス',
  consent_control_checked: '同意操作を検出',
  live_sync_surface_detected: 'ライブ同期入力面を検出',
  network_activity_during_input: '入力操作と近接した通信開始を観測（旧形式）',
  network_activity_after_content_edit: '内容変更操作と近接した通信開始を観測',
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
  declared_submission_boundary: 'フォーム宣言上の送信境界を観測',
  submission_boundary_partial: '送信境界を部分観測',
  network_metadata_only: '通信開始メタデータのみを観測',
  page_surface_partial: 'ページ面を部分観測',
  unobservable: '観測不能',
  unsupported: '未対応',
};

const OPERATION_EVIDENCE_LABELS: Readonly<Record<OperationEvidence, string>> = {
  extension_observation: '拡張機能が直接観測',
  direct_trusted_event: '信頼済みイベントを直接観測',
  correlated_trusted_events: '信頼済みイベント列を相関',
  browser_network_api_observation: 'ブラウザ通信APIの通知を観測',
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

export function submissionMethodLabel(record: ObservationLogRecord): string {
  return record.networkMethod ?? record.submissionMethod ?? '—';
}

export function submissionDestinationLabel(record: ObservationLogRecord): string {
  if (record.destinationRelation === undefined) return '—';
  const relation = {
    same_origin: '同一オリジン',
    cross_origin: '別オリジン',
    non_http: 'HTTP以外',
    unknown: '不明',
  }[record.destinationRelation];
  const host =
    record.destinationHost && record.destinationHost !== 'unknown'
      ? ` · ${record.destinationHost}`
      : '';
  return `${relation}${host}`;
}

export function submissionEncodingLabel(record: ObservationLogRecord): string {
  return record.submissionEncoding ?? '—';
}

export function frameContextLabel(record: ObservationLogRecord): string {
  if (record.frameType === undefined) return '旧形式';
  if (record.frameType === 'top') return 'トップフレーム';
  const top =
    record.topLevelDomain && record.topLevelDomain !== 'unknown'
      ? record.topLevelDomain
      : 'トップフレーム不明';
  const frame =
    record.frameDomain && record.frameDomain !== 'unknown' ? record.frameDomain : record.domainKey;
  return `埋め込みフレーム · ${top} → ${frame}`;
}

export function submissionAssociationLabel(record: ObservationLogRecord): string {
  switch (record.submissionAssociation) {
    case 'declared_submit_control':
      return 'フォーム関連submit要素';
    case 'enter_key_candidate':
      return 'Enter候補';
    case 'correlated_submit_event':
      return '同一フォームでsubmit成立と相関';
    case 'submit_event_without_prior_candidate':
      return 'submitイベント単独観測';
    default:
      return record.submissionMethod === undefined ? '—' : '旧形式（相関情報なし）';
  }
}

export function networkMechanismLabel(record: ObservationLogRecord): string {
  switch (record.networkMechanism) {
    case 'fetch_or_xhr':
      return 'fetch/XHR系';
    case 'beacon_or_ping':
      return 'Beacon/Ping系';
    default:
      return '—';
  }
}

export function networkCorrelationLabel(record: ObservationLogRecord): string {
  if (record.networkCorrelation === 'recent_content_edit') {
    return '内容変更操作から2.5秒以内の時間相関';
  }
  if (record.networkCorrelation === 'recent_input_activity') {
    return '入力操作から2.5秒以内の時間相関（旧形式）';
  }
  return '—';
}

export function networkPayloadObservationLabel(record: ObservationLogRecord): string {
  return record.networkPayloadObservation === 'not_requested' ? '本文を要求していない' : '—';
}

export function cookieHeaderDetectionLabel(record: ObservationLogRecord): string {
  switch (record.cookieHeaderDetection) {
    case 'detected':
      return '検出';
    case 'not_detected':
      return '未検出';
    case 'not_observed':
      return '未観測';
    case 'unavailable':
      return '判定不能';
    default:
      return '—';
  }
}

export function pageObservationTimingLabel(record: ObservationLogRecord): string {
  switch (record.pageObservationTiming) {
    case 'within_5s_of_page_observation':
      return 'ページ観測開始から5秒以内';
    case 'after_5s_of_page_observation':
      return 'ページ観測開始から5秒超';
    case 'unknown':
      return '時間関係不明';
    default:
      return '—';
  }
}

export function boundarySourceLabel(record: ObservationLogRecord): string {
  if (record.networkMechanism !== undefined) return 'ブラウザ通信メタデータ';
  if (record.submissionMethod !== undefined) return '標準form宣言';
  return '—';
}

export function surfaceStructureLabel(record: ObservationLogRecord): string {
  if (record.surfaceTagName === undefined) return '—';

  const parts = [`<${record.surfaceTagName}>`];
  if (record.surfaceInputType) parts.push(`type=${record.surfaceInputType}`);
  if (record.surfaceRole) parts.push(`role=${record.surfaceRole}`);
  if (record.surfaceIsContentEditable) parts.push('contenteditable');
  if (record.surfaceAutocompleteTokens && record.surfaceAutocompleteTokens.length > 0) {
    parts.push(`autocomplete=${record.surfaceAutocompleteTokens.join(',')}`);
  }
  return parts.join(' · ');
}

export function logLayerLabel(record: ObservationLogRecord): string {
  return (record.logLayer ?? 'activity') === 'diagnostic' ? '診断' : '通常';
}
