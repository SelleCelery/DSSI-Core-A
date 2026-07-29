# DSSI Core A v0.3.2 ファイル一覧・責務表

## 位置づけ

この文書は、DSSI Core A v0.3系の理解回収 Step 1 として、Sprint 2.2 ソース一式の現在のファイル構成を整理したものである。

対象ソース:

- `DSSI-Core-A-Sprint2.2-source.zip`
- npm package version: `0.3.2`
- Manifest V3
- Chromium 120以上

この文書の目的は、各ファイルについて次を説明できる状態を作ることにある。

1. そのファイルは何を担当するか。
2. 何を入力として受け取るか。
3. 何を出力または変更するか。
4. どのファイルに依存するか。
5. DSSIの境界上、何を行ってはいけないか。

---

## 1. 全体構造

```text
ブラウザページ
  ↓ DOMイベント
src/content/
  ↓ ObservationLogRecord候補
chrome.runtime.sendMessage
  ↓
src/background/service-worker.ts
  ↓ フレーム情報補完・開始ログ抑制
src/storage/session-buffer.ts
  ↓ プライバシー境界検査
chrome.storage.session
  ↓
src/popup/ または src/logs/
  ↓
利用者向け表示
```

設定は別経路を通る。

```text
src/options/ または src/popup/
  ↓
src/storage/settings-store.ts
  ↓
chrome.storage.local
  ↓
src/content/bootstrap.ts がページ起動時に読み込む
```

Core A v0.3.2の主要な責務境界は、次の七層に分けられる。

| 層 | 主なディレクトリ | 中心責務 |
|---|---|---|
| ブラウザ接続層 | `src/manifest`, `src/content`, `src/background` | DOMイベントと拡張機能実行環境への接続 |
| 観測論理層 | `src/core` | 分類、入力経路判定、送信宣言解析、記録生成 |
| データモデル層 | `src/core/models` | 設定・観測・入力面・送信情報の型定義 |
| 保存層 | `src/storage` | 設定とセッションログの保存・取得・消去 |
| 表示層 | `src/ui`, `src/popup`, `src/logs`, `src/options` | チップ、一覧、設定画面の表示 |
| 検証層 | `tests` | 純関数とプライバシー境界の回帰検査 |
| ビルド・文書層 | `scripts`, `docs`, ルート設定 | 配布物生成、品質検査、仕様・履歴の保存 |

---

## 2. 実行時入口

### `src/manifest/manifest.json`

| 項目 | 内容 |
|---|---|
| 責務 | Chrome/Edgeに、拡張機能の入口、権限、対象ページ、各UIを宣言する。 |
| 主な入力 | ブラウザの拡張機能ローダー。 |
| 主な出力 | Service Worker、Popup、Options、Content Scriptの起動条件。 |
| 重要設定 | `storage`権限、`http://*/*`と`https://*/*`、`document_start`、`all_frames: true`。 |
| 境界 | ページ本文を読む権限を追加で要求しない。ネットワーク監視権限も現段階では持たない。 |

注意: package versionは`0.3.2`だが、当該ソースのmanifest内versionは`0.3.0`である。`scripts/build.mjs`がビルド時にpackage versionへ同期する設計である。

### `src/content/bootstrap.ts`

| 項目 | 内容 |
|---|---|
| 責務 | 各文書でDSSI観測器を起動する最初のコード。 |
| 入力 | `settings-store`から取得する現在設定。 |
| 出力 | 一つの`sessionId`を発行し、`InputSurfaceObserver`と`SubmissionObserver`を開始する。 |
| 依存 | `settings-store.ts`, `input-surface-observer.ts`, `submission-observer.ts`。 |
| 境界 | DSSIが無効なら何も起動しない。入力値を取得しない。 |

---

## 3. Content Script層

### `src/content/input-surface-observer.ts`

| 項目   | 内容                                                                                                            |
| ---- | ------------------------------------------------------------------------------------------------------------- |
| 責務   | 入力面へのフォーカス、キー入力、貼り付け、値変化などを観測し、入力面分類・入力経路判定・ログ生成・チップ表示を統括する。                                                  |
| 入力   | DOMイベント、現在設定、`sessionId`。                                                                                     |
| 出力   | `ObservationLogRecord`をService Workerへ送信し、必要に応じてFact Chipを表示する。                                               |
| 主な依存 | `surface-descriptor`, `surface-classifier`, `input-origin`, `observation-factory`, `cue-policy`, `fact-chip`。 |
| 状態   | 入力面ごとの直近keydown、paste、input等を`SurfaceRuntimeState`として保持する。                                                    |
| 境界   | 入力文字列、貼り付け本文、フォーム値をログへ入れない。入力由来を証拠以上に断定しない。                                                                   |

このファイルは入力観測経路のオーケストレーターであり、分類規則そのものや表示文言そのものは別ファイルへ委譲する。

### `src/content/submission-observer.ts`

| 項目 | 内容 |
|---|---|
| 責務 | 標準HTMLフォームについて、submit要素の操作、Enter候補、信頼済み`submit`イベントを観測し、同一フォーム内で相関する。 |
| 入力 | `click`, `keydown`, `submit`等のDOMイベント、現在設定、`sessionId`。 |
| 出力 | フォーム宣言情報を含む`ObservationLogRecord`、必要に応じたFact Chip。 |
| 主な依存 | `submission-analyzer`, `observation-factory`, `fact-chip`。 |
| 相関窓 | `1500ms`。 |
| 境界 | 実通信、サーバー到達、保存成功、利用者の意味上の送信意図を断定しない。フォーム値やrequest bodyを読まない。 |

### `src/content/surface-descriptor.ts`

| 項目 | 内容 |
|---|---|
| 責務 | DOM要素が観測対象の入力面かを判定し、分類に使う記述子を生成する。種類不明入力面向けの安全な構造情報も生成する。 |
| 入力 | `Element`またはDOMイベント。 |
| 出力 | `InputSurfaceDescriptor`、`SafeInputSurfaceStructure`、対象要素一覧。 |
| 分類用情報 | tagName、input type、autocomplete、role、contenteditable、ラベル・属性由来の意味文字列。 |
| ログ用安全情報 | tagName、input type、role、contenteditable、許可形式のautocompleteトークンのみ。 |
| 境界 | 分類時に使う意味文字列と、保存可能な安全構造情報を混同しない。`id`、`name`、placeholder本文、ラベル本文をログ化しない。 |

重要: このファイルは内部分類のために意味的テキストを組み立てるが、その文字列を`ObservationLogRecord`へ保存しない設計である。

---

## 4. Coreデータモデル

### `src/core/models/observation.ts`

| 項目 | 内容 |
|---|---|
| 責務 | Core Aが保存・表示する観測記録の中心型`ObservationLogRecord`と、関連する列挙型を定義する。 |
| 主な型 | `TriggerType`, `SurfaceType`, `ObservationScope`, `OperationEvidence`, `InputOrigin`, `FrameType`, `LogLayer`。 |
| 出力 | 他の全実装が共有する型契約。 |
| 境界 | 観測事実、操作証拠、分類確度、観測範囲を別フィールドとして保持する。 |

### `src/core/models/input-surface.ts`

| 項目 | 内容 |
|---|---|
| 責務 | 入力面の内部記述、分類結果、安全な保存用構造の型を定義する。 |
| 主な型 | `InputSurfaceDescriptor`, `InputSurfaceClassification`, `SafeInputSurfaceStructure`。 |
| 境界 | 内部分類用記述子とログ保存用構造を分離する。 |

### `src/core/models/submission.ts`

| 項目 | 内容 |
|---|---|
| 責務 | 標準フォームの宣言上の送信境界を表現する型を定義する。 |
| 主な型 | method、encoding、same/cross origin、mechanism、association。 |
| 境界 | `correlated_submit_event`もネットワーク通信成立を意味しない。 |

### `src/core/models/settings.ts`

| 項目 | 内容 |
|---|---|
| 責務 | DSSI設定と既定値を定義する。 |
| 現在有効な中心設定 | `enabled`, `viscosityLevel`。 |
| 将来用フラグ | local classification、network observation、download observation、persistent history。 |
| 境界 | 将来用フラグが存在しても、その機能が実装済みとはみなさない。 |

---

## 5. Core純粋ロジック

### `src/core/surface-classifier.ts`

| 項目 | 内容 |
|---|---|
| 責務 | 入力面記述子を、password、email/ID、payment、personal information、free text、unknownへ分類する。 |
| 入力 | `InputSurfaceDescriptor`。 |
| 出力 | `InputSurfaceClassification`。 |
| 根拠 | 明示type、autocomplete、role/contenteditable、意味語彙など。 |
| 境界 | 内容本文を分類しない。分類確度を`explicit`, `heuristic`, `generic`, `unknown`で残す。 |

### `src/core/input-origin.ts`

| 項目 | 内容 |
|---|---|
| 責務 | inputイベントの由来を、直前のkeydown/paste等との時間相関から評価する。 |
| 入力 | `InputOriginEvidence`。 |
| 出力 | 入力由来と操作証拠。 |
| 相関窓 | keyboard 1200ms、paste reflection 300ms。 |
| 境界 | イベント証拠が不足する場合は`unknown`またはscript/unknownとし、貼り付けや自動入力を断定しない。 |

### `src/core/submission-analyzer.ts`

| 項目 | 内容 |
|---|---|
| 責務 | フォーム宣言からmethod、encoding、送信先関係、scheme、hostを正規化する。 |
| 入力 | `FormSubmissionSnapshot`。 |
| 出力 | `SubmissionDescriptor`。 |
| 境界 | query、fragment、credentials、path、フォーム値、bodyを保存対象にしない。 |

### `src/core/observation-factory.ts`

| 項目 | 内容 |
|---|---|
| 責務 | 個別観測結果から共通形式の`ObservationLogRecord`を生成する。 |
| 入力 | 共通contextと、trigger・surface・証拠・送信情報等。 |
| 出力 | schema version付きの観測記録。 |
| 境界 | 各Observerが勝手な形のログを生成しないよう、共通生成点を提供する。 |

### `src/core/privacy-safe-logger.ts`

| 項目 | 内容 |
|---|---|
| 責務 | 保存直前に、禁止されたキー名が観測記録へ混入していないか再帰検査する。 |
| 入力 | `ObservationLogRecord`。 |
| 出力 | 安全と判断された複製、または`PrivacyBoundaryError`。 |
| 境界 | value、content、text、prompt、password等を示す危険キーを拒否する防衛線。 |

これは「本文を絶対に取得していないこと」の完全証明ではないが、保存オブジェクトへ危険なフィールドが追加される回帰を止める防御である。

### `src/core/cue-policy.ts`

| 項目 | 内容 |
|---|---|
| 責務 | 粘性レベルと入力面種別から、画面チップを出すか決定する。 |
| 入力 | viscosity level、surface type。 |
| 出力 | boolean。 |
| 境界 | ログを残すことと、利用者へ割り込んで表示することを分離する。 |

### `src/core/observation-presentation.ts`

| 項目 | 内容 |
|---|---|
| 責務 | 型・コード値を日本語表示へ翻訳し、通常ログ、診断ログ、フレーム関係、送信関連づけ等の表示文言を一元化する。 |
| 入力 | `ObservationLogRecord`または各種enum。 |
| 出力 | UI表示用ラベル。 |
| 境界 | 表示文言が記録の証拠強度を超えないようにする。「送信成功」等へ言い換えない。 |

---

## 6. Background層

### `src/background/service-worker.ts`

| 項目 | 内容 |
|---|---|
| 責務 | Content Scriptからの観測記録を受信し、ブラウザsender情報からフレーム文脈を補完し、抑制判定後に保存層へ渡す。ログ消去・件数取得メッセージも処理する。 |
| 入力 | `chrome.runtime.onMessage`、`MessageSender`。 |
| 出力 | 補完済み記録、抑制結果、保存・消去・件数応答。 |
| 補完情報 | top/iframe、トップレベルdomain、実観測frame domain。 |
| 抑制 | iframeのpage-startを全抑制。トップフレーム同一tab/domainのpage-startを5秒窓で抑制。 |
| 境界 | Content Scriptから送られた意味を強めない。iframe内の実操作までは抑制しない。 |

---

## 7. Storage層

### `src/storage/session-buffer.ts`

| 項目 | 内容 |
|---|---|
| 責務 | 通常ログと診断ログを別キーで`chrome.storage.session`へ保存・取得・消去する。 |
| キー | `dssiSessionLog`, `dssiDiagnosticLog`。 |
| 上限 | activity 500件、diagnostic 250件。 |
| 防衛 | 保存前に`createPrivacySafeRecord`を必ず通す。 |
| 境界 | 永続履歴にしない。ブラウザセッションを越える証拠保全機能ではない。 |

### `src/storage/settings-store.ts`

| 項目 | 内容 |
|---|---|
| 責務 | `chrome.storage.local`上のDSSI設定を読み書きし、既定値を保証する。 |
| 入力 | Popup/Options/Bootstrap。 |
| 出力 | `DssiSettings`。 |
| 境界 | ログ本文を扱わない。設定と観測履歴を分離する。 |

---

## 8. UI層

### `src/ui/fact-chip.ts`

| 項目 | 内容 |
|---|---|
| 責務 | ページ上にShadow DOMで短時間の事実チップを表示する。入力面種別、入力経路、フォーム宣言情報等を提示する。 |
| 入力 | surface type、input origin、submission descriptor、viscosity level。 |
| 出力 | ページ上の視覚的フィードバック。 |
| 境界 | 内容や安全性を評価しない。DSSI自身の表示がページCSSに侵食されにくいようShadow DOMを使う。 |

### `src/ui/required-element.ts`

| 項目 | 内容 |
|---|---|
| 責務 | Popup/Logs/Optionsの必須DOM要素を安全に取得し、欠落時は即座に失敗させる。 |
| 境界 | UI版ずれを静かに見逃さない。 |

### `src/ui/base.css`

| 項目 | 内容 |
|---|---|
| 責務 | Popup、Options、Logsで共有する基本スタイル。 |
| 境界 | 観測ロジックを含まない。 |

### `src/popup/popup.ts`

| 項目 | 内容 |
|---|---|
| 責務 | 有効/無効、粘性レベルの操作、通常ログ件数、直近通常ログ、ログ画面・設定画面への導線を提供する。 |
| 入力 | settings-store、session-buffer。 |
| 出力 | 設定変更、Popup表示。 |
| 境界 | 診断ログを通常の観測件数へ混ぜない。 |

### `src/popup/popup.html`

PopupのDOM構造を定義する。ロジックは`popup.ts`へ置く。

### `src/logs/logs.ts`

| 項目 | 内容 |
|---|---|
| 責務 | 通常ログと診断ログを切り替え、観測記録を表形式で表示し、現在層または全層を消去する。 |
| 入力 | session-buffer、observation-presentation。 |
| 出力 | ログ一覧UI。 |
| 境界 | 生のenumや内部コードを直接見せず、証拠強度を保った文言へ変換する。 |

### `src/logs/logs.html`

ログ画面の切替ボタン、表、説明文等のDOM構造を定義する。

### `src/options/options.ts`

| 項目 | 内容 |
|---|---|
| 責務 | 詳細設定の読み書きとセッションログ全消去を行う。 |
| 入力 | settings-store、runtime message。 |
| 出力 | 設定保存、ログ消去。 |

### `src/options/options.html`

Options画面のDOM構造と説明を定義する。

---

## 9. ビルド・品質設定

### `scripts/build.mjs`

| 項目 | 内容 |
|---|---|
| 責務 | esbuildでContent Script、Service Worker、Popup、Options、Logsを束ね、HTML/CSS/manifest/iconsを`dist`へコピーする。 |
| 特記事項 | package.jsonのversionをdist側manifestへ同期する。 |
| 境界 | ソースを直接Chromeへ読み込むのではなく、配布構造を一貫して生成する。 |

### `scripts/clean.mjs`

`dist`を削除し、古い成果物の混入を防ぐ。

### `package.json`

依存、npm scripts、Node要件、package versionを定義する。`npm run check`はtypecheck、lint、format check、test、buildの順で実行する。

### `package-lock.json`

依存バージョンと取得元を固定する。実装責務は持たないが、再現可能性に関わる。

### `tsconfig.json`

TypeScriptの型検査・モジュール・DOM/Chrome型環境を設定する。

### `eslint.config.js`

静的解析規則を定義する。

### `.prettierrc.json`, `.prettierignore`

書式規則と除外対象を定義する。

### `vitest.config.ts`

単体テスト実行環境を定義する。

### `.editorconfig`, `.gitattributes`, `.gitignore`

編集形式、改行、Git追跡対象を安定させる。

---

## 10. テスト層

Step 5で詳細な仕様対応表を作るため、ここでは責務だけを固定する。

| ファイル | 主責務 |
|---|---|
| `tests/unit/settings.test.ts` | 既定設定が意図した値であることを検査する。 |
| `tests/unit/cue-policy.test.ts` | 粘性レベル別のチップ表示規則を検査する。 |
| `tests/unit/privacy-safe-logger.test.ts` | 危険フィールドを拒否し、安全な観測記録を許可することを検査する。 |
| `tests/unit/surface-classifier.test.ts` | 入力面分類と分類確度を検査する。 |
| `tests/unit/input-origin.test.ts` | keyboard、paste、autofill/unknown等の時間相関を検査する。 |
| `tests/unit/submission-analyzer.test.ts` | method、encoding、送信先関係、保存しないURL部分を検査する。 |
| `tests/unit/surface-descriptor.test.ts` | 種類不明入力面向け安全構造情報の許可・除外規則を検査する。 |
| `tests/unit/observation-presentation.test.ts` | ログ層、フレーム、観測事実、送信相関、安全構造情報の表示文言を検査する。 |
| `tests/fixtures/input-surfaces.html` | 入力面、貼り付け拒否、標準フォーム、synthetic event等の手動・結合確認用ページ。 |

注意: 現在のテスト群は主に純関数の単体テストである。実ブラウザ上のイベント伝播、Service Worker sender情報、Chrome storageを含むend-to-end保証ではない。

---

## 11. 文書層

### ルート文書

| ファイル | 責務 |
|---|---|
| `README.md` | 製品概要、導入、動作、制限の入口。 |
| `CHANGELOG.md` | バージョン別変更履歴。 |
| `PRIVACY.md` | 取得しない情報、保存範囲、プライバシー境界。 |
| `SECURITY.md` | セキュリティ報告方針。 |
| `CONTRIBUTING.md` | 開発参加の基本規則。 |
| `SOURCE_BUILD_NOTE.ja.md` | ソースZIPには生成済みdistを含まず、ローカルビルドが必要であることを説明する。 |
| `LICENSE` | GPL-3.0-or-laterライセンス本文。 |

### `docs/`

| ファイル | 責務 |
|---|---|
| `ADR-0001-core-a-browser-extension.md` | Core Aをブラウザ拡張として実装する設計判断。 |
| `PERMISSION_STRATEGY.md` | 権限最小化方針。 |
| `DEVELOPMENT_ROADMAP.md` | Sprintと将来機能の計画。 |
| `DEVELOPMENT_RECORD_v0.3.1.ja.md` | Sprint 0〜2.1を中心とする開発判断・実地発見の履歴。 |
| `UNDERSTANDING_RECOVERY_PLAN_v0.3.ja.md` | v0.3系理解回収のStep 1〜6と完了条件。 |
| `SPRINT1_IMPLEMENTATION_GUIDE.md` | 入力面検出導入時の実装説明。 |
| `SPRINT1_1_IMPLEMENTATION_GUIDE.md` | ログ閲覧・入力経路表示の実装説明。 |
| `SPRINT1_2_IMPLEMENTATION_GUIDE.md` | 貼り付け等の証拠相関と三軸分離の説明。 |
| `SPRINT2_IMPLEMENTATION_GUIDE.md` | 標準フォーム送信境界の説明。 |
| `SPRINT2_1_IMPLEMENTATION_GUIDE.md` | frame分離とsubmit相関の説明。 |
| `SPRINT2_2_IMPLEMENTATION_GUIDE.md` | 通常/診断ログ分離と安全構造情報の説明。 |
| `product/DSSI_Core_A_Requirements_Definition.md` | 製品要求、目的、非目標、制約。 |
| `product/DSSI_Core_A_Functional_Specification.md` | 機能仕様、観測・表示・保存の具体的契約。 |

---

## 12. Assets

| ファイル | 責務 |
|---|---|
| `assets/icons/icon16.png` | ツールバー等の16pxアイコン。 |
| `assets/icons/icon32.png` | 32pxアイコン。 |
| `assets/icons/icon48.png` | 拡張管理画面等の48pxアイコン。 |
| `assets/icons/icon128.png` | ストア・管理画面等の128pxアイコン。 |

---

## 13. 責務の集中箇所

現在、変更影響が特に大きいファイルは次のとおりである。

| ファイル | 集中している責務 | 変更時の主な影響 |
|---|---|---|
| `input-surface-observer.ts` | DOMイベント、状態相関、ログ生成、チップ起動 | 入力観測全体、ログ件数、誤検出 |
| `submission-observer.ts` | click/Enter/submit相関 | フォーム境界の証拠強度 |
| `observation.ts` | 保存スキーマ | 保存、UI、テスト、後方互換性 |
| `observation-presentation.ts` | UI意味表現 | 利用者がログをどう解釈するか |
| `service-worker.ts` | frame補完、抑制、保存入口 | iframe/トップフレーム判定、ログ欠落 |
| `session-buffer.ts` | 保存層、件数上限、層分離 | 通常/診断ログ、プライバシー防衛 |
| `surface-descriptor.ts` | DOMから内部意味情報を抽出 | 分類精度と情報取得境界 |

---

## 14. 現在の依存方向

望ましい依存方向は概ね次のようになっている。

```text
models
  ↑
core pure logic
  ↑
content observers / storage / presentation
  ↑
background / popup / logs / options
```

ただし、`input-surface-observer.ts`と`submission-observer.ts`は、ブラウザイベント、Coreロジック、記録生成、UI提示を接続するため責務が比較的重い。理解回収では、この二つをイベントフロー単位で追跡する必要がある。

---

## 15. 「どのファイルを見ればよいか」索引

| 確認したいこと | 最初に見るファイル |
|---|---|
| 拡張機能がどのページで動くか | `src/manifest/manifest.json` |
| ページ開始時に何が起動するか | `src/content/bootstrap.ts` |
| pasteがどう処理されるか | `src/content/input-surface-observer.ts`, `src/core/input-origin.ts` |
| 入力面がどう分類されるか | `src/content/surface-descriptor.ts`, `src/core/surface-classifier.ts` |
| submit候補とsubmitがどう結びつくか | `src/content/submission-observer.ts` |
| フォーム送信先をどこまで読むか | `src/core/submission-analyzer.ts` |
| ログ形式そのもの | `src/core/models/observation.ts` |
| ログの日本語表示 | `src/core/observation-presentation.ts` |
| top/iframeをどこで決めるか | `src/background/service-worker.ts` |
| 何が保存されるか | `src/storage/session-buffer.ts` |
| 本文保存をどう防ぐか | `src/core/privacy-safe-logger.ts` |
| 通常/診断ログをどう分けるか | `src/storage/session-buffer.ts`, `src/logs/logs.ts` |
| チップがいつ表示されるか | `src/core/cue-policy.ts`, `src/ui/fact-chip.ts` |
| 設定の既定値 | `src/core/models/settings.ts` |
| 配布用distの作り方 | `scripts/build.mjs` |

---

## 16. Step 1で確認できた設計上の要点

1. Content Scriptは全frameで起動するが、frameの確定はService Workerの`MessageSender`で行う。
2. 入力面の内部分類用情報と、ログへ保存可能な安全構造情報は分離されている。
3. `ObservationLogRecord`は、観測事実、操作証拠、分類確度、観測範囲、送信関連づけを別々に保持する。
4. 保存直前にプライバシー安全検査を行う。
5. 通常ログと診断ログは保存キー・件数上限・UI表示を分離している。
6. フォーム観測はDOM上の宣言とイベントまでであり、通信成立を扱わない。
7. 現在の自動テストは純関数中心で、ブラウザ統合動作の全保証ではない。
8. 実装理解の中心は、二つのObserverからRecord生成、Service Worker、Session Buffer、表示までの流れにある。

---

## 17. Step 2への接続

次は`paste`一件について、次の順で実コードを追跡する。

```text
paste DOM event
  ↓
InputSurfaceObserver
  ↓ trusted判定・入力面解決・時刻保存
input DOM event
  ↓
assessInputOrigin
  ↓
createObservationRecord
  ↓
chrome.runtime.sendMessage
  ↓
service-worker
  ↓
appendSessionRecord
  ↓
privacy-safe-logger
  ↓
chrome.storage.session
  ↓
logs.ts / popup.ts
  ↓
日本語表示
```

Step 2では、「貼り付けイベントを観測」と「貼り付け反映を確認」が別記録になる理由、300ms相関窓、`isTrusted`、チップ表示判断、保存項目を行単位で確認する。
