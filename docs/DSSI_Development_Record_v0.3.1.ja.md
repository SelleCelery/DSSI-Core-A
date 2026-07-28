# DSSI Core A 開発記録

Version scope: v0.1.0–v0.3.1  
Status: Prototype / Experimental  
Language: Japanese  

## 1. この記録の目的

本書は、DSSI Core A の初期開発について、単なる変更履歴ではなく、各実装段階で何を観測し、何が成立し、何が誤っていたかを記録する。

DSSIの開発では、機能追加そのものよりも、次の区別を失わないことが重要である。

- 直接観測した事実
- 複数イベントの相関から確認した事実
- 構造情報から推定した分類
- 現時点では観測できない領域
- 利用者へ表示すべき情報
- 診断用にだけ保持すべき情報

開発記録も同じ原則に従い、成功だけでなく、誤検出、用語の過剰、版ずれ、観測限界を保存する。

---

## 2. Core A の基本目的

DSSI Core A は、ブラウザ上の入力・送信・同意に関する境界を可視化し、利用者が無意識操作から意識操作へ戻ることを支援するローカルファーストのブラウザ拡張である。

中核KPIは次である。

> ユーザーが無意識操作から意識操作へ移れたか。

DSSIは判断を代行しない。安全性、法的有効性、送信成功、理解状態を自動的に断定しない。観測できた範囲、推定した範囲、観測不能な範囲を分離して返す。

---

## 3. 技術基盤

### 3.1 実装方式

- Chrome / Edge向けブラウザ拡張
- Manifest V3
- TypeScript
- Node.js / npmによる開発環境
- esbuildによるビルド
- Vitestによる単体テスト
- ESLint / Prettierによる検査
- `src`を編集し、`dist`をChromeへ読み込む構造

### 3.2 初期リポジトリ

ローカル配置:

```text
C:\UserWorkspace\10_PUBLIC_GITHUB\DSSI\DSSI-Core-A
```

Git履歴の初期点:

```text
c970766 chore: initialize DSSI Core A Sprint 0 foundation
```

初期Bundleからのcloneでは、remote HEADが存在しない警告が出たため、`main`を明示的に作成した。

### 3.3 npm環境の問題

初回の`npm install`では、生成元環境の内部npmレジストリURLが`package-lock.json`に残っていたため、利用者PCから接続できなかった。

問題の種類:

```text
ETIMEDOUT
packages.applied-caas-gateway1.internal.api.openai.org
```

対応:

- 不完全な`node_modules`を削除
- `package-lock.json`を退避・再生成
- 公開npmレジストリを指定
- `npm install`を再実行

修正コミット:

```text
947212 fix: regenerate npm lockfile for public registry
```

この問題から、lockfileは単なるバージョン表ではなく、取得元情報も含む再現性の境界であることが確認された。

---

## 4. Sprint 0 — 基盤構築

Version: v0.1.0

### 4.1 目的

ブラウザ拡張として最低限の構造を成立させる。

### 4.2 実装

- Manifest V3
- Service Worker
- Content Script
- Popup
- Options
- `chrome.storage`
- ローカル設定
- プライバシー安全なログ基盤
- TypeScript型検査
- テスト
- ビルド

### 4.3 確認されたこと

- `dist`をChromeへ読み込める
- Popupと設定画面が開く
- 粘性レベルを保存できる
- Service Workerが起動する
- 利用者PCでビルドを再現できる

### 4.4 理解上の整理

- TypeScript: 人間が安全に編集する元コード
- npm: 開発用パッケージとコマンドの管理
- Node.js: ブラウザ外で開発ツールを実行する環境
- `src`: 編集する原本
- `dist`: Chromeが実行する生成物

---

## 5. Sprint 1 — 入力面認識

Version: v0.2.0

Commit:

```text
cd34cec feat: implement Sprint 1 input recognition
```

### 5.1 目的

利用者がAction Surfaceへ触れた時点で「あ、入力だ」と認識する。

### 5.2 実装

検出対象:

- `input`
- `textarea`
- `contenteditable`
- `role="textbox"`
- 動的に追加された入力面

入力面分類:

- パスワード
- メールアドレス／ID
- 決済情報
- 個人情報
- 自由記述
- 種類不明

入力経路分類:

- キー入力
- 貼り付け
- 自動入力または入力支援の可能性
- スクリプトまたは不明な更新
- 不明

### 5.3 初期試験で判明した問題

キー入力、貼り付け、自動入力の違いは内部ログに記録されていたが、利用者向けUIには表示されなかった。

また、観測ログは`chrome.storage.session`へ保存されていたが、Popupから閲覧できなかった。

この段階では、観測機構は存在するが、観測結果が利用者へ返っていなかった。

---

## 6. Sprint 1.1 — 観測結果の可視化

Version: v0.2.1

### 6.1 目的

隠れていた観測ログを利用者が読める製品面へ移す。

### 6.2 実装

- Popupへ最新観測を表示
- 観測ログ一覧画面
- ログ更新・消去
- Level 3で入力経路チップを表示
- 内部コード名を日本語表示へ変換

### 6.3 実装上の不整合

更新ZIPの部分適用により、次の版ずれが発生した。

- `logs.ts`が`getSessionRecords`を要求
- `session-buffer.ts`側にexportが存在しない
- `popup.js`は新仕様
- `popup.html`は旧仕様で`#recentList`が存在しない

発生したエラー:

```text
TS2724: no exported member named getSessionRecords
Uncaught Error: Required DOM element not found: #recentList
```

対応:

- session bufferの読み取り関数を追加
- Popup DOM要素を追加
- バージョンを0.2.1へ同期
- Prettier差分を修正
- hotfixを再配布

この問題は、TypeScript、生成済みJavaScript、HTML、版番号が一つのリリース単位として同期されなければならないことを示した。

---

## 7. Sprint 1.2 — 証拠と観測境界の分離

Version: v0.2.2

Commit:

```text
acd3faf feat: separate evidence and observation boundaries in Sprint 1.2
```

Tag:

```text
v0.2.2
DSSI Core A Sprint 1.2 observation boundary baseline
```

### 7.1 問題認識

Sprint 1.1では、次の異なる概念が「観測可能性」に混在していた。

- 操作を直接見たか
- 入力面の用途を分類できたか
- 送信や通信まで見えているか

また、`paste`イベントを受けただけで「貼り付けを確認」と表示しており、操作と反映を分離できていなかった。

### 7.2 三軸への分離

1. 操作証拠
   - 信頼済みイベントを直接観測
   - 信頼済みイベント列を相関
   - 信頼済みイベントから推定
   - 非信頼イベントまたは根拠不足

2. 入力面分類根拠
   - 明示情報による分類
   - 推定による分類
   - 一般分類
   - 分類根拠なし

3. 境界観測範囲
   - 入力面・DOMイベントを観測
   - ページ面を部分観測
   - その他、現在の実装範囲

### 7.3 貼り付けの二段階化

```text
pasteイベント
→ 貼り付けイベントを観測

信頼済みinputイベントと相関
→ 貼り付け反映を確認
```

- `event.isTrusted`を参照
- 貼り付け相関窓: 300ms
- キー入力相関窓: 1200ms
- 貼り付け拒否欄では反映確認を出さない
- 合成pasteイベントは非信頼として記録

### 7.4 実地確認

- 通常貼り付け: 直接観測＋反映確認
- 貼り付け拒否: pasteイベントのみ
- 合成イベント: 非信頼イベント
- 自由記述: 一般分類だがDOMイベントは観測可能

この段階で、入力境界に関する最初の基準版が成立した。

---

## 8. GitHubリモート作成

Scientific-Ontologyとは独立した製品リポジトリとして、`DSSI-Core-A`を作成する方針を採用した。

関係:

```text
Scientific-Ontology
  理論的・設計思想上の背景

DSSI-Core-A
  独立したソフトウェア実装
```

HTTPSで登録したoriginは、SSHへ差し替え可能であり、コード履歴には影響しない。

旧Bundle remoteは`bundle-origin`として保持し、GitHubを`origin`とする。

---

## 9. Sprint 2 — 標準フォーム送信境界

Version: v0.3.0

### 9.1 目的

入力境界の次に、標準HTMLフォームの「出口」を観測する。

### 9.2 実装

別々に記録:

- 送信操作面の起動
- Enterによる送信候補
- `submit`イベント

取得する宣言情報:

- method
- enctype
- 同一／別オリジン
- scheme
- host

保存しない情報:

- 入力値
- request body
- URL query
- fragment
- credentials
- action path

### 9.3 明示した死角

Sprint 2では未観測:

- `fetch`
- XMLHttpRequest
- WebSocket
- `sendBeacon`
- Service Workerによる通信変更
- 自動保存
- JavaScript独自送信
- 実際のサーバー到達

### 9.4 実地試験

Facebook、X、ChatGPT、はてな、note等で試験。

確認:

- SPAでも入力面・focus・keydown・pasteは検出可能
- 標準formではsubmit境界が取れる
- JavaScript独自送信は未観測
- ChatGPT上のGET form検出は、メッセージ送信そのものではなく、DOM上の別フォームである可能性が高い

この試験から、DOM構造上のsubmitと利用者が意味する「送信」は一致しない場合があることが確認された。

---

## 10. Sprint 2.1 — フレームとsubmit相関

Version: v0.3.1

### 10.1 目的

実地ログで発生したiframeノイズと、submit操作面の過剰な意味づけを整理する。

### 10.2 実装

- トップフレーム／iframe識別
- 主ページドメインと観測フレームドメインを分離
- iframeの開始ログを抑制
- iframe内で実操作があった場合だけ記録
- submit要素への操作とsubmit成立を同一フォームで相関

送信関連づけ:

- フォーム関連submit要素
- Enter候補
- 同一フォームでsubmit成立と相関
- submitイベント単独観測

### 10.3 実地試験結果

成功:

- iframe由来の開始ログが大幅に減少
- 実在サイトでsubmit候補とsubmit成立の相関を確認
- 標準フォーム上のPOST・同一オリジン・encodingを取得

新たな問題:

- トップフレームの「ページ観測を開始」が通常ログに過剰表示
- 「主ページ」という語が、技術的なtop frameと意味的な主要サービスを混同しうる
- 種類不明入力面の診断情報が不足

---

## 11. Sprint 2.2 予定 — 表示層と診断層の分離

次の開発対象:

- 「ページ観測を開始」を通常ログから外す
- 必要なら診断ログへ移す
- 同一タブ・同一文書の短時間重複を抑制
- 「主ページ」を「トップフレーム」へ改称
- ページ開始を個別ログではなく集計へ移す
- 種類不明入力面の安全な構造情報を診断用に追加

中心原則:

> 観測機構内部に必要な記録と、利用者の判断に必要な表示を分離する。

---

## 12. 新規コンセプト — 同意境界

開発中、規約や医療説明に対する同意について、提示側と応答側の非対称が見いだされた。

```text
提示側
  センテンス、例外、留保、免責を多数提示できる

応答側
  同意／非同意の一ビットへ圧縮される
```

同意ビットには、次の状態が区別されない。

- 理解し納得した
- 要点だけ確認した
- 一部不明だが許容した
- 全文未読
- 利用上の必要から受諾した
- 不本意だが代替手段がない
- 理解限界を留保した

DSSIの将来機能として、次が検討される。

- Consent Surface Detection
- Terms Presentation Observation
- Comprehension Self-Declaration
- Constraint Declaration
- Consent History Receipt

研究ノート:

```text
Consent_Boundary_and_Sentence_Bit_Asymmetry.ja.md
```

DSSIは同意の法的有効性を裁定せず、同意ビットへ圧縮される前の提示条件、観測事実、理解限界、制約申告、最終操作を利用者側へ返す。

---

## 13. 証拠性とトラストサービス

ローカルログへ改ざん検出を付けることはDSSI単体でも可能である。

段階:

1. ローカルログ
   - ハッシュ連鎖
   - 欠落検出
   - エクスポート

2. 利用者署名
   - 署名付きログ束
   - 検証ツール

3. 第三者時刻
   - タイムスタンプ
   - 存在時刻と非改ざん性の補強

4. トラストサービス
   - 本人認証
   - 認証局
   - 長期保存
   - 独立監査

DSSI単体が保証すべきなのは法的勝敗ではなく、ログがどの方法で生成され、どの範囲まで改変検出可能で、どの第三者証明が付いているかを明示することである。

---

## 14. 開発体制の判断

### 一人＋GPTで進められる範囲

- 技術実証
- 入力・送信・同意境界の試作
- ローカルログ
- ハッシュ連鎖の試作
- テスト
- 公開仕様
- 研究ノート

### 外部レビューが必要な範囲

- セキュリティ監査
- 暗号鍵管理
- 法律評価
- プライバシー評価
- アクセシビリティ
- Chrome Web Store公開

### 外部組織との接続が必要な範囲

- 第三者タイムスタンプ
- 認証局
- 独立監査
- 長期署名・保存
- 法的保証を伴うサービス

初期試作は一人でよいが、一人しか検証できない状態で一般公開してはならない。

---

## 15. 開発速度と理解の回収

GPTによる高速実装は、コード量が設計者本人の理解を上回る危険を持つ。

今後は各機能について、次を記録する。

```text
目的
入力
処理
出力
保存
死角
テスト
```

また、機能追加Sprintと理解・安定化フェーズを交互に置く。

予定:

```text
Sprint 2.2
  表示層と診断層の分離

Understanding Recovery v0.3
  実装地図
  イベントフロー
  保存データ
  観測不能領域
  テスト保証範囲

Sprint 3
  JavaScript通信境界の技術調査
```

DSSIが無意識操作から意識操作へ戻す装置である以上、開発過程もまた、自動生成コードを無意識に積み上げるものにしてはならない。

---

## 16. 現在地点

```text
Sprint 0
  ブラウザ拡張基盤                     完了

Sprint 1
  入力面・入力イベント観測             完了

Sprint 1.1
  観測ログの利用者向け可視化           完了

Sprint 1.2
  操作証拠・分類根拠・観測範囲の分離   完了

Sprint 2
  標準フォーム送信境界                 完了

Sprint 2.1
  iframeノイズ抑制・submit相関          完了

Sprint 2.2
  表示層と診断層の分離                 次

Understanding Recovery v0.3
  実装理解の回収                       Sprint 2.2後
```

