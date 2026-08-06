# 観測境界導入フロー検証報告

> Status: Automated checks complete; real-browser acceptance pending  
> Work boundary: Installer and Release Hardening acceptance patch

検証日: 2026-08-06

## 自動検証

- TypeScript型検査
- ESLint
- Prettier整形検査
- Vitest
- esbuild
- 展開済み配布ディレクトリ生成

`npm run check`は29 test files／118 testsで成功した。

自動検証では、任意権限オブジェクトに`origins`が含まれないこと、三つの観測選択が設定へ正しく変換されること、休止時のCoverage Manifestが「現在は観測していない／利用者の選択」となることを固定する。

## 実機受入待ち

Chrome／Chromiumの新規profileで次を確認する。

1. 新規導入後、説明確認前に観測ログが増えない。
2. 全確認項目のチェック後に三択が現れる。
3. 標準設定の許可、拒否、再要求が破綻しない。
4. DOM限定および休止で`You cannot remove required permissions`が発生しない。
5. `webRequest`撤回後に通信メタデータが止まり、DOM限定ではページ上の限定観測が残る。
6. 休止ではDOMと通信メタデータの両方が止まる。
7. 「設定とプライバシー」から三択を往復できる。
8. ブラウザー再起動後も選択と権限表示が一致する。
9. 簡易ログの`⋯`とPUTのひし形を区別できる。
10. 通信パルスコンソールの`↻`が八方向移動、`⌫`がhostname設定解除として動く。

実機受入が完了するまで、本報告は公開配布の最終承認を意味しない。
