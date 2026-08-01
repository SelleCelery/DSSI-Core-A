# DSSI Core A 運用用語集

## 位置づけ

この用語集は、DSSI Core Aのログ、型、UI、仕様書で使う語の最小意味を固定する。

DSSIの用語は、日常語としての最大意味ではなく、実装が保証できる最小意味で定義する。

## 直接観測 / Direct Observation

DSSIが対象DOMイベント通知を、登録したイベントリスナーで受信したこと。

例:

- `paste`
- `input`
- `focusin`
- `click`
- `submit`

「直接」とは、別の結果からそのイベントを推測したのではなく、ブラウザのDOMイベント機構から、そのイベント型の返りを受けたという意味である。

物理的に本人が操作したこと、操作意図、内容理解、通信成立は証明しない。

## 信頼済みイベント / Trusted Event

受信したDOMイベントの`event.isTrusted`が`true`だったこと。

ページ内JavaScriptが`dispatchEvent`で生成しただけの人工イベントではなく、ブラウザのイベント生成経路から渡されたことを示す。

本人性、自由意思、理解、操作結果の正しさは証明しない。

## ブラウザ通信API観測 / Browser Network API Observation

Chromeの拡張APIである`webRequest`から、通信開始メタデータを受け取ったこと。

DOMイベントの直接観測とは別の観測面である。通信開始の存在と限定メタデータを示すが、入力内容との因果、request body、サーバー受信、処理成功は証明しない。

## 相関確認 / Correlation Confirmation

複数の観測事実が、同一対象と時間窓を基準に関連づけられた状態。

例:

- pasteの後300ms以内に同じ入力面でinput
- submit候補の後1500ms以内に同じformでsubmit
- 信頼済みの内容変更操作の後2500ms以内に同じtab / frameで通信開始

相関は、単独事実より強い関係情報を持つが、因果関係の完全証明ではない。

## 反映確認 / Reflection Confirmation

操作イベント後に、対象入力面の編集変化を示す`input`イベントを観測したこと。

貼り付け本文や入力前後の値を比較したという意味ではない。

## 入力面 / Input Surface

利用者が情報を入力または編集できるDOM上の領域。

例:

- `input`
- `textarea`
- `contenteditable`
- `role="textbox"`

## 一般分類 / Generic Classification

入力面の構造的種類は判断できるが、具体的な社会的用途までは確定できない分類。

自由記述欄は、SNS投稿、AIプロンプト、メール、検索、コメントなどに使えるため、通常は一般分類となる。

一般分類はイベント観測の不確実性を意味しない。

## 操作証拠 / Operation Evidence

観測事実が、どの生成経路またはイベント関係に基づくかを示す軸。

例:

- 拡張機能自身による観測開始
- 信頼済みDOMイベントの直接観測
- 信頼済みイベント列の相関
- ブラウザ通信API観測
- 信頼済みイベントからの推定
- 非信頼または不明

## 観測範囲 / Observation Scope

その記録についてDSSIが確認した層の上限。

例:

- 入力面・DOMイベント
- form宣言上の送信境界
- 通信開始メタデータのみ
- ページ面の部分観測

観測範囲を越える事実は、その記録から主張しない。

## 送信候補 / Submission Candidate

submit要素への操作やEnter入力など、標準form submitへつながる可能性がある事象。

submit成立、ネットワーク送信、サーバー到達とは別である。

## submit成立 / Submit Event Observed

同一formでDOMの`submit`イベントを受信した状態。

フォーム処理がDOMイベント段階へ進んだことを示すが、通信成立や保存成功は証明しない。

## 宣言送信先 / Declared Destination

標準formの`action`属性等から読める、HTML上で宣言された送信先。

JavaScriptによる書き換えや別通信経路があり得るため、実際の最終送信先と同一であることは保証しない。

## 通信開始メタデータ / Network Start Metadata

`webRequest.onBeforeSendHeaders`から取得し、安全な項目へ縮約した送信前通信メタデータ。

Sprint 3.1で保持できるのは、method、resource class、scheme、host、same/cross-origin関係、内容変更との時間近接、ページ観測開始との中立的時間関係、Cookieヘッダー名の検出状態である。

request body、完全URL、request-header値、response、サーバー到達は保持または確認しない。

## 内容変更近接通信 / Network Activity Near Content Edit

信頼済みの内容変更パルスから2500ms以内に、同一tab / frameで対象通信開始が観測された状態。

フォーカスは内容変更パルスを生成しない。入力内容が通信へ含まれたことも意味しない。

## フォーカス気づき / Focus Awareness Cue

入力面へフォーカスしたことを、その場のチップだけで提示する一時的な気づき。

Sprint 3.1では通常ログへ保存せず、通信相関にも用いない。Level 3では入力面全般、Level 2ではパスワード、決済、個人情報の入力面を表示対象とする。

## Cookieヘッダー検出 / Cookie Header Detection

ChromeがDSSIへ提供したrequest-header集合のヘッダー名に、`Cookie`が含まれていたかを縮約した状態。

- `detected`: ヘッダー名を検出した
- `not_detected`: 提供された集合内では検出しなかった
- `not_observed`: その記録ではヘッダー名観測を行っていない
- `unavailable`: APIからヘッダー集合が提供されず判定できなかった

`not_detected`はCookie不存在を保証しない。DSSIの処理はCookie値を参照、分類、保存、表示しない。ただし、Chromeのコールバックオブジェクトへ値が渡される可能性そのものを否定する定義ではない。

## ページ観測との時間関係 / Page-Observation Timing

通信観測時刻と、DSSIがその文書でページ観測開始を記録した時刻との関係。

- ページ観測開始から5秒以内
- ページ観測開始から5秒超
- 時間関係不明

初期化、認証、状態復元、分析等の用途を推定する分類ではない。

## 一時生観測材料 / Transient Raw Evidence

分類または縮約の処理中だけ参照し、保存経路へ渡さない情報。

例:

- ラベル文字列
- placeholder
- 完全request URL

## 縮約 / Reduction

生情報から、DSSIが保持を許可する限定メタデータだけを取り出すこと。

例:

```text
https://example.test/private/path?token=secret
↓
scheme: https
host: example.test
```

## パージ / Purge

一時生観測材料を保存可能モデルへ移さず、処理後にDSSIの状態、メッセージ、ログ、storage、UI、consoleから参照可能な形で保持しないこと。

JavaScriptエンジンのメモリを即時物理消去したという意味ではない。

## 保存境界 / Persistence Boundary

情報が、一時処理からsession log等の保持領域へ入る関門。

現行では、Content Script送信前、Service Worker受信後、storage書込前の三段階で安全検査する。

## 通常ログ / Activity Log

利用者の操作と判断に関係する境界事象を表示するセッションログ。

## 診断ログ / Diagnostic Log

DSSI自身の起動状態やページ観測開始など、観測装置の動作確認を目的とするログ。

## 未観測 / Unobserved

現在の観測方式では、その事象を確認していない状態。

```text
未観測 ≠ 起きていない
```

## 未要求 / Not Requested

APIが追加情報を返し得る場合でも、DSSIがその情報を受け取るオプションを要求していない状態。

Sprint 3.1のrequest bodyは未要求である。request headersはCookieヘッダー名の検出目的で要求するため、未要求には該当しない。

## 利用者明示保存 / User-Preserved Record

将来構想。利用者が明示操作によって、通常なら破棄される追加情報を証拠候補として保存すること。

現時点では未実装であり、通常のObservationRecordとは別仕様にする。

## 標準form操作近接通信 / Network Activity Near Standard-Form Operation

信頼済みのsubmit要素操作、IME変換中ではないEnter候補、またはtrusted submitイベントから2000ms以内に、同一tab / frameで対象通信開始が観測された状態。

内容変更から送信までの時間が長い場合でも、送信時点の標準form操作との近接を扱える。ただし、通信に入力内容が含まれたこと、利用者がその通信を意図したこと、サーバーが受信したことは意味しない。

## 操作相関未確認通信 / Network Activity Without Confirmed User-Operation Correlation

MAX報告モードで、内容変更2500ms相関と標準form操作2000ms相関のいずれも確認できなかった対象通信。

```text
操作相関未確認 ≠ 利用者操作がなかった
操作相関未確認 ≠ 自動送信
操作相関未確認 ≠ 意図外送信
```

DSSIが現在相関対象にしている信号を確認しなかったことだけを示す。

## MAX報告モード / MAX Coverage Reporting

粘性Level 1-3とは別の報告軸。Level 3相当の気づき表示を含み、対象通信の診断事象と既知の観測限界を最大限表示する。

MAXはすべてを観測するという意味ではなく、取得権限や本文観測を増やすものでもない。

## Coverage Manifest / 観測範囲台帳

DSSIの現在の観測能力と境界判断を、事象ログとは別に表示する仕様。

- `observed`: 観測している
- `observed_then_reduced`: 観測後に縮約している
- `not_observed_by_design`: 技術的接触可能性があっても設計上接続しない
- `not_observable_currently`: 現在の権限・API・構造では観測できない
- `unknown_residual`: 未列挙の死角が残る

Coverage Manifestは完全な死角一覧を保証しない。

## 通信パルス / Communication Pulse

DOM上の標準form送信境界または、`webRequest`で観測した対象通信を、本文を含まない小型幾何アイコンとして一時表示するもの。

通信パルスは通信の有害性、安全性、利用者意図、入力本文の含有、サーバー到達を判定しない。観測経路と時間配置を示す。

```text
形 = 観測経路
中央文字 = method
点・破線 = Cookieヘッダー名の検出状態
短線 = 別オリジン関係
色 = 分類補助であり危険度ではない
```

ネットワーク通信パルスはすべて本文未観測である。

## 形優先表示 / Shape-First Rendering

意味の第一媒体を幾何形状、線、点、文字とし、色を補助媒体に限定する表示原則。

色が失われても分類が残り、赤・緑・黄等を安全・危険・注意へ短絡させない。

## ミラー横スクロール / Mirrored Horizontal Scroll

横幅の大きい観測表について、表の上側と下側に同期した横スクロール操作面を設けること。

上側の操作面は表データを複製せず、下側スクロール領域と`scrollLeft`だけを同期する。
