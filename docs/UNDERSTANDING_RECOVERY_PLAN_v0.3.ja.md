# DSSI Core A 理解回収計画 v0.3

Status: Planned  
Timing: Sprint 2.2 completion後

## 1. 目的

DSSI Core A v0.3系までに増えた実装を、設計者が所有可能な理解へ戻す。

ここでの目的は、すべてのTypeScript構文やChrome APIを暗記することではない。各機能について、どこで起動し、何を読み、どの根拠で分類し、何を保存し、何を観測できないかを説明できる状態を作る。

## 2. 成果物

### 2.1 実装地図

- ディレクトリ構造
- 各ファイルの責務
- 変更時の影響範囲
- `src`から`dist`への生成対応

### 2.2 イベントフロー

対象:

- focus
- keydown
- beforeinput
- input
- paste
- click
- submit
- MutationObserver
- Service Worker message

各イベントについて記録:

```text
発火条件
受信場所
信頼性判定
相関時間窓
生成される観測記録
チップ表示条件
死角
```

### 2.3 データモデル

- ObservationRecord
- 操作証拠
- 入力面分類根拠
- 境界観測範囲
- フレーム情報
- submit関連づけ
- 保存禁止情報

### 2.4 保存境界

確認項目:

- `chrome.storage.session`
- `chrome.storage.local`
- セッション終了時の扱い
- ログ上限
- 消去操作
- 入力本文を保存しない保証
- URL query/pathを保存しない保証

### 2.5 UI表示境界

- Popup
- Options
- Log Viewer
- Fact Chip
- 通常ログ
- 診断ログ

表示すべき事実と、内部診断だけに残す情報を分離する。

### 2.6 テスト保証表

各テストについて、何を保証し、何を保証しないかを記録する。

例:

```text
paste correlation test
  保証する:
    pasteイベントとinputイベントを時間相関できる

  保証しない:
    すべてのブラウザ・サイトで同じイベント順序になる
    クリップボード内容が正しい
    サイトが内容を保存した
```

## 3. 理解確認の問い

設計者は、各機能について次に答えられる状態を目標とする。

1. なぜこのイベントを使うのか。
2. 直接観測と相関確認はどう違うか。
3. `event.isTrusted`は何を証明し、何を証明しないか。
4. 貼り付け反映確認はどの時間窓で成立するか。
5. 自由記述欄が一般分類になる理由は何か。
6. 入力面の用途と通信境界をなぜ分けるのか。
7. submit要素への操作とsubmit成立をなぜ分けるのか。
8. 標準formから読める送信情報は何か。
9. `fetch`やXHRが未観測であることはどこに現れるか。
10. iframeとトップフレームはどこで識別されるか。
11. どの情報がログへ保存されないか。
12. 変更するならどのファイルを触るか。
13. その変更をどのテストで確認するか。

## 4. 進め方

### Step 1

現在のファイル一覧を取得し、責務表を作る。

### Step 2

入力イベント一件を選び、ブラウザイベントからログ表示まで追跡する。

推奨対象:

```text
paste
```

### Step 3

標準フォーム送信一件を選び、click / Enterからsubmit相関まで追跡する。

### Step 4

保存されるObservationRecordを一件ずつ確認する。

### Step 5

テストファイルを読み、仕様との対応表を作る。

### Step 6

設計者自身の言葉で、Core A v0.3の動作を再記述する。

## 5. 完了条件

- ファイル責務表がある
- 入力イベントフロー図がある
- 送信イベントフロー図がある
- 保存データ一覧がある
- 保存禁止情報一覧がある
- 観測不能領域一覧がある
- テスト保証表がある
- 設計者が主要機能を説明できる
- 次Sprintの変更影響を予測できる

## 6. 原則

> コードをすべて自力で書けることではなく、コードがどの境界へ触れ、何を持ち帰り、何を持ち帰らないかを説明できることを、実装理解の基準とする。


### 付録

以下は、DSSI Core A v0.3.2の実装を前提にした説明です。単なる一般論ではなく、現在のコードがどこまで実現しているか、何をまだ保証していないかまで分けます。

## 1. なぜこのイベントを使うのか

DSSIは、入力内容そのものではなく、ブラウザ上で起きる境界事象を観測します。そのため、DOMイベントを入口にしています。

現在使っている主なイベントは次です。

```text
focusin
focusout
keydown
paste
beforeinput
input
click
submit
```

それぞれ役割が違います。

`focusin`は、利用者またはブラウザが入力面へ接触したことを知るために使います。

```text
入力欄が存在する
```

だけでは、利用者がその入力欄を使おうとしているとは限りません。`focusin`が起きることで、少なくともその入力面が操作対象になったことを観測できます。

`keydown`は、キーボード操作が入力変化の直前にあったかを記録するために使います。ただし、`keydown`単独では文字が実際に入力されたとは限りません。

```text
keydown
→ キーが押された

input
→ 入力面の値または編集状態が変化した
```

そのため、両者を後で相関させます。

`paste`は、貼り付け操作そのものが発生したことを直接観測するために使います。ただし、貼り付けが拒否されたり、ページ側でキャンセルされたりする可能性があります。

`beforeinput`は、ブラウザが報告する`inputType`を先に保持するために使います。たとえば、

```text
insertFromPaste
insertText
insertReplacementText
```

のような入力種別です。

`input`は、入力面へ実際に編集変化が反映されたことを観測するために使います。

`click`は、標準formに属するsubmitボタンやsubmit inputへの操作を検出するために使います。

`keydown`のEnterは、Enterによってフォーム送信が始まる可能性を記録するために使います。ただし、Enterを押しただけで送信したとは断定しません。

`submit`は、DOM上でフォーム送信イベントが成立したことを観測するために使います。

実装上は次のファイルです。

```text
src/content/input-surface-observer.ts
src/content/submission-observer.ts
```

重要なのは、イベントを使う理由が「取れるから」ではなく、各イベントが異なる境界事実を表すからです。

---

## 2. 直接観測と相関確認はどう違うか

直接観測とは、そのイベント自体をDSSIが受け取ったことです。

たとえば、

```text
pasteイベントを受け取った
```

なら、貼り付け操作イベントを直接観測しています。

コード上では、次の証拠型になります。

```text
direct_trusted_event
```

一方、相関確認とは、複数の別イベントが時間的・対象的に結びついていることを確認した状態です。

たとえば、

```text
paste
↓ 300ms以内
同じ入力面でinput
```

が起きた場合、

```text
貼り付け操作を観測した
かつ
入力面への反映を観測した
```

と扱えます。

この場合の証拠型は、

```text
correlated_trusted_events
```

です。

標準formでも同じ考え方です。

```text
submitボタンをclick
↓ 1500ms以内
同じformでsubmitイベント
```

なら、

```text
同一フォームでsubmit成立と相関
```

になります。

直接観測は「一点の事実」です。

相関確認は「複数の事実の履歴的な接続」です。

ただし、相関は因果関係を完全に証明するものではありません。DSSIは、時間窓と同一対象という条件から、実務上妥当な関連づけを行っています。

---

## 3. `event.isTrusted`は何を証明し、何を証明しないか

`event.isTrusted`は、そのイベントがブラウザによって生成されたイベントかどうかを示します。

一般に、

```text
利用者操作やブラウザ標準処理から発生
→ isTrusted = true

JavaScriptでdispatchEventして人工的に発生
→ isTrusted = false
```

となります。

DSSIでは、`isTrusted`がtrueなら、

```text
信頼済みイベントを直接観測
```

または、

```text
信頼済みイベント列を相関
```

と扱います。

実装例は次です。

```ts
event.isTrusted
  ? 'direct_trusted_event'
  : 'untrusted_or_unknown'
```

ただし、`isTrusted`が証明するのは限定的です。

証明しやすいこと：

```text
ページ内スクリプトがdispatchEventしただけの人工イベントではない
ブラウザのイベント系から発生した
```

証明しないこと：

```text
人間本人が操作した
操作が自発的だった
内容を理解して操作した
悪意がなかった
入力内容が正しい
通信が成立した
サーバーへ届いた
```

たとえば、ブラウザの自動入力、パスワードマネージャー、アクセシビリティ機能、OSレベルの入力支援でも、信頼済みイベントとして現れる可能性があります。

したがって、

```text
isTrusted = true
```

は、

```text
人間が意図的に行った
```

と同義ではありません。

DSSIでは、`trusted`を「利用者本人の意思」ではなく、「ブラウザイベントとしての生成経路の信頼性」として扱っています。

---

## 4. 貼り付け反映確認はどの時間窓で成立するか

現在の実装では300ミリ秒です。

定義は次の場所にあります。

```text
src/core/input-origin.ts
```

定数：

```ts
const PASTE_REFLECTION_WINDOW_MS = 300;
```

流れは次です。

```text
pasteイベント
↓
発生時刻をlastPasteAtへ保存
↓
inputイベント
↓
現在時刻との差を確認
↓
300ms以内なら貼り付け反映として相関
```

条件は次です。

```text
lastPasteTrusted === true
現在時刻 - lastPasteAt が0ms以上300ms以下
inputイベントもtrusted
```

この条件を満たすと、

```text
origin: paste_confirmed
operationEvidence: correlated_trusted_events
```

になります。

ただし、別経路もあります。

`inputType`が`insertFromPaste`を含み、`input`イベント自体がtrustedなら、別の`paste`イベントが保存されていなくても、

```text
paste_confirmed
direct_trusted_event
```

になります。

つまり現在は二経路あります。

```text
paste + inputを300ms以内で相関
→ correlated_trusted_events

trusted inputType=insertFromPasteのみ
→ direct_trusted_event
```

また、同じ貼り付け反映が短時間に重複記録されないよう、200ミリ秒以内の再記録を抑制しています。

```ts
now - state.lastPasteReflectionLoggedAt <= 200
```

300msという値は絶対的な真理ではありません。一般的なブラウザイベント列で過剰に広げず、通常の反映を拾うための暫定値です。

---

## 5. 自由記述欄が一般分類になる理由は何か

現在、次のような入力面は`free_text`になります。

```text
textarea
contenteditable
role="textbox"
input type="text"
input type="search"
input type="url"
```

分類確度は、

```text
generic
```

です。

理由は、入力面の構造は分かっても、その用途までは分からないからです。

たとえば`textarea`は、

```text
SNS投稿
問い合わせ
AIプロンプト
コメント
メール本文
日記
社内メモ
住所補足
```

のどれにも使えます。

DOM上の構造だけから、どの社会的用途かを安全に確定できません。

そのため、

```text
入力面としては自由記述
用途は一般分類
```

とします。

ここで重要なのは、

```text
一般分類
```

が、

```text
観測精度が低い
```

という意味ではないことです。

Sprint 1.2で分離された点です。

```text
入力面用途の分類確度
≠
イベント観測の確実性
```

たとえば、自由記述欄であることは一般分類でも、貼り付けイベントがtrustedで観測されたことは明確です。

現在の実装では、

```text
surfaceType: free_text
classificationConfidence: generic
observationScope: input_surface_and_dom_events
operationEvidence: direct_trusted_event
```

のように別軸で保持されます。

---

## 6. 入力面の用途と通信境界をなぜ分けるのか

入力面の用途は、

```text
何を入力するための面か
```

を扱います。

通信境界は、

```text
その入力がどこへ送られる可能性があるか
どの送信構造が宣言されているか
```

を扱います。

両者は別問題です。

たとえば、同じ自由記述欄でも、

```text
ブラウザ内だけで保存
同一サイトへPOST
外部ドメインへ送信
JavaScriptでfetch
自動保存
WebSocketで同期
```

など、通信構造は異なります。

逆に、同じ標準formでも入力面は、

```text
メールアドレス
パスワード
検索語
コメント
住所
```

など異なります。

したがって、

```text
入力面分類
```

から、

```text
通信先
```

を推定してはいけません。

DSSIでは、次を別軸にしています。

```text
surfaceType
classificationConfidence
```

と、

```text
submissionMethod
destinationRelation
destinationHost
submissionMechanism
submissionAssociation
```

です。

この分離がないと、

```text
自由記述欄だからAIへ送られる
```

あるいは、

```text
パスワード欄だから外部送信される
```

といった不適切な断定が起きます。

---

## 7. submit要素への操作とsubmit成立をなぜ分けるのか

submitボタンを押しても、必ずsubmitイベントが成立するとは限りません。

考えられる例：

```text
JavaScriptでclickをキャンセル
入力検証に失敗
確認ダイアログが出る
ボタンが別処理へ使われている
formが存在しない
ページ側処理でpreventDefault
```

逆に、submitボタンを押さなくてもsubmitイベントは起こり得ます。

```text
Enterキー
スクリプトによるrequestSubmit
別のUIからフォーム送信
```

したがってDSSIは分けています。

submit要素への操作：

```text
triggerType: submitter_activation_observed
association: declared_submit_control
```

submitイベント成立：

```text
triggerType: submit_attempt
mechanism: form_submit_event
```

さらに、同一formで1500ms以内に両者が起きた場合、

```text
association: correlated_submit_event
```

になります。

この分離により、

```text
ボタンを押した
```

だけで、

```text
フォーム送信が成立した
```

とは表示しません。

さらに、submitイベントが成立しても、

```text
ネットワーク通信が完了した
サーバーが受信した
保存された
投稿が成功した
```

とは扱いません。

---

## 8. 標準formから読める送信情報は何か

現在、標準formから読む情報は次です。

```text
action
method
enctype
現在ページURL
```

そこから保存する情報は次です。

```text
method
encoding
送信先が同一オリジンか
クロスオリジンか
非HTTPか
送信先scheme
送信先host
送信機構
送信関連づけ
宣言送信先を解析できたか
```

具体的には、

```text
submissionMethod
submissionEncoding
destinationRelation
destinationScheme
destinationHost
submissionMechanism
submissionAssociation
declaredDestinationObservable
```

です。

例：

```text
POST
multipart/form-data
cross_origin
https
receiver.example
form_submit_event
correlated_submit_event
true
```

保存しない情報：

```text
actionのpath
query string
fragment
ユーザー名・パスワード部分
フォーム入力値
リクエスト本文
```

`submission-analyzer.test.ts`では、次のようなURLを入力しています。

```text
/submit?token=secret
```

しかし結果には、

```text
destinationHost: example.test
```

しか残しません。

`token=secret`は保存されません。

---

## 9. `fetch`やXHRが未観測であることはどこに現れるか

現時点では、`fetch`やXHRを直接観測する実装はありません。

コード上では、通信監視用のObserverやhookが存在しません。

現在の送信観測は、

```text
src/content/submission-observer.ts
```

による標準formのDOMイベントだけです。

この限界は、ログ上では主に次の形に現れます。

```text
observationScope:
  declared_submission_boundary
```

または、

```text
submission_boundary_partial
```

つまり、

```text
フォーム宣言上の送信境界を観測
```

であって、

```text
実通信を観測
```

ではありません。

また設定モデルには、

```text
networkObservationEnabled: false
```

がありますが、現時点ではネットワーク観測機能自体が未実装です。

`fetch`、XHR、WebSocket、sendBeaconなどは、以下のケースでログに現れません。

```text
ボタンを押す
↓
JavaScriptがfetchを実行
↓
標準form submitは発生しない
```

この場合、入力やclickは一部観測できても、通信境界は記録されません。

重要なのは、未観測であることが必ずしも毎回、

```text
fetch未観測
```

という個別ログとして出るわけではないことです。

現状は、

```text
標準form以外は観測対象外
```

という仕様上の限界として文書化されています。

したがって「未観測であることをどこに明示するか」は、今後さらに強化余地があります。

将来的には、

```text
標準form送信は未検出
JavaScript通信の可能性は観測対象外
```

という明示的な観測限界表示を追加する可能性があります。

---

## 10. iframeとトップフレームはどこで識別されるか

識別はContent Script側ではなく、Service Worker側で行います。

対象ファイル：

```text
src/background/service-worker.ts
```

判定は、

```ts
sender.frameId === 0 ? 'top' : 'iframe'
```

です。

Content Scriptは、自分がどのフレームで動いているかを最終確定しません。

理由は、Service Workerがメッセージ受信時にChromeの`MessageSender`情報を受け取れるからです。

Service Workerは次を補完します。

```text
frameType
topLevelDomain
frameDomain
```

`frameDomain`はContent Scriptが観測した文書のhostnameです。

`topLevelDomain`は`sender.tab.url`から取得します。

例：

```text
topLevelDomain: blog.hatena.ne.jp
frameDomain: platform.twitter.com
frameType: iframe
```

これにより、

```text
埋め込みフレーム · blog.hatena.ne.jp → platform.twitter.com
```

と表示できます。

また、iframe内の`page_observation_started`はService Worker側で抑制されます。

```ts
if (
  enriched.frameType === 'iframe' &&
  enriched.triggerType === 'page_observation_started'
)
```

実際の入力やsubmitが起きたiframeログは残ります。

---

## 11. どの情報がログへ保存されないか

保存しないことが明示されている主な情報は次です。

```text
入力値
パスワード本文
カード番号
貼り付け内容
AIプロンプト本文
コメント本文
メール本文
リクエスト本文
通信body
フォームbody
```

また、安全な構造情報では次も保存しません。

```text
name属性
id属性
aria-label本文
placeholder本文
label本文
周辺テキスト
semanticText
```

ただし、入力面分類時にはこれらを一時的に参照しています。

```text
分類のためには読む
ログには保存しない
```

という分離です。

種類不明入力面について保存できるのは、限定された構造情報だけです。

```text
tagName
inputType
role
contenteditableか
安全なautocomplete token
```

さらに標準formについても保存しません。

```text
action path
query
fragment
credentials
入力値
本文
```

保存前には、

```text
src/core/privacy-safe-logger.ts
```

で禁止キー検査を行います。

禁止対象のキー断片：

```text
value
content
body
clipboard
password
paymentnumber
prompt
messagebody
requestbody
```

ただし、この検査には限界があります。

現在はトップレベルのキー名だけを検査しています。深いネスト構造や、禁止語を使わない別名でデータを入れた場合まで完全に防ぐ仕組みではありません。

現実には、型定義とRecord Factoryが保存項目を限定していることと、Privacy Safe Loggerの二重構造で守っています。

---

## 12. 変更するならどのファイルを触るか

変更内容によって異なります。

### 観測するDOMイベントを変える

```text
src/content/input-surface-observer.ts
src/content/submission-observer.ts
```

例：

```text
compositionイベントを追加
focus重複抑制
新しい入力イベントを観測
```

### 入力起源の相関時間や判定を変える

```text
src/core/input-origin.ts
```

例：

```text
paste 300msを変更
keyboard 1200msを変更
IME入力の判定追加
```

### 入力面分類を変える

```text
src/core/surface-classifier.ts
```

例：

```text
file inputを独立分類
AIプロンプト分類
コメント欄分類
```

### DOM属性の読み取り方を変える

```text
src/content/surface-descriptor.ts
```

例：

```text
新しいselector追加
安全な構造情報追加
semanticTextの作り方変更
```

### ObservationRecordの項目を変える

```text
src/core/models/observation.ts
src/core/observation-factory.ts
```

新しい項目を増やす場合、表示・保存・テストも連動します。

### 標準formの送信情報を変える

```text
src/core/submission-analyzer.ts
src/core/models/submission.ts
src/content/submission-observer.ts
```

### iframe／トップフレーム判定を変える

```text
src/background/service-worker.ts
```

### 保存件数・保存層・保存形式を変える

```text
src/storage/session-buffer.ts
```

### 保存禁止情報の規則を変える

```text
src/core/privacy-safe-logger.ts
```

### 日本語表示を変える

```text
src/core/observation-presentation.ts
```

### Popupやログ表を変える

```text
src/popup/popup.ts
src/popup/popup.html
src/logs/logs.ts
src/logs/logs.html
src/ui/fact-chip.ts
```

---

## 13. その変更をどのテストで確認するか

現在のテストは主に純関数単位です。

### paste・keyboard・入力起源判定

```text
tests/unit/input-origin.test.ts
```

確認対象：

```text
trusted paste + inputの相関
insertFromPaste単独
keyboard + inputの相関
untrusted event
autofill推定
```

貼り付け時間窓を変えるなら、このテストへ境界値を追加します。

例：

```text
299msなら相関
300msなら相関
301msなら非相関
```

現状のテストは基本パターンを確認していますが、時間窓の厳密な境界値テストは追加余地があります。

### 入力面分類

```text
tests/unit/surface-classifier.test.ts
```

確認対象：

```text
password
payment
email_or_id
personal_information
free_text
unknown
```

自由記述の分類規則を変える場合はここです。

### 安全な構造情報

```text
tests/unit/surface-descriptor.test.ts
```

確認対象：

```text
semanticTextを保存しない
不正なroleを捨てる
不正なautocomplete tokenを捨てる
```

### 標準form送信情報

```text
tests/unit/submission-analyzer.test.ts
```

確認対象：

```text
same-origin
cross-origin
non-http
不正URL
method
encoding
queryを保持しない
```

### 保存禁止情報

```text
tests/unit/privacy-safe-logger.test.ts
```

確認対象：

```text
metadata-only recordを許可
fieldValue
promptBody
clipboardContent
requestBody
password
を拒否
```

### 日本語表示

```text
tests/unit/observation-presentation.test.ts
```

確認対象：

```text
観測事実のラベル
操作証拠のラベル
分類確度のラベル
観測範囲
フレーム表示
submit相関
安全な構造情報
通常ログと診断ログの区別
```

### チップ表示方針

```text
tests/unit/cue-policy.test.ts
```

確認対象：

```text
Level 1
Level 2
Level 3
各入力面で表示するか
```

### 設定既定値

```text
tests/unit/settings.test.ts
```

確認対象：

```text
networkObservationEnabled: false
persistentHistoryEnabled: false
初期粘性Level
```

## 現在のテストで確認できていないこと

ここは重要です。

現在のVitestは主に純関数単体テストです。次の全体接続は自動テストされていません。

```text
実ブラウザでpasteイベント発生
↓
Content Script
↓
chrome.runtime.sendMessage
↓
Service Worker
↓
chrome.storage.session
↓
ログ画面表示
```

また、

```text
click
↓
同一form submit
↓
1500ms相関
```

のObserver全体動作も、ブラウザ統合テストとしては未整備です。

そのため現在は、

```text
単体テスト
＋
テストページ
＋
実在サイトでの手動確認
```

で補っています。

将来は、Playwrightなどによるブラウザ統合テストを追加すると、ObserverからUIまでの全経路を自動確認できます。

## 全13項目を一つの流れにすると

貼り付けの場合：

```text
pasteイベントを使う
↓
event.isTrustedを確認
↓
直接観測として記録
↓
300ms以内のinputを待つ
↓
同じ入力面なら相関確認
↓
入力面用途を分類
↓
用途分類と通信境界を分離
↓
本文を捨てる
↓
ObservationRecordを生成
↓
Service Workerでframeを補完
↓
Privacy Safe Loggerを通す
↓
session storageへ保存
↓
日本語ラベルで表示
```

標準formの場合：

```text
clickまたはEnter
↓
送信候補として記録
↓
同一formのsubmitを1500ms待つ
↓
成立すれば相関
↓
form宣言からmethod・encoding・hostを抽出
↓
path・query・bodyは捨てる
↓
実通信ではなく宣言上の境界として保存
↓
fetch/XHRは未観測のまま
```

この13項目に答えられる状態とは、コードの文法を全部説明できることではありません。

> どの事実をどのイベントから取り、どの条件で意味を強め、どこで断定を止め、何を保存せず、どのファイルとテストがその責任を持つか

を説明できる状態です。

それが、Core A v0.3を設計者として所有できている状態です。

### イベント監視の仕組み｜分類観測はどのように行われるか

はい。DOM側には、イベントを受け取るための標準的な仕組みが用意されています。

DSSIが「直接観測」するときは、ざっくり言えば、

```text
ブラウザが発生させたDOMイベント
↓
DSSIが登録した関数
↓
その関数が呼ばれる
```

という構造です。

中心になるのは `addEventListener` です。

## DOMにイベント監視の仕組みがある

Webページ上の要素や文書は、`EventTarget`という仕組みを持っています。

`document`、`window`、`input`、`textarea`、`form`、`button`などは、イベントを受け取る対象になれます。

たとえば、貼り付けイベントを監視するなら、概念的には次です。

```ts
document.addEventListener("paste", handlePaste);
```

意味は、

```text
document上でpasteイベントが起きたら
handlePasteという関数を呼ぶ
```

です。

`handlePaste`はDSSI側が用意する関数です。

```ts
function handlePaste(event: ClipboardEvent): void {
  // pasteイベントを受け取った後の処理
}
```

DOMが`handlePaste`という特別な関数を最初から持っているわけではありません。

DOMが用意しているのは、

```text
イベントを発生させる仕組み
イベント監視関数を登録する仕組み
登録された関数へイベント情報を渡す仕組み
```

です。

DSSIが用意するのは、

```text
どのイベントを監視するか
イベントを受け取った後に何を確認するか
何を記録するか
```

です。

## `addEventListener`の三要素

次のコードを分解します。

```ts
document.addEventListener("paste", handlePaste);
```

### `document`

監視対象です。

ここではWebページ全体の文書を指します。

個別の入力欄ごとに監視関数を付ける方法もありますが、DSSIでは動的に追加される入力欄も扱いたいため、文書全体側でイベントを受ける方式が有効です。

### `"paste"`

監視するイベント名です。

ブラウザが定めた標準イベント名です。

ほかにも、

```ts
"focusin"
"keydown"
"beforeinput"
"input"
"click"
"submit"
```

などがあります。

### `handlePaste`

イベントが発生したときに呼ばれる関数です。

この種の関数は、一般にイベントハンドラー、イベントリスナー、コールバック関数などと呼ばれます。

## ブラウザはイベント情報を関数へ渡す

イベントハンドラーが呼ばれると、ブラウザはイベントを表すオブジェクトを渡します。

```ts
function handlePaste(event: ClipboardEvent): void {
  console.log(event.type);
}
```

この`event`には、たとえば次の情報があります。

```text
event.type
  pasteというイベント種別

event.target
  イベントが起きた対象

event.isTrusted
  ブラウザ由来のイベントか

event.timeStamp
  イベント時刻に関する情報

event.defaultPrevented
  標準処理がキャンセルされたか
```

ただし、DSSIはクリップボード本文を読むために`clipboardData`を使う設計にはしていません。

貼り付けイベントの存在は受け取りますが、貼り付けた文字列は記録しません。

## DSSIの「直接観測」の意味

DSSIでいう直接観測は、

> DSSI自身が登録したイベントリスナーが、対象DOMイベントを実際に受け取った

という意味です。

貼り付けなら、

```text
利用者またはブラウザが貼り付け操作
↓
ブラウザがpasteイベントを生成
↓
DOMイベント経路を伝播
↓
DSSIのhandlePasteが呼ばれる
↓
DSSIがpasteイベント観測記録を作る
```

という流れです。

つまり、画面を見て「たぶん貼り付けた」と推定しているのではありません。

ブラウザのイベント系から、`paste`というイベント通知を受け取っています。

ただし、ここで直接観測したのはあくまで、

```text
pasteイベントが届いた
```

ことです。

まだ、

```text
貼り付けた内容が入力面へ反映された
```

ことまでは確認していません。

その確認には後続の`input`イベントを使います。

## イベントは対象要素から伝播する

DOMイベントには、イベント伝播という仕組みがあります。

たとえば、入力欄でpasteが起きた場合、イベントは概念的に次の経路を通ります。

```text
window
↓
document
↓
html
↓
body
↓
入力欄
```

その後、逆方向へ上がってくることもあります。

この流れは次の三段階に分かれます。

```text
キャプチャフェーズ
  外側から対象へ向かう

ターゲットフェーズ
  対象要素上で処理される

バブリングフェーズ
  対象から外側へ戻る
```

`addEventListener`の第3引数で、どの段階で受け取るかを指定できます。

```ts
document.addEventListener("paste", handlePaste, true);
```

または、

```ts
document.addEventListener("paste", handlePaste, {
  capture: true,
});
```

ならキャプチャ段階です。

```ts
document.addEventListener("paste", handlePaste);
```

なら通常はバブリング段階です。

DSSIのような観測拡張では、ページ側の処理より先にイベントを受けたい場合や、途中で伝播を止められる可能性を減らしたい場合に、キャプチャ段階を使うことがあります。

## なぜ入力欄ごとに関数を付けないのか

入力欄へ直接付けるなら、こう書けます。

```ts
const input = document.querySelector("input");

input?.addEventListener("paste", handlePaste);
```

しかし現代のWebアプリでは、入力欄が後から追加・削除・再生成されます。

たとえばGeminiやXでは、Reactなどの仕組みによってDOM要素が差し替えられることがあります。

すると、最初の入力欄へ付けたイベントリスナーは、新しく作られた入力欄には付きません。

文書全体へ登録すれば、

```ts
document.addEventListener("paste", handlePaste);
```

後から追加された入力欄で起きたイベントも、伝播してくれば受け取れます。

これはイベント委譲と呼ばれる設計に近いです。

```text
個々の入力欄を監視
ではなく
文書全体でイベントを受け、event.targetから対象を判定
```

という方式です。

## `event.target`から入力面を探す

イベントを受け取った後、DSSIはイベントがどこで起きたかを確認します。

```ts
function handlePaste(event: ClipboardEvent): void {
  const target = event.target;
}
```

`event.target`には、通常、イベントの発生元となったDOM要素が入ります。

ただしTypeScript上では、必ずしも`HTMLElement`とは限らないので確認が必要です。

```ts
if (!(event.target instanceof HTMLElement)) {
  return;
}
```

その後、その要素が入力対象かを確認します。

```text
inputか
textareaか
contenteditableか
role="textbox"か
```

実装上は、こうした解決処理を`surface-descriptor.ts`などへ分けています。

つまりイベントハンドラーがすべてを担当するのではなく、

```text
イベントを受ける
↓
対象要素を解決する
↓
入力面記述子を作る
↓
分類器へ渡す
```

という責務分離になっています。

## DOMに「貼り付けられた」という関数があるわけではない

より正確に言うと、DOMには、

```text
貼り付けを検出する専用関数
```

が一個用意されているのではありません。

DOMには汎用的なイベント機構があり、イベント名として`paste`が定義されています。

開発者は、

```ts
addEventListener("paste", ...)
```

によって監視を登録します。

同じ方式で、

```ts
addEventListener("input", ...)
addEventListener("submit", ...)
addEventListener("focusin", ...)
```

も登録できます。

## Content ScriptはどこからDOMへ接触するのか

DSSIはブラウザ拡張なので、WebページにContent Scriptが挿入されます。

`manifest.json`には、概念的に次の指定があります。

```json
{
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content-script.js"],
      "all_frames": true
    }
  ]
}
```

ブラウザは対象ページが開かれたとき、DSSIのContent Scriptをその文書で実行します。

Content Script内で、

```ts
document.addEventListener(...)
```

を呼ぶことで、そのページのDOMイベントを監視します。

流れは次です。

```text
manifest.json
  対象ページでContent Scriptを実行するようChromeへ申告
↓
ChromeがページへContent Scriptを配置
↓
Content Scriptがdocumentへイベントリスナーを登録
↓
ページ上でイベント発生
↓
DSSIの関数が呼ばれる
```

## ページ側JavaScriptとの関係

Content ScriptはページのDOMへ接触できますが、通常はページ自身のJavaScriptとは別の実行領域で動きます。

Chrome拡張では、これをisolated worldと呼びます。

```text
ページ側JavaScript
  独自の変数・関数

DSSI Content Script
  DSSI独自の変数・関数

共有できるもの
  DOM構造とDOMイベント
```

そのため、DSSIが定義した関数をページ側が直接呼んだり、ページ側のローカル変数をDSSIが直接読んだりするわけではありません。

両者の接点は主にDOMです。

この分離は、拡張機能の処理がページ側スクリプトと不用意に衝突するのを防ぎます。

## 直接観測できない場合もある

DOMイベント機構を使えば何でも観測できるわけではありません。

たとえば、

```text
イベントがDOM上で発生しない
ページ側が特殊な内部処理を行う
ブラウザ拡張が接触できない特殊ページ
別プロセス・別アプリで起きる
ネットワーク通信だけが発生する
Shadow DOMの扱いが特殊
イベント伝播が途中で止められる
```

などがあります。

また、`fetch`やXHRは入力DOMイベントとは別です。

```text
ボタンclick
↓
ページJavaScriptがfetchを呼ぶ
```

場合、clickはDOMイベントとして受け取れても、fetch通信そのものは現在のDSSIでは直接観測していません。

## 直接観測は、ブラウザの観測APIに依存する

したがって「直接」という言葉も相対的です。

DSSIが現実世界の指やキーボードを物理的に直接見ているわけではありません。

正確には、

> ブラウザがDOMイベントとして外部へ公開した事実を、DSSIがイベントリスナーで直接受信している

という意味です。

観測の階層は次です。

```text
物理操作
↓
OS
↓
ブラウザ
↓
DOMイベント
↓
DSSIイベントリスナー
↓
ObservationRecord
```

DSSIにとっての直接観測面はDOMイベントです。

その前段階にある物理操作やOS処理は、ブラウザによって既に変換されています。

だから`event.isTrusted`も、

```text
物理的に人間が操作した証明
```

ではなく、

```text
ブラウザが信頼済みイベントとして渡した
```

ことの証明に留まります。

## 一文でまとめると

DSSIの直接観測は、

> Content ScriptがDOMの`addEventListener`を使って、`paste`、`input`、`submit`などの標準イベントを監視登録し、ブラウザからイベントオブジェクトを受け取ることで成立する。

という仕組みです。

そしてDSSIでは、その受信関数から、

```text
イベント受信
↓
対象DOM要素の解決
↓
trusted判定
↓
入力面分類
↓
前後イベントとの相関
↓
ObservationRecord生成
```

へ進みます。

#### DSSI用語集準備

必要です。しかも一般的なWeb開発用語集ではなく、**DSSI内部でその語をどの意味に限定して使うかを固定する用語集**が必要です。

特に「直接」は危険です。日常語では「現実をそのまま見た」という強い意味に読めますが、DSSIでの直接観測はそこまで強くありません。

暫定的には、次の定義が適切です。

### 直接観測

DSSIのContent ScriptがDOMのイベント監視機構を通じて、ブラウザからイベントオブジェクトを受け取った状態。

例：

```text
paste
input
focusin
click
submit
```

「直接」とは、別の結果から推測したのではなく、そのイベント種別の通知をDSSI自身が受信したという意味である。

ただし、次は証明しない。

```text
物理的に本人が操作した
本人が意図して操作した
内容を理解していた
入力内容が反映された
通信が成立した
サーバーへ到達した
```

もう少し短くUI寄りにするなら、あなたの案を少し整えて、

> DOMイベント機構から、ブラウザが生成したイベント通知をDSSIが受け取った。

がよいです。

ただし、

> ブラウザによる信頼されたイベント

は、`event.isTrusted === true`の場合に限定した方が正確です。直接観測とtrustedは別軸です。

たとえば、JavaScriptで人工的に発火されたイベントでも、DSSIはイベント自体を直接受信できます。

```text
直接観測: した
isTrusted: false
```

したがって、用語集では次のように分けるべきです。

## 直接観測

DSSIが対象となるDOMイベント通知をイベントリスナーで受信したこと。

## 信頼済みイベント

受信したDOMイベントについて、`event.isTrusted`が`true`だったこと。

ブラウザのイベント生成経路から渡されたことを示すが、本人の意思、理解、自由意思、操作内容の正しさまでは証明しない。

## 相関確認

時間的に近接した複数のイベントが、同一の入力面または同一formに関係すると判定されたこと。

例：

```text
paste
↓ 300ms以内
同じ入力面でinput
```

または、

```text
submit要素へのclick
↓ 1500ms以内
同じformでsubmit
```

単独イベントより強い観測根拠になるが、完全な因果関係や通信成立は証明しない。

## 反映確認

操作イベントの後に、対象入力面で編集状態の変化を示す`input`イベントを観測したこと。

貼り付け本文そのものを確認したという意味ではない。

## 入力面

利用者が文字列や識別情報などを入力できるDOM上の領域。

例：

```text
input
textarea
contenteditable
role="textbox"
```

入力面の存在や種類を観測しても、その入力内容や最終用途までは確定しない。

## 一般分類

入力面の構造上の種類は判断できるが、具体的な社会的用途までは限定できない分類。

自由記述欄が代表例。

```text
SNS投稿
AIプロンプト
メール本文
コメント
検索語
```

などをDOM構造だけでは区別できないため、`free_text / generic`として扱う。

## 観測範囲

DSSIがその記録について、どの層まで確認できたかを示す項目。

例：

```text
入力面とDOMイベントを観測
フォーム宣言上の送信境界を観測
ページ面を部分観測
```

観測範囲を超える事実は、そのログからは主張しない。

## 送信候補

submit要素への操作やEnter入力など、標準form送信へつながる可能性がある事象を観測した状態。

submit成立や通信成立とは別。

## submit成立

同一formでDOMの`submit`イベントを受信した状態。

フォーム送信処理がDOMイベント段階へ進んだことを示すが、ネットワーク通信やサーバー到達は証明しない。

## 宣言送信先

標準formの`action`属性などから読み取れる、HTML上で宣言された送信先。

実際の通信先と一致するとは限らない。JavaScriptによる書き換え、`fetch`、XHRなどは別経路である。

## 未観測

DSSIの現在の観測方式では、その事象を確認できていない状態。

「起きていない」という意味ではない。

これはかなり重要です。

```text
未観測
≠
不存在
```

## 診断ログ

DSSI自身がどのページ・フレームで起動したかなど、観測機構の動作確認を目的とする記録。

利用者の操作履歴を示す通常ログとは分離する。

## 通常ログ

入力面への接触、貼り付け、キー入力、submit候補など、利用者の判断に関係する境界事象を表示する記録。

---

用語集の中核には、次の原則を置くべきです。

> DSSIの用語は、日常語としての最大意味ではなく、実装が保証できる最小意味で定義する。

たとえば、

```text
直接
送信
反映
信頼
確認
成立
```

は、いずれも強く読まれやすい語です。そのため必ず、

```text
どのイベントを受けたのか
どの層まで確認したのか
何を証明しないのか
```

を定義に含める必要があります。

ファイル名は、次が適切です。

```text
DSSI_Core_A_Operational_Glossary.ja.md
```

既存の一般用語集と分けるなら、

```text
docs/
└─ DSSI_Core_A_Operational_Glossary.ja.md
```

がよいです。これは単なる補助文書ではなく、ログ表示、型定義、テスト期待値を照合するための**意味上の正本**になります。
