# Sprint 3.3 検証報告

## 対象

DSSI Core A v0.4.3 — Real-Time Boundary Pulse Visualization

## 作成環境で確認した項目

- package version 0.4.3
- TypeScript strict型整合（Chrome API・Vitest一時型スタブ使用）
- 通信パルス、八方向位置、表示条件の純粋関数ランタイム検査
- 八方向位置型と時計回り循環
- Level 2・3・MAXに限定した通信パルス表示条件
- NetworkDescriptorから本文未観測のパルス記述へ縮約
- SubmissionDescriptorからDOM送信境界パルスへの変換
- method glyph変換
- Cookieヘッダー検出状態の閉じた分類
- optionsとlogsで共有するCoverage Manifest描画
- 上下横スクロール同期ロジック
- 既存のrequest body未要求、Cookie値非保存、URL縮約方針の維持
- テストfixtureへのfetch GET、fetch POST、Beacon/Ping試験追加

## 作成環境で完走できなかった項目

内部npmレジストリで`yocto-queue@0.1.0`を取得できず、次を完走していない。

```text
npm ci
npm run check
```

利用者環境で次を最終確認とする。

```powershell
npm.cmd run format
npm.cmd run check
```

## 実ブラウザ受入項目

1. Level 1標準では通信パルスが出ない。
2. Level 2・3またはMAXで、通信パルス設定が有効なら表示される。
3. 標準form submitで四角形パルスが表示される。
4. fetch/XHRで円形パルスが表示される。
5. Beacon/Pingで波形パルスが表示される。
6. GETはG、POSTはPとして表示される。
7. Cookieヘッダー名検出は塗り点、未検出は空点、未観測・判定不能は破線点になる。
8. 別オリジンでは左上の短線が表示される。
9. 色が危険・安全・注意の表示として使われていない。
10. アイコンサイズと表示時間を変更できる。
11. 文章チップの移動で通信パルス位置も同時に移る。
12. 右下・左下を含む八方向を選択できる。
13. 観測ログ上部からCoverage Manifestを開ける。
14. 観測表の上側・下側横スクロールが同期する。
15. ログ、チップ、パルスに本文、Cookie値、URL path/queryが出ない。
