import type { UiLanguage } from '../../i18n/ui';
import type { ObservationLogRecord } from '../models/observation';

export type ObservationTipId =
  | 'periodic_activity_without_observed_operation'
  | 'many_requests_after_page_start'
  | 'activity_near_content_edit'
  | 'activity_near_submit'
  | 'cross_origin_activity'
  | 'multiple_destination_hosts'
  | 'short_interval_repetition'
  | 'operation_not_correlated';

const OBSERVATION_TIP_IDS: ReadonlySet<string> = new Set<ObservationTipId>([
  'periodic_activity_without_observed_operation',
  'many_requests_after_page_start',
  'activity_near_content_edit',
  'activity_near_submit',
  'cross_origin_activity',
  'multiple_destination_hosts',
  'short_interval_repetition',
  'operation_not_correlated',
]);

export function isObservationTipId(value: string | undefined): value is ObservationTipId {
  return value !== undefined && OBSERVATION_TIP_IDS.has(value);
}

export interface ObservationTip {
  id: ObservationTipId;
  title: string;
  observedFact: string;
  notEstablished: readonly string[];
  commonPossibilities: readonly string[];
  nonInvasiveChecks: readonly string[];
  responsibilityReturn: string;
}

export interface ObservationTipAnalysis {
  tip: ObservationTip;
  status: 'available' | 'not_applicable';
  matchingRecordIds: readonly string[];
}

const RETURN_JA =
  'この説明は一般的な技術用途の可能性を列挙したものであり、当該サイトの実際の目的を示すものではありません。実際の目的、必要性、保存条件、第三者提供、停止方法を説明できるのは、当該通信を設計・運用する主体です。技術的に一般的であることは、利用者への説明が不要であることを意味しません。';
const RETURN_EN =
  'This explanation lists common technical possibilities. It does not establish the actual purpose of the site. The entity that designs and operates the communication remains responsible for explaining its actual purpose, necessity, retention conditions, third-party sharing, and available means of stopping it. A practice being technically common does not remove the need to explain it to users.';

export const OBSERVATION_TIPS: readonly ObservationTip[] = [
  {
    id: 'periodic_activity_without_observed_operation',
    title: '操作相関未確認の通信が一定間隔に近い形で続く',
    observedFact:
      '同じ閲覧サイト・通信先・通信方式の組合せで、利用者操作との相関が確認されていない通信開始が複数回観測されています。',
    notEstablished: ['通信の目的', '送信内容', '利用者操作が実際になかったこと', '必要性や適法性'],
    commonPossibilities: [
      'セッション維持',
      '通知確認',
      '状態同期',
      '接続確認',
      '分析または広告関連処理',
    ],
    nonInvasiveChecks: [
      'タブを前面／背面へ移したときの変化を見る',
      'ログイン／ログアウト前後を比較する',
      'サイト設定変更前後を比較する',
    ],
    responsibilityReturn: RETURN_JA,
  },
  {
    id: 'many_requests_after_page_start',
    title: 'ページ観測開始から5秒以内に複数の通信がある',
    observedFact:
      'ConnectBits自身のページ観測開始から5秒以内として記録された通信開始が、同じページ文脈で複数あります。',
    notEstablished: ['ページ初期化の完了', '認証目的', '分析目的', '通信の必要性'],
    commonPossibilities: [
      '画面構成データの取得',
      '状態復元',
      '認証状態確認',
      '通知取得',
      '複数サービスの初期化',
    ],
    nonInvasiveChecks: [
      '再読み込み時の再現性を確認する',
      'ログイン状態を変えて比較する',
      '同一サイトの別ページと比較する',
    ],
    responsibilityReturn: RETURN_JA,
  },
  {
    id: 'activity_near_content_edit',
    title: '内容変更操作と時間的に近い通信がある',
    observedFact: '信頼済みの内容変更操作から所定の相関窓内に通信開始が観測されています。',
    notEstablished: ['入力内容が通信へ含まれたこと', '因果関係', 'サーバー到達', '保存の有無'],
    commonPossibilities: ['自動保存', '入力支援', '共同編集同期', '候補生成', '状態更新'],
    nonInvasiveChecks: [
      '入力しない場合と比較する',
      '自動保存・同期設定を変えて比較する',
      '入力面の種類を変えて比較する',
    ],
    responsibilityReturn: RETURN_JA,
  },
  {
    id: 'activity_near_submit',
    title: '標準form送信操作と時間的に近い通信がある',
    observedFact: '標準formに関係する送信操作から所定の相関窓内に通信開始が観測されています。',
    notEstablished: ['その操作が通信を発生させたこと', '送信本文', '通信完了', '受信側の処理'],
    commonPossibilities: ['フォーム送信', '入力検証', '認証処理', '操作記録', '画面遷移準備'],
    nonInvasiveChecks: [
      '送信しない場合と比較する',
      '同じフォームで通信先とmethodを確認する',
      '公式説明を確認する',
    ],
    responsibilityReturn: RETURN_JA,
  },
  {
    id: 'cross_origin_activity',
    title: '別オリジンへの通信がある',
    observedFact: '閲覧中のページとは異なるオリジンへの通信開始が観測されています。',
    notEstablished: ['第三者提供', '追跡目的', '個人情報の送信', '通信先組織との契約関係'],
    commonPossibilities: ['CDN', '認証基盤', '外部API', '分析', '広告', '障害監視'],
    nonInvasiveChecks: [
      '公式のプライバシー説明やCookie一覧を確認する',
      'サイト設定変更前後を比較する',
      'ログイン前後を比較する',
    ],
    responsibilityReturn: RETURN_JA,
  },
  {
    id: 'multiple_destination_hosts',
    title: '複数の通信先ホストが観測されている',
    observedFact: '一つの表示範囲に、複数のdestinationHostが含まれています。',
    notEstablished: ['各ホストの運営主体', '目的の共通性', 'データ共有関係', '必要性'],
    commonPossibilities: ['機能別API', 'コンテンツ配信', '認証', '分析', '広告', '外部埋込み'],
    nonInvasiveChecks: [
      'ホスト別に件数と時点を比較する',
      '公式文書を確認する',
      'ページ機能や同意設定を変えて比較する',
    ],
    responsibilityReturn: RETURN_JA,
  },
  {
    id: 'short_interval_repetition',
    title: '同じ通信条件が短時間に反復している',
    observedFact:
      '同じ閲覧サイト・通信先・通信方式・methodの組合せが、短い時間間隔で複数回観測されています。',
    notEstablished: ['重複送信', '異常動作', '同一本文', '通信失敗や再試行'],
    commonPossibilities: ['分割取得', '複数イベント通知', '再試行', '状態同期', 'ポーリング'],
    nonInvasiveChecks: [
      '反復間隔と回数を確認する',
      '操作一回の場合と無操作時を比較する',
      'タブ表示状態を変えて比較する',
    ],
    responsibilityReturn: RETURN_JA,
  },
  {
    id: 'operation_not_correlated',
    title: '相関可能な利用者操作が確認されていない',
    observedFact:
      '通信開始の前に、ConnectBitsが相関対象とする内容変更操作または標準form送信操作を確認していません。',
    notEstablished: [
      '利用者操作が存在しなかったこと',
      '自動通信であること',
      '通信目的',
      '不適切性',
    ],
    commonPossibilities: [
      'ページ内部処理',
      '周期処理',
      '通知確認',
      '状態同期',
      '観測範囲外の操作との関係',
    ],
    nonInvasiveChecks: [
      '無操作時と操作時を比較する',
      'ページ観測開始からの時間関係を見る',
      '通信先・method・反復間隔を分ける',
    ],
    responsibilityReturn: RETURN_JA,
  },
] as const;

const EN_OBSERVATION_TIPS: readonly ObservationTip[] = [
  {
    id: 'periodic_activity_without_observed_operation',
    title: 'Uncorrelated requests continue at roughly regular intervals',
    observedFact:
      'Several request starts were observed for the same browsing site, destination, and communication mechanism without a correlated user action.',
    notEstablished: [
      'Purpose of the request',
      'Payload contents',
      'That no user action occurred',
      'Necessity or legality',
    ],
    commonPossibilities: [
      'Session maintenance',
      'Notification checks',
      'State synchronization',
      'Connectivity checks',
      'Analytics or advertising-related processing',
    ],
    nonInvasiveChecks: [
      'Compare foreground and background tab states',
      'Compare logged-in and logged-out states',
      'Compare before and after changing site settings',
    ],
    responsibilityReturn: RETURN_EN,
  },
  {
    id: 'many_requests_after_page_start',
    title: 'Multiple requests occur within five seconds of page observation',
    observedFact:
      'Several request starts in the same page context were recorded within five seconds of ConnectBits beginning page observation.',
    notEstablished: [
      'Completion of page initialization',
      'Authentication purpose',
      'Analytics purpose',
      'Necessity of the requests',
    ],
    commonPossibilities: [
      'Loading page-structure data',
      'State restoration',
      'Authentication-state checks',
      'Notification retrieval',
      'Initialization of multiple services',
    ],
    nonInvasiveChecks: [
      'Check whether the pattern repeats after reload',
      'Compare different login states',
      'Compare another page on the same site',
    ],
    responsibilityReturn: RETURN_EN,
  },
  {
    id: 'activity_near_content_edit',
    title: 'A request occurs close in time to a content edit',
    observedFact:
      'A request start was observed within the configured correlation window after a trusted content-edit action.',
    notEstablished: [
      'That input content was included',
      'Causation',
      'Server receipt',
      'Whether data was stored',
    ],
    commonPossibilities: [
      'Autosave',
      'Input assistance',
      'Collaborative synchronization',
      'Suggestion generation',
      'State updates',
    ],
    nonInvasiveChecks: [
      'Compare with no input',
      'Change autosave or synchronization settings',
      'Compare different input surfaces',
    ],
    responsibilityReturn: RETURN_EN,
  },
  {
    id: 'activity_near_submit',
    title: 'A request occurs close in time to a standard-form submission action',
    observedFact:
      'A request start was observed within the configured correlation window after a standard-form-related submission action.',
    notEstablished: [
      'That the action caused the request',
      'Submitted payload',
      'Request completion',
      'Processing by the receiver',
    ],
    commonPossibilities: [
      'Form submission',
      'Input validation',
      'Authentication',
      'Action logging',
      'Navigation preparation',
    ],
    nonInvasiveChecks: [
      'Compare without submitting',
      'Compare destination and method for the same form',
      'Review the operator’s explanation',
    ],
    responsibilityReturn: RETURN_EN,
  },
  {
    id: 'cross_origin_activity',
    title: 'A cross-origin request is observed',
    observedFact: 'A request start was observed to an origin different from the page being viewed.',
    notEstablished: [
      'Third-party disclosure',
      'Tracking purpose',
      'Transmission of personal information',
      'Contractual relationship with the destination organization',
    ],
    commonPossibilities: [
      'CDN',
      'Authentication infrastructure',
      'External API',
      'Analytics',
      'Advertising',
      'Failure monitoring',
    ],
    nonInvasiveChecks: [
      'Review the official privacy explanation or Cookie list',
      'Compare before and after changing site settings',
      'Compare logged-in and logged-out states',
    ],
    responsibilityReturn: RETURN_EN,
  },
  {
    id: 'multiple_destination_hosts',
    title: 'Multiple destination hosts are observed',
    observedFact: 'The current display range contains multiple destinationHost values.',
    notEstablished: [
      'Operator of each host',
      'Whether purposes are shared',
      'Data-sharing relationships',
      'Necessity',
    ],
    commonPossibilities: [
      'Feature-specific APIs',
      'Content delivery',
      'Authentication',
      'Analytics',
      'Advertising',
      'External embeds',
    ],
    nonInvasiveChecks: [
      'Compare counts and timing by host',
      'Review official documentation',
      'Compare page features or consent settings',
    ],
    responsibilityReturn: RETURN_EN,
  },
  {
    id: 'short_interval_repetition',
    title: 'The same request conditions repeat within a short interval',
    observedFact:
      'The same browsing site, destination, mechanism, and method combination was observed several times at short intervals.',
    notEstablished: [
      'Duplicate submission',
      'Malfunction',
      'Identical payload',
      'Failure or retry behavior',
    ],
    commonPossibilities: [
      'Segmented retrieval',
      'Multiple event notifications',
      'Retries',
      'State synchronization',
      'Polling',
    ],
    nonInvasiveChecks: [
      'Review repetition interval and count',
      'Compare one action with no action',
      'Change the tab visibility state',
    ],
    responsibilityReturn: RETURN_EN,
  },
  {
    id: 'operation_not_correlated',
    title: 'No correlatable user action was observed',
    observedFact:
      'Before the request start, ConnectBits did not observe a content edit or standard-form submission action eligible for correlation.',
    notEstablished: [
      'That no user action occurred',
      'That the request was automatic',
      'Request purpose',
      'Impropriety',
    ],
    commonPossibilities: [
      'Page-internal processing',
      'Periodic processing',
      'Notification checks',
      'State synchronization',
      'Relation to actions outside the observation boundary',
    ],
    nonInvasiveChecks: [
      'Compare action and no-action periods',
      'Review timing relative to page observation',
      'Separate destination, method, and repetition interval',
    ],
    responsibilityReturn: RETURN_EN,
  },
] as const;

export function observationTipsForLanguage(language: UiLanguage): readonly ObservationTip[] {
  return language === 'ja' ? OBSERVATION_TIPS : EN_OBSERVATION_TIPS;
}

function groups(
  records: readonly Readonly<ObservationLogRecord>[],
  keyOf: (record: Readonly<ObservationLogRecord>) => string | undefined,
): Map<string, Readonly<ObservationLogRecord>[]> {
  const result = new Map<string, Readonly<ObservationLogRecord>[]>();
  for (const record of records) {
    const key = keyOf(record);
    if (key === undefined) continue;
    result.set(key, [...(result.get(key) ?? []), record]);
  }
  return result;
}
function where(
  records: readonly Readonly<ObservationLogRecord>[],
  predicate: (record: Readonly<ObservationLogRecord>) => boolean,
): Set<string> {
  return new Set(records.filter(predicate).map((record) => record.eventId));
}
function periodic(records: readonly Readonly<ObservationLogRecord>[]): Set<string> {
  const result = new Set<string>();
  const grouped = groups(
    records.filter((record) => record.networkCorrelation === 'no_correlated_user_operation'),
    (record) =>
      `${record.domainKey}\n${record.destinationHost ?? ''}\n${record.networkMechanism ?? ''}`,
  );
  for (const group of grouped.values()) {
    if (group.length < 3) continue;
    const ordered = [...group].sort((a, b) => a.timestamp - b.timestamp);
    const intervals: number[] = [];
    for (let index = 1; index < ordered.length; index += 1) {
      const current = ordered[index];
      const previous = ordered[index - 1];
      if (current === undefined || previous === undefined) continue;
      const interval = current.timestamp - previous.timestamp;
      if (interval > 0 && interval <= 120_000) intervals.push(interval);
    }
    if (intervals.length >= 2 && Math.max(...intervals) / Math.min(...intervals) <= 2.5) {
      for (const record of ordered) result.add(record.eventId);
    }
  }
  return result;
}
function afterStart(records: readonly Readonly<ObservationLogRecord>[]): Set<string> {
  const result = new Set<string>();
  const grouped = groups(
    records.filter((record) => record.pageObservationTiming === 'within_5s_of_page_observation'),
    (record) => `${record.sessionId}\n${record.domainKey}`,
  );
  for (const group of grouped.values())
    if (group.length >= 5) for (const record of group) result.add(record.eventId);
  return result;
}
function repetition(records: readonly Readonly<ObservationLogRecord>[]): Set<string> {
  const result = new Set<string>();
  const grouped = groups(records, (record) =>
    record.destinationHost === undefined
      ? undefined
      : `${record.domainKey}\n${record.destinationHost}\n${record.networkMechanism ?? ''}\n${record.networkMethod ?? ''}`,
  );
  for (const group of grouped.values()) {
    const ordered = [...group].sort((a, b) => a.timestamp - b.timestamp);
    for (let index = 1; index < ordered.length; index += 1) {
      const current = ordered[index];
      const previous = ordered[index - 1];
      if (
        current !== undefined &&
        previous !== undefined &&
        current.timestamp - previous.timestamp <= 5_000
      ) {
        result.add(previous.eventId);
        result.add(current.eventId);
      }
    }
  }
  return result;
}

export function analyzeObservationTips(
  records: readonly Readonly<ObservationLogRecord>[],
  language: UiLanguage = 'ja',
): readonly ObservationTipAnalysis[] {
  const hosts = new Set(
    records
      .map((record) => record.destinationHost)
      .filter((host): host is string => host !== undefined && host !== 'unknown'),
  );
  const matches: Readonly<Record<ObservationTipId, Set<string>>> = {
    periodic_activity_without_observed_operation: periodic(records),
    many_requests_after_page_start: afterStart(records),
    activity_near_content_edit: where(
      records,
      (record) =>
        record.networkCorrelation === 'recent_content_edit' ||
        record.triggerType === 'network_activity_after_content_edit',
    ),
    activity_near_submit: where(
      records,
      (record) =>
        record.networkCorrelation === 'recent_submit_operation' ||
        record.triggerType === 'network_activity_after_submit_operation',
    ),
    cross_origin_activity: where(
      records,
      (record) => record.destinationRelation === 'cross_origin',
    ),
    multiple_destination_hosts:
      hosts.size >= 3
        ? where(records, (record) => record.destinationHost !== undefined)
        : new Set<string>(),
    short_interval_repetition: repetition(records),
    operation_not_correlated: where(
      records,
      (record) => record.networkCorrelation === 'no_correlated_user_operation',
    ),
  };
  return observationTipsForLanguage(language).map((tip) => {
    const matchingRecordIds = [...matches[tip.id]];
    return {
      tip,
      status: matchingRecordIds.length > 0 ? 'available' : 'not_applicable',
      matchingRecordIds,
    };
  });
}

export function matchedTipIdsForRecord(
  analyses: readonly ObservationTipAnalysis[],
  eventId: string,
): readonly ObservationTipId[] {
  return analyses
    .filter((analysis) => analysis.matchingRecordIds.includes(eventId))
    .map((analysis) => analysis.tip.id);
}
