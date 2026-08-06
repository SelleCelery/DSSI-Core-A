# ConnectBits Log Reader 要件定義書

## DSSI Core A — Local Observation Log Collation Reader

> Status: Implemented baseline for Sprint 3.5-A; UI aligned in Sprint 3.5-B  
> Version: 0.2.0  
> Language: Japanese primary  
> Product name: ConnectBits Log Reader（暫定。名称確認ゲートあり）  
> Project lineage: DSSI / DSSI Core A  
> Target: Chrome / Chromium-based browsers, Manifest V3  
> Product class: Local Read-Only Collation Interface / ローカル読取専用照合インターフェース

---

## 0. 本書の目的

本書は、DSSI Core A が出力する観測ログを、利用者がローカル環境で再読込し、原記録を変更せずに並べ替え、絞り込み、集計し、自らの判断へ用いるための `ConnectBits Log Reader` の製品要件を定める。

本リーダーは、ログ解析による危険判定、違法性判定、運営者評価、証拠化を目的としない。観測された断片を別の観点から照合できるようにし、観測限界と説明責任の所在を保持したまま、利用者へ判断条件を返す。

本書の上位根拠は、次の文書および実装に置く。

- `docs/product/DSSI_Core_A_Requirements_Definition.md`
- `docs/product/DSSI_Core_A_Functional_Specification.md`
- `docs/DSSI_Core_A_Architectural_Design_Principles.ja.md`
- `docs/DATA_LIFECYCLE_AND_PURGE_BOUNDARY.ja.md`
- `PRIVACY.md`
- `src/core/log-export.ts`
- `src/core/models/observation.ts`

---

## 1. 製品定義

### 1.1 一文定義

**ConnectBits Log Reader は、DSSI Core A の観測ログをローカルで読取専用として再読込し、原記録と派生表示を混同せずに照合するための閲覧インターフェースである。**

### 1.2 中心目的

本リーダーの中心目的は、ログを「理解済みの結論」へ変換することではない。

次の三点を成立させる。

1. 何が観測されたかを振り返れる。
2. どの観点で並べ替え・絞り込み・集計したかを確認できる。
3. その記録から何が分からないかを保持できる。

### 1.3 判断支援原則

> ログは判断の代替物ではなく、判断条件の一部である。

本リーダーは、利用者へ危険度、善悪、適法性、意図を結論として与えない。利用者が疑問を持ったとき、原記録へ戻り、観測事実と一般的な技術的可能性と運営者に残る説明責任を区別できるようにする。

### 1.4 原記録非改変原則

本リーダーは、読み込んだログファイルへ書き戻さない。

次の操作は表示変換として許容する。

- 並べ替え
- 絞り込み
- グループ化
- 件数集計
- 時間間隔の算出
- 原レコードへの参照

次の操作は v0.5 の責任範囲外とする。

- レコードの編集
- レコードの削除
- 重複除去
- 値の補正
- 加工済みログの再エクスポート
- 原ログへの注記埋込み

### 1.5 非証拠化原則

本リーダーおよびDSSI観測ログは、次の用途に必要な証拠能力を確保する設計ではない。

- 法的証拠
- 監査証跡
- デジタル・フォレンジック記録
- 労務監視記録
- 懲戒または処分判断
- 契約執行
- 雇用、与信、保険その他の第三者不利益判断

ログの完全性、網羅性、法的に信頼可能な時刻、記録主体の同一性、改変不存在、証拠保全手続への適合を保証しない。

---

## 2. DSSI Core A 内での位置づけ

### 2.1 配置方針

ConnectBits Log Reader は、別リポジトリへ分離せず、v0.5では DSSI Core A の同一リポジトリ内に置く。

推奨配置は次とする。

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
  unit/
    log-reader-export-validator.test.ts
    log-reader-query.test.ts
    log-reader-summary.test.ts
    observation-tips.test.ts

  fixtures/
    observation-log-format-v1.json
    observation-log-invalid.json

docs/
  product/
    ConnectBits_Log_Reader_Requirements_Definition.ja.md
    ConnectBits_Log_Reader_Functional_Specification.ja.md
```

### 2.2 配置理由

- DSSI Core A の現行ログ形式と同時に変更管理できる。
- `src/core/log-export.ts` と型・意味定義を共有できる。
- 外部APIや別サーバーを持たずに成立する。
- 拡張機能のローカルページとして提供できる。
- v0.5公開時に本体、リーダー、境界文書を一つの配布単位へ閉じられる。

### 2.3 独立性

同一リポジトリに置くが、観測処理とは責任を分離する。

```text
Observation Runtime
  └─ ログを生成する

Log Export
  └─ 利用者の管理領域へファイルを渡す

ConnectBits Log Reader
  └─ 利用者が選択したファイルを読取専用で表示する
```

リーダーは service worker のセッションバッファを直接参照せず、エクスポート済みファイルを入力とする。

---

## 3. 対象ユーザー

### 3.1 Primary Users

- ConnectBitsを自ら利用し、観測ログを振り返りたい個人
- 通信の発生時点、通信先、操作との相関を比較したい利用者
- 「何が分かり、何が分からないか」を保持して確認したい利用者

### 3.2 Secondary Users

- DSSI / ConnectBits の開発者
- デジタル教育または研究目的で、自身の環境のログを読む利用者
- プライバシー、デジタル主権、説明責任に関する検討者

### 3.3 Non-Target Users / Uses

- 従業員や第三者を監視する管理者
- 証拠保全またはフォレンジックを目的とする調査者
- 危険サイト一覧や違反判定を求める利用者
- ログを自動送信して外部分析したい運用者

---

## 4. 対象入力形式

### 4.1 v0.5対応形式

`src/core/log-export.ts` が生成するJSON形式を対象とする。

必須識別条件：

```json
{
  "export": {
    "format": "dssi-observation-log",
    "formatVersion": 1
  }
}
```

### 4.2 対応する主要領域

- `export`
- `observationContext`
- `useBoundary`
- `records`
- `integrity`

### 4.3 schemaVersion

v0.5では、現在の `ObservationLogRecord` が定義する schemaVersion 1〜10を読取対象とする。

未知のschemaVersionが含まれる場合は、黙って解釈せず、次のいずれかとする。

- 読み込み全体を拒否する。
- 既知フィールドのみを限定表示し、互換性未確認を明示する。

v0.5の標準動作は前者とし、部分読込は将来検討とする。

### 4.4 非対応入力

- CSV単体
- ZIP
- 暗号化ファイル
- 複数ログの同時読込
- 外部URL
- クリップボード貼付けによるJSON投入

CSV対応は、原ログの文脈情報が欠落しやすいためv0.5では含めない。

---

## 5. 機能要件

### 5.1 ファイル読込

- 利用者が明示的にローカルJSONファイルを選択する。
- ドラッグ&ドロップは初版では任意とする。
- 読込前にファイル名、サイズ、最終更新時刻を表示してよい。
- 読込後にファイルハンドルを保持しない。
- 原ファイルへ書き戻す経路を持たない。

### 5.2 形式検証

- JSONとして解析可能であること。
- `export.format` が `dssi-observation-log` であること。
- `export.formatVersion` が対応範囲内であること。
- `records` が配列であること。
- `export.recordCount` と実レコード件数の不一致を通知すること。
- 各レコードの最低限必須項目を検証すること。
- 読込エラーは利用者へ事実として表示し、推測で補正しないこと。

### 5.3 概要表示

最低限、次を表示する。

- エクスポート日時
- アプリケーションバージョン
- ログ形式バージョン
- レコードschemaVersion
- 全レコード件数
- 表示中レコード件数
- 記録期間
- domainKey数
- destinationHost数
- 同一オリジン／別オリジン件数
- 操作相関別件数
- 通信方式別件数
- `cuePresented` true／false件数
- 設定スナップショット利用可能性
- integrity status

### 5.4 時系列表示

各行に最低限、次を表示する。

- 時刻
- domainKey
- frameType
- triggerType
- observationScope
- operationEvidence
- networkMethodまたはsubmissionMethod
- networkMechanismまたはsubmissionMechanism
- destinationRelation
- destinationHost
- networkCorrelation
- pageObservationTiming
- cookieHeaderDetection
- viscosityLevel
- cuePresented

表示名は日本語化できるが、原値を確認できる経路を残す。

### 5.5 絞り込み

次の複合フィルターを提供する。

- domainKey
- destinationHost
- triggerType
- surfaceType
- logLayer
- frameType
- destinationRelation
- networkMechanism
- networkCorrelation
- pageObservationTiming
- cuePresented
- viscosityLevel
- 日時範囲

フィルター適用中であることを常時表示し、解除操作を一か所に集約する。

### 5.6 並べ替え

最低限、次を提供する。

- 時刻 昇順／降順
- domainKey
- destinationHost
- triggerType

既定は、原エクスポートの `recordOrder` を尊重する。

### 5.7 グループ表示

次の観点から件数を表示する。

- 閲覧サイト別
- 通信先別
- 操作相関別
- 通信方式別
- 同一／別オリジン別
- 表示対象／表示対象外別

集計値を選択すると、対応する原レコード一覧へ移動できること。

### 5.8 原レコード表示

- 選択した一件の原JSONを表示できる。
- 値を編集できない。
- 欠落フィールドを推測補完しない。
- 派生ラベルと原値を明確に区別する。

### 5.9 技術チップス

v0.5では、次の観測パターンを初版対象とする。

1. 何もしていないように見える間に定期通信がある
2. ページを開いただけで多数の通信がある
3. 入力中または内容変更後に通信がある
4. 送信操作より前後に通信がある
5. 別オリジンへの通信がある
6. 複数の外部ホストへ通信している
7. 同じ通信先への短時間反復がある
8. 利用者操作との相関が確認されていない

各チップスは次の固定構造を持つ。

- 観測されたこと
- この記録からは分からないこと
- 一般的にあり得る技術用途
- 侵襲せずに比較できること
- 運営者へ残る説明責任

チップスは自動結論ではなく、該当し得る読解補助として表示する。

### 5.10 利用境界表示

画面上に恒常的または容易に到達可能な形で、次を示す。

> このリーダーは原ログを変更しません。並べ替え、絞り込み、集計は表示上の変換です。

> このログは利用者自身の判断支援を目的とし、完全性、網羅性、証拠能力を保証しません。

> 一般的な技術用途の説明は、当該サイトの実際の目的を示すものではありません。実際の目的、必要性、保存条件、第三者提供、停止方法を説明できるのは運営者です。

---

## 6. 非機能要件

### 6.1 ローカル完結

- 読込、検証、集計、表示をブラウザ内で完結する。
- 外部APIを呼び出さない。
- 読み込んだログをネットワーク送信しない。
- 分析用テレメトリを送信しない。

### 6.2 性能

- 1,000件のログを一般的なデスクトップ環境で実用的に閲覧できる。
- 10,000件は保証対象外だが、画面を停止させない設計を優先する。
- フィルター操作は原則として1秒未満を目標とする。

### 6.3 可用性

- 読込失敗で拡張機能全体を停止させない。
- 一件の不正レコードを黙って削除しない。
- エラー位置と拒否理由を表示する。

### 6.4 アクセシビリティ

- キーボード操作可能であること。
- 色だけで状態を区別しないこと。
- 表とフィルターに明確なラベルを付けること。
- 原値表示へスクリーンリーダーで到達できること。

### 6.5 国際化

- v0.5では日本語正本とする。
- UI文字列を直接散在させず、英語通約を追加可能な構造にする。
- JSONのキーと列挙値は言語非依存のまま保持する。

---

## 7. プライバシー要件

- ファイル選択は利用者の明示操作による。
- 読込内容を `chrome.storage`、`localStorage`、IndexedDBへ自動保存しない。
- 最近開いたファイル一覧を保持しない。
- ファイルパスを永続化しない。
- ログ本文をコンソールへ出力しない。
- エラー報告へ原レコード全文を含めない。
- 外部リンクを開く場合でもログ内容をURLへ含めない。

---

## 8. セキュリティ要件

- 読み込んだ文字列を `innerHTML` へ直接挿入しない。
- JSON値はテキストとしてレンダリングする。
- 巨大ファイルによる画面停止を避けるため、ファイルサイズ上限または警告を設ける。
- prototype pollutionを避けるため、入力オブジェクトを実行可能な設定として扱わない。
- JSON内のURLを自動アクセスしない。
- ログ内の文字列をコードとして評価しない。

---

## 9. UI要件

初版は次の四領域で構成する。

```text
[利用境界・読込状態]
[概要]
[フィルター／グループ]
[時系列一覧／原レコード詳細／技術チップス]
```

### 9.1 初期状態

- ファイル未選択状態を明示する。
- 読み込まない限りログ内容を表示しない。
- サンプルデータを実ログと誤認させない。

### 9.2 読込後状態

- 読込ファイル名
- 全件数
- 表示中件数
- 適用中フィルター
- 互換性状態
- 利用境界

を常時確認できる。

### 9.3 誤読防止

次の表現を避ける。

- 安全／危険
- 正常／異常
- 違法／適法
- 追跡確定
- 漏洩確定
- 悪質サイト

代わりに観測事実を記述する。

- 操作相関なし
- 別オリジン
- 短時間反復
- 目的未確認
- 本文未観測

---

## 10. 受入条件

v0.5の受入条件は次とする。

1. 現行の `dssi-observation-log` formatVersion 1を正常に読める。
2. schemaVersion 1〜10を検証できる。
3. 不正JSONを安全に拒否できる。
4. 非DSSI JSONをDSSIログとして受け入れない。
5. 読込後に外部通信が発生しない。
6. 原ファイルへ書き戻さない。
7. 全件数と表示中件数を区別する。
8. 主要フィルターを複合適用できる。
9. 集計から原レコードへ戻れる。
10. 原JSONを読取専用で表示できる。
11. 初版チップス8項目へ到達できる。
12. 証拠能力を保証しないことを明示する。
13. 目的を断定せず、説明責任を運営者へ返す。
14. 1,000件程度のログで実用的に動作する。
15. Readerを閉じると読込内容が残らない。

---

## 11. v0.5で実装しない事項

- AIによるログ解説
- 外部サービスによるホスト判定
- WHOIS、DNS、証明書、企業情報の自動取得
- 通信本文の取得
- 通信遮断
- 危険度スコア
- 適法性評価
- 規約との自動照合
- 証拠保全
- 電子署名
- 複数ログ比較
- 注記サイドカー
- 共有用レポート生成

これらは、Core Aの観測境界、権限境界、責任境界を再検討したうえで別スプリントとする。

---

## 12. 名称確認ゲート

`ConnectBits` は公開製品名候補であるが、公開前に次を確認する。

- 日本の商標検索
- WIPO Global Brand Database
- 主要公開対象国の商標検索
- Chrome Web Store内名称
- GitHub、npm、主要ドメイン
- ITサービス分野の既存事業者との混同可能性

名称確認が完了するまで、文書上は「暫定」と明示する。名称変更があっても、DSSI Core AおよびLog Readerの責任境界と機能要件は維持する。
