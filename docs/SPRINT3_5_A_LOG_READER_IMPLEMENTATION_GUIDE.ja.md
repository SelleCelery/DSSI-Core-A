# Sprint 3.5-A ConnectBits Log Reader 実装ガイド

> Status: Source implementation completed / local build required  
> Baseline: DSSI Core A v0.4.6  
> Public release target: v0.5  
> Product name: ConnectBits Log Reader（暫定）

## 1. 実装範囲

`ConnectBits_Log_Reader_Requirements_Definition.ja.md` と
`ConnectBits_Log_Reader_Functional_Specification.ja.md` に基づき、次を実装した。

- 拡張機能ローカルページ `reader.html`
- ローカルJSONの明示選択と読込
- `dssi-observation-log` formatVersion 1の検証
- record schemaVersion 1〜10の検証
- 原記録を変更しない読取専用モデル
- 概要集計
- 時系列一覧と100件単位ページング
- 複合フィルターと安定ソート
- グループ件数から原レコード一覧へ戻る導線
- 原レコードJSONの読取専用表示
- 観測パターン別技術チップス8項目
- 判断支援、非証拠化、説明責任返送の恒常表示
- popupおよび現行ログ画面からReaderを開く導線
- Reader向けユニットテストと形式fixture

## 2. 配置

```text
src/
  reader/
    reader.html
    reader.ts
  core/
    log-reader/
      export-parser.ts
      export-validator.ts
      observation-tips.ts
      reader-model.ts
      reader-query.ts
      reader-summary.ts

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

## 3. 適用後の確認

リポジトリ直下で実行する。

```powershell
npm.cmd run format
npm.cmd run check
```

成功後、Chromeで次を行う。

1. `chrome://extensions` を開く。
2. DSSI Core Aを再読み込みする。
3. 既に開いている検証対象タブを再読み込みする。
4. 拡張機能のpopupから「保存済みログを読む」を開く。
5. または観測ログ画面から「エクスポート済みログを読む」を開く。
6. DSSIが出力したJSONを選択する。

## 4. Readerの入力境界

Readerは、エクスポート済みJSONファイルだけを入力とする。

- 現在のsession bufferを直接参照しない。
- 最近のログを自動読込しない。
- ファイルハンドルを保持しない。
- 読み込んだ内容を `chrome.storage`、`localStorage`、IndexedDBへ保存しない。
- 外部APIへ送信しない。
- 原ファイルへ書き戻さない。

## 5. 大容量制御

- 5 MB超: 警告して読込を継続する。
- 25 MB超: v0.5では読込を拒否する。
- 一覧は100件単位で描画する。

## 6. v0.5で実装していない事項

- ログ編集・削除・補正
- 加工済みログの再エクスポート
- AI解説
- 危険度・適法性・運営者評価
- 通信本文の取得
- 外部ホスト情報の自動取得
- 証拠保全・署名・改変検知
- 複数ログ比較
- 注記サイドカー

## 7. バージョンについて

この実装単体では `package.json` のバージョンを変更していない。
Reader以外のv0.5公開境界、UI運用修正、配布手順、英語通約が閉じた時点で、リリース版番号を確定する。
