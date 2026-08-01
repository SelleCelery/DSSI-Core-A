# DSSI Core A 0.4.3 ソース・ビルド注記

この配布物はTypeScriptソースを含む。Chromeへ読み込むのは`src`ではなく、ユーザー環境でビルドされた`dist`である。

```powershell
npm.cmd run format
npm.cmd run check
```

`check`はtypecheck、lint、format check、Vitest、esbuildを順に実行する。

この作成環境では内部npmレジストリに`yocto-queue@0.1.0`が存在せず、正式な`npm ci`および`npm run check`全体を完走していない。TypeScriptソースとテストのstrict型整合は、一時的なChrome API・Vitest型スタブを使って確認した。最終成果物は利用者環境の正式コマンドを通したものを正とする。

ビルド後:

1. `chrome://extensions`で拡張機能を再読み込みする。
2. 観測対象ページも再読み込みする。
3. `dist/manifest.json`が0.4.3であることを確認する。
