# DSSI Core A 機能仕様書

## Digital Sovereignty Support Interface — Core Action Layer

> Status: Implementation Baseline  
> Version: 0.1.0  
> Related: `DSSI_Core_A_Requirements_Definition.md`  
> Target Stack: TypeScript / Chrome Extensions Manifest V3  
> Distribution target: Chrome Web Store compatible package

---

## 0. 本書の目的

本書は、DSSI Core A 要件定義書を実装可能な単位へ分解し、アーキテクチャ、イベント、データモデル、検出規則、UI、ログ、権限、テスト、実装順序を定める。

初期版はブラウザ拡張単体で成立させ、外部API、Python、ネイティブ補助アプリを必須依存にしない。

---

## 1. システム構成

```text
Web Page
  ↓ DOM Event / Mutation / User Action
Content Observer
  ↓ Normalized BoundaryEvent
Surface Classifier
  ↓ ActionSurface + ObservationFact
Context Analyzer
  ↓ Submit / Navigation / Consent / Network Metadata
Observability Evaluator
  ↓ observable / partial / high-uncertainty / unobservable
Viscosity Policy
  ↓ silent / awareness / sovereign behavior
Message Catalog
  ↓ factual message
UI Presenter
  ↓ chip / popover / confirmation / blind-spot notice
Local Store
  ↓ settings / session metadata / opt-in history
```

### 1.1 Manifest V3 Components

| Component                | Responsibility                                               |
| ------------------------ | ------------------------------------------------------------ |
| Content Script           | DOM観測、入力面検出、イベント取得、ページ内UI表示            |
| Extension Service Worker | タブ横断イベント、設定、権限、通信メタデータ、メッセージ中継 |
| Popup / Options Page     | モード変更、権限、ログ閲覧、消去、プライバシー表示           |
| Local Storage            | 設定、ミュート状態、オプトイン履歴                           |
| In-memory Session Buffer | セッション内の観測イベント                                   |

content script は原則として isolated world で動かす。MAIN world への注入は初期配布版の標準機能にしない。

---

## 2. 推奨ディレクトリ構成

```text
src/
  manifest/
    manifest.json

  background/
    service-worker.ts
    tab-session-registry.ts
    network-observer.ts
    permission-manager.ts

  content/
    bootstrap.ts
    mutation-observer.ts
    event-capture.ts
    surface-scanner.ts
    submit-observer.ts
    navigation-observer.ts
    consent-observer.ts
    download-link-observer.ts

  core/
    models/
      boundary-event.ts
      action-surface.ts
      observation-fact.ts
      observability.ts
      awareness-transition.ts
    registry/
      trigger-registry.ts
      detector-registry.ts
      message-registry.ts
    classifiers/
      field-classifier.ts
      input-origin-classifier.ts
      content-category-classifier.ts
      submit-context-classifier.ts
      consent-classifier.ts
    policies/
      viscosity-policy.ts
      privacy-policy.ts
      presentation-policy.ts
      logging-policy.ts

  ui/
    chip-presenter.ts
    popover-presenter.ts
    confirmation-presenter.ts
    blind-spot-presenter.ts
    styles.css

  storage/
    settings-store.ts
    session-buffer.ts
    persistent-history-store.ts

  options/
    options.html
    options.ts

  popup/
    popup.html
    popup.ts

  tests/
    fixtures/
    unit/
    integration/
    e2e/
```

---

## 3. 標準データモデル

### 3.1 BoundaryEvent

```ts
export type TriggerType =
  | 'password_field_focus'
  | 'email_or_id_field_focus'
  | 'payment_field_focus'
  | 'personal_info_field_focus'
  | 'free_text_surface_focus'
  | 'ai_prompt_surface_focus'
  | 'paste_event_observed'
  | 'paste_reflected_in_field'
  | 'keyboard_input_started'
  | 'autofill_or_manager_suspected'
  | 'script_or_unknown_value_change'
  | 'submit_attempt'
  | 'enter_submit_attempt'
  | 'external_domain_click'
  | 'download_attempt'
  | 'consent_control_focus'
  | 'consent_control_checked'
  | 'live_sync_surface_detected'
  | 'network_activity_during_input'
  | 'partially_observable_surface'
  | 'unobservable_surface';

export interface BoundaryEvent {
  eventId: string;
  tabId?: number;
  frameId?: number;
  documentId?: string;
  timestamp: number;
  triggerType: TriggerType;
  surfaceId: string;
  topOrigin: string;
  frameOrigin?: string;
  userInitiated: boolean | 'unknown';
}
```

Sprint 1.2 の実装では、`paste_event_observed` と `paste_reflected_in_field` を分離する。
前者は貼り付けイベントの直接観測、後者は信頼済み入力イベントとの相関または
貼り付けを明示する信頼済み入力イベントに基づく反映確認である。

### 3.2 ActionSurface

```ts
export type SurfaceType =
  | 'password'
  | 'email_or_id'
  | 'payment'
  | 'personal_information'
  | 'free_text'
  | 'ai_prompt'
  | 'comment'
  | 'chat'
  | 'webmail'
  | 'cloud_editor'
  | 'consent'
  | 'download_link'
  | 'external_navigation'
  | 'unknown';

export interface ActionSurface {
  surfaceId: string;
  surfaceType: SurfaceType;
  elementTag: string;
  inputType?: string;
  formId?: string;
  autocompleteToken?: string;
  contentEditable: boolean;
  shadowRootContext: boolean;
  iframeContext: boolean;
  confidence: number;
  evidenceCodes: string[];
}
```

`confidence` は内部評価用であり、ユーザーへ確率を断定表示しない。

### 3.3 InputOrigin

```ts
export type InputOrigin =
  | 'keyboard_confirmed'
  | 'paste_confirmed'
  | 'autofill_or_manager_suspected'
  | 'script_or_unknown_update'
  | 'unknown';
```

### 3.4 ObservationFact

```ts
export type FactCode =
  | 'FIELD_ACCEPTS_PASSWORD'
  | 'FIELD_ACCEPTS_EMAIL_OR_ID'
  | 'FIELD_ACCEPTS_PAYMENT'
  | 'FREE_TEXT_SURFACE'
  | 'PAGE_USES_HTTP'
  | 'FORM_ACTION_OBSERVED'
  | 'FORM_TARGET_EXTERNAL'
  | 'FORM_METHOD_OBSERVED'
  | 'FORM_ENCODING_OBSERVED'
  | 'JS_CONTROLLED_SUBMIT_SUSPECTED'
  | 'NETWORK_ACTIVITY_DURING_INPUT'
  | 'NETWORK_INPUT_RELATION_UNKNOWN'
  | 'EXTERNAL_DOMAIN_LINK'
  | 'EXECUTABLE_EXTENSION_LINK'
  | 'TERMS_LINK_NEAR_CONSENT'
  | 'PRIVACY_LINK_NEAR_CONSENT'
  | 'OBSERVATION_PARTIAL'
  | 'OBSERVATION_UNAVAILABLE';

export interface ObservationFact {
  factCode: FactCode;
  value?: string;
  source: 'dom' | 'browser_api' | 'correlation' | 'heuristic';
  confidence: 'confirmed' | 'inferred' | 'unknown';
  observedAt: number;
}
```

### 3.5 Observation Scope / Evidence / Observability

Sprint 1.2 以降、次の三軸を分離する。

```ts
export type ObservationScope =
  'input_surface_and_dom_events' | 'page_surface_partial' | 'unobservable' | 'unsupported';

export type OperationEvidence =
  | 'extension_observation'
  | 'direct_trusted_event'
  | 'correlated_trusted_events'
  | 'inferred_from_trusted_event'
  | 'untrusted_or_unknown';

export type ObservabilityState =
  'observable' | 'partially_observable' | 'high_uncertainty' | 'unobservable' | 'unsupported';
```

`ObservationScope` は、DSSI が実際に観測した技術層を示す。`OperationEvidence` は、
操作に関する主張が直接観測、イベント相関、推定のどれに基づくかを示す。
`ObservabilityState` は送信、同期、通信、保存等を含む境界全体の評価に用い、
入力面の分類確度とは混同しない。自由記述欄であることだけを根拠に
`high_uncertainty` としてはならない。

### 3.6 AwarenessTransition

```ts
export type UserResponse =
  | 'continued_without_detail'
  | 'opened_detail'
  | 'continued_after_detail'
  | 'cancelled_after_cue'
  | 'changed_setting'
  | 'muted'
  | 'no_observable_response';

export interface AwarenessTransition {
  eventId: string;
  cuePresented: boolean;
  explicitConfirmationRequested: boolean;
  userResponse: UserResponse;
  elapsedFromCueMs?: number;
}
```

このモデルは「意識」を直接断定せず、事実提示後に観測された操作だけを記録する。

---

## 4. DOM観測仕様

### 4.1 初期スキャン

content script は可能な限り早い段階で起動し、次を行う。

1. 現在のDOMに存在する入力面をスキャンする。
2. MutationObserver を登録する。
3. capture phase で入力関連イベントを登録する。
4. 現在ページの通信プロトコルを確認する。
5. service workerへページ観測開始を通知する。

### 4.2 対象要素

- `input`
- `textarea`
- `[contenteditable="true"]`
- `select` のうち同意・送信に関連するもの
- `button`
- `a[href]`
- `form`
- `iframe` 内のアクセス可能な要素
- open Shadow DOM 内のアクセス可能な要素

closed Shadow DOM や権限外iframeは、必要に応じて死角として扱う。

### 4.3 捕捉イベント

- `focusin`
- `beforeinput`
- `input`
- `paste`
- `keydown`
- `change`
- `click`
- `submit`

`event.isTrusted` は補助情報として利用するが、単独で入力起源を断定しない。

### 4.4 動的ページ対応

MutationObserver は、追加・変更されたノードを差分スキャンする。

毎回document全体を再走査しない。

---

## 5. Field Classifier 仕様

### 5.1 Evidence Sources

- `type`
- `name`
- `id`
- `autocomplete`
- `aria-label`
- associated `label`
- placeholder
- nearby text
- surrounding form attributes
- semantic role

### 5.2 Classification Priority

1. 明示的標準属性
2. autocomplete token
3. label / aria information
4. name / id pattern
5. nearby text heuristic
6. unknown

### 5.3 Password

`input[type=password]` は confirmed とする。

通常text fieldでパスワード入力を促す実装は inferred とする。

### 5.4 Email / ID

- `type=email`
- autocomplete `email`, `username`
- label patterns

メールとユーザーIDを区別できない場合は `email_or_id` とする。

### 5.5 Payment

- autocomplete `cc-number`, `cc-exp`, `cc-csc`, `cc-name`
- payment-related labels
- `inputmode=numeric` だけでは確定しない

### 5.6 Free Text / High-Uncertainty

次を高不確実性候補とする。

- AIプロンプト欄
- コメント欄
- チャット欄
- Webメール本文
- クラウド共同編集面

サイト名だけで確定せず、DOM構造、ラベル、周辺文言を組み合わせる。

---

## 6. Input Origin Classifier 仕様

### 6.1 Keyboard

直前の trusted `keydown` と `beforeinput/input` の時間相関が成立した場合、`keyboard_confirmed` とする。

### 6.2 Paste

trusted `paste` と値変化が相関した場合、`paste_confirmed` とする。

クリップボード本文は取得・保存しない。

### 6.3 Autofill / Password Manager

次の条件を組み合わせ、`autofill_or_manager_suspected` とする。

- focus前後のキー・pasteイベントなしで値が変化
- autocomplete属性を持つ
- change/inputが短時間に複数フィールドへ発生
- ブラウザが付与する視覚状態をCSS擬似クラス等で補助観測可能

確定表現は禁止する。

### 6.4 Script / Unknown

ユーザー由来イベントとの相関が取れない値変化は `script_or_unknown_update` とする。

区別できない場合は `unknown` とする。

---

## 7. Content Category Classifier 仕様

### 7.1 実行条件

- Level 1: 原則実行しない。高影響面でカテゴリ存在だけ軽量判定してもよい。
- Level 2: ユーザーが有効化した場合のみ、軽量分類する。
- Level 3: ローカル分類を実行し、カテゴリを確認画面へ出す。

### 7.2 処理原則

- 入力イベントの同期経路で全文解析しない。
- デバウンスする。
- 結果はカテゴリラベルだけ保持する。
- 本文をStorage、console、telemetryへ出さない。
- 長文は部分解析として状態を分ける。

### 7.3 初期検出器

- メールアドレス形式
- 電話番号候補
- 住所候補
- クレジットカード候補（Luhn検証を含むが番号保存なし）
- API key / token候補
- 契約・社外秘・未公開等の語彙候補
- 第三者を示す固有名詞候補

固有名詞・機微な相談内容は、初期版では誤検知が大きいため `inferred` とし、断定しない。

---

## 8. Submit Observer 仕様

### 8.1 Standard Form

`form` が取得できる場合、次を読む。

- `action`
- `method`
- `enctype`
- `target`
- current originとの比較

未指定時のブラウザ既定値を適用して内部状態を作る。

### 8.2 Submit Triggers

- `submit` event
- submit button click
- Enter key candidate
- `requestSubmit()` 相当の結果として観測されるsubmit

### 8.3 JavaScript-controlled Submit

標準form submitが発生せず、クリック後に通信が観測された場合は、`javascript_controlled_unknown` とする。

ページ内部の関数名や変数を推測して断定しない。

### 8.4 Submit Guard

#### Level 1

原則ブロックしない。

#### Level 2

重大な確認点がある場合、非モーダルまたは短い確認UIを表示する。通常操作を恒常的に破壊しない。

#### Level 3

技術的に可能な標準フォームでは、一時保留し、確認後に再送信する。

再送信時は再帰的なGuard発火を防止する。

JavaScript制御の送信について完全な保留を保証しない。

---

## 9. Network Observer 仕様

### 9.1 Positioning

Network Observer は補助観測であり、Core Aの主戦場ではない。

### 9.2 Observable Metadata

`webRequest` 等で取得可能な範囲において、次を観測する。v0.4.1の実装は`onBeforeSendHeaders`を用い、request bodyは要求せず、request-header集合はCookieヘッダー名の検出にだけ一時利用する。

- request URL
- request method
- resource type
- initiator
- tab / frame / document identifiers
- timestamp
- request body availability state
- Cookie request-header name detection state
- relation to DSSI page-observation start

### 9.3 Request Body

request body がAPIから提供される場合でも、初期配布版は本文を永続保存しない。

内容分類へ一時利用するかは、別途プライバシーレビューを経る。初期実装では無効を既定とする。

### 9.4 Input Correlation

信頼済みの内容変更イベントと、同一タブ・同一フレームの通信イベントを時間窓で相関する。フォーカスは相関パルスを生成しない。v0.4.1では各内容変更時にパルスを更新し、活動ログの重複抑制とは独立させる。

出力状態：

```text
no_network_activity_observed
network_activity_observed
destination_observed
payload_relation_unknown
correlation_unavailable
```

時間相関だけで、入力内容の送信を断定しない。

### 9.4.1 Cookie Header Name Detection

v0.4.1では、Chromeが提供したrequest-header集合についてヘッダー名だけを走査し、`Cookie`の検出状態を次の閉じた値へ縮約する。

```text
detected
not_detected
not_observed
unavailable
```

request-header値はDSSIの処理で参照、分類、コピー、保存、表示しない。`not_detected`は、提供された集合内で検出されなかったことだけを意味し、Cookie不存在や認証情報不存在を保証しない。

### 9.4.2 Page-Observation Timing

通信時刻はDSSI自身のページ観測開始との関係だけを、5秒以内、5秒超、不明として保持できる。初期化、認証、状態復元、分析等の用途分類には使用しない。

### 9.5 WebSocket / Persistent Connections

WebSocketはハンドシェイクを観測できる場合があるが、確立後の個々のメッセージをCore Aで完全観測できるとは扱わない。

確立済みセッションがある場合は `high_uncertainty` を強める根拠になりうるが、内容送信を断定しない。

### 9.6 Blocking Boundary

一般配布版は `webRequestBlocking` に依存しない。

通信ブロックではなく、DOM側の早期認識と死角開示を中核にする。

---

## 10. Navigation Observer 仕様

### 10.1 Link Click

クリック時に、現在のtop originとリンク先originを比較する。

表示候補：

- 現在のサイト内
- 別のサブドメイン
- 別ドメイン
- URL解析不能

### 10.2 Shortened / Indirect URL

既知短縮ドメイン辞書を用いる場合は、辞書の版と根拠を管理する。

短縮URLだから危険とは表示しない。

### 10.3 Automatic Navigation

JavaScriptやサーバーによる自動遷移は、事前UIを保証しない。発生後に遷移先を記録できる場合は、事後観測として扱う。

---

## 11. Download Observer 仕様

### 11.1 Pre-click Link Analysis

- href
- download attribute
- extension
- origin
- visible label

### 11.2 Browser Download Event

`downloads` 権限を有効化した場合、ダウンロード生成イベントを補助観測する。

初期配布で権限を要求するかは実装スパイク後に確定する。

### 11.3 Message Boundary

許容：

> このリンクは `.exe` 形式を示しています。

禁止：

> このファイルはマルウェアです。

---

## 12. Consent Observer 仕様

### 12.1 Detection Inputs

- checkbox / radio / toggle
- associated label
- nearby anchor
- link text containing terms / privacy / policy equivalents
- button text
- DOM proximity

### 12.2 Output Facts

- 利用規約リンクが近接している
- プライバシーポリシーリンクが近接している
- チェック済みである
- 本文確認の有無は判定不能

「未読」と断定するには、DSSI内で明確な閲覧イベントを観測できた場合に限る。それ以外は「本文を確認したかDSSIでは分かりません」とする。

---

## 13. Observability Evaluator 仕様

### 13.1 Evaluation Rules

`observable`:

- 標準属性やAPIから事実が確認できる

`partially_observable`:

- DOMは観測できるが、送信または同期構造を確定できない

`high_uncertainty`:

- AI、チャット、クラウドエディタ、Webメール等であることに加え、持続通信、
  自動保存、JavaScript制御等の構造的根拠がある
- 送信前同期の可能性は高いが、入力内容との関係または送信境界を確定できない
- 入力面の種類だけでは、この状態に分類しない

`unobservable`:

- closed Shadow DOM
- 権限外iframe
- 構造取得失敗
- 対象イベント取得不能

`unsupported`:

- ブラウザ内部ページ
- 拡張機能が動作できない特殊スキーム
- Core A対象外アプリ

### 13.2 Blind-Spot Messages

- DSSIはこの入力面の送信構造を確認できません。
- このページでは、一部の入力面を観測できませんでした。
- 内容変更操作と近接して通信が発生しましたが、その通信に入力内容が含まれるかは確認できません。
- 警告が表示されていないことは、安全であることを意味しません。

---

## 14. Viscosity Policy 仕様

| Behavior                      |   Level 1 Silent | Level 2 Awareness | Level 3 Sovereign |
| ----------------------------- | ---------------: | ----------------: | ----------------: |
| Surface detection             |              Yes |               Yes |               Yes |
| Session log                   |              Yes |               Yes |               Yes |
| Passive chip                  | High-impact only |               Yes |               Yes |
| Blind-spot cue                |              Yes |               Yes |               Yes |
| Local category classification |      Minimal/off |          Optional |                On |
| Submit details                |         Log only |           Popover |      Confirmation |
| Standard form pause           |               No |       Exceptional |    Where possible |
| Persistent local history      |           Opt-in |            Opt-in |            Opt-in |

Level 3でも、観測不能な送信を完全に止められると表示してはならない。

---

## 15. UI仕様

### 15.1 Chip

用途：入力面の性質を早期に知らせる。

要件：

- 入力を妨げない位置
- フォーカスを奪わない
- 色以外のアイコン・テキストを持つ
- 詳細表示への導線
- 閉じる・ミュートが可能

### 15.2 Popover

用途：Submit、遷移、同意等で分かった事実をまとめる。

表示順：

1. 確認できた事実
2. 推定された項目
3. 分からない項目
4. ユーザーの選択肢

### 15.3 Confirmation

Level 3 の標準フォームで使用する。

ボタン例：

- 内容を確認して続行
- 戻る
- このサイトでは一時的に表示しない

「安全に送信」など安全保証を含む表現を使わない。

### 15.4 Blind-Spot Indicator

死角は赤い危険表示だけにしない。

状態例：

- 観測済み
- 一部観測
- 高不確実性
- 観測不能

---

## 16. Message Catalog 仕様

メッセージは `FactCode` と `ObservabilityState` から生成する。

```ts
export interface MessageDefinition {
  messageId: string;
  factCode?: FactCode;
  observabilityState?: ObservabilityState;
  severity: 'info' | 'attention' | 'high_impact';
  shortJa: string;
  detailJa: string;
  prohibitedAlternatives?: string[];
}
```

### 初期メッセージ例

| ID                       | Short message                                            |
| ------------------------ | -------------------------------------------------------- |
| `FIELD_PASSWORD`         | この入力欄はパスワードを受け取る形式です。               |
| `FIELD_PAYMENT`          | この入力欄は決済情報に関連する形式です。                 |
| `PAGE_HTTP`              | このページの通信は暗号化されていません。                 |
| `FORM_EXTERNAL`          | このフォームの送信先は現在のサイトと異なります。         |
| `INPUT_NETWORK_ACTIVITY` | 入力操作中に通信が発生しました。                         |
| `INPUT_NETWORK_UNKNOWN`  | その通信に入力内容が含まれるか、DSSIでは確認できません。 |
| `SURFACE_PARTIAL`        | DSSIはこの入力面を一部だけ観測できました。               |
| `SURFACE_UNOBSERVABLE`   | DSSIはこの入力面の構造を十分に観測できません。           |

---

## 17. Session Log 仕様

### 17.1 Event Record

```ts
export interface ObservationLogRecord {
  schemaVersion: 2;
  eventId: string;
  timestamp: number;
  sessionId: string;
  domainKey: string;
  surfaceType: SurfaceType;
  triggerType: TriggerType;
  inputOrigin?: InputOrigin;
  facts?: FactCode[];
  operationEvidence: OperationEvidence;
  classificationConfidence?: 'explicit' | 'heuristic' | 'generic' | 'unknown';
  observationScope: ObservationScope;
  boundaryObservability?: ObservabilityState;
  viscosityLevel: 1 | 2 | 3;
  cuePresented: boolean;
  userResponse?: UserResponse;
}
```

### 17.2 Domain Key

初期版は、完全URLを保存しない。

候補：

- eTLD+1相当の縮約ドメイン
- セッションごとのsalt付きhash

ユーザー向けログ表示が必要な場合、完全URL保存は別の明示設定とする。

### 17.3 Retention

- Session buffer: browser session終了まで
- Persistent local history: opt-in
- Clear all: options pageから即時実行

---

## 18. Settings 仕様

```ts
export interface DssiSettings {
  enabled: boolean;
  viscosityLevel: 1 | 2 | 3;
  localClassificationEnabled: boolean;
  networkObservationEnabled: boolean;
  downloadObservationEnabled: boolean;
  persistentHistoryEnabled: boolean;
  siteOverrides: Record<string, SiteOverride>;
}
```

設定変更は即時反映し、容易に戻せること。

サイト単位のミュートには期限を設定できる。

---

## 19. 権限構成案

### 19.1 Base Build

```json
{
  "manifest_version": 3,
  "permissions": ["storage"],
  "background": {
    "service_worker": "service-worker.js",
    "type": "module"
  }
}
```

実際の host permissions と content scripts は、配布ポリシーに合わせて確定する。

### 19.2 Optional Capabilities

- Network metadata observation: `webRequest`
- Download event observation: `downloads`
- Runtime injection: `scripting`

必要な権限だけを段階的に要求する。

### 19.3 Host Permission Strategy

技術スパイクで次を比較する。

A. 常時観測のための広範なhost permission  
B. `optional_host_permissions` でユーザーが全サイトまたは選択サイトを許可  
C. `activeTab` 中心の限定モード

製品目的上は常時の早期気づきが重要だが、権限の広さと導入信頼を比較し、配布版を決定する。

---

## 20. Privacy Enforcement 仕様

### 20.1 Prohibited Persistence

次の文字列をStorageへ渡すコードパスを作らない。

- field value
- clipboard value
- password
- payment number
- raw request body
- prompt/comment/email body

### 20.2 Development Safeguards

- loggerは構造化メタデータだけを受け付ける型にする。
- raw content型をlogger引数へ渡せないようにする。
- テストでStorage内容を検査する。
- production buildでdebug loggingを無効化する。

### 20.3 No External Communication

初期配布版の拡張コード自身は、更新・Chrome標準処理を除き、DSSI管理サーバーへ通信しない。

---

## 21. Error Handling

### 21.1 Detector Failure

- 検出器単位で失敗を隔離する。
- ページ全体の操作を停止しない。
- 必要に応じて `partially_observable` を返す。

### 21.2 Presenter Failure

- UI表示に失敗しても送信や入力を恒久停止しない。
- Level 3の保留処理ではタイムアウトまたは復旧導線を持つ。

### 21.3 Service Worker Suspension

Service workerが常駐しない前提で、状態をメモリだけへ依存させない。

必要な設定はstorageへ保存し、タブ単位の短期状態は再構成可能にする。

---

## 22. テスト仕様

### 22.1 Unit Tests

- field classification
- input origin classification
- submit context parsing
- origin comparison
- consent proximity rules
- observability evaluation
- viscosity policy
- message selection
- privacy logging guard

### 22.2 Fixture Pages

最低限、次のfixtureを作る。

1. Standard login form
2. Payment form
3. Same-origin POST form
4. External-origin form action
5. JavaScript fetch submit
6. contenteditable comment box
7. AI-like prompt box
8. iframe-contained form
9. open Shadow DOM input
10. closed Shadow DOM simulation
11. consent checkbox with terms link
12. executable download link
13. page generating network activity while typing
14. dynamically inserted form

### 22.3 Integration Tests

- focus -> detection -> chip
- paste -> origin classification
- submit -> popover
- Level 3 standard form pause -> confirmation -> continue
- network event -> correlation -> non-assertive message
- mute -> no UI -> automatic recovery
- session clear -> logs removed

### 22.4 Privacy Tests

- password is absent from storage
- prompt text is absent from storage
- clipboard value is absent from storage
- raw request body is absent from persistent log
- no DSSI-managed external request occurs

### 22.5 Accessibility Tests

- keyboard-only flow
- screen reader labels
- focus return
- high contrast
- reduced motion

---

## 23. 受入シナリオ

### AC-001 Password Field

Given: password field exists  
When: user focuses the field  
Then: DSSI displays a factual chip before submit  
And: field content is not stored

### AC-002 Paste Detection

Given: supported text field  
When: user pastes text  
Then: input origin becomes `paste_confirmed`  
And: clipboard content is not persisted

### AC-003 Autofill Uncertainty

Given: field value changes without correlated keyboard/paste event  
When: DSSI cannot identify the source  
Then: source is `autofill_or_manager_suspected` or `unknown`  
And: DSSI does not state that a password manager was definitely used

### AC-004 Standard Form Destination

Given: form action points to another origin  
When: user attempts submit  
Then: DSSI displays the observed destination difference

### AC-005 JavaScript-controlled Submit

Given: no standard form submit is observed  
When: click is followed by network activity  
Then: DSSI records `javascript_controlled_unknown`  
And: does not claim to have captured all content

### AC-006 Live-Sync Blind Spot

Given: user is typing in a free-text surface  
When: network activity occurs in the same tab  
Then: DSSI displays that communication occurred  
And: states that the relationship to typed content is unknown

### AC-007 Unobservable Surface

Given: input exists inside an inaccessible context  
When: DSSI cannot inspect it  
Then: DSSI reports an observation blind spot where technically possible

### AC-008 Level 1

Given: Silent Mode  
When: ordinary supported input is used  
Then: metadata is recorded in session buffer  
And: UI remains minimal

### AC-009 Level 2

Given: Awareness Mode  
When: high-impact action is attempted  
Then: facts and unknowns are presented before or during the action where possible

### AC-010 Level 3

Given: Sovereign Mode and standard HTML form  
When: submit is attempted  
Then: DSSI pauses the form where technically possible  
And: user may continue or return

---

## 24. 実装順序

### Sprint 0 — Foundation

- repository setup
- TypeScript build
- Manifest V3 scaffold
- lint / format / test
- privacy-safe logger

### Sprint 1 — Input Recognition

- content script bootstrap
- MutationObserver
- focus/input/paste/keydown capture
- ActionSurface model
- field classifiers
- passive chip

### Sprint 2 — Submit Context

- form analysis
- submit trigger detection
- destination/method/encoding facts
- Level 2 popover
- Level 3 standard form guard

### Sprint 3 — Observability and Blind Spots

- observability evaluator
- high-uncertainty surfaces
- blind-spot messages
- inaccessible iframe/shadow handling

### Sprint 4 — Silent Log and Modes

- session buffer
- options page
- Level 1/2/3 policy
- mute and recovery
- local log viewer

### Sprint 5 — Network Metadata Spike

- optional `webRequest`
- tab/frame/document correlation
- network-during-input state
- no-payload default

### Sprint 6 — Consent / Navigation / Download

- consent detector
- external link analysis
- download link analysis
- optional downloads API decision

### Sprint 7 — Release Hardening

- privacy tests
- accessibility tests
- permissions review
- Chrome Web Store listing materials
- privacy policy
- release checklist

---

## 25. 開発開始判定

以下が揃えば、Sprint 0へ着手する。

- 要件定義書の承認
- 本仕様書の承認
- 初期ライセンス方針の確認
- リポジトリ作成場所の決定
- パッケージマネージャの決定
- Chrome最低対応バージョンの仮設定

未解決のネットワーク完全捕捉、Python連携、OS連携は、Sprint 0開始条件に含めない。

---

## 26. 公式技術文書との照合項目

実装時には、Chrome for Developers の最新公式文書で次を確認する。

- Manifest V3
- content scripts と isolated world
- extension service worker lifecycle
- `webRequest` の観測範囲
- `webRequestBlocking` の一般配布制約
- host permissions / optional permissions
- Chrome Web Store の single purpose
- minimum permissions
- user data / privacy disclosure

仕様と公式APIが衝突した場合、事実を更新し、本仕様書の技術項目を改訂する。DSSIの中心原則と死角開示原則は維持する。

---

## 27. v0.4.2実装差分：MAX報告と観測範囲台帳

v0.4.2では、粘性Level 1-3とは別に`max_coverage`報告モードを追加する。MAXは観測権限や本文取得を増やすものではなく、現在の観測面で取得できた診断通信と、既知の観測限界の表示量を増やす。

対象通信の相関は次の三分類とする。

- 内容変更から2500ms以内
- 標準form操作から2000ms以内
- 上記の相関を確認できない

第三分類はMAX時だけ診断ログへ保存し、「意図外送信」「自動送信」「入力内容送信」とは表示しない。

設定画面には、事象ログとは別にCoverage Manifestを表示する。

- 観測している
- 観測後に縮約する
- 設計上、観測しない
- 現在の仕組みでは観測できない
- 未知残差

保存Cookie、request body、ページ内部メモリ、確立済み通信路の個別メッセージはCore Aの観測経路へ接続しないか、現在の観測面では確認できない領域として明示する。

チップ本体は操作透過を維持し、小さな移動ハンドルだけを操作可能にする。位置は上、左、下、右の閉じた分類としてローカル設定へ保存する。
