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
  localClassification: 'ローカル入力面分類（現在は固定）',
  localClassificationHelp:
    'ページ上の限定観測が動作中は、入力欄のtype、autocomplete、周辺構造を使う分類を端末内で行います。この版では切替未実装のため変更できません。入力本文は分類・保存しません。',
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
  pulseOpacity: '通信パルス背景の透過率',
  pulseTransparency0: '0%（背景は不透過）',
  pulseTransparency30: '30%',
  pulseTransparency60: '60%',
  pulseTransparency90: '90%（背景は高透過）',
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
  clearFilters: '絞り込みと並べ替えをリセット',
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
  selectRecord: '下の時系列一覧から一件を選ぶと、ここに詳細と原値が表示されます。',
  clearSelection: '選択を解除',
  rawValue: '原値（読取専用）',
  observationTips: '観測パターン別チップス',
  tipsNotDiagnosis: '自動診断ではありません。この表示範囲に関連し得る読解補助です。',
  setupWizardTitle: '導入と権限の確認',
  setupWizardIntro:
    'ConnectBitsの目的、手段、Chromeの権限、利用時の責任境界を、観測方法を選ぶ前に説明します。',
  onboardingWhyHeading: 'なぜ、この説明が必要か',
  onboardingWhyBody:
    'ConnectBitsが返すのは限定的な観測材料であり、安全判定ではありません。また、Chromeが許可する技術的能力は、現在のConnectBitsが使う範囲より広いためです。',
  reviewMarkHeading: 'チェックは、自分のための確認メモです',
  reviewMarkBody:
    'チェックは任意です。空欄でもConnectBitsの起動、観測方法の選択、Chromeの権限確認へ進めます。状態はこの端末内だけに保存され、開発者や外部サーバーへ送信されません。利用規約への同意、免責への同意、法的権利の放棄を意味しません。',
  resetReviewMarks: '確認メモをリセット',
  step: 'ステップ',
  nextStep: '次へ',
  previousStep: '戻る',
  decideLater: '今は閉じる',
  onboardingStep1Kicker: '1｜目的',
  onboardingStep1Title: '通信を裁かず、見えるようにする',
  onboardingStep1Body:
    'ConnectBitsは、通常は見えにくい入力面、送信操作、通信開始の痕跡を、利用者が自分で判断するための観測材料として返します。',
  onboardingPurposeBoundaryHeading: 'ConnectBitsが決めないこと',
  onboardingPurposeBoundaryBody:
    '通信の安全・危険、目的、必要性、適法性、運営者や利用者の意図を確定しません。表示は結論や保証ではありません。',
  onboardingStep2Kicker: '2｜手段',
  onboardingStep2Title: '本文ではなく、発生条件を観測する',
  onboardingStep2Body:
    'ページ上の限定的な操作と、任意権限を許可した場合の通信開始メタデータを端末内で照合します。',
  onboardingObserveHeading: '観測するもの',
  onboardingObserve1: '入力開始、貼り付け、標準form送信などのDOMイベント',
  onboardingObserve2: '任意権限がある場合の通信先hostname、HTTP method、通信機構',
  onboardingObserve3: 'Cookieヘッダー名の有無。値は読み取らない',
  onboardingObserve4: 'ページ操作と通信開始の時間的な近接',
  onboardingNotObserveHeading: '観測・保存しないもの',
  onboardingNot1: 'フォームの入力本文、通信本文、Cookie値',
  onboardingNot2: 'URLのpath、query、fragment',
  onboardingNot3: 'Cookie一覧、Local Storage、IndexedDB、ファイル内容',
  onboardingNot4: '通信目的、運営者の意図、安全性、適法性',
  onboardingMethodFrequency: '発生時に観測し、PC全体を定期走査しません。',
  onboardingMethodStorage: '設定は端末内、観測ログはブラウザーのセッション領域に保持します。',
  onboardingMethodTransmission:
    'ConnectBits自身は観測ログを開発者・外部サーバー・第三者へ送信しません。',
  onboardingStep3Kicker: '3｜Chromeの権限',
  onboardingStep3Title: '許可される能力と、現在使う範囲を分けて示す',
  onboardingStep4Kicker: '4｜責任境界',
  onboardingStep4Title: 'ConnectBitsが守ることと、任せられないこと',
  onboardingStep4Body:
    'ConnectBitsは説明した観測境界を守ります。ただし、観測記録を証拠・診断・安全保証として提供するものではありません。',
  connectBitsResponsibilitiesHeading: 'ConnectBitsが守る境界',
  connectBitsResponsibility1: '説明した取得・保存・送信範囲をコードでも守る',
  connectBitsResponsibility2: '観測できない範囲と判断できない事項を隠さない',
  connectBitsResponsibility3: '目的・権限・保存方法の重要変更時は再説明する',
  connectBitsResponsibility4: '観測停止と任意権限の撤回手段を用意する',
  userBoundariesHeading: 'ConnectBitsへ任せられないこと',
  userBoundary1: '第三者の意図・違法性・危険性の断定',
  userBoundary2: '生命・身体・財産・法的判断などの重要判断',
  userBoundary3: 'エクスポート後のファイル管理',
  userBoundary4: '観測対象サイト自身が行う外部通信の管理',
  ackJudgment: '安全・危険、目的、必要性、適法性をConnectBitsが確定するものではないと確認した',
  ackObservationScope: 'ConnectBitsが観測するものと、観測・保存しないものを確認した',
  ackObservationAbsence: '表示がないことは、通信がなかったことを意味しないと確認した',
  ackPermissionDifference: 'Chromeの許可範囲と、現在のConnectBitsの処理範囲との差について確認した',
  ackEvidenceBoundary: '観測記録だけを根拠に、第三者の意図・違法性・危険性を断定しない',
  ackHighImpactBoundary: '生命・身体・財産・法的判断などの重要判断を、ConnectBitsだけに委ねない',
  ackExportBoundary: 'エクスポートしたファイルは、自分の管理領域で扱う',
  onboardingChoiceIntro: '観測方法を選択してください',
  onboardingChangeable: 'いつでもこの選択は変更できます。',
  onboardingCoverageAfter:
    '導入後も「設定とプライバシー」から、説明、観測範囲、権限状態、確認メモを見直せます。',
  allowNetwork: '標準設定で観測を開始',
  onboardingStandardDetail:
    'ページ上の限定観測と、通信開始メタデータの観測を開始します。直前にChromeの権限確認があります。',
  startLocalOnly: '通信メタデータを観測せず開始',
  onboardingDomOnlyDetail:
    'Chromeの任意webRequest権限を使わず、ページ上の限定観測だけを開始します。',
  pauseObservation: '今は観測を開始しない',
  onboardingPausedDetail: '観測を開始せず、拡張機能を休止状態にします。あとから設定できます。',
  permissionDialogKicker: 'Chromeの確認を開く直前',
  permissionDialogTitle: '広い許可の中で、ConnectBitsが現在使う範囲',
  permissionDialogIntro:
    'Chromeの確認表示は、権限から技術的に可能になる範囲を示します。右列は、この版のConnectBitsが実際に実行・保存する処理です。',
  permissionChromeMaximum: 'Chromeが許可する最大能力',
  permissionConnectBitsActual: 'ConnectBitsが現在行う処理',
  permissionChromeScope: 'HTTP/HTTPSの許可対象ホストでwebRequestイベントへアクセスできる。',
  permissionActualScope: 'XMLHttpRequest/fetch系とBeacon/Pingの通信開始だけを監視する。',
  permissionChromeUrl: '対象イベントから完全なURL、HTTP method、initiatorなどをコードへ渡せる。',
  permissionActualUrl: 'URLはschemeとhostnameだけへ縮約し、path・query・fragmentを保存しない。',
  permissionChromeHeaders: 'リスナーが要求すればrequest headersをコードへ渡せる。',
  permissionActualHeaders:
    'Cookieヘッダー名の有無だけを一時確認し、ヘッダー値を読み取って保存・表示しない。',
  permissionChromeBody:
    '将来コードがonBeforeRequestでrequestBodyを要求すれば、送信本文へアクセスできる余地がある。',
  permissionActualBody: 'requestBodyを要求するリスナーを登録せず、通信本文を取得しない。',
  permissionChromeChange: '権限範囲内で、将来コードが別の非ブロッキング監視処理を追加できる。',
  permissionActualChange: 'webRequestBlockingを要求せず、通信を停止・変更・転送しない。',
  permissionDialogBrowserUiNote:
    '次の操作でChrome自身の権限確認が表示されます。この説明はページ上に残りますが、Chromeの表示位置や文言はConnectBitsから変更できません。すでに許可済みの場合、Chromeの確認が再表示されないことがあります。',
  permissionDialogChromeSummary:
    '許可対象のHTTP/HTTPS通信について、完全なURLやrequest headersなどをコードへ渡せます。将来コードがrequestBodyを要求する余地もあります。',
  permissionDialogActualSummary:
    '通信開始だけを監視し、schemeとhostnameへ縮約します。本文・path・query・Cookie値を保存せず、通信を停止・変更・転送しません。',
  permissionReviewOptionalReminder:
    '権限差についての確認メモは任意です。チェックがなくてもChromeの確認へ進めます。',
  backToChoices: '選択へ戻る',
  showChromePermission: 'Chromeの権限確認を表示',
  onboardingComplete:
    '観測方法を保存しました。確認メモの有無は、ConnectBitsの動作条件には使われません。',
  openObservationLog: '観測ログを開く',
  openSetupAfter: '設定とプライバシーを開く',
  statusSaved: '設定を保存しました。',
  statusSavedReload: '設定を保存しました。対象ページの再読み込み後に確実に反映されます。',
  statusMaxSaved: 'MAX報告モードを保存しました。対象ページの再読み込み後に反映されます。',
  statusPermissionDenied: '通信開始メタデータ観測の権限が付与されなかったため、無効のままです。',
  statusPermissionError:
    '通信観測に必要な任意権限を変更できませんでした。権限状態を保ったまま、選択の保存を中止しました。',
  statusReviewMarkSaveError:
    '確認メモを端末内へ保存できませんでした。ConnectBitsの利用条件や権限状態には影響しません。',
  statusReviewMarksReset: '確認メモをリセットしました。観測設定とChromeの権限は変更していません。',
  statusOnboardingInitializationError:
    '導入説明の端末内状態を読み込めませんでした。説明は閲覧でき、チェックなしでも観測方法を選べます。',
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
  localClassification: 'Local input-surface classification (fixed for now)',
  localClassificationHelp:
    'While limited page observation is running, ConnectBits classifies input surfaces locally using type, autocomplete, and surrounding structure. This version does not yet provide a switch. Input text is not classified or stored.',
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
  pulseOpacity: 'Communication pulse background transparency',
  pulseTransparency0: '0% (opaque background)',
  pulseTransparency30: '30%',
  pulseTransparency60: '60%',
  pulseTransparency90: '90% (highly transparent background)',
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
  clearFilters: 'Reset filters and sort',
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
  selectRecord:
    'Select one record from the timeline below to show its details and raw values here.',
  clearSelection: 'Clear selection',
  rawValue: 'Raw values (read-only)',
  observationTips: 'Observation-pattern tips',
  tipsNotDiagnosis: 'These are reading aids, not automated diagnoses.',
  setupWizardTitle: 'Setup and permission review',
  setupWizardIntro:
    'Before you choose an observation method, ConnectBits explains its purpose, method, Chrome permissions, and responsibility boundaries.',
  onboardingWhyHeading: 'Why this explanation is necessary',
  onboardingWhyBody:
    'ConnectBits returns limited observation material, not a safety judgment. Chrome also grants broader technical capability than ConnectBits currently uses.',
  reviewMarkHeading: 'Checks are personal review notes',
  reviewMarkBody:
    'Every check is optional. Blank checks do not prevent ConnectBits from starting, selecting an observation method, or opening Chrome permission confirmation. Check states remain on this device and are not sent to the developer or an external server. They do not mean acceptance of terms, agreement to a liability waiver, or surrender of legal rights.',
  resetReviewMarks: 'Reset personal review notes',
  step: 'Step',
  nextStep: 'Next',
  previousStep: 'Back',
  decideLater: 'Close for now',
  onboardingStep1Kicker: '1 | Purpose',
  onboardingStep1Title: 'Make connections visible without judging them',
  onboardingStep1Body:
    'ConnectBits returns normally hidden input surfaces, submission actions, and request-start traces as observation material for the user’s own judgment.',
  onboardingPurposeBoundaryHeading: 'What ConnectBits does not decide',
  onboardingPurposeBoundaryBody:
    'It does not determine safety, danger, purpose, necessity, legality, or operator and user intent. A presentation is not a conclusion or guarantee.',
  onboardingStep2Kicker: '2 | Method',
  onboardingStep2Title: 'Observe occurrence conditions, not content',
  onboardingStep2Body:
    'ConnectBits collates limited page actions with request-start metadata on the device when optional permission is granted.',
  onboardingObserveHeading: 'Observed',
  onboardingObserve1: 'DOM events such as input start, paste, and standard-form submission',
  onboardingObserve2:
    'Destination hostname, HTTP method, and communication mechanism when optional permission is present',
  onboardingObserve3: 'Presence of the Cookie header name; its value is not read',
  onboardingObserve4: 'Temporal proximity between page actions and request start',
  onboardingNotObserveHeading: 'Not observed or stored',
  onboardingNot1: 'Form input content, network payloads, and Cookie values',
  onboardingNot2: 'URL paths, queries, and fragments',
  onboardingNot3: 'Cookie inventories, Local Storage, IndexedDB, and file contents',
  onboardingNot4: 'Communication purpose, operator intent, safety, and legality',
  onboardingMethodFrequency:
    'Observation occurs when eligible events occur; ConnectBits does not periodically scan the computer.',
  onboardingMethodStorage:
    'Settings remain on the device, and observation logs remain in browser session storage.',
  onboardingMethodTransmission:
    'ConnectBits itself does not send observation logs to the developer, an external server, or a third party.',
  onboardingStep3Kicker: '3 | Chrome permission',
  onboardingStep3Title: 'Separate granted capability from current use',
  onboardingStep4Kicker: '4 | Responsibility boundary',
  onboardingStep4Title: 'What ConnectBits must protect and what it cannot take over',
  onboardingStep4Body:
    'ConnectBits must keep the observation boundary it describes. It does not provide observation records as proof, diagnosis, or a safety guarantee.',
  connectBitsResponsibilitiesHeading: 'Boundaries ConnectBits must protect',
  connectBitsResponsibility1:
    'Enforce the described collection, storage, and transmission scope in code',
  connectBitsResponsibility2: 'Disclose what it cannot observe or determine',
  connectBitsResponsibility3: 'Explain material changes to purpose, permission, or storage again',
  connectBitsResponsibility4: 'Provide ways to pause observation and revoke optional permission',
  userBoundariesHeading: 'What cannot be delegated to ConnectBits',
  userBoundary1: 'Determining another party’s intent, illegality, or danger',
  userBoundary2: 'High-impact decisions involving life, health, property, or legal matters',
  userBoundary3: 'Managing files after export',
  userBoundary4: 'Controlling external communication performed by the observed site',
  ackJudgment:
    'I reviewed that ConnectBits does not determine safety, danger, purpose, necessity, or legality.',
  ackObservationScope:
    'I reviewed what ConnectBits observes and what it does not observe or store.',
  ackObservationAbsence: 'I reviewed that no presentation does not mean no communication occurred.',
  ackPermissionDifference:
    'I reviewed the difference between Chrome’s permission scope and ConnectBits’ current processing scope.',
  ackEvidenceBoundary:
    'I will not determine another party’s intent, illegality, or danger from observation records alone.',
  ackHighImpactBoundary:
    'I will not delegate high-impact decisions involving life, health, property, or legal matters to ConnectBits alone.',
  ackExportBoundary: 'I will manage exported files within my own control.',
  onboardingChoiceIntro: 'Choose an observation method',
  onboardingChangeable: 'You can change this choice at any time.',
  onboardingCoverageAfter:
    'After setup, Settings & Privacy lets you revisit the explanation, observation scope, permission state, and personal review notes.',
  allowNetwork: 'Start with standard observation',
  onboardingStandardDetail:
    'Starts limited page observation and request-start metadata observation. Chrome permission confirmation appears immediately beforehand.',
  startLocalOnly: 'Start without communication-metadata observation',
  onboardingDomOnlyDetail:
    'Starts limited page observation without using the optional Chrome webRequest permission.',
  pauseObservation: 'Do not start observation now',
  onboardingPausedDetail:
    'Keeps the extension installed with observation paused. You can choose later in settings.',
  permissionDialogKicker: 'Immediately before Chrome confirmation',
  permissionDialogTitle: 'What ConnectBits currently uses within the broader grant',
  permissionDialogIntro:
    'Chrome describes what the permission makes technically possible. The right column states what this ConnectBits version actually executes and stores.',
  permissionChromeMaximum: 'Maximum capability Chrome grants',
  permissionConnectBitsActual: 'What ConnectBits currently does',
  permissionChromeScope: 'Can access webRequest events across all permitted HTTP and HTTPS hosts.',
  permissionActualScope:
    'Listens only at request start for XMLHttpRequest/fetch and Beacon/Ping traffic.',
  permissionChromeUrl:
    'Can pass the full URL, HTTP method, initiator, and other event metadata to code.',
  permissionActualUrl:
    'Reduces URLs to scheme and hostname; paths, queries, and fragments are not stored.',
  permissionChromeHeaders: 'Can pass request headers to code when a listener asks for them.',
  permissionActualHeaders:
    'Checks only for the Cookie header name transiently; header values are not read, stored, or displayed.',
  permissionChromeBody:
    'Future code could access submitted content by registering onBeforeRequest with requestBody.',
  permissionActualBody:
    'Registers no listener that requests requestBody and does not collect network payloads.',
  permissionChromeChange:
    'Future code could add other non-blocking observation within the granted scope.',
  permissionActualChange:
    'Does not request webRequestBlocking and does not stop, modify, or redirect traffic.',
  permissionDialogBrowserUiNote:
    "The next action opens Chrome's own permission confirmation. This explanation remains on the page, but ConnectBits cannot control the prompt's wording or position. Chrome may not show it again if access was already granted.",
  permissionDialogChromeSummary:
    'For permitted HTTP and HTTPS traffic, Chrome can pass complete URLs, request headers, and related metadata to code. Future code could also request requestBody.',
  permissionDialogActualSummary:
    'ConnectBits observes request start and reduces URLs to scheme and hostname. It does not store payloads, paths, queries, or Cookie values and does not stop, modify, or redirect traffic.',
  permissionReviewOptionalReminder:
    'The personal review note about this difference is optional. Chrome confirmation remains available without the check.',
  backToChoices: 'Back to choices',
  showChromePermission: 'Show Chrome permission confirmation',
  onboardingComplete:
    'The observation method was saved. Personal review notes are not used as a condition for ConnectBits to operate.',
  openObservationLog: 'Open observation log',
  openSetupAfter: 'Open settings & privacy',
  statusSaved: 'Settings saved.',
  statusSavedReload: 'Settings saved. Reload eligible pages to apply them reliably.',
  statusMaxSaved: 'MAX reporting mode saved. Reload eligible pages to apply it.',
  statusPermissionDenied:
    'The request-start metadata permission was not granted, so it remains disabled.',
  statusPermissionError:
    'The optional communication-observation permissions could not be changed. The choice was not saved and the existing permission state was preserved.',
  statusReviewMarkSaveError:
    'The personal review note could not be stored on this device. This does not affect ConnectBits usage conditions or permission state.',
  statusReviewMarksReset:
    'Personal review notes were reset. Observation settings and Chrome permissions were not changed.',
  statusOnboardingInitializationError:
    'The local state for this introduction could not be loaded. You may still read the explanation and select an observation method without any checks.',
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
