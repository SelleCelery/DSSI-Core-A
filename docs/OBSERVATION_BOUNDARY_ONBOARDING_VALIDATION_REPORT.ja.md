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

初回自動検証では、任意権限オブジェクトに`origins`が含まれないことを正しい契約として固定していた。三つの観測選択と休止状態のテストは成功したが、実機受入により、この権限契約では通信観測が成立しないことが判明した。

## 2026-08-07 権限回帰補修

`npm run check`は33 test files／148 testsで成功した。

補修後の自動検証では、付与要求に`webRequest`とHTTP/HTTPS originの両方が含まれること、manifestがoriginを任意ホスト権限として宣言すること、listener開始判定が完全な権限束を確認すること、解除要求には`webRequest`だけが含まれることを固定する。

初回検証の成功記録は削除せず、「自動検査は通ったが、実機で必要な通信観測成立条件を欠いていた」という回帰履歴として保持する。

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
