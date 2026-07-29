# DSSI Core A Sprint 3 更新手順

## 対象

- 更新前: DSSI Core A 0.3.2 / Sprint 2.2
- 更新後: DSSI Core A 0.4.0 / Sprint 3

## 追加されるもの

- 一時取得・縮約・保存・パージ境界
- 閉じた項目・値集合によるObservationRecord検査
- Content Script、Service Worker、storageの三重検査
- 任意`webRequest`権限
- 入力面操作と近接したfetch/XHR・Beacon/Ping通信開始メタデータ
- 通信用語とパージ境界の文書

## 適用

PowerShellでリポジトリへ移動する。

```powershell
cd "C:\UserWorkspace\10_PUBLIC_GITHUB\DSSI\DSSI-Core-A"
```

現在の状態を確認する。

```powershell
git status
```

Sprint 2.2をまだコミットしていない場合は、先に固定する。

```powershell
git add .
git commit -m "feat: separate activity and diagnostic logs in Sprint 2.2"
```

更新ZIPを上書き展開する。

```powershell
Expand-Archive `
  "$HOME\Downloads\DSSI-Core-A-Sprint3-update.zip" `
  -DestinationPath "." `
  -Force
```

## 検査とビルド

```powershell
npm.cmd run format
npm.cmd run check
```

正常ならpackage versionは`0.4.0`となり、`dist/manifest.json`もビルド時に0.4.0へ同期される。

## Chromeへの反映

1. `chrome://extensions`を開く。
2. DSSI Core Aを再読み込みする。
3. DSSIの設定画面を開く。
4. 「通信メタデータ補助観測」を有効にする。
5. Chromeの任意権限確認を承認する。
6. 観測対象ページを再読み込みする。

通信観測を使わない場合は、設定を無効のままにできる。無効化すると任意権限を削除する。

## 実地確認

入力欄へフォーカス、キー入力、または貼り付けを行い、その後2.5秒以内にfetch/XHRまたはBeacon/Ping系通信が始まると、通常ログへ次が表示される可能性がある。

```text
観測事実:
  入力操作と近接した通信開始を観測

操作証拠:
  ブラウザ通信APIの通知を観測

境界観測範囲:
  通信開始メタデータのみを観測

本文観測:
  本文を要求していない
```

記録が示さないもの:

- 入力内容が通信へ含まれたこと
- 通信完了
- サーバー受信
- 保存成功
- 安全性または危険性の確定

## 保存境界の確認

テストページのSprint 3ボタンは、URL pathとqueryに試験文字列を含む。ログにはhostだけが残り、path、query、request bodyが表示されないことを確認する。

## 固定

実地確認後:

```powershell
git add .
git commit -m "feat: add privacy-bounded network metadata observation in Sprint 3"
git tag -a v0.4.0 -m "DSSI Core A Sprint 3 data lifecycle and network metadata baseline"
```
