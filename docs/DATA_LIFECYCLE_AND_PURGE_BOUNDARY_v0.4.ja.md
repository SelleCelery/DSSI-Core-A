# DSSI Core A データライフサイクルとパージ境界 v0.4

## 位置づけ

この文書は、DSSI Core Aが観測のために接触する情報と、記録として保持してよい情報の境界を定める。

DSSIでは、次の三つを同一視しない。

```text
取得可能な情報
≠ 分類・相関に一時利用してよい情報
≠ 保存してよい情報
```

観測できたことは、その情報を保存してよいことを意味しない。

## 基本原則

1. 生情報は、必要な処理局面を越えて保持しない。
2. 保存可能な型には、生情報を格納する項目を設けない。
3. 生情報を保存してから削除するのではなく、保存経路へ入れない。
4. 保存前だけでなく、実行領域を越えるメッセージ送信前にも検査する。
5. エラー処理やconsole出力を、生情報の迂回保存経路にしない。
6. 未観測は不存在を意味しない。
7. 将来の利用者明示保存は、通常観測とは別のデータモデルと操作境界を持つ。

## データ状態

### 1. Transient Raw Evidence / 一時生観測材料

DOM属性、ブラウザAPIから渡されたURLなど、分類・縮約のために処理中だけ参照する情報。

例:

- `name`
- `id`
- `placeholder`
- `aria-label`
- 関連ラベル文字列
- 意味分類用の周辺文字列
- `webRequest`コールバックへ渡される完全なrequest URL

これらは、分類またはURL解析を終えた後、返り値、runtime message、ObservationRecord、storage、UI、consoleへ移してはならない。

JavaScriptの一般的な文字列について、アプリケーションがメモリ上の即時完全ゼロ消去を保証することはできない。そのためDSSIが保証するのは、処理局面を越えて参照を保持せず、永続化可能な経路へ移さないことである。

### 2. Ephemeral Correlation State / 一時相関状態

複数イベントを短時間だけ関連づけるための、本文を含まない状態。

現行例:

- pasteとinputの相関: 300ms
- click / Enterとsubmitの相関: 1500ms
- 入力面操作と通信開始の相関: 2500ms
- 同一通信メタデータの重複抑制: 1200ms

通信相関用の入力パルスは、次だけを含む。

- session ID
- domain key
- 入力面分類
- 分類確度
- 粘性レベル

入力値、ラベル文字列、URL、クリップボード本文は含まない。Service Workerのメモリ上にのみ置き、storageへ書かない。

### 3. Derived Safe Metadata / 縮約済み安全メタデータ

生情報から必要な意味だけを取り出したもの。

例:

- `free_text`
- `generic`
- `POST`
- `cross_origin`
- `https`
- `api.example.test`
- `fetch_or_xhr`
- `payloadObservation: not_requested`

完全URLは、scheme、host、同一／外部関係へ縮約する。path、query、fragment、credentialsは返り値へ含めない。

### 4. ObservationRecord / 保存可能観測記録

通常ログまたは診断ログへ保存できる、閉じた項目・値集合の記録。

ObservationRecordはフラットな構造とし、任意の追加項目、ネストしたオブジェクト、予定外の配列を許可しない。保存可能項目は型と実行時allowlistの両方で制限する。

### 5. UserPreservedRecord / 利用者明示保存記録

将来構想。現時点では未実装。

通常なら破棄される完全URL、規約文書識別情報、画面状態などを利用者が証拠候補として保存する場合は、通常のObservationRecordへ項目を追加してはならない。

必要条件:

- 明示的な利用者操作
- 保存前の内容表示
- 保存範囲の選択
- 保存理由と時刻の記録
- 保持期間または削除方法の提示
- 通常ログとは異なる型と保存領域
- 将来の署名・タイムスタンプ接続を考慮した形式

## 現行の三重検査境界

### 境界A: Content Scriptからruntime messageを送る前

入力・submit観測記録は、`createPrivacySafeRecord`を通してからService Workerへ送る。

目的:

- DOM分類材料がメッセージ境界を越えないようにする
- 誤って追加された未知項目を早期に拒否する

### 境界B: Service Workerで受信した直後

Service Workerは、受信したObservationRecordを再検査する。

目的:

- 送信側の実装だけを信頼しない
- 将来別の送信元が増えても保存境界を維持する

### 境界C: `chrome.storage.session`へ書く直前

`appendSessionRecord`は保存直前に再度検査する。

目的:

- 保存関数を最終関門にする
- 呼び出し元の増加による迂回を防ぐ

## ネットワーク観測における取得と縮約

Sprint 3では、任意権限の`webRequest`を使用し、`xmlhttprequest`と`ping`分類の通信開始を補助観測する。

ブラウザAPIのコールバックでは、完全なrequest URLが一時的に渡される。DSSIはこれをURL解析へ使うが、次だけを返す。

- method
- resource classに基づくmechanism
- destination scheme
- destination host
- initiatorとのsame-origin / cross-origin関係
- 入力操作との時間近接

次は要求または保存しない。

- request body
- request headers
- response headers
- response body
- URL path
- URL query
- URL fragment
- URL credentials

`webRequest.onBeforeRequest`のextraInfoSpecは空配列で登録し、request bodyを要求するオプションを指定しない。

## パージの定義

DSSIにおけるパージとは、次を意味する。

> 一時生観測材料を保存可能モデルへ移さず、必要な分類・縮約が終わった後は、DSSIの状態、メッセージ、ログ、storage、UI、consoleから参照可能な形で保持しないこと。

パージは、JavaScriptエンジンのメモリ領域を物理的に即時ゼロ消去したという主張ではない。

## 失敗時の原則

分類、解析、runtime message、storage保存が失敗した場合も、生情報を例外文、console、診断ログへ含めない。

```text
失敗した
→ 安全なメタデータだけで失敗を示す、または無記録で閉じる

失敗した
→ 生URL・入力本文・属性文字列を出力する
```

後者は禁止する。

## 検査強度

現行v0.4は次を採用する。

1. 保存型に生情報項目を持たせない。
2. Record Factoryが安全メタデータだけをコピーする。
3. 実行時に閉じた項目・値allowlistで項目を検査する。
4. host欄へpath、query、credentialsが混入していないか検査する。
5. payload観測状態を`not_requested`へ固定する。
6. Content Script、Service Worker、storageの三境界で検査する。
7. 単体テストで禁止項目、未知項目、ネスト、偽装URLを拒否する。

今後必要な強化:

- ブラウザ統合テスト
- 生成物の静的検査
- console出力規則の自動検査
- 第三者セキュリティレビュー
- UserPreservedRecordの独立仕様

## 設計固定文

> DSSIは、観測のために接触できた情報を、そのまま履歴として所有しない。必要な意味へ縮約し、保存権のない情報を持ち帰らない。
