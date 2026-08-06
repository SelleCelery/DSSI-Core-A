# Sprint 3.5-B｜ConnectBits UI and Boundary Alignment 検証報告

> Validation addendum: 2026-08-05
> Complete repository check: passed with Node.js 24.14.0 and npm 11.9.0

## 1. 対象

- ConnectBits v0.5.0 Public Preview UI
- 日本語・英語表示
- 初回導入説明と任意権限選択
- 設置とプライバシー／観測ログ／Log Reader間の導線
- 通信パルス読解ダイアログ
- Cookieヘッダー・通信本文・権限に関する表示境界
- Log Readerの日本語・英語読解
- 展開済み配布物およびWindows ZIP生成スクリプト

新しい観測API、Cookie保存領域の閲覧、通信本文取得、危険度判定は追加していない。

## 2. 実施済み検証

### 2.1 TypeScript

コンテナ内のTypeScript 5.8.3と、Chrome/Vitest APIの検証用型スタブを用い、次を実行した。

- `strict`
- `noUncheckedIndexedAccess`
- `exactOptionalPropertyTypes`
- `noFallthroughCasesInSwitch`
- `noImplicitOverride`
- `useUnknownInCatchVariables`
- `noUnusedLocals`
- `noUnusedParameters`

対象は`src/**/*.ts`および`tests/**/*.ts`である。結果はエラー0件だった。

プロジェクトが宣言するTypeScript 6.0.3および実際の`@types/chrome`による最終確認は、利用者環境の`npm.cmd run check`を最終関門とする。

### 2.2 構文変換

TypeScript Compiler APIの`transpileModule`で、`src`と`tests`に含まれる82ファイルを個別変換した。構文診断は0件だった。

### 2.3 i18n整合

- 日本語メッセージキー: 238
- ソース／HTMLから参照されたキー: 231
- 未定義キー: 0
- manifestの`__MSG_*__`参照について、日本語・英語とも欠落0

### 2.4 DOM ID整合

`requiredElement('#...')`と各HTMLの`id`を照合した。

| 画面       | requiredElement数 | 欠落ID | 重複ID |
| ---------- | ----------------: | -----: | -----: |
| popup      |                11 |      0 |      0 |
| options    |                17 |      0 |      0 |
| logs       |                31 |      0 |      0 |
| reader     |                59 |      0 |      0 |
| onboarding |                20 |      0 |      0 |

### 2.5 実ログによるReader確認

実際にConnectBits/DSSIから出力された次のログを、Parser、Validator、Query、Summary、Groups、Observation Tipsへ通した。

- 249件のログ: 13 domainKey、36 destinationHost
- 165件のログ: 10 domainKey、32 destinationHost

両方について次を確認した。

- JSON parse成功
- formatVersion 1／schemaVersion 1〜10の検証成功
- 全件表示件数とsummary件数の一致
- domain／destination groupの生成
- 日本語・英語とも技術チップス8項目を生成
- 原記録へ変更を加えずに派生表示を作成

### 2.6 エクスポート境界

日本語UIでは日本語、英語UIでは英語の`useBoundary`文面を生成することを純粋関数で確認した。ログキー、format、record schemaは変更していない。

### 2.7 外部送信経路の静的確認

`src`内について、ConnectBits自身による次の実行呼出しを検索した。

- `fetch(...)`
- `XMLHttpRequest`
- `WebSocket`
- `sendBeacon(...)`

該当する外部送信実装は0件だった。検出されたHTTP文字列は、観測対象URLパターンとSVG名前空間だけである。

### 2.8 package／manifest整合

次のバージョンがすべて`0.5.0`で一致することを確認した。

- `package.json`
- `package-lock.json`
- `package-lock.json` root package
- `src/manifest/manifest.json`

`npm ci --dry-run --offline`により、package.jsonとlockfileの依存定義が同期していることも確認した。

### 2.9 スクリプト構文

- `scripts/build.mjs`: `node --check`成功
- `scripts/prepare-release.mjs`: `node --check`成功

PowerShell実行環境がないため、`scripts/package-release.ps1`の実行確認は利用者のWindows環境で行う。

## 3. 初回検証環境で完走できなかった検証

初回報告時、プロジェクトの完全な`npm run check`は、コンテナ内npmレジストリに必要なパッケージtarballがなく、`npm ci`が完了しなかったため実行できていなかった。

未完走項目:

- 正式なESLint
- 正式なPrettier
- Vitest
- esbuildによる全バンドル
- Chromeへ読み込んだ実UI動作
- Windows PowerShellによるZIP生成

利用者環境では次を実行する。

```powershell
npm.cmd run format
npm.cmd run check
npm.cmd run package:release:windows
```

### 3.1 2026-08-05追補

完全版リポジトリで`npm ci`と`npm run check`を実行し、次を確認した。

- TypeScript: 合格
- ESLint: 合格
- Prettier: 合格
- Vitest: 28 test files／112 tests 合格
- esbuild: 合格

これにより、上記の未完走項目のうち、正式なESLint、Prettier、Vitest、esbuildは解消した。残る実機関門は、Chrome／Chromiumの新規プロファイルで行う導入・権限・更新確認と、Windows PowerShellによる最終ZIP生成である。

## 4. 手動受入確認

ビルド後、次を確認する。

1. 初回導入説明が新規インストール時に開く。
2. 通信観測権限を許可せずに開始できる。
3. 日本語／英語／ブラウザー追従を切り替えられる。
4. 設置とプライバシー、観測ログ、Reader、導入説明を相互移動できる。
5. 観測ログは簡易ストリームを初期表示とする。
6. 「通信パルスの読み方」がクリックで開く。
7. 詳細表を高度な確認として残す。
8. `not_requested`が「要求・取得していない」と表示される。
9. Cookieはヘッダー存在状態として表示され、値を取得したように見えない。
10. 任意権限の許可と、必要性・妥当性の判断が別文で表示される。
11. Readerで日本語・英語の技術チップスを表示できる。
12. Readerは読み込んだ原ファイルへ書き戻さない。
13. release ZIPにsource、tests、node_modulesが混入しない。
14. 拡張機能更新後、既に開いていた対象ページを再読み込みすると新しいUIが反映される。

## 5. 判定

ソース統合、厳格型確認、静的整合、実ログ読込確認は完了した。

Sprint 3.5-Bの完全リポジトリ検査は通過した。Chrome実画面確認とWindows ZIP生成を通過した時点で、v0.5.0 Public Preview候補と判定できる。
