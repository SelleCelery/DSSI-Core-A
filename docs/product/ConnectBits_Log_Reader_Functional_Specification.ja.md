# ConnectBits Log Reader 機能仕様書

## DSSI Core A — Local Observation Log Collation Reader

> Status: Implemented baseline for Sprint 3.5-A; UI aligned in Sprint 3.5-B  
> Version: 0.2.0  
> Related: `ConnectBits_Log_Reader_Requirements_Definition.ja.md`  
> Product name: ConnectBits Log Reader（暫定）  
> Target Stack: TypeScript / Chrome Extensions Manifest V3  
> Runtime: Extension local page, no external API

---

## 0. 本書の目的

本書は、ConnectBits Log Reader 要件定義書を実装可能な構成へ分解し、配置、データフロー、入力検証、派生モデル、UI、技術チップス、テスト、ビルド変更、実装順序を定める。

本リーダーは、DSSI Core Aの観測ランタイムへ新たな観測権限を加えない。エクスポート済みJSONを、利用者が明示的に選択した場合のみ、拡張機能ローカルページ内で読み取る。

---

## 1. 推奨実装配置

```text
src/
  reader/
    reader.html
    reader.ts

  core/
    log-reader/
      export-parser.ts
      export-validator.ts
      reader-model.ts
      reader-query.ts
      reader-summary.ts
      observation-tips.ts

  ui/
    base.css

tests/
  fixtures/
    observation-log-format-v1.json
    observation-log-invalid.json

  unit/
    log-reader-export-parser.test.ts
    log-reader-export-validator.test.ts
    log-reader-query.test.ts
    log-reader-summary.test.ts
    observation-tips.test.ts
```

### 1.1 責任分離

| Component             | Responsibility                                     |
| --------------------- | -------------------------------------------------- |
| `reader/reader.html`  | 読込UI、概要、フィルター、一覧、詳細の構造         |
| `reader/reader.ts`    | UI状態、ファイル選択、描画、イベント接続           |
| `export-parser.ts`    | JSON文字列から未知入力を生成し、構文エラーを返す   |
| `export-validator.ts` | DSSIログ形式、バージョン、必須フィールドを検証する |
| `reader-model.ts`     | 読取専用モデルと表示用型を定義する                 |
| `reader-query.ts`     | ソート、フィルター、グループ条件を適用する         |
| `reader-summary.ts`   | 件数、期間、ドメイン等の派生集計を生成する         |
| `observation-tips.ts` | 観測パターンと技術チップスの対応を定義する         |

`reader.ts`へ検証・集計ロジックを集中させない。

---

## 2. ビルド構成

`scripts/build.mjs` の entryPointsへ `reader` を追加する。

```js
entryPoints: {
  'service-worker': resolve(root, 'src/background/service-worker.ts'),
  content: resolve(root, 'src/content/bootstrap.ts'),
  popup: resolve(root, 'src/popup/popup.ts'),
  options: resolve(root, 'src/options/options.ts'),
  logs: resolve(root, 'src/logs/logs.ts'),
  reader: resolve(root, 'src/reader/reader.ts'),
}
```

copyTargetsへ `reader.html` を追加する。

```js
['src/reader/reader.html', 'reader.html'];
```

出力は次とする。

```text
dist/
  reader.html
  reader.js
  reader.js.map
```

---

## 3. 起動導線

### 3.1 推奨導線

v0.5では、次の二か所からReaderを開けるようにする。

1. `logs.html` の「エクスポート済みログを読む」
2. `popup.html` の補助リンク

起動は拡張機能ローカルページを新規タブで開く。

```ts
await chrome.tabs.create({
  url: chrome.runtime.getURL('reader.html'),
});
```

### 3.2 直接連携しない事項

- 現在のsession bufferを自動的にReaderへ渡さない。
- logs画面の表示中データをReaderへ暗黙転送しない。
- 開いた時点で最近のログを自動読込しない。

Readerはエクスポート済みファイルを入力境界とする。

---

## 4. 標準データフロー

```text
User selects local JSON file
  ↓
File.text()
  ↓
parseObservationLogExport(text)
  ↓ unknown | ParseError
validateObservationLogExport(value)
  ↓ ValidatedExport | ValidationError[]
createReaderModel(validatedExport)
  ↓ immutable source model
applyReaderQuery(model.records, query)
  ↓ derived visible records
buildReaderSummary(model, visibleRecords)
  ↓ derived summary
render()
```

原入力と派生表示を別の参照として保持する。

```ts
interface ReaderState {
  source?: Readonly<ValidatedObservationLogExport>;
  query: ReaderQuery;
  visibleRecordIds: readonly string[];
  selectedRecordId?: string;
  selectedTipId?: ObservationTipId;
  status: ReaderStatus;
}
```

---

## 5. 入力パーサー

### 5.1 戻り値

```ts
export type ParseObservationLogResult =
  { ok: true; value: unknown } | { ok: false; error: ReaderParseError };

export interface ReaderParseError {
  code: 'empty_file' | 'invalid_json' | 'file_read_failed';
  message: string;
  position?: number;
}
```

### 5.2 制約

- `JSON.parse`以外の評価機構を用いない。
- コメント付きJSONを受け入れない。
- エラー時に入力内容全文をログ出力しない。
- JSONの自動修復を行わない。

---

## 6. 形式バリデーター

### 6.1 検証結果

```ts
export type ValidationResult<T> =
  | { ok: true; value: T; notices: readonly ReaderValidationNotice[] }
  | { ok: false; errors: readonly ReaderValidationError[] };
```

### 6.2 エラーコード

```ts
export type ReaderValidationErrorCode =
  | 'not_object'
  | 'missing_export_section'
  | 'unsupported_format'
  | 'unsupported_format_version'
  | 'missing_records'
  | 'records_not_array'
  | 'unsupported_record_schema_version'
  | 'invalid_required_field'
  | 'duplicate_event_id';
```

### 6.3 通知コード

```ts
export type ReaderValidationNoticeCode =
  | 'record_count_mismatch'
  | 'settings_snapshot_partial'
  | 'integrity_not_provided'
  | 'unknown_optional_field'
  | 'empty_records';
```

通知は読み込みを妨げないが、画面上に残す。

### 6.4 必須フィールド

各レコードでは最低限、次を検証する。

```ts
interface MinimumObservationRecord {
  eventId: string;
  timestamp: number;
  sessionId: string;
  domainKey: string;
  surfaceType: string;
  triggerType: string;
  viscosityLevel: 1 | 2 | 3;
  cuePresented: boolean;
}
```

未知の列挙値を推測で既知値へ変換しない。

---

## 7. 読取専用モデル

### 7.1 型方針

`DssiObservationLogExport` と `ObservationLogRecord` を参照するが、Reader内部では検証済み読取専用型を用いる。

```ts
export type ValidatedObservationLogExport = Readonly<{
  export: Readonly<DssiObservationLogExport['export']>;
  observationContext: Readonly<DssiObservationLogExport['observationContext']>;
  useBoundary: Readonly<DssiObservationLogExport['useBoundary']>;
  records: readonly Readonly<ObservationLogRecord>[];
  integrity: Readonly<DssiObservationLogExport['integrity']>;
}>;
```

実装上は `structuredClone` 後に再帰的freezeを行ってよい。ただし、非改変の主要保証は書込経路を実装しないことで成立させる。

### 7.2 派生値

次は原記録へ追加せず、別モデルで計算する。

```ts
interface ReaderRecordView {
  eventId: string;
  displayTimestamp: string;
  methodLabel: string;
  mechanismLabel: string;
  relationLabel: string;
  correlationLabel: string;
  matchedTipIds: readonly ObservationTipId[];
}
```

---

## 8. Reader Query

```ts
export interface ReaderQuery {
  searchText: string;
  domainKeys: readonly string[];
  destinationHosts: readonly string[];
  triggerTypes: readonly string[];
  surfaceTypes: readonly string[];
  logLayers: readonly string[];
  frameTypes: readonly string[];
  destinationRelations: readonly string[];
  networkMechanisms: readonly string[];
  networkCorrelations: readonly string[];
  pageObservationTimings: readonly string[];
  cuePresented: 'all' | 'true' | 'false';
  viscosityLevels: readonly (1 | 2 | 3)[];
  timestampFrom?: number;
  timestampTo?: number;
  sort: ReaderSort;
}
```

### 8.1 フィルター意味

- 同一カテゴリー内の複数値はOR。
- 異なるカテゴリー間はAND。
- 空配列は制限なし。
- searchTextは `domainKey`、`destinationHost`、`triggerType` のみを対象とし、原ログ全文検索にしない。

### 8.2 並べ替え

```ts
export type ReaderSort =
  | 'timestamp_descending'
  | 'timestamp_ascending'
  | 'domain_ascending'
  | 'destination_ascending'
  | 'trigger_ascending';
```

元配列をin-place sortしない。

---

## 9. 概要集計

```ts
export interface ReaderSummary {
  sourceRecordCount: number;
  visibleRecordCount: number;
  timestampMin?: number;
  timestampMax?: number;
  domainCount: number;
  destinationHostCount: number;
  sameOriginCount: number;
  crossOriginCount: number;
  unknownRelationCount: number;
  correlatedCount: number;
  uncorrelatedCount: number;
  cuePresentedCount: number;
  cueNotPresentedCount: number;
  mechanismCounts: Readonly<Record<string, number>>;
}
```

「無操作時通信件数」はログだけから直接断定しない。`networkCorrelation === 'none_observed'` 等の実際の列挙値に基づく表示名を使用する。

---

## 10. 技術チップス仕様

### 10.1 型

```ts
export type ObservationTipId =
  | 'periodic_activity_without_observed_operation'
  | 'many_requests_after_page_start'
  | 'activity_near_content_edit'
  | 'activity_near_submit'
  | 'cross_origin_activity'
  | 'multiple_destination_hosts'
  | 'short_interval_repetition'
  | 'operation_not_correlated';

export interface ObservationTip {
  id: ObservationTipId;
  title: string;
  observedFact: string;
  notEstablished: readonly string[];
  commonPossibilities: readonly string[];
  nonInvasiveChecks: readonly string[];
  responsibilityReturn: string;
}
```

### 10.2 自動表示の境界

Readerは、チップスを「該当確定」として自動診断しない。

表示状態は次とする。

- `available`: このログに関連する可能性がある
- `selected`: 利用者が開いている
- `not_applicable`: 必要な観測項目がログに存在しない

### 10.3 パターン検出例

#### 別オリジン通信

```ts
record.destinationRelation === 'cross_origin';
```

#### 操作相関未確認

```ts
record.networkCorrelation === 'none_observed';
```

実際の列挙値は `src/core/models/network.ts` を正本とし、仕様実装時に確認する。

#### 短時間反復

同一 `domainKey`、`destinationHost`、`networkMechanism` の組合せを時刻順に見て、設定した表示上の窓内に複数件ある場合を候補とする。

この派生は「重複」や「異常」を意味しない。

### 10.4 責任返送文

すべてのチップスに、次の趣旨を保持する。

> この説明は一般的な技術用途の可能性を列挙したものであり、当該サイトの実際の目的を示すものではありません。実際の目的、必要性、保存条件、第三者提供、停止方法を説明できるのは、当該通信を設計・運用する主体です。技術的に一般的であることは、利用者への説明が不要であることを意味しません。

---

## 11. UI構成

### 11.1 reader.html

```text
main
├─ header
│  ├─ product title
│  ├─ provisional name notice
│  └─ use-boundary summary
├─ file-load-section
│  ├─ file input
│  ├─ load status
│  └─ validation notices
├─ summary-section
├─ query-section
│  ├─ search
│  ├─ filters
│  ├─ sort
│  └─ clear all
├─ grouping-section
├─ records-section
│  ├─ record count
│  ├─ table/list
│  └─ pagination or windowing
├─ detail-section
│  ├─ translated labels
│  └─ raw JSON
└─ tips-section
```

### 11.2 表示密度

- 初期表示は概要と主要列に限定する。
- 詳細フィールドは選択レコードへ展開する。
- 長いホスト名は省略表示できるが、完全値を確認可能にする。
- 画面幅が狭い場合は表をカード化するか列を減らす。

### 11.3 状態管理

フレームワークは導入せず、v0.5では小規模な単一状態オブジェクトと描画関数で実装する。

```ts
function setState(patch: Partial<ReaderState>): void {
  state = { ...state, ...patch };
  render(state);
}
```

大規模化した場合のみ再検討する。

---

## 12. ファイルサイズと表示件数

### 12.1 初期上限

- 警告開始: 5 MB
- 読込拒否候補: 25 MB

値は実測後に調整する。

### 12.2 一覧描画

初版は次のいずれかとする。

- 100件単位のページング
- 先頭200件表示＋追加表示

全件DOM生成は避ける。

原レコード件数と現在描画件数を区別する。

---

## 13. エラー表示

### 13.1 表示原則

- 何が失敗したか
- どの形式を期待したか
- ファイルが変更されたか否か
- 再試行方法

を示す。

### 13.2 例

```text
このファイルはConnectBits/DSSI観測ログとして認識できませんでした。
export.format が dssi-observation-log ではありません。
ファイルは変更されていません。
```

「壊れています」と断定せず、Readerとの形式不一致として表現する。

---

## 14. プライバシー実装

### 14.1 禁止API・禁止動作

Reader実装では、次を使用しない。

- `fetch`
- `XMLHttpRequest`
- `WebSocket`
- `navigator.sendBeacon`
- 外部画像・外部フォント
- `chrome.storage`へのログ保存
- `localStorage`へのログ保存
- IndexedDBへのログ保存

### 14.2 Content Security Policy

Manifest V3のextension page CSP内で動作し、インラインスクリプトを使用しない。

### 14.3 コンソール

開発時のエラーには、ファイル名、件数、エラーコードまでを許容し、原レコード全文は出力しない。

---

## 15. テスト仕様

### 15.1 Unit Tests

#### Parser

- 空文字を拒否する
- 不正JSONを拒否する
- 有効JSONをunknownとして返す

#### Validator

- 正しいformatVersion 1を受理する
- 異なるformatを拒否する
- records非配列を拒否する
- 未知schemaVersionを拒否する
- recordCount不一致をnoticeにする
- eventId重複を検出する

#### Query

- 元配列を変更しない
- 同一カテゴリORを適用する
- 異カテゴリANDを適用する
- 日時範囲を適用する
- sortの安定性を確認する

#### Summary

- source件数とvisible件数を分ける
- domain数、host数を正しく数える
- undefined値をunknownへ集計する

#### Tips

- cross_origin候補を抽出する
- 相関未確認候補を抽出する
- 短時間反復を異常と断定しない

### 15.2 Manual Validation

- 現在の実ログを読み込める
- 1,000件で操作可能
- Reader起動後に外部通信が増えない
- タブを閉じ、再度開いたときログが残っていない
- ファイルを別アプリで開き、内容が変化していない
- キーボードだけで主要操作ができる
- ライト／ダーク環境で読める

### 15.3 Network Silence Validation

Chrome DevToolsまたはConnectBits自身を用いて、Readerページが外部通信を開始しないことを確認する。

拡張機能内部のブラウザ動作とReader由来通信を区別し、観測できないことをゼロ通信の証明とは扱わない。

---

## 16. 実装順序

### Step 1 — Reader Skeleton

- `reader.html`
- `reader.ts`
- build entry
- logs／popupからの起動導線

### Step 2 — Parser and Validator

- formatVersion 1
- schemaVersion 1〜10
- エラー・notice表示

### Step 3 — Read-Only Timeline

- 概要
- 時系列一覧
- 原レコード詳細

### Step 4 — Query and Grouping

- フィルター
- ソート
- グループ件数
- 原レコードへ戻る導線

### Step 5 — Observation Tips

- 初版8項目
- 責任返送文
- 適用可能性表示

### Step 6 — Hardening

- 大容量制御
- XSS対策確認
- アクセシビリティ
- ネットワーク無通信確認
- 英語文字列分離

---

## 17. 完了条件

次を満たした時点で、ConnectBits Log Reader MVPをSprint 3.5-A完了とする。

- `npm run check` が成功する。
- Readerがdistへ生成される。
- 現行実ログを読み込める。
- 不正形式を安全に拒否する。
- ログを保存・送信・書換しない。
- 時系列、概要、主要フィルターが使える。
- 原レコードへ戻れる。
- 初版チップス8項目が実装される。
- 判断支援／非証拠化／説明責任返送の境界がUIにある。
- 既知の制約が文書化される。

---

## 18. v0.5以降への保留

- 複数ログ比較
- セッション差分
- 利用者注記サイドカー
- Reader専用エクスポート
- チップス追加
- 英語UI
- 独立Webアプリ化
- Firefox対応
- 商標・名称確定後のブランド置換

保留事項は、原記録非改変、ローカル完結、判断支援、非証拠化の四境界を変更しない範囲で検討する。
