# Sprint 3.4 検証報告

## 対象

- DSSI Core A `0.4.6`
- Sprint `3.4`
- 観測記録スキーマ `10`

## 実施できた検証

### TypeScript strict型検査

一時的なChrome API型スタブを用い、`src/**/*.ts`を対象にTypeScript strict型検査を実行しました。

```text
結果: 成功
```

さらに、一時的なVitest宣言スタブを加え、`src/**/*.ts`と`tests/**/*.ts`の型整合を検査しました。

```text
結果: 成功
```

一時スタブと一時tsconfigは配布物に含めません。

### 構造検査

次を確認しました。

- package、lockfile、manifestのバージョンが`0.4.6`
- 新規観測記録がschema `10`
- `settingsSnapshotId`がprivacy-safe loggerの許可フィールドに含まれる
- 不正なsettings snapshot IDが拒否される
- hostname表示プロファイルが粘性レベルと報告モードを変更しない
- DOM色とwebRequest色が独立して上書き可能
- 通信パルス不透明度がhostnameプロファイルへ保存可能
- Service Workerがhostname profile変更時にキャッシュを無効化する
- 通信表示の状態と注意チップの表示経路が分離されている
- 初回hostnameで粘性を自動変更しない
- observed-host更新を1時間以内は再書き込みしない
- JSON exportが設定、Coverage Manifest、利用境界、一次観測記録を含む
- CSVが固定列・一行一記録であり、表示文へ再変換しない
- CSV-only時のcontext JSONがrecords配列を重複保持しない
- exportが`integrity.status: not_provided`を明記する
- 暗号化、署名、改変不能性を実装済みと表示しない

## 実施できなかった正式検査

生成環境で`npm ci`を実行したところ、内部npmレジストリから次の依存パッケージを取得できませんでした。

```text
yocto-queue@0.1.0
404 Not Found
```

このため、生成環境では次を正式には完走できていません。

- project dependencyを用いた`npm run typecheck`
- ESLint
- Prettier check
- Vitest実行
- esbuildによる最終dist生成
- `npm run check`全体

利用者環境で次を最終関門として実行してください。

```powershell
npm.cmd run format
npm.cmd run check
```

## Chrome実機で確認すべき項目

1. D/W/α操作が現在hostnameだけへ保存される。
2. 再読み込み後もhostname別の色・不透明度・表示状態・位置が復元される。
3. `↺`でhostname profileが削除され、全体設定へ戻る。
4. 通信パルスまたはTを非表示にしても、Level 2/3のパスワード・決済・個人情報注意チップが表示される。
5. 初回hostname表示が粘性レベルを変更しない。
6. JSON保存が一ファイルとして完了する。
7. CSV保存時にCSVとcontext JSONが生成される。
8. JSON＋CSV保存時に両ファイルが生成される。
9. 「現在表示中」が通常／診断フィルターを反映する。
10. 保存JSONのsettings snapshot参照が記録と対応する。
11. 保存ファイルに入力本文、Cookie値、request body、完全URL path/queryが含まれない。
12. 保存ファイルが暗号化・署名済みであるかのように表示されない。

## 残る制約

- 保存ファイルは編集可能です。
- 改変検知、真正性証明、暗号化はありません。
- ブラウザのダウンロード先をDSSIが任意フォルダへ固定しません。
- hostnameは完全一致単位であり、サブドメインを自動統合しません。
- 既存のschema 9以前の記録には観測時設定スナップショットがない場合があります。
- `cuePresented`は表示方針上の対象性を示す既存フィールドであり、実際に文章チップが画面へ表示されたことだけを証明しません。
