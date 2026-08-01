export type CoverageStatus =
  | 'observed'
  | 'observed_then_reduced'
  | 'not_observed_by_design'
  | 'not_observable_currently'
  | 'unknown_residual';

export type CoverageReason =
  | 'privacy_boundary'
  | 'permission_boundary'
  | 'platform_limitation'
  | 'scope_limitation'
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
  networkObservationEnabled: boolean;
  networkPermissionGranted: boolean;
}

export function buildCoverageManifest(context: CoverageManifestContext): CoverageManifestEntry[] {
  const networkEnabled = context.networkObservationEnabled && context.networkPermissionGranted;

  return [
    {
      capabilityId: 'trusted-dom-events',
      label: '信頼済みDOM入力・操作イベント',
      detail: '入力、貼り付け、標準formのsubmit関連イベントを観測します。入力本文は取得しません。',
      status: 'observed',
      reason: 'scope_limitation',
      enabled: true,
    },
    {
      capabilityId: 'network-metadata',
      label: '対象通信の開始メタデータ',
      detail:
        '許可されたHTTP/HTTPSサイトのfetch/XHR系・Beacon/Ping系について、method、host、通信方式などを観測します。',
      status: 'observed',
      reason: context.networkPermissionGranted ? 'scope_limitation' : 'permission_boundary',
      enabled: networkEnabled,
      permissionGranted: context.networkPermissionGranted,
    },
    {
      capabilityId: 'url-reduction',
      label: '完全URLの縮約',
      detail:
        'Chromeから受け取ったURLはscheme、host、同一／別オリジン関係へ直ちに縮約し、path、query、fragment、credentialsを保存しません。',
      status: 'observed_then_reduced',
      reason: 'privacy_boundary',
      enabled: networkEnabled,
      permissionGranted: context.networkPermissionGranted,
    },
    {
      capabilityId: 'request-header-reduction',
      label: 'request headersの縮約',
      detail:
        'Cookieというヘッダー名の検出状態だけへ縮約します。ヘッダー値、Cookie名、Cookie値、個数は保存・表示しません。',
      status: 'observed_then_reduced',
      reason: 'privacy_boundary',
      enabled: networkEnabled,
      permissionGranted: context.networkPermissionGranted,
    },
    {
      capabilityId: 'raw-input',
      label: '入力本文・パスワード・決済番号',
      detail:
        '取得可能性があっても、利用者の主権を損なうためDSSI Core Aの保存・表示経路へ接続しません。',
      status: 'not_observed_by_design',
      reason: 'privacy_boundary',
      enabled: false,
    },
    {
      capabilityId: 'request-body',
      label: 'request body・送信本文',
      detail: 'webRequestで要求せず、分類・保存・表示しません。',
      status: 'not_observed_by_design',
      reason: 'privacy_boundary',
      enabled: false,
    },
    {
      capabilityId: 'stored-cookies',
      label: 'ブラウザに保存されたCookie',
      detail:
        '追加のcookies権限で接触可能になる領域ですが、Core Aでは権限侵襲を避けるためインターフェイスへ接続しません。',
      status: 'not_observed_by_design',
      reason: 'permission_boundary',
      enabled: false,
    },
    {
      capabilityId: 'page-main-world-memory',
      label: 'ページ内部メモリと入力値の複製',
      detail:
        'ページ本体の実行環境への侵襲的な注入を行わないため、保持・複製・送信待ち状態は確認しません。',
      status: 'not_observed_by_design',
      reason: 'privacy_boundary',
      enabled: false,
    },
    {
      capabilityId: 'memory-cache',
      label: 'インメモリキャッシュ内で完結する処理',
      detail:
        '現在のwebRequest観測面では確認できない場合があります。未観測は不存在を意味しません。',
      status: 'not_observable_currently',
      reason: 'platform_limitation',
      enabled: false,
    },
    {
      capabilityId: 'established-streams',
      label: '確立済みWebSocket／WebTransport内部通信',
      detail: '接続後の個別メッセージやセッション内部の通信は現在の観測面では確認できません。',
      status: 'not_observable_currently',
      reason: 'platform_limitation',
      enabled: false,
    },
    {
      capabilityId: 'permission-excluded-network',
      label: '権限外・Chrome非公開の通信',
      detail:
        'DSSIに許可されていない通信、またはChromeが拡張機能へ公開しない事象は確認できません。通信自体が遮断されるという意味ではありません。',
      status: 'not_observable_currently',
      reason: 'permission_boundary',
      enabled: false,
    },
    {
      capabilityId: 'unknown-residual',
      label: '未列挙の観測不能領域',
      detail:
        'この一覧は死角の全体を保証しません。ブラウザ、ページ実装、通信方式、権限状態の変化により未知の残差が存在し得ます。',
      status: 'unknown_residual',
      reason: 'unknown',
      enabled: false,
    },
  ];
}

export function coverageStatusLabel(status: CoverageStatus): string {
  switch (status) {
    case 'observed':
      return '観測している';
    case 'observed_then_reduced':
      return '観測後に縮約';
    case 'not_observed_by_design':
      return '設計上、観測しない';
    case 'not_observable_currently':
      return '現在の仕組みでは観測できない';
    case 'unknown_residual':
      return '未知残差';
  }
}

export function coverageReasonLabel(reason: CoverageReason): string {
  switch (reason) {
    case 'privacy_boundary':
      return 'プライバシー境界';
    case 'permission_boundary':
      return '権限境界';
    case 'platform_limitation':
      return 'プラットフォーム上の限界';
    case 'scope_limitation':
      return '現在の対象範囲';
    case 'unknown':
      return '未確定';
  }
}
