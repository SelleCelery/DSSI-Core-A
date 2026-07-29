# Sprint 3 検証記録

## 対象

DSSI Core A 0.4.0 / Sprint 3

## この環境で実施した検査

- 一時的なChrome/Vitest型スタブを用いたTypeScript全ソース・テストの`--noEmit`検査
- network analyzerのURL縮約sanity check
- 2500ms入力相関境界と1200ms重複抑制境界のsanity check
- Privacy Safe Loggerによる禁止項目、偽装host、payload状態拒否のsanity check
- 入力相関パルスの閉じた項目集合とdomain検査
- 日本語表示ラベルのsanity check
- package、lockfile、manifest、Prettier設定のJSON構文検査
- `src`内にconsole出力がないことの検索
- ソース・テスト・文書の行末空白検査

## 成功した結果

- TypeScript整合検査: 成功
- 純関数sanity check: 成功
- JSON構文検査: 成功
- console出力検査: 成功
- 行末空白検査: 成功

## この環境で完走していない検査

依存パッケージ取得が完了しなかったため、正式な次のコマンドは実行していない。

```text
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build
```

利用者環境で、先に`npm.cmd run format`を実行し、その後`npm.cmd run check`を実行する必要がある。

## ブラウザ受入確認が必要な項目

- 任意権限の確認画面が設定ボタン操作から表示される
- 権限付与後に`webRequest` listenerが登録される
- 無効化後に権限とlistenerが解除される
- 入力面操作から2.5秒以内のfetch/XHRまたはBeacon/Ping通信が記録される
- URL path、query、request bodyがログへ出ない
- 通信がない、時間窓外、別documentの場合に記録されない
- チップとログが入力内容送信を断定しない

## 判定

ソース配布可能な実装候補。正式なSprint 3基準版への固定は、利用者環境の`npm.cmd run check`とChrome実地確認後に行う。
