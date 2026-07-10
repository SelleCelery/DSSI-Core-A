# DSSI Core A 要件定義書

## Digital Sovereignty Support Interface — Core Action Layer

> Status: Implementation Baseline  
> Version: 0.1.0  
> Language: Japanese primary  
> Target: Chrome / Chromium-based browsers, Manifest V3  
> Product class: Cognitive Safety Layer / 認知的セーフティレイヤー

---

## 0. 本書の目的

本書は、DSSI Core A の製品目的、責任範囲、機能要件、非機能要件、プライバシー要件、受入条件を固定し、実装開始時の基準とする。

DSSI Core A は、セキュリティ判定エンジンではない。ユーザーの判断を代行せず、ブラウザ上の行為に触れた早い段階から、観測可能な事実、確認点、観測限界を提示する認知的セーフティレイヤーである。

本書の上位根拠は、以下の既存文書に置く。

- `DSSI Core Definition.txt`
- `DSSI_Constitution.md`
- `DSSI_Strategic_Blueprint.md`
- `DSSI_Genesis_Log.md`
- `DSSI_Integrated_Strategy_Report.md`
- `DSSI_Philosophical_Architecture.md`
- `README.md`
- `認知インターフェイスDSSI.txt`

ただし、本書は思想説明ではなく、配布可能な製品を成立させるための実装基準を扱う。

---

## 1. 製品定義

### 1.1 一文定義

**DSSI Core A は、入力・送信・遷移・ダウンロード・同意などの Action Surface にユーザーが触れた時点から、観測可能な事実と観測限界を提示し、無意識操作から意識操作への移行を支援するブラウザ拡張機能である。**

### 1.2 中心原則

> 正しい判断は、過不足ない判断材料から成立する。

DSSI Core A は次の三原則に従う。

1. 勝手に入力しない。
2. 事実を隠さない。
3. 防御を支援する。

### 1.3 初期気づき優先の原則

DSSI Core A は、最後の送信時点だけを境界とみなさない。

入力欄へのフォーカス、キー入力、貼り付け、自動入力らしき更新、送信試行、同意チェック、外部遷移、ダウンロード試行を境界イベントとして扱う。

```text
最後に止める
    ↓
最初に気づけるようにする
```

### 1.4 死角開示の原則

DSSI Core A は、観測できないものを観測できたように扱わない。

観測が不完全な場合は、警告なしを安全証明に変換せず、次のいずれかを明示する。

- 一部のみ観測できた。
- 送信先または送信形式を確定できない。
- 入力中の通信と入力内容の関係を確定できない。
- ページ構造を十分に解析できない。
- DSSI の権限またはブラウザ仕様により観測できない。

---

## 2. 製品の成功条件

### 2.1 Primary KPI

**ユーザーが無意識操作から意識操作へ移れたか。**

これは内面状態を直接測定するものではなく、以下の操作上の代理指標によって評価する。

- 操作前または操作中に、関連する事実提示が行われた。
- ユーザーが詳細表示を開いた。
- ユーザーが確認後に続行した。
- ユーザーが確認後に中止した。
- ユーザーが表示レベルや監視範囲を自ら変更した。
- 観測できない領域が、死角として表示された。

### 2.2 Supporting Metrics

- Input Surface Detection Rate
- Input Origin Classification Rate
- Submit Destination Observation Rate
- Submit Format Observation Rate
- Live-Sync Suspicion Observation Rate
- Blind-Spot Disclosure Rate
- Awareness Cue Presentation Rate
- Explicit Confirmation Rate
- User Pause Event Rate

これらは Primary KPI を支える観測項目であり、単独で製品価値を決定しない。

---

## 3. 対象ユーザー

### 3.1 Primary Users

- 一般のブラウザ利用者
- 生成AI、SNS、Webメール、オンライン決済、クラウドサービスを利用する個人
- 何が送信・保存・共有されるかを理解したうえで操作したい利用者
- 過剰な自動化や断定的警告ではなく、判断材料を求める利用者

### 3.2 Secondary Users

- デジタル教育の担当者
- 自治体・企業PCの導入検討者
- 情報セキュリティ、法務、コンプライアンス担当者

Secondary Users 向け機能は Core A の初期配布版へ含めず、将来の管理環境向けレイヤーとして分離する。

---

## 4. 対象環境

### 4.1 Initial Target

- Google Chrome
- Microsoft Edge を含む Chromium 系ブラウザ
- Manifest V3
- Desktop environment

### 4.2 Initial Non-Target

- Firefox 専用実装
- Safari 専用実装
- Android / iOS ブラウザ
- OS 全体の監視
- ネイティブアプリ内部の入力監視

これらは Core A の安定後に、別の互換レイヤーまたは Core B として検討する。

---

## 5. 製品スコープ

### 5.1 In Scope

DSSI Core A は、次の Action Surface を扱う。

1. Input Zone
2. Submit Zone
3. Navigation Zone
4. Download Zone
5. Consent Zone

### 5.2 Out of Scope

初期配布版では、次を製品責任の外に置く。

- すべての通信内容の完全捕捉
- すべての送信の完全遮断
- セキュリティ認証または安全保証
- サイトや企業の善悪判定
- 法律相談または契約上の最終判断
- 外部LLM APIによる規約監査
- Visionによる画面解析
- OS、レジストリ、他アプリの常時監視
- 企業向け集中管理ダッシュボード
- ユーザー入力本文の保存
- 行動履歴のサーバー収集

---

## 6. Action Surface 要件

### 6.1 Input Zone

対象例：

- パスワード欄
- メールアドレス・ID欄
- 決済情報欄
- 氏名、住所、電話番号等の個人情報欄
- AIプロンプト欄
- コメント欄
- チャット欄
- Webメール本文
- クラウドエディタ
- その他の自由記述欄

Core A は、入力値そのものより先に「入力が始まる場」を検出する。

### 6.2 Submit Zone

対象例：

- HTMLフォーム送信
- ログイン
- 決済確定
- コメント投稿
- AIプロンプト送信
- Enterキーによる送信
- JavaScript制御の送信操作

送信先、送信方式、送信形式を観測できる場合は表示する。観測できない場合は `unknown` とする。

### 6.3 Navigation Zone

対象例：

- 外部ドメインへのリンク
- 新規タブ遷移
- 短縮URL
- リダイレクトを伴う可能性のあるリンク

初期版は、ユーザー操作に直接結びつくリンク遷移を中心に扱う。JavaScriptによる自動遷移やサーバー側リダイレクトの事前阻止は保証しない。

### 6.4 Download Zone

対象例：

- 実行可能形式
- 圧縮ファイル
- 文書ファイル
- 拡張子とMIMEの不一致候補

Core A は、クリック前に分かるリンク属性と、ブラウザから取得可能なメタデータを提示する。すべてのダウンロードを開始前に捕捉することは保証しない。

### 6.5 Consent Zone

対象例：

- 利用規約への同意
- プライバシーポリシーへの同意
- データ利用許諾
- メール配信への同意
- 権利許諾を含むチェックボックス

Core A は、チェックボックス、ラベル、近接リンク、ボタン文言を用いて同意面を推定する。法的意味の断定は行わない。

---

## 7. 観測起動点レジストリ要件

DSSI Core A は、次の Trigger を一元管理する。

```text
password_field_focus
email_or_id_field_focus
payment_field_focus
personal_info_field_focus
free_text_surface_focus
ai_prompt_surface_focus
paste_into_field
keyboard_input_started
autofill_or_manager_suspected
script_or_unknown_value_change
submit_attempt
enter_submit_attempt
external_domain_click
download_attempt
consent_control_focus
consent_control_checked
live_sync_surface_detected
network_activity_during_input
partially_observable_surface
unobservable_surface
```

Trigger は、UI、分類、ログへ直接結合せず、標準イベントモデルへ変換して各モジュールへ渡す。

---

## 8. 入力起源分類要件

Core A は、入力起源を次の状態で扱う。

```text
keyboard_confirmed
paste_confirmed
autofill_or_manager_suspected
script_or_unknown_update
unknown
```

パスワードマネージャ由来の入力は、常に確定できるとは限らない。推定を事実として表示してはならない。

---

## 9. 送信分析要件

### 9.1 Submit Destination

```text
same_origin_confirmed
external_origin_confirmed
form_action_observed
network_destination_observed
javascript_controlled_unknown
unknown
```

### 9.2 Submit Method

```text
GET
POST
PUT
PATCH
DELETE
WEBSOCKET_HANDSHAKE
JS_CONTROLLED
UNKNOWN
```

### 9.3 Submit Encoding

```text
application/x-www-form-urlencoded
multipart/form-data
text/plain
json_suspected
raw_or_unknown
unknown
```

### 9.4 Live-Sync Observation

入力中に同一タブから通信が発生した場合、Core A は「入力中に通信が発生した」という事実を記録できる。

ただし、通信本文を観測していない限り、入力内容が漏えいした、保存された、送信されたと断定してはならない。

許容表現：

> この入力面の操作中に通信が発生しました。DSSIは、その通信に入力内容が含まれるかを確認できません。

禁止表現：

> 入力内容が漏れています。

---

## 10. 観測状態要件

すべての Action Surface は、次のいずれかの観測状態を持つ。

| State                  | 定義                                                         |
| ---------------------- | ------------------------------------------------------------ |
| `observable`           | 具体的な構造または事実を提示できる                           |
| `partially_observable` | 一部を観測できるが、送信・同期等を確定できない               |
| `high_uncertainty`     | AI入力、チャット、クラウドエディタ等、送信前同期が起きうる面 |
| `unobservable`         | 必要な構造を十分に取得できない                               |
| `unsupported`          | ブラウザ仕様、権限、対象形式が Core A の対応外               |

警告がないことは、`observable` または安全を意味しない。

---

## 11. 可変粘性要件

### Level 1 — Silent Mode

- 観測を基本とする。
- UI介入は最小化する。
- 高影響または死角のみ、控えめな表示を行う。
- セッション観測ログを生成する。

### Level 2 — Awareness Mode

- 初期配布版のデフォルト候補。
- Action Surface の分類と確認点をチップスまたはポップで表示する。
- 高影響操作では、短い認識停止を置く。

### Level 3 — Sovereign Mode

- 観測可能な送信情報と情報カテゴリを表示する。
- 技術的に可能な範囲で、明示確認後に操作を続行させる。
- 完全捕捉を保証しない。

モード変更はユーザーが行い、簡単に元へ戻せなければならない。

---

## 12. 情報カテゴリ分類要件

入力内容の分類を有効にした場合、処理はローカルで行い、本文を保存しない。

初期カテゴリ：

```text
credential
payment_information
personal_information
third_party_information
business_or_confidential
identifier_or_proper_noun
sensitive_consultation
location_information
unknown_sensitive_pattern
no_supported_category_detected
```

分類結果は「含まれる可能性」として提示し、法的または医学的な属性を断定しない。

---

## 13. ログ要件

### 13.1 Session Observation Buffer

Silent Mode を含む全モードで、現在のブラウザセッション内に限り、観測メタデータを保持できる。

ブラウザ終了またはユーザー操作で消去する。

### 13.2 Persistent Local History

永続ログは初期状態で無効とし、ユーザーの明示的な選択でのみ有効化する。

### 13.3 保存可能な項目

- timestamp
- tab-scoped session identifier
- reduced domain identifier
- surface type
- trigger type
- input origin estimate
- field category labels
- submit destination state
- submit method state
- submit encoding state
- network activity correlation state
- observability state
- viscosity level
- cue presented
- user action after cue

### 13.4 保存禁止項目

- 入力本文
- パスワード
- クレジットカード番号
- 認証トークン
- クリップボード内容
- AIプロンプト全文
- コメント全文
- メール本文
- フォームpayload
- HTTP request body の永続保存

### 13.5 ログ主権

ユーザーは、ログの閲覧、消去、永続化の停止を行える。

DSSI Core A は、初期版においてログを外部送信しない。

---

## 14. UIメッセージ要件

### 14.1 許容される表現

- この入力欄はパスワードを受け取る形式です。
- このページはHTTP通信です。
- このフォームの送信先は現在のサイトと異なります。
- この操作中に通信が発生しました。
- DSSIは送信内容と通信の関係を確認できません。
- このチェックボックスの近くに利用規約へのリンクがあります。
- このファイルは実行可能な拡張子です。
- DSSIはこのページ構造を十分に観測できませんでした。

### 14.2 禁止される表現

- このサイトは危険です。
- このサービスは悪質です。
- 同意しない方がよいです。
- あなたは騙されています。
- 入力内容が漏れています。
- 安全です。

断定は、DSSIが直接観測できた技術的事実に限定する。

---

## 15. プライバシー要件

- 初期版は外部サーバーを持たない。
- 初期版は外部LLM APIへ接続しない。
- 入力本文を永続化しない。
- ユーザー行動を広告、プロファイリング、第三者提供へ利用しない。
- 権限は製品の単一目的に必要な最小範囲とする。
- 権限の理由をオンボーディングとプライバシーポリシーに記載する。
- 機能追加に伴いデータ取扱いが変わる場合は、事前に明示する。

---

## 16. 非機能要件

### 16.1 Performance

- 入力イベントの同期処理では、本文全体の重い解析を行わない。
- 分類処理はデバウンスまたは非同期化する。
- 文字入力に体感可能な遅延を生じさせない。
- 大容量入力では解析範囲を制限し、部分解析であることを表示できる。

### 16.2 Reliability

- DSSIの障害によって、ページの通常操作を恒常的に破壊しない。
- Level 1 では原則として操作をブロックしない。
- Level 2 の表示は閉じることができる。
- Level 3 の確認機能に失敗した場合は、DSSI側の状態を表示し、ページを無期限にロックしない。

### 16.3 Security

- リモートコードを実行しない。
- `eval` 相当の動的コード実行を使わない。
- ページから受け取る文字列をUIへ出す場合はサニタイズする。
- 機微情報をコンソールログへ出さない。
- 開発用デバッグログは配布ビルドで無効化する。

### 16.4 Maintainability

- TypeScript を使用する。
- Observer、Classifier、Policy、Presenter、Storageを分離する。
- メッセージ文言をコードへ散在させない。
- 検知規則をレジストリ化し、単体テスト可能にする。

### 16.5 Accessibility

- 色だけで状態を表現しない。
- キーボード操作で詳細確認と閉じる操作を行える。
- ARIA属性とフォーカス管理を行う。
- UI文面は短く、詳細説明を段階的に開ける。

---

## 17. 権限方針

初期実装では、Manifest V3 を使用する。

候補権限：

- `storage`
- 必要に応じて `scripting`
- 対象ページの host permissions

追加観測機能はオプション権限として分離を検討する。

- `webRequest`
- `downloads`

強い権限を将来機能のためだけに先取りしてはならない。

`webRequestBlocking` に依存した完全遮断を一般配布版の前提にしない。

---

## 18. 初期配布版の機能優先度

### P0 — Release Required

- Manifest V3 extension scaffold
- Action Surface Detection
- Password / Email-ID / Payment / Free-text Detection
- Input Trigger Registry
- Keyboard / Paste / Unknown Input Origin Classification
- Standard Form Submit Analysis
- HTTP Context Display
- Observability State
- Blind-Spot Disclosure
- Level 1 / 2 / 3 Settings
- Session Observation Buffer
- Local-only settings
- Message Catalog
- Privacy screen

### P1 — Strong Candidate

- External-domain link analysis
- Consent surface detection
- AI prompt / comment / chat high-uncertainty detection
- Network metadata correlation during input
- Download link metadata analysis
- Persistent local history as opt-in

### P2 — Deferred

- Payload inspection as a general feature
- MAIN world API instrumentation
- External LLM integration
- Terms-of-service AI audit
- Vision analysis
- Native companion application
- OS / Registry trigger integration
- Enterprise dashboard

---

## 19. リリース受入条件

初期配布版は、少なくとも次を満たすこと。

1. 対応するテストページ上で、入力欄への接触を検出できる。
2. キー入力と貼り付けを区別できる。
3. 自動入力等を確定できない場合、推定または不明として扱える。
4. 標準HTMLフォームの `action`、`method`、`enctype` を取得できる。
5. JavaScript制御等で分からない場合、死角を表示できる。
6. 入力中の通信発生を観測した場合、通信発生の事実と因果未確認を分けて表示できる。
7. 入力本文、パスワード、決済番号を永続保存しない。
8. Level 1 / 2 / 3 をユーザーが変更できる。
9. DSSIを無効化またはミュートした場合、通常ページ操作へ戻れる。
10. 配布ビルドが外部サーバーへ通信しない。
11. 主要UIがキーボード操作可能である。
12. プライバシー説明と権限理由を製品内で確認できる。

---

## 20. 未解決事項

次の項目は、開発中に実測して確定する。

- 広範なページ観測に必要な host permissions の配布時構成
- `webRequest` を標準権限とするか、オプション権限とするか
- Download Zone を初期版へ含める実装可能範囲
- contenteditable、Shadow DOM、iframe内入力面の対応深度
- パスワードマネージャ入力の推定精度
- Live-Sync Surface のネットワーク相関方法
- セッションログの保持上限
- 大容量自由記述の分類上限

未解決事項は、実装上の不備として隠さず、技術スパイクとテスト結果によって更新する。

---

## 21. 参照技術基盤

本要件は、Chrome Extensions Manifest V3 の以下の前提を採用する。

- content scripts によるDOM観測
- isolated world を標準とする実行環境
- extension service worker による中央イベント処理
- `webRequest` による通信メタデータ観測
- Manifest V3 一般配布での `webRequestBlocking` 制約
- Chrome Web Store の単一目的、最小権限、ユーザーデータ透明性の要件

実装時には、Chrome for Developers の最新公式文書を再確認する。

---

## 22. 要件固定文

> Core Aは、Submitから始まらない。Core Aは、ユーザーがAction Surfaceに触れた時点から始まる。
>
> DSSIの中核タスクは、境界イベントを登録し、観測できる事実を分類し、観測できない領域を死角として開示し、ユーザーが無意識操作から意識操作へ移れるようにすることである。
