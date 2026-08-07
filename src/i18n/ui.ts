export type UiLanguageSetting = 'auto' | 'ja' | 'en';
export type UiLanguage = 'ja' | 'en';

const JA_MESSAGES = {
  productName: 'ConnectBits',
  productTagline: '見えなかった接続を、判断できる断片として返す。',
  projectLineage: 'DSSI Core A 開発系列',
  previewLabel: 'Public Preview',
  navSetup: '設定とプライバシー',
  navLog: '観測ログ',
  navReader: 'Log Reader',
  navSetupReview: '導入説明を見直す',
  navLanguage: '表示言語',
  languageAuto: 'ブラウザーに合わせる',
  languageJapanese: '日本語',
  languageEnglish: 'English',
  enabled: '有効',
  viscosityLevel: '粘性レベル',
  reportingMode: '報告モード',
  reportingStandard: '標準',
  reportingStandardLong: '標準 — 選別された観測を報告',
  reportingMax: 'MAX — 診断と観測限界を最大限表示',
  maxExplanation: 'MAXはLevel 4ではなく、現在の観測範囲と死角を学習的に可視化する特別モードです。',
  communicationPulses: '小型通信パルス',
  communicationPulsesHelp:
    'Level 2・3またはMAXで有効です。色は危険度ではなく観測経路の識別補助です。',
  sessionObservationCount: '観測件数（現在のブラウザーセッション）',
  recentObservations: '最新の観測',
  recentEmpty: '入力面に関する観測はまだありません。',
  openLog: '観測ログを表示',
  openReader: '保存済みログを読む',
  openSetup: '設定とプライバシー',
  setupTitle: '設定とプライバシー',
  setupIntro:
    'ConnectBitsは入力本文、パスワード、決済番号、クリップボード本文、通信本文を保存しません。保存対象は設定と、本文を含まない観測メタデータです。',
  localFunctions: 'ローカル機能',
  observationBoundary: '観測境界',
  observationStandard: '標準設定で観測 — ページ上の限定観測＋通信メタデータ',
  observationDomOnly: '通信メタデータを観測しない — ページ上の限定観測のみ',
  observationPaused: '今は観測を開始しない',
  observationSelectionHelp:
    '通信メタデータ観測を外すと、任意のwebRequest権限だけを撤回します。操作者自身が関与し画面上で自覚できる、限定的なDOM上の操作・表示変化は、ページ上の限定観測を選んでいる間は継続します。「今は観測を開始しない」では両方を停止します。',
  localClassification: 'ローカル内容分類',
  networkObservation: '通信開始メタデータの補助観測（任意権限）',
  networkObservationExplanation:
    '標準設定を選んだ場合だけ、Chromeの任意権限webRequestと、その観測に必要なHTTP/HTTPSホストアクセスを求めます。標準モードでは内容変更または標準form送信操作に近接した通信を通常ログへ残します。MAXでは相関可能な利用者操作を確認できない対象通信も診断ログへ記録します。通信本文は要求・取得せず、URLのpath・query・fragmentは保存しません。request headersはCookieヘッダーの存在検出にだけ一時利用し、値は保存・表示しません。',
  maxScopeExplanation:
    'MAXは権限や取得内容を増やすモードではありません。現在の観測面で取得できた診断事象と、見ない・見えない領域の説明量を増やします。',
  chipPosition: 'チップ・通信パルス表示位置',
  positionTop: '上',
  positionTopRight: '右上',
  positionRight: '右',
  positionBottomRight: '右下',
  positionBottom: '下',
  positionBottomLeft: '左下',
  positionLeft: '左',
  positionTopLeft: '左上',
  positionHelp: '表示中の文章チップ右上にある移動ボタンでも、時計回りに位置を変更できます。',
  pulseDisplayHeading: '通信パルス表示',
  pulseDisplayEnabled: '小型通信パルスを表示',
  communicationTextEnabled: '通信の文章チップも表示',
  pulseDisplayExplanation:
    'Level 2・3またはMAXで、標準formのDOM送信境界と、webRequestで観測した通信を小型の幾何アイコンとして表示します。通信の文章チップは初期状態では無効です。色は観測経路の識別補助であり、安全・危険・注意を示しません。通信本文は要求・取得していません。',
  duration: '表示時間',
  duration300: '瞬間 — 300ms',
  duration700: '短い — 700ms',
  duration1500: '標準 — 1500ms',
  duration3000: '長い — 3秒',
  duration10000: '確認 — 10秒',
  duration30000: '調査 — 30秒',
  duration60000: '長時間 — 60秒',
  duration0: '固定 — 手動で消すまで',
  iconSize: 'アイコンサイズ',
  iconSmall: '小 — 約4.2mm相当',
  iconMedium: '中 — 約4.8mm相当',
  domColor: 'DOM観測の色',
  webRequestColor: 'webRequest観測の色',
  colorMagenta: 'マゼンタ',
  colorCyan: 'シアン',
  colorYellow: 'イエロー',
  colorNeutral: '無色',
  pulseOpacity: '通信パルスの不透明度',
  howToReadPulses: '通信パルスの読み方',
  pulseGuideOpen: '読み方を確認',
  pulseGuideIntro: 'パルスは通信または送信操作の観測を示します。',
  pulseGuide1:
    '外周形はHTTP methodを示します。GETは円、POSTは四角、PUTはひし形、PATCHは六角形、DELETEは三角形です。',
  pulseGuide2: '中央のS／F／Bは標準form、fetch/XHR、Beacon/Pingを示します。',
  pulseGuide3: '色は観測経路を示し、安全性・危険性・注意を示しません。',
  pulseGuide4: '右上の●／−／·／?はCookieヘッダーの存在検出状態です。Cookie値は取得しません。',
  pulseGuide5: '左上の短線は別オリジンを示します。',
  pulseGuide6: '操作との時間的相関は、因果関係、通信目的、利用者の意図を証明しません。',
  pulseGuide7: 'パルスが表示されなかったことは、通信がなかったことを意味しません。',
  pulseGuide8: 'ConnectBitsは通信本文を要求・取得していません。',
  pulseGuideProfile:
    'ページ上の操作部では表示を一時変更できます。ピン操作でhostname別に保存し、解除すると全体設定へ戻ります。粘性に基づく注意チップは通信表示の抑制から独立します。',
  persistentHistory: '永続履歴',
  save: '保存',
  clearSession: 'セッション観測ログを消去',
  currentCoverage: '現在の観測範囲',
  coverageIntro:
    'ConnectBitsが観測するもの、観測後に縮約するもの、主権保全のため接続しないもの、現在の仕組みでは見えないものを分けて表示します。この一覧自体も完全ではなく、未列挙の未知が残ります。',
  permissionState: '権限状態',
  permissionGranted: '通信観測権限：許可済み',
  permissionNotGranted: '通信観測権限：未許可',
  permissionJudgmentBoundary: '権限の許可は、処理の必要性や妥当性が確認されたことを意味しません。',
  logTitle: '観測ログ',
  logIntro:
    '通常ログと診断ログを、簡易ストリームから照合できます。入力本文、パスワード、決済番号、クリップボード本文、通信本文は含まれません。',
  allTimeline: '全時系列',
  activityOnly: '通常のみ',
  diagnosticOnly: '診断のみ',
  simpleStream: '簡易ストリーム',
  detailedTable: '詳細表（高度な確認）',
  countSuffix: '件数',
  refresh: '更新',
  showCoverage: '観測範囲を確認',
  clearCurrent: '表示中のログを消去',
  clearAll: 'すべてのログを消去',
  exportHeading: '観測ログを保存',
  format: '形式',
  formatJson: 'JSON — 観測条件を含む',
  formatCsv: 'CSV＋context JSON — 表計算向け',
  formatBoth: 'JSON＋CSV',
  scope: '範囲',
  allRecords: '全ログ',
  currentView: '現在表示中',
  export: '保存',
  exportBoundary:
    '保存するのはConnectBitsが観測時に生成した一次観測記録です。保存時に通信の集約、危険度判定、目的分類、欠損値補完を加えません。このログは入力内容、通信内容、利用者の意図、責任、有害性、安全性を証明しません。保存後のファイルは利用者の管理領域へ移ります。現在の版では暗号化・署名・改変検知を提供しません。',
  noLogs: '観測ログはありません。',
  advancedReading: '詳細な読み方',
  advancedReadingSummary: '観測語、相関、フレーム、Cookieヘッダーの境界を確認する',
  close: '閉じる',
  readerTitle: 'ConnectBits Log Reader',
  readerKicker: 'DSSI Core A / Local Read-Only Collation Interface',
  readerLocalOnly: '読取専用・ローカル',
  readerBoundaryHeading: '利用境界',
  readerBoundary1:
    'このリーダーは原ログを変更しません。並べ替え、絞り込み、集計は表示上の変換です。',
  readerBoundary2:
    'このログは利用者自身の判断支援を目的とし、完全性、網羅性、証拠能力を保証しません。',
  readerBoundary3:
    '一般的な技術用途の説明は、当該サイトの実際の目的を示すものではありません。実際の目的、必要性、保存条件、第三者提供、停止方法を説明できるのは運営者です。',
  loadLog: '観測ログを読み込む',
  supportedFormat: '対応形式: dssi-observation-log / formatVersion 1 / record schemaVersion 1〜10',
  jsonFile: 'JSONファイル',
  noFile: 'ファイルは選択されていません。',
  waiting: '読込待機中です。',
  summary: '概要',
  exportedAt: 'エクスポート日時',
  appVersion: 'アプリ版',
  recordSchema: 'レコードschema',
  sourceRecordCount: '原記録件数',
  visibleRecordCount: '表示中件数',
  visiblePeriod: '表示中期間',
  browsingSiteCount: '閲覧サイト数',
  destinationHostCount: '通信先ホスト数',
  originRelation: '同一／別オリジン',
  operationCorrelation: '操作相関',
  cueState: '表示対象',
  settingsSnapshots: '設定スナップショット',
  queryHeading: '絞り込みと並べ替え',
  noFilters: 'フィルターなし',
  clearFilters: 'すべて解除',
  searchLabel: '検索（閲覧サイト・通信先・triggerType）',
  sort: '並べ替え',
  sortTimestampDesc: '時刻 降順',
  sortTimestampAsc: '時刻 昇順',
  sortDomain: '閲覧サイト',
  sortDestination: '通信先',
  sortTrigger: 'triggerType',
  all: 'すべて',
  dateFrom: '日時（以降）',
  dateTo: '日時（以前）',
  detailFilters: '詳細フィルター',
  multiSelectHelp:
    '同一欄の複数選択はOR、異なる欄どうしはANDです。CtrlまたはCommandキーで複数選択できます。',
  browsingSite: '閲覧サイト',
  destination: '通信先',
  groupsHeading: 'まとまりから原記録へ戻る',
  groupsHelp: '件数を選ぶと対応するフィルターを適用し、時系列一覧へ移動します。',
  byBrowsingSite: '閲覧サイト別',
  byDestination: '通信先別',
  byCorrelation: '操作相関別',
  byMechanism: '通信方式別',
  byOrigin: '同一／別オリジン別',
  byCue: '表示対象別',
  recordsHeading: '時系列一覧',
  previous: '前へ',
  next: '次へ',
  noMatchingRecords: '条件に一致するレコードはありません。',
  time: '時刻',
  frame: 'フレーム',
  observation: '観測',
  mechanism: '方式',
  selectedRecord: '選択レコード',
  selectRecord: '時系列一覧から一件を選択してください。',
  rawValue: '原値（読取専用）',
  observationTips: '観測パターン別チップス',
  tipsNotDiagnosis: '自動診断ではありません。この表示範囲に関連し得る読解補助です。',
  setupWizardTitle: '導入と権限の確認',
  setupWizardIntro:
    'ConnectBitsが扱う情報と扱わない情報を、権限を付与する前に一項目ずつ確認します。所要時間の目安は2〜3分です。',
  step: 'ステップ',
  nextStep: '次へ',
  previousStep: '戻る',
  decideLater: '今は決めない',
  onboardingStep1Title: 'ConnectBitsの目的',
  onboardingStep1Body:
    'ConnectBitsは、通常は見えにくいブラウザー上の入力面、送信操作、通信開始メタデータを可視化し、利用者へ判断材料を返します。通信の安全性、目的、必要性、適法性を自動的に確定しません。',
  onboardingStep2Title: '観測するもの・観測しないもの',
  onboardingObserveHeading: '選択に応じて観測するもの',
  onboardingObserve1:
    'ページ上の限定的なDOMイベント（入力開始、貼り付け、標準form送信操作など。入力本文は取得しない）',
  onboardingObserve2: '任意権限を許可した場合だけ、ブラウザーが提供する通信開始メタデータ',
  onboardingObserve3: 'Cookieヘッダーの存在検出（値は取得しない）',
  onboardingObserve4: '閲覧中ページと通信先のオリジン関係、操作との時間的近接',
  onboardingNotObserveHeading: '観測しないもの',
  onboardingNot1: '通信本文、フォームへ入力された本文、Cookie値',
  onboardingNot2: 'PC内に保存されたCookie一覧、Local Storage、IndexedDBの内容',
  onboardingNot3: '閲覧履歴全体、位置情報、カメラ、マイク、連絡先、ファイル内容',
  onboardingNot4: '通信目的、運営者の意図、安全性、適法性',
  onboardingStep3Title: '処理条件と説明責任',
  onboardingPurpose:
    '利用目的：通信の発生と限定的な付随情報を可視化し、利用者が自分で確認・比較・判断できるようにします。',
  onboardingFrequency:
    '取得頻度：対象ページで該当イベントや通信が発生するたびに観測します。PC全体を定期走査しません。',
  onboardingStorage:
    '保存：設定、導入確認、ホスト別表示プロファイルは端末内のローカル領域へ保存し、変更・リセットまたは拡張機能の削除まで保持します。観測ログと設定スナップショットは、ブラウザー再起動や拡張再読み込みで消えるセッション領域に保持します。利用者が明示的にエクスポートしたログファイルは、利用者が削除するまで残ります。',
  onboardingExternal:
    '外部通信・第三者提供：ConnectBits自身は観測ログを開発者、外部サーバー、第三者へ送信・提供しません。観測対象サイト自身の通信について同じことを保証する文ではありません。',
  onboardingFuture:
    '重要な用途、保存方法、権限の変更時には改めて説明し、再確認を求めます。現在の確認を未提示の将来用途への包括同意とは扱いません。',
  onboardingSupport:
    '問い合わせ：事実に基づく報告を受け付け、可能な範囲で受領状態を示します。個別調査、修正、期限付き対応、継続支援は保証しません。受領は責任承認や修正義務の確定を意味しません。',
  onboardingStep4Title: '確認と選択',
  ackObservation: '観測する情報と観測しない情報を確認した',
  ackFrequency: '観測が行われる条件と頻度を確認した',
  ackStorage: 'ローカル保存、セッション保存、エクスポート後の保持条件を確認した',
  ackExternal: 'ConnectBits自身が観測ログを外部送信・第三者提供しないことを確認した',
  ackJudgment: 'ConnectBitsが通信の目的や危険性を確定しないことを確認した',
  ackSupport: '問い合わせと対応に上記の限界があることを確認した',
  ackDecision: '観測境界を三つから選び、あとから変更できることを確認した',
  onboardingChoiceIntro: '観測方法を選択してください',
  onboardingChangeable: 'いつでもこの選択は変更できます。',
  onboardingCoverageAfter:
    '何を観測しているか、何を現在観測していないか、何を設定によって観測対象から外しているか、何を仕組み上観測できないかは、導入後に「設定とプライバシー」で確認できます。',
  allowNetwork: '標準設定で観測を開始',
  onboardingStandardDetail:
    'ページ上の限定観測と、通信先やHTTP methodなどの通信メタデータ観測を開始します。',
  startLocalOnly: '通信メタデータを観測せず開始',
  onboardingDomOnlyDetail:
    '通信メタデータは観測しません。ページ上の限定的な操作・表示変化の観測は継続します。',
  pauseObservation: '今は観測を開始しない',
  onboardingPausedDetail: '観測を開始せず、拡張機能を休止状態にします。あとから設定できます。',
  permissionMeaning:
    '権限の付与を、ConnectBitsが行う個々の判断への同意とみなすことはありません。また、ConnectBitsの観測や判定は、通信の安全性・妥当性を保証するものではありません。',
  onboardingComplete:
    '導入確認が完了しました。対象ページを再読み込みすると、現在の設定が確実に反映されます。',
  openObservationLog: '観測ログを開く',
  openSetupAfter: '設定とプライバシーを開く',
  statusSaved: '設定を保存しました。',
  statusSavedReload: '設定を保存しました。対象ページの再読み込み後に確実に反映されます。',
  statusMaxSaved: 'MAX報告モードを保存しました。対象ページの再読み込み後に反映されます。',
  statusPermissionDenied: '通信開始メタデータ観測の権限が付与されなかったため、無効のままです。',
  statusPermissionError:
    '通信観測に必要な任意権限を変更できませんでした。権限状態を保ったまま、選択の保存を中止しました。',
  statusObservationStandard:
    '標準設定を保存しました。ページ上の限定観測と通信メタデータ観測を行います。',
  statusObservationDomOnly:
    '選択を変更し、任意のwebRequest権限を撤回しました。ページ上の限定観測は継続します。',
  statusObservationPaused:
    '選択を変更し、任意のwebRequest権限を撤回しました。現在、観測は停止しています。',
  statusNetworkEnabled:
    '設定を保存しました。通信本文、URL path/query、ヘッダー値は保存しません。対象ページの再読み込み後に確実に反映されます。',
  statusNetworkDisabled:
    '設定を保存しました。通信開始メタデータ観測は無効です。対象ページの再読み込み後に確実に反映されます。',
  statusSessionCleared: 'セッション観測ログを消去しました。',
  statusExported: '{count}件の一次観測記録を保存しました。保存時の追加集約・判定は行っていません。',
  confirmClearAll: '通常ログと診断ログをすべて消去しますか？',
  confirmClearLayer: '{label}を消去しますか？',
  activityLog: '通常ログ',
  diagnosticLog: '診断ログ',
  clearedAll: '通常ログと診断ログを消去しました。',
  clearedLayer: '{label}を消去しました。',
  unknown: '不明',
  unavailable: '取得不能',
  valueMissing: '値なし',
  active: '現在有効',
  inactive: '現在は観測経路へ未接続',
  permissionYes: '権限あり',
  permissionNo: '権限なし',
} as const;

export type UiMessageKey = keyof typeof JA_MESSAGES;

function isUiMessageKey(value: string | undefined): value is UiMessageKey {
  return value !== undefined && Object.hasOwn(JA_MESSAGES, value);
}

const EN_MESSAGES: Record<UiMessageKey, string> = {
  productName: 'ConnectBits',
  productTagline: 'Return hidden connections as fragments people can judge.',
  projectLineage: 'Developed under DSSI Core A',
  previewLabel: 'Public Preview',
  navSetup: 'Settings & privacy',
  navLog: 'Observation log',
  navReader: 'Log Reader',
  navSetupReview: 'Review setup',
  navLanguage: 'Display language',
  languageAuto: 'Follow browser',
  languageJapanese: '日本語',
  languageEnglish: 'English',
  enabled: 'Enabled',
  viscosityLevel: 'Viscosity level',
  reportingMode: 'Reporting mode',
  reportingStandard: 'Standard',
  reportingStandardLong: 'Standard — report selected observations',
  reportingMax: 'MAX — show diagnostic events and known observation limits',
  maxExplanation:
    'MAX is not Level 4. It is a special learning mode that makes the current observation surface and its blind spots more visible.',
  communicationPulses: 'Compact communication pulses',
  communicationPulsesHelp:
    'Available at Level 2, Level 3, or MAX. Color identifies an observation route, not risk.',
  sessionObservationCount: 'Observations in the current browser session',
  recentObservations: 'Recent observations',
  recentEmpty: 'No input-surface observations yet.',
  openLog: 'Open observation log',
  openReader: 'Read an exported log',
  openSetup: 'Settings & privacy',
  setupTitle: 'Settings & privacy',
  setupIntro:
    'ConnectBits does not store input text, passwords, payment numbers, clipboard content, or network payloads. It stores settings and observation metadata that excludes those contents.',
  localFunctions: 'Local functions',
  observationBoundary: 'Observation boundary',
  observationStandard: 'Standard observation — limited page observation + communication metadata',
  observationDomOnly: 'No communication metadata — limited page observation only',
  observationPaused: 'Do not start observation now',
  observationSelectionHelp:
    'Removing communication-metadata observation withdraws only the optional webRequest permission. Limited DOM actions and display changes in which the operator participates and can notice continue while limited page observation is selected. “Do not start observation now” stops both layers.',
  localClassification: 'Local surface classification',
  networkObservation: 'Supplementary request-start metadata observation (optional permission)',
  networkObservationExplanation:
    'ConnectBits requests optional webRequest and the HTTP/HTTPS host access required by that API only when standard observation is selected. Standard mode records selected requests near a trusted content edit or standard-form submission action. MAX also records selected requests for which no correlatable user action was observed. Network payloads are not requested or collected, and URL paths, queries, and fragments are not stored. Request headers are used transiently only to detect the presence of a Cookie header; values are not stored or displayed.',
  maxScopeExplanation:
    'MAX does not increase permissions or collected content. It increases the amount of diagnostic information and explanations about observed, reduced, intentionally excluded, currently unobservable, and unknown areas.',
  chipPosition: 'Chip and pulse position',
  positionTop: 'Top',
  positionTopRight: 'Top right',
  positionRight: 'Right',
  positionBottomRight: 'Bottom right',
  positionBottom: 'Bottom',
  positionBottomLeft: 'Bottom left',
  positionLeft: 'Left',
  positionTopLeft: 'Top left',
  positionHelp: 'The move control on an explanatory chip also cycles the position clockwise.',
  pulseDisplayHeading: 'Communication pulse display',
  pulseDisplayEnabled: 'Show compact communication pulses',
  communicationTextEnabled: 'Also show communication text chips',
  pulseDisplayExplanation:
    'At Level 2, Level 3, or MAX, ConnectBits represents standard-form DOM submission boundaries and requests observed through webRequest as compact geometric icons. Communication text chips are off by default. Color identifies the observation route and does not mean safe, dangerous, or caution. Network payloads are not requested or collected.',
  duration: 'Display duration',
  duration300: 'Instant — 300 ms',
  duration700: 'Short — 700 ms',
  duration1500: 'Standard — 1500 ms',
  duration3000: 'Long — 3 seconds',
  duration10000: 'Review — 10 seconds',
  duration30000: 'Inspect — 30 seconds',
  duration60000: 'Extended — 60 seconds',
  duration0: 'Pinned — until manually cleared',
  iconSize: 'Icon size',
  iconSmall: 'Small — about 4.2 mm',
  iconMedium: 'Medium — about 4.8 mm',
  domColor: 'DOM observation color',
  webRequestColor: 'webRequest observation color',
  colorMagenta: 'Magenta',
  colorCyan: 'Cyan',
  colorYellow: 'Yellow',
  colorNeutral: 'Neutral',
  pulseOpacity: 'Communication pulse opacity',
  howToReadPulses: 'How to read communication pulses',
  pulseGuideOpen: 'Open reading guide',
  pulseGuideIntro: 'A pulse marks an observed communication event or submission action.',
  pulseGuide1:
    'The outer geometry represents the HTTP method: GET is a circle, POST a square, PUT a diamond, PATCH a hexagon, and DELETE a triangle.',
  pulseGuide2: 'The center glyph S, F, or B represents a standard form, fetch/XHR, or Beacon/Ping.',
  pulseGuide3:
    'Color represents the observation route. It does not mean safe, dangerous, or caution.',
  pulseGuide4:
    'The top-right ●, −, ·, or ? represents the Cookie-header detection state. Cookie values are not collected.',
  pulseGuide5: 'A short top-left mark represents a cross-origin destination.',
  pulseGuide6:
    'Temporal correlation with an action does not prove causation, purpose, or user intent.',
  pulseGuide7: 'The absence of a displayed pulse does not prove the absence of communication.',
  pulseGuide8: 'ConnectBits does not request or collect network payloads.',
  pulseGuideProfile:
    'The page HUD can apply temporary display changes. Pinning stores them per hostname; removing the profile returns to global settings. Viscosity-based attention chips remain independent of communication-display suppression.',
  persistentHistory: 'Persistent history',
  save: 'Save',
  clearSession: 'Clear session observation log',
  currentCoverage: 'Current observation coverage',
  coverageIntro:
    'ConnectBits separates what it observes, what it reduces after observation, what it intentionally does not connect for sovereignty and privacy, what the current mechanism cannot observe, and unknown residuals. This list does not guarantee a complete map of blind spots.',
  permissionState: 'Permission state',
  permissionGranted: 'Network-observation permission: granted',
  permissionNotGranted: 'Network-observation permission: not granted',
  permissionJudgmentBoundary:
    'Granting a permission does not establish the necessity or appropriateness of the processing.',
  logTitle: 'Observation log',
  logIntro:
    'Review activity and diagnostic records from the compact stream. Input text, passwords, payment numbers, clipboard content, and network payloads are not included.',
  allTimeline: 'All timeline',
  activityOnly: 'Activity only',
  diagnosticOnly: 'Diagnostic only',
  simpleStream: 'Compact stream',
  detailedTable: 'Detailed table (advanced)',
  countSuffix: 'records',
  refresh: 'Refresh',
  showCoverage: 'Review observation coverage',
  clearCurrent: 'Clear current view',
  clearAll: 'Clear all logs',
  exportHeading: 'Export observation log',
  format: 'Format',
  formatJson: 'JSON — includes observation context',
  formatCsv: 'CSV + context JSON — spreadsheet use',
  formatBoth: 'JSON + CSV',
  scope: 'Scope',
  allRecords: 'All records',
  currentView: 'Current view',
  export: 'Export',
  exportBoundary:
    'The export contains primary observation records generated by ConnectBits. Export does not add request aggregation, risk judgment, purpose classification, or inferred missing values. The log does not prove input content, network content, user intent, responsibility, harm, or safety. After export, the file enters the user’s management boundary. This version does not provide encryption, digital signatures, or tamper detection.',
  noLogs: 'No observation records.',
  advancedReading: 'Detailed reading guide',
  advancedReadingSummary:
    'Review observation terms, correlation, frames, and Cookie-header boundaries',
  close: 'Close',
  readerTitle: 'ConnectBits Log Reader',
  readerKicker: 'DSSI Core A / Local Read-Only Collation Interface',
  readerLocalOnly: 'Read-only · local',
  readerBoundaryHeading: 'Use boundary',
  readerBoundary1:
    'This reader does not modify the source log. Sorting, filtering, and aggregation are display transformations.',
  readerBoundary2:
    'The log supports the user’s own judgment and does not guarantee completeness, comprehensive coverage, or evidentiary reliability.',
  readerBoundary3:
    'A list of common technical possibilities does not establish the actual purpose of a site. The operator remains responsible for explaining purpose, necessity, retention, third-party sharing, and means of refusal or suspension.',
  loadLog: 'Load observation log',
  supportedFormat: 'Supported: dssi-observation-log / formatVersion 1 / record schemaVersion 1–10',
  jsonFile: 'JSON file',
  noFile: 'No file selected.',
  waiting: 'Waiting for a log file.',
  summary: 'Summary',
  exportedAt: 'Exported at',
  appVersion: 'Application version',
  recordSchema: 'Record schema',
  sourceRecordCount: 'Source records',
  visibleRecordCount: 'Visible records',
  visiblePeriod: 'Visible period',
  browsingSiteCount: 'Browsing sites',
  destinationHostCount: 'Destination hosts',
  originRelation: 'Same/cross origin',
  operationCorrelation: 'Action correlation',
  cueState: 'Presentation target',
  settingsSnapshots: 'Settings snapshots',
  queryHeading: 'Filter and sort',
  noFilters: 'No filters',
  clearFilters: 'Clear all',
  searchLabel: 'Search browsing site, destination, or triggerType',
  sort: 'Sort',
  sortTimestampDesc: 'Time descending',
  sortTimestampAsc: 'Time ascending',
  sortDomain: 'Browsing site',
  sortDestination: 'Destination',
  sortTrigger: 'triggerType',
  all: 'All',
  dateFrom: 'From',
  dateTo: 'To',
  detailFilters: 'Detailed filters',
  multiSelectHelp:
    'Multiple values in one field use OR. Different fields use AND. Use Ctrl or Command for multi-select.',
  browsingSite: 'Browsing site',
  destination: 'Destination',
  groupsHeading: 'Return from groups to source records',
  groupsHelp: 'Select a count to apply the corresponding filter and move to the timeline.',
  byBrowsingSite: 'By browsing site',
  byDestination: 'By destination',
  byCorrelation: 'By action correlation',
  byMechanism: 'By mechanism',
  byOrigin: 'By origin relation',
  byCue: 'By presentation target',
  recordsHeading: 'Timeline',
  previous: 'Previous',
  next: 'Next',
  noMatchingRecords: 'No records match the current conditions.',
  time: 'Time',
  frame: 'Frame',
  observation: 'Observation',
  mechanism: 'Mechanism',
  selectedRecord: 'Selected record',
  selectRecord: 'Select one record from the timeline.',
  rawValue: 'Raw values (read-only)',
  observationTips: 'Observation-pattern tips',
  tipsNotDiagnosis: 'These are reading aids, not automated diagnoses.',
  setupWizardTitle: 'Setup and permission review',
  setupWizardIntro:
    'Review what ConnectBits handles and does not handle before granting permissions. Estimated time: 2–3 minutes.',
  step: 'Step',
  nextStep: 'Next',
  previousStep: 'Back',
  decideLater: 'Decide later',
  onboardingStep1Title: 'Purpose of ConnectBits',
  onboardingStep1Body:
    'ConnectBits makes selected browser input surfaces, submission actions, and request-start metadata visible so that users can retain conditions for their own judgment. It does not automatically determine safety, purpose, necessity, or legality.',
  onboardingStep2Title: 'Observed and excluded information',
  onboardingObserveHeading: 'Observed according to your selection',
  onboardingObserve1:
    'Limited DOM events on a page, such as input start, paste, and standard-form submission actions; input content is not collected',
  onboardingObserve2:
    'Request-start metadata exposed by the browser, only when the optional permission is granted',
  onboardingObserve3: 'Presence of a Cookie header; values are not collected',
  onboardingObserve4:
    'Origin relation between the page and destination, and temporal proximity to selected actions',
  onboardingNotObserveHeading: 'Not observed',
  onboardingNot1: 'Network payloads, form input content, and Cookie values',
  onboardingNot2: 'Stored-Cookie inventories, Local Storage contents, and IndexedDB contents',
  onboardingNot3:
    'Full browsing history, location, camera, microphone, contacts, and file contents',
  onboardingNot4: 'Communication purpose, operator intent, safety, and legality',
  onboardingStep3Title: 'Processing conditions and responsibility',
  onboardingPurpose:
    'Purpose: make communication events and limited accompanying metadata visible so users can compare and judge for themselves.',
  onboardingFrequency:
    'Frequency: observation runs when a relevant event or request occurs on an eligible page. ConnectBits does not periodically scan the entire computer.',
  onboardingStorage:
    'Storage: settings, setup-review state, and host display profiles are kept in local extension storage until changed, reset, or the extension is removed. Observation records and settings snapshots are kept in session storage that is cleared by browser restart or extension reload. Exported log files remain until the user deletes them.',
  onboardingExternal:
    'External transmission and third-party disclosure: ConnectBits itself does not send or provide observation logs to the developer, an external server, or another party. This statement does not make the same guarantee about communications performed by the site being observed.',
  onboardingFuture:
    'Material changes to purpose, storage, or required permissions must be explained and reviewed again. This review is not blanket consent to undisclosed future uses.',
  onboardingSupport:
    'Reports: fact-based reports are accepted and receipt may be acknowledged where possible. Individual investigation, fixes, deadlines, and continuing support are not guaranteed. Receipt does not establish liability or a duty to modify.',
  onboardingStep4Title: 'Review and choose',
  ackObservation: 'I reviewed the information ConnectBits observes and does not observe.',
  ackFrequency: 'I reviewed when and how often observation occurs.',
  ackStorage: 'I reviewed local storage, session storage, and retention after export.',
  ackExternal:
    'I reviewed that ConnectBits itself does not externally transmit or disclose observation logs.',
  ackJudgment: 'I reviewed that ConnectBits does not determine communication purpose or danger.',
  ackSupport: 'I reviewed the limits of support and response.',
  ackDecision:
    'I reviewed that I can choose one of three observation boundaries and change it later.',
  onboardingChoiceIntro: 'Choose an observation method',
  onboardingChangeable: 'You can change this choice at any time.',
  onboardingCoverageAfter:
    'After setup, Settings & Privacy shows what is observed, what is not currently observed, what is excluded by settings, and what the current mechanism cannot observe.',
  allowNetwork: 'Start with standard observation',
  onboardingStandardDetail:
    'Starts limited page observation and communication-metadata observation such as destination and HTTP method.',
  startLocalOnly: 'Start without communication-metadata observation',
  onboardingDomOnlyDetail:
    'Communication metadata is not observed. Limited observation of page actions and display changes continues.',
  pauseObservation: 'Do not start observation now',
  onboardingPausedDetail:
    'Keeps the extension installed with observation paused. You can choose later in settings.',
  permissionMeaning:
    'ConnectBits does not treat granting permission as consent to its individual judgments. ConnectBits observations and classifications do not guarantee that a communication is safe or appropriate.',
  onboardingComplete:
    'Setup review is complete. Reload eligible pages to apply the current settings reliably.',
  openObservationLog: 'Open observation log',
  openSetupAfter: 'Open settings & privacy',
  statusSaved: 'Settings saved.',
  statusSavedReload: 'Settings saved. Reload eligible pages to apply them reliably.',
  statusMaxSaved: 'MAX reporting mode saved. Reload eligible pages to apply it.',
  statusPermissionDenied:
    'The request-start metadata permission was not granted, so it remains disabled.',
  statusPermissionError:
    'The optional communication-observation permissions could not be changed. The choice was not saved and the existing permission state was preserved.',
  statusObservationStandard:
    'Standard observation saved. Limited page observation and communication-metadata observation are active.',
  statusObservationDomOnly:
    'Choice changed and the optional webRequest permission was withdrawn. Limited page observation continues.',
  statusObservationPaused:
    'Choice changed and the optional webRequest permission was withdrawn. Observation is currently paused.',
  statusNetworkEnabled:
    'Settings saved. Network payloads, URL paths/queries, and header values are not stored. Reload eligible pages to apply the settings reliably.',
  statusNetworkDisabled:
    'Settings saved. Request-start metadata observation is disabled. Reload eligible pages to apply the settings reliably.',
  statusSessionCleared: 'Session observation log cleared.',
  statusExported:
    '{count} primary observation records exported. No additional aggregation or judgment was applied.',
  confirmClearAll: 'Clear all activity and diagnostic records?',
  confirmClearLayer: 'Clear {label}?',
  activityLog: 'Activity log',
  diagnosticLog: 'Diagnostic log',
  clearedAll: 'Activity and diagnostic records cleared.',
  clearedLayer: '{label} cleared.',
  unknown: 'Unknown',
  unavailable: 'Unavailable',
  valueMissing: 'Missing value',
  active: 'Currently active',
  inactive: 'Not connected to an observation route',
  permissionYes: 'Permission granted',
  permissionNo: 'Permission not granted',
};

const MESSAGES: Readonly<Record<UiLanguage, Readonly<Record<UiMessageKey, string>>>> = {
  ja: JA_MESSAGES,
  en: EN_MESSAGES,
};

export function resolveUiLanguage(setting: UiLanguageSetting, browserLanguage = 'en'): UiLanguage {
  if (setting === 'ja' || setting === 'en') return setting;
  return browserLanguage.toLowerCase().startsWith('ja') ? 'ja' : 'en';
}

export function browserUiLanguage(): string {
  try {
    return chrome.i18n.getUILanguage();
  } catch {
    return navigator.language || 'en';
  }
}

export function t(
  language: UiLanguage,
  key: UiMessageKey,
  replacements: Readonly<Record<string, string | number>> = {},
): string {
  let value = MESSAGES[language][key];
  for (const [name, replacement] of Object.entries(replacements)) {
    value = value.replaceAll(`{${name}}`, String(replacement));
  }
  return value;
}

export function applyDocumentTranslations(root: ParentNode, language: UiLanguage): void {
  if (root instanceof Document) {
    root.documentElement.lang = language;
    root.documentElement.dir = 'ltr';
  }
  for (const element of root.querySelectorAll<HTMLElement>('[data-i18n]')) {
    const key = element.dataset.i18n;
    if (isUiMessageKey(key)) element.textContent = t(language, key);
  }
  for (const element of root.querySelectorAll<HTMLElement>('[data-i18n-title]')) {
    const key = element.dataset.i18nTitle;
    if (isUiMessageKey(key)) element.title = t(language, key);
  }
  for (const element of root.querySelectorAll<HTMLElement>('[data-i18n-aria-label]')) {
    const key = element.dataset.i18nAriaLabel;
    if (isUiMessageKey(key)) element.setAttribute('aria-label', t(language, key));
  }
  for (const element of root.querySelectorAll<HTMLInputElement>('[data-i18n-placeholder]')) {
    const key = element.dataset.i18nPlaceholder;
    if (isUiMessageKey(key)) element.placeholder = t(language, key);
  }
}
