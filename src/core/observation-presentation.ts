import type { UiLanguage } from '../i18n/ui';
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

const SURFACE_LABELS: Readonly<Record<UiLanguage, Readonly<Record<SurfaceType, string>>>> = {
  ja: {
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
  },
  en: {
    page: 'Page',
    password: 'Password',
    email_or_id: 'Email address / ID',
    payment: 'Payment information',
    personal_information: 'Personal information',
    free_text: 'Free text',
    ai_prompt: 'Generative AI input',
    comment: 'Comment',
    chat: 'Chat',
    webmail: 'Email body',
    cloud_editor: 'Cloud editor',
    consent: 'Consent control',
    download_link: 'Download',
    external_navigation: 'External navigation',
    unknown: 'Unclassified input surface',
  },
};

const TRIGGER_LABELS: Readonly<Record<UiLanguage, Readonly<Record<TriggerType, string>>>> = {
  ja: {
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
    network_activity_after_submit_operation: '送信操作と近接した通信開始を観測',
    network_activity_without_correlated_operation: '通信開始を観測（相関可能な利用者操作は未確認）',
    partially_observable_surface: '部分的に観測可能な面を検出',
    unobservable_surface: '観測できない面を検出',
  },
  en: {
    page_observation_started: 'Page observation started',
    password_field_focus: 'Password field focused',
    email_or_id_field_focus: 'Email / ID field focused',
    payment_field_focus: 'Payment field focused',
    personal_info_field_focus: 'Personal-information field focused',
    free_text_surface_focus: 'Free-text surface focused',
    unknown_input_surface_focus: 'Unclassified input surface focused',
    paste_event_observed: 'Paste event observed',
    paste_into_field: 'Paste confirmed (legacy)',
    paste_reflected_in_field: 'Paste reflection confirmed',
    keyboard_input_started: 'Keyboard input start confirmed',
    autofill_or_manager_suspected: 'Autofill or input-assistance possibility',
    script_or_unknown_value_change: 'Update with unidentified input route',
    submit_attempt: 'Form submit event observed',
    submitter_activation_observed: 'Form-associated submit control observed',
    enter_submit_candidate: 'Enter-based submission candidate observed',
    external_domain_click: 'External-domain navigation detected',
    download_attempt: 'Download action detected',
    consent_control_focus: 'Consent control focused',
    consent_control_checked: 'Consent action detected',
    live_sync_surface_detected: 'Live-sync surface detected',
    network_activity_during_input: 'Request start near input activity (legacy)',
    network_activity_after_content_edit: 'Request start near a content edit',
    network_activity_after_submit_operation: 'Request start near a submission action',
    network_activity_without_correlated_operation:
      'Request start observed; no correlatable user action confirmed',
    partially_observable_surface: 'Partially observable surface detected',
    unobservable_surface: 'Unobservable surface detected',
  },
};

const INPUT_ORIGIN_LABELS: Readonly<Record<UiLanguage, Readonly<Record<InputOrigin, string>>>> = {
  ja: {
    keyboard_confirmed: 'キー入力開始を確認',
    paste_confirmed: '貼り付け反映を確認',
    autofill_or_manager_suspected: '自動入力または入力支援の可能性',
    script_or_unknown_update: 'スクリプトまたは不明な更新',
    unknown: '入力経路不明',
  },
  en: {
    keyboard_confirmed: 'Keyboard input start confirmed',
    paste_confirmed: 'Paste reflection confirmed',
    autofill_or_manager_suspected: 'Autofill or input-assistance possibility',
    script_or_unknown_update: 'Script or unidentified update',
    unknown: 'Input route unknown',
  },
};

const OBSERVATION_SCOPE_LABELS: Readonly<
  Record<UiLanguage, Readonly<Record<ObservationScope, string>>>
> = {
  ja: {
    input_surface_and_dom_events: '入力面・DOMイベントを観測',
    declared_submission_boundary: 'フォーム宣言上の送信境界を観測',
    submission_boundary_partial: '送信境界を部分観測',
    network_metadata_only: '通信開始メタデータのみを観測',
    page_surface_partial: 'ページ面を部分観測',
    unobservable: '観測不能',
    unsupported: '未対応',
  },
  en: {
    input_surface_and_dom_events: 'Input surface and DOM events observed',
    declared_submission_boundary: 'Declared form-submission boundary observed',
    submission_boundary_partial: 'Submission boundary partially observed',
    network_metadata_only: 'Request-start metadata only',
    page_surface_partial: 'Page surface partially observed',
    unobservable: 'Unobservable',
    unsupported: 'Unsupported',
  },
};

const OPERATION_EVIDENCE_LABELS: Readonly<
  Record<UiLanguage, Readonly<Record<OperationEvidence, string>>>
> = {
  ja: {
    extension_observation: '拡張機能が直接観測',
    direct_trusted_event: '信頼済みイベントを直接観測',
    correlated_trusted_events: '信頼済みイベント列を相関',
    browser_network_api_observation: 'ブラウザ通信APIの通知を観測',
    inferred_from_trusted_event: '信頼済みイベントから推定',
    untrusted_or_unknown: '非信頼イベントまたは根拠不足',
  },
  en: {
    extension_observation: 'Observed directly by the extension',
    direct_trusted_event: 'Trusted event observed directly',
    correlated_trusted_events: 'Correlated trusted event sequence',
    browser_network_api_observation: 'Browser network API notification observed',
    inferred_from_trusted_event: 'Inferred from a trusted event',
    untrusted_or_unknown: 'Untrusted event or insufficient evidence',
  },
};

const LEGACY_OBSERVABILITY_LABELS: Readonly<
  Record<UiLanguage, Readonly<Record<LegacyObservabilityState, string>>>
> = {
  ja: {
    observable: '旧形式（分類確度と混在）',
    partially_observable: 'ページ面を部分観測（旧形式）',
    high_uncertainty: '旧形式（用途不明と境界不明が混在）',
    unobservable: '観測不能（旧形式）',
    unsupported: '未対応（旧形式）',
  },
  en: {
    observable: 'Legacy format (mixed with classification confidence)',
    partially_observable: 'Page surface partially observed (legacy)',
    high_uncertainty: 'Legacy format (purpose and boundary uncertainty mixed)',
    unobservable: 'Unobservable (legacy)',
    unsupported: 'Unsupported (legacy)',
  },
};

const CONFIDENCE_LABELS: Readonly<
  Record<UiLanguage, Readonly<Record<ClassificationConfidence, string>>>
> = {
  ja: {
    explicit: '明示情報による分類',
    heuristic: '推定による分類',
    generic: '一般分類',
    unknown: '分類根拠なし',
  },
  en: {
    explicit: 'Classified from explicit information',
    heuristic: 'Heuristic classification',
    generic: 'Generic classification',
    unknown: 'No classification basis',
  },
};

export function surfaceTypeLabel(surfaceType: SurfaceType, language: UiLanguage = 'ja'): string {
  return SURFACE_LABELS[language][surfaceType];
}

export function triggerTypeLabel(triggerType: TriggerType, language: UiLanguage = 'ja'): string {
  return TRIGGER_LABELS[language][triggerType];
}

export function inputOriginLabel(inputOrigin: InputOrigin, language: UiLanguage = 'ja'): string {
  return INPUT_ORIGIN_LABELS[language][inputOrigin];
}

export function observationScopeLabel(
  record: ObservationLogRecord,
  language: UiLanguage = 'ja',
): string {
  if (record.observationScope !== undefined) {
    return OBSERVATION_SCOPE_LABELS[language][record.observationScope];
  }
  if (record.observability !== undefined) {
    return LEGACY_OBSERVABILITY_LABELS[language][record.observability];
  }
  return language === 'ja' ? '観測範囲情報なし' : 'No observation-scope information';
}

export function operationEvidenceLabel(
  evidence: OperationEvidence | undefined,
  language: UiLanguage = 'ja',
): string {
  return evidence === undefined
    ? language === 'ja'
      ? '旧形式（証拠未分離）'
      : 'Legacy format (evidence not separated)'
    : OPERATION_EVIDENCE_LABELS[language][evidence];
}

export function observabilityLabel(
  observability: LegacyObservabilityState | undefined,
  language: UiLanguage = 'ja',
): string {
  return observability === undefined
    ? language === 'ja'
      ? '観測範囲情報なし'
      : 'No observation-scope information'
    : LEGACY_OBSERVABILITY_LABELS[language][observability];
}

export function classificationConfidenceLabel(
  confidence: ClassificationConfidence | undefined,
  language: UiLanguage = 'ja',
): string {
  return confidence === undefined
    ? language === 'ja'
      ? '分類情報なし'
      : 'No classification information'
    : CONFIDENCE_LABELS[language][confidence];
}

export function observationActionLabel(
  record: ObservationLogRecord,
  language: UiLanguage = 'ja',
): string {
  return record.inputOrigin === undefined
    ? triggerTypeLabel(record.triggerType, language)
    : inputOriginLabel(record.inputOrigin, language);
}

export function isUserInputObservation(record: ObservationLogRecord): boolean {
  return record.triggerType !== 'page_observation_started';
}

export function submissionMethodLabel(record: ObservationLogRecord): string {
  return record.networkMethod ?? record.submissionMethod ?? '—';
}

export function submissionDestinationLabel(
  record: ObservationLogRecord,
  language: UiLanguage = 'ja',
): string {
  if (record.destinationRelation === undefined) return '—';
  const relation = {
    ja: {
      same_origin: '同一オリジン',
      cross_origin: '別オリジン',
      non_http: 'HTTP以外',
      unknown: '不明',
    },
    en: {
      same_origin: 'Same origin',
      cross_origin: 'Cross origin',
      non_http: 'Non-HTTP',
      unknown: 'Unknown',
    },
  }[language][record.destinationRelation];
  const host =
    record.destinationHost && record.destinationHost !== 'unknown'
      ? ` · ${record.destinationHost}`
      : '';
  return `${relation}${host}`;
}

export function submissionEncodingLabel(record: ObservationLogRecord): string {
  return record.submissionEncoding ?? '—';
}

export function frameContextLabel(
  record: ObservationLogRecord,
  language: UiLanguage = 'ja',
): string {
  if (record.frameType === undefined) return language === 'ja' ? '旧形式' : 'Legacy format';
  if (record.frameType === 'top') return language === 'ja' ? 'トップフレーム' : 'Top frame';
  const top =
    record.topLevelDomain && record.topLevelDomain !== 'unknown'
      ? record.topLevelDomain
      : language === 'ja'
        ? 'トップフレーム不明'
        : 'Top frame unknown';
  const frame =
    record.frameDomain && record.frameDomain !== 'unknown' ? record.frameDomain : record.domainKey;
  return language === 'ja'
    ? `埋め込みフレーム · ${top} → ${frame}`
    : `Embedded frame · ${top} → ${frame}`;
}

export function submissionAssociationLabel(
  record: ObservationLogRecord,
  language: UiLanguage = 'ja',
): string {
  switch (record.submissionAssociation) {
    case 'declared_submit_control':
      return language === 'ja' ? 'フォーム関連submit要素' : 'Form-associated submit element';
    case 'enter_key_candidate':
      return language === 'ja' ? 'Enter候補' : 'Enter candidate';
    case 'correlated_submit_event':
      return language === 'ja'
        ? '同一フォームでsubmit成立と相関'
        : 'Correlated with submit on the same form';
    case 'submit_event_without_prior_candidate':
      return language === 'ja' ? 'submitイベント単独観測' : 'Submit event observed alone';
    default:
      return record.submissionMethod === undefined
        ? '—'
        : language === 'ja'
          ? '旧形式（相関情報なし）'
          : 'Legacy format (no association information)';
  }
}

export function networkMechanismLabel(
  record: ObservationLogRecord,
  language: UiLanguage = 'ja',
): string {
  switch (record.networkMechanism) {
    case 'fetch_or_xhr':
      return language === 'ja' ? 'fetch/XHR系' : 'fetch/XHR';
    case 'beacon_or_ping':
      return language === 'ja' ? 'Beacon/Ping系' : 'Beacon/Ping';
    default:
      return '—';
  }
}

export function networkCorrelationLabel(
  record: ObservationLogRecord,
  language: UiLanguage = 'ja',
): string {
  switch (record.networkCorrelation) {
    case 'recent_content_edit':
      return language === 'ja'
        ? '内容変更操作から2.5秒以内の時間相関'
        : 'Temporal correlation within 2.5 seconds of a content edit';
    case 'recent_submit_operation':
      return language === 'ja'
        ? '標準form送信操作から2秒以内の時間相関'
        : 'Temporal correlation within 2 seconds of a standard-form submission action';
    case 'no_correlated_user_operation':
      return language === 'ja'
        ? '相関可能な利用者操作を確認していない'
        : 'No correlatable user action observed';
    case 'correlation_unavailable':
      return language === 'ja' ? '操作相関を判定できない' : 'Action correlation unavailable';
    case 'recent_input_activity':
      return language === 'ja'
        ? '入力操作から2.5秒以内の時間相関（旧形式）'
        : 'Temporal correlation within 2.5 seconds of input activity (legacy)';
    default:
      return '—';
  }
}

export function networkPayloadObservationLabel(
  record: ObservationLogRecord,
  language: UiLanguage = 'ja',
): string {
  return record.networkPayloadObservation === 'not_requested'
    ? language === 'ja'
      ? '観測対象としていない'
      : "Outside ConnectBits' observation scope"
    : '—';
}

export function cookieHeaderDetectionLabel(
  record: ObservationLogRecord,
  language: UiLanguage = 'ja',
): string {
  switch (record.cookieHeaderDetection) {
    case 'detected':
      return language === 'ja'
        ? '存在を検出（値は未取得）'
        : 'Presence detected; values not collected';
    case 'not_detected':
      return language === 'ja'
        ? '未検出（不存在の証明ではない）'
        : 'Not detected; not proof of absence';
    case 'not_observed':
      return language === 'ja' ? '未観測' : 'Not observed';
    case 'unavailable':
      return language === 'ja' ? '判定不能' : 'Unavailable';
    default:
      return '—';
  }
}

export function pageObservationTimingLabel(
  record: ObservationLogRecord,
  language: UiLanguage = 'ja',
): string {
  switch (record.pageObservationTiming) {
    case 'within_5s_of_page_observation':
      return language === 'ja'
        ? 'ページ観測開始から5秒以内'
        : 'Within 5 seconds of page observation start';
    case 'after_5s_of_page_observation':
      return language === 'ja'
        ? 'ページ観測開始から5秒超'
        : 'More than 5 seconds after page observation start';
    case 'unknown':
      return language === 'ja' ? '時間関係不明' : 'Timing relation unknown';
    default:
      return '—';
  }
}

export function boundarySourceLabel(
  record: ObservationLogRecord,
  language: UiLanguage = 'ja',
): string {
  if (record.networkMechanism !== undefined) {
    return language === 'ja' ? 'ブラウザ通信メタデータ' : 'Browser request metadata';
  }
  if (record.submissionMethod !== undefined) {
    return language === 'ja' ? '標準form宣言' : 'Standard-form declaration';
  }
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

export function logLayerLabel(record: ObservationLogRecord, language: UiLanguage = 'ja'): string {
  const diagnostic = (record.logLayer ?? 'activity') === 'diagnostic';
  return language === 'ja'
    ? diagnostic
      ? '診断'
      : '通常'
    : diagnostic
      ? 'Diagnostic'
      : 'Activity';
}
