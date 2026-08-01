# DSSI Core A Sprint 3.3 更新手順

## 更新内容

- 観測ログからCoverage Manifestを開く
- 観測表の上下同期横スクロール
- 文章チップの八方向配置
- Level 2・3・MAX向け小型通信パルス
- 幾何優先・非警告色の通信経路表示
- 表示時間とサイズ設定

## 適用

リポジトリのルートで、更新ZIPを上書き展開する。

```powershell
cd "C:\UserWorkspace\10_PUBLIC_GITHUB\DSSI\DSSI-Core-A"

Expand-Archive `
  "$HOME\Downloads\DSSI-Core-A-Sprint3.3-update.zip" `
  -DestinationPath "." `
  -Force
```

## 検査とビルド

```powershell
npm.cmd run format
npm.cmd run check
```

正常時のpackage versionは`0.4.3`。

## Chrome反映

1. `chrome://extensions`を開く。
2. DSSI Core Aを再読み込みする。
3. 観測対象ページも再読み込みする。
4. `dist/manifest.json`が0.4.3であることを確認する。

## 手動確認

```powershell
py -m http.server 4173
```

次を開く。

```text
http://localhost:4173/tests/fixtures/input-surfaces.html
```

確認項目:

- Level 1標準ではパルス非表示
- Level 2・3またはMAXでパルス表示
- DOM form＝四角、fetch/XHR＝円、Beacon/Ping＝波形
- GET＝G、POST＝P
- Cookie検出状態の点表示
- 八方向位置と右下・左下
- ログ画面の観測範囲ダイアログ
- 上下スクロール同期
- 本文、Cookie値、URL path/queryが表示されない
