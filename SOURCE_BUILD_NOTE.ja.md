# DSSI Core A 0.4.1 ソース・ビルド注記

この配布物はTypeScriptソースを含む。Chromeへ読み込むのは`src`ではなく、ユーザー環境でビルドされた`dist`である。

```powershell
npm.cmd run format
npm.cmd run check
```

`check`はtypecheck、lint、format check、Vitest、esbuildを順に実行する。

この作成環境では依存パッケージ取得先の制約により正式な`npm run check`全体を完走していない。TypeScriptソースとテストの型整合は代替型環境で確認したが、最終成果物はユーザー環境の正式コマンドを通したものを正とする。

ビルド後:

1. `chrome://extensions`で拡張機能を再読み込みする。
2. 観測対象ページも再読み込みする。
3. `dist/manifest.json`が0.4.1であることを確認する。
