# ソース一式について

このアーカイブには古い生成物の混入を避けるため `dist/` を含めていません。

```powershell
npm.cmd install
npm.cmd run format
npm.cmd run check
```

を実行すると、検査後に `dist/` が生成されます。

## Sprint 3補足

Sprint 3の配布物はソース更新である。任意`webRequest`権限、通信メタデータ観測、閉じた保存スキーマを反映した`dist`は、利用者環境で`npm.cmd run check`を実行して生成する。

この生成前ソースについては、型スタブを使ったTypeScript整合確認と純関数のsanity checkを実施した。依存パッケージの取得が実行環境で完了しなかったため、正式なESLint、Prettier、Vitest、esbuild一括検査は利用者環境で行う必要がある。
