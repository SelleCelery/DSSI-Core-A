# DSSI Core A Sprint 3.2 更新手順

対象: Sprint 3.1 / v0.4.1からSprint 3.2 / v0.4.2への更新

## 1. 更新前確認

```powershell
cd "C:\UserWorkspace\10_PUBLIC_GITHUB\DSSI\DSSI-Core-A"
git status
```

未保存の変更がある場合は、先にコミットまたは退避する。

## 2. 更新ZIPを展開

```powershell
Expand-Archive `
  "$HOME\Downloads\DSSI-Core-A-Sprint3.2-update.zip" `
  -DestinationPath "." `
  -Force
```

## 3. 整形・検査・ビルド

PowerShellの実行ポリシーにより`npm.ps1`が止まる環境では`npm.cmd`を使う。

```powershell
npm.cmd run format
npm.cmd run check
```

成功時のpackage versionは`0.4.2`。

## 4. Chromeへ反映

1. `chrome://extensions`を開く
2. DSSI Core Aを再読み込み
3. 対象ページも再読み込み
4. 必要ならセッションログを消去

Content Scriptは既に開いているページへ自動差し替えされない。

## 5. MAX確認

1. ポップアップで報告モードをMAXへ変更
2. 対象ページを再読み込み
3. ページ開始時にMAX境界チップが一度出ることを確認
4. 入力やsubmitをせず、対象ページが行うfetch/XHRまたはBeacon/Pingを待つ
5. 診断ログに「通信開始を観測（相関可能な利用者操作は未確認）」が出ることを確認
6. 通信が短時間に複数発生した場合、チップが一件ずつではなく集約されることを確認

## 6. 送信操作相関確認

1. 標準formへ入力
2. 内容変更から2.5秒以上待つ
3. submit要素を操作
4. 2秒以内にfetch/XHR系またはBeacon/Ping系通信が始まるページで、「送信操作と近接した通信開始」を確認

標準formがmain_frame遷移だけを行う場合、現在の通信フィルターではwebRequest側の相関記録が出ないことがある。DOMのsubmit記録は別に残る。

## 7. チップ位置確認

表示中チップ右上の小さな移動ボタンを押す。

```text
上 → 左 → 下 → 右 → 上
```

位置変更後もチップ本体以外のページ操作が妨げられないことを確認する。

## 8. Coverage Manifest確認

設定とプライバシー画面で、次の五分類が表示されることを確認する。

- 観測している
- 観測後に縮約
- 設計上、観測しない
- 現在の仕組みでは観測できない
- 未知残差

通信メタデータ権限を解除すると、対象通信観測が「現在有効」ではなくなることも確認する。
