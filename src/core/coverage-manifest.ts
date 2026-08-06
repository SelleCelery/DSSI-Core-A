import type { UiLanguage } from '../i18n/ui';

export type CoverageStatus =
  | 'observed'
  | 'observed_then_reduced'
  | 'not_observed_currently'
  | 'not_observed_by_design'
  | 'not_observable_currently'
  | 'unknown_residual';

export type CoverageReason =
  | 'privacy_boundary'
  | 'permission_boundary'
  | 'platform_limitation'
  | 'scope_limitation'
  | 'user_selection'
  | 'unknown';

export interface CoverageManifestEntry {
  capabilityId: string;
  label: string;
  detail: string;
  status: CoverageStatus;
  reason: CoverageReason;
  enabled: boolean;
  permissionGranted?: boolean;
}

export interface CoverageManifestContext {
  observationEnabled: boolean;
  networkObservationEnabled: boolean;
  networkPermissionGranted: boolean;
}

interface CoverageCopy {
  label: string;
  detail: string;
}

const COVERAGE_COPY: Readonly<Record<UiLanguage, Readonly<Record<string, CoverageCopy>>>> = {
  ja: {
    'trusted-dom-events': {
      label: '信頼済みDOM入力・操作イベント',
      detail: '入力、貼り付け、標準formのsubmit関連イベントを観測します。入力本文は取得しません。',
    },
    'network-metadata': {
      label: '対象通信の開始メタデータ',
      detail:
        '許可されたHTTP/HTTPSサイトのfetch/XHR系・Beacon/Ping系について、method、host、通信方式などを観測します。',
    },
    'url-reduction': {
      label: '完全URLの縮約',
      detail:
        'Chromeから受け取ったURLはscheme、host、同一／別オリジン関係へ直ちに縮約し、path、query、fragment、credentialsを保存しません。',
    },
    'request-header-reduction': {
      label: 'request headersの縮約',
      detail:
        'Cookieヘッダーの存在検出状態だけへ縮約します。ヘッダー値、Cookie名、Cookie値、個数は保存・表示しません。',
    },
    'raw-input': {
      label: '入力本文・パスワード・決済番号',
      detail:
        '取得可能性があっても、利用者の主権を損なうためConnectBitsの保存・表示経路へ接続しません。',
    },
    'request-body': {
      label: 'request body・通信本文',
      detail: 'webRequestで要求せず、取得・分類・保存・表示しません。',
    },
    'stored-cookies': {
      label: 'ブラウザーに保存されたCookie',
      detail:
        '追加のcookies権限で接触可能になる領域ですが、現行版では権限侵襲を避けるためインターフェイスへ接続しません。',
    },
    'page-main-world-memory': {
      label: 'ページ内部メモリと入力値の複製',
      detail:
        'ページ本体の実行環境への侵襲的な注入を行わないため、保持・複製・送信待ち状態は確認しません。',
    },
    'memory-cache': {
      label: 'インメモリキャッシュ内で完結する処理',
      detail:
        '現在のwebRequest観測面では確認できない場合があります。未観測は不存在を意味しません。',
    },
    'established-streams': {
      label: '確立済みWebSocket／WebTransport内部通信',
      detail: '接続後の個別メッセージやセッション内部の通信は現在の観測面では確認できません。',
    },
    'permission-excluded-network': {
      label: '権限外・Chrome非公開の通信',
      detail:
        'ConnectBitsに許可されていない通信、またはChromeが拡張機能へ公開しない事象は確認できません。通信自体が遮断されるという意味ではありません。',
    },
    'unknown-residual': {
      label: '未列挙の観測不能領域',
      detail:
        'この一覧は死角の全体を保証しません。ブラウザー、ページ実装、通信方式、権限状態の変化により未知の残差が存在し得ます。',
    },
  },
  en: {
    'trusted-dom-events': {
      label: 'Trusted DOM input and action events',
      detail:
        'ConnectBits observes selected input, paste, and standard-form submit-related events. It does not collect input content.',
    },
    'network-metadata': {
      label: 'Selected request-start metadata',
      detail:
        'For permitted HTTP/HTTPS sites, ConnectBits observes selected fetch/XHR and Beacon/Ping request metadata such as method, host, and mechanism.',
    },
    'url-reduction': {
      label: 'Full URL reduction',
      detail:
        'URLs exposed by Chrome are immediately reduced to scheme, host, and same/cross-origin relation. Paths, queries, fragments, and credentials are not stored.',
    },
    'request-header-reduction': {
      label: 'Request-header reduction',
      detail:
        'Request headers are reduced to the detection state of a Cookie header. Header values, Cookie names, Cookie values, and counts are not stored or displayed.',
    },
    'raw-input': {
      label: 'Input text, passwords, and payment numbers',
      detail:
        'Even where technically accessible, these values are not connected to ConnectBits storage or display paths because doing so would undermine user sovereignty.',
    },
    'request-body': {
      label: 'Request body and network payload',
      detail: 'ConnectBits does not request, collect, classify, store, or display request bodies.',
    },
    'stored-cookies': {
      label: 'Cookies stored by the browser',
      detail:
        'This area could be accessed with an additional cookies permission, but the current version does not connect it to the interface in order to avoid expanding authority.',
    },
    'page-main-world-memory': {
      label: 'Page main-world memory and copied input values',
      detail:
        'ConnectBits does not inject invasive main-world instrumentation and therefore does not inspect retained, copied, or pending-send values inside the page.',
    },
    'memory-cache': {
      label: 'Processes completed within memory cache',
      detail:
        'Some activity may not appear on the current webRequest observation surface. Not observed does not mean nonexistent.',
    },
    'established-streams': {
      label: 'Established WebSocket / WebTransport traffic',
      detail:
        'Individual messages and session-internal communication after connection establishment are not observable through the current surface.',
    },
    'permission-excluded-network': {
      label: 'Permission-excluded or Chrome-hidden communication',
      detail:
        'ConnectBits cannot confirm requests outside granted permissions or events Chrome does not expose. This does not mean the communication is blocked.',
    },
    'unknown-residual': {
      label: 'Unlisted unobservable areas',
      detail:
        'This list does not guarantee a complete map of blind spots. Unknown residuals may remain as browser behavior, page implementation, protocols, and permissions change.',
    },
  },
};

export function buildCoverageManifest(
  context: CoverageManifestContext,
  language: UiLanguage = 'ja',
): CoverageManifestEntry[] {
  const domEnabled = context.observationEnabled;
  const networkEnabled =
    context.observationEnabled &&
    context.networkObservationEnabled &&
    context.networkPermissionGranted;
  const copy = COVERAGE_COPY[language];

  const make = (
    capabilityId: string,
    status: CoverageStatus,
    reason: CoverageReason,
    enabled: boolean,
    permissionGranted?: boolean,
  ): CoverageManifestEntry => ({
    capabilityId,
    label: copy[capabilityId]?.label ?? capabilityId,
    detail: copy[capabilityId]?.detail ?? '',
    status,
    reason,
    enabled,
    ...(permissionGranted === undefined ? {} : { permissionGranted }),
  });

  return [
    make(
      'trusted-dom-events',
      domEnabled ? 'observed' : 'not_observed_currently',
      domEnabled ? 'scope_limitation' : 'user_selection',
      domEnabled,
    ),
    make(
      'network-metadata',
      networkEnabled ? 'observed' : 'not_observed_currently',
      !context.observationEnabled || !context.networkObservationEnabled
        ? 'user_selection'
        : context.networkPermissionGranted
          ? 'scope_limitation'
          : 'permission_boundary',
      networkEnabled,
      context.networkPermissionGranted,
    ),
    make(
      'url-reduction',
      networkEnabled ? 'observed_then_reduced' : 'not_observed_currently',
      'privacy_boundary',
      networkEnabled,
      context.networkPermissionGranted,
    ),
    make(
      'request-header-reduction',
      networkEnabled ? 'observed_then_reduced' : 'not_observed_currently',
      'privacy_boundary',
      networkEnabled,
      context.networkPermissionGranted,
    ),
    make('raw-input', 'not_observed_by_design', 'privacy_boundary', false),
    make('request-body', 'not_observed_by_design', 'privacy_boundary', false),
    make('stored-cookies', 'not_observed_by_design', 'permission_boundary', false),
    make('page-main-world-memory', 'not_observed_by_design', 'privacy_boundary', false),
    make('memory-cache', 'not_observable_currently', 'platform_limitation', false),
    make('established-streams', 'not_observable_currently', 'platform_limitation', false),
    make('permission-excluded-network', 'not_observable_currently', 'permission_boundary', false),
    make('unknown-residual', 'unknown_residual', 'unknown', false),
  ];
}

export function coverageStatusLabel(status: CoverageStatus, language: UiLanguage = 'ja'): string {
  const labels: Readonly<Record<UiLanguage, Readonly<Record<CoverageStatus, string>>>> = {
    ja: {
      observed: '観測している',
      observed_then_reduced: '観測後に縮約',
      not_observed_currently: '現在は観測していない',
      not_observed_by_design: '設計上、観測しない',
      not_observable_currently: '現在の仕組みでは観測できない',
      unknown_residual: '未知残差',
    },
    en: {
      observed: 'Observed',
      observed_then_reduced: 'Observed then reduced',
      not_observed_currently: 'Not currently observed',
      not_observed_by_design: 'Not observed by design',
      not_observable_currently: 'Not currently observable',
      unknown_residual: 'Unknown residual',
    },
  };
  return labels[language][status];
}

export function coverageReasonLabel(reason: CoverageReason, language: UiLanguage = 'ja'): string {
  const labels: Readonly<Record<UiLanguage, Readonly<Record<CoverageReason, string>>>> = {
    ja: {
      privacy_boundary: 'プライバシー境界',
      permission_boundary: '権限境界',
      platform_limitation: 'プラットフォーム上の限界',
      scope_limitation: '現在の対象範囲',
      user_selection: '利用者の選択',
      unknown: '未確定',
    },
    en: {
      privacy_boundary: 'Privacy boundary',
      permission_boundary: 'Permission boundary',
      platform_limitation: 'Platform limitation',
      scope_limitation: 'Current scope',
      user_selection: 'User selection',
      unknown: 'Undetermined',
    },
  };
  return labels[language][reason];
}
