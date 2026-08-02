# Sprint 3.5-A ConnectBits Log Reader 検証報告

> Validation date: 2026-08-02  
> Baseline: DSSI Core A v0.4.6  
> Scope: Reader source, Reader core, fixtures, three actual exported logs

## 1. 実施結果

### 1.1 Reader対象のstrict TypeScript確認

次の条件でReaderと依存するcoreを確認した。

- `strict: true`
- `noUncheckedIndexedAccess: true`
- `exactOptionalPropertyTypes: true`
- `useUnknownInCatchVariables: true`
- `noEmit: true`

結果: **成功**

### 1.2 Readerテストソースの型確認

Reader用の5テストファイルとcore依存を、ローカル検証用の最小型宣言で確認した。

結果: **成功**

### 1.3 手動ユニット相当アサーション

Node.jsの標準 `assert` を用いて次を確認した。

- 空ファイル拒否
- 不正JSON拒否
- 元配列を変更しないソート
- 同一カテゴリOR、異カテゴリAND
- source件数とvisible件数の分離
- 欠落値の明示的グループ化
- cross-origin候補と操作相関未確認候補
- 有効fixtureのfreeze
- 非DSSI形式の拒否

結果: **成功**

### 1.4 実ログ再読込

実際にDSSI Core Aから出力された3ファイルを、Parser → Validator → Query → Summary → Tipsの順に処理した。

| ファイル                                    | レコード | domainKey | destinationHost | available tips |
| ------------------------------------------- | -------: | --------: | --------------: | -------------: |
| `dssi-observation-log_20260801_213532.json` |       62 |         3 |              14 |              5 |
| `dssi-observation-log_20260801_225453.json` |      249 |        13 |              36 |              6 |
| `dssi-observation-log_20260801_235709.json` |      165 |        10 |              32 |              6 |

3ファイルとも、formatVersion 1およびrecord schemaVersionの検証を通過した。
`integrity_not_provided` は仕様どおり非阻害noticeとして残った。

### 1.5 禁止API・禁止動作の静的走査

`src/reader` と `src/core/log-reader` に対して、次の使用がないことを文字列走査した。

- `fetch`
- `XMLHttpRequest`
- `WebSocket`
- `navigator.sendBeacon`
- `chrome.storage`
- `localStorage`
- `sessionStorage`
- IndexedDB
- `innerHTML`
- `eval`
- `new Function`
- 外部URL資産

結果: **該当なし**

## 2. 完全な `npm run check` について

この検証環境では `npm ci` が内部npmミラーの404で停止した。

```text
E404: yocto-queue-0.1.0.tgz was not found in the configured internal registry
```

そのため、次はこの環境では未実行である。

- プロジェクト全体のESLint
- Prettierの正式check
- Vitestによる全テスト
- esbuildによる正式dist生成

依存パッケージが既にある開発環境で、適用後に次を実行する必要がある。

```powershell
npm.cmd run format
npm.cmd run check
```

## 3. 手動確認が残る事項

- Chrome拡張機能ページとしての実表示
- 1,000件以上での体感性能
- キーボードのみでの一連操作
- ライト／ダーク表示
- popupおよびlogs画面からの起動
- DevToolsによるReader起因の外部通信不存在確認
- Readerタブを閉じて再度開いた際に読込内容が残らないこと

## 4. 判定

Readerのsource実装、形式検証、派生集計、フィルター、チップス、実ログ処理は成立している。
正式なビルドおよびChrome上の受入確認は、開発環境での `npm run check` と手動検証をもって完了とする。
