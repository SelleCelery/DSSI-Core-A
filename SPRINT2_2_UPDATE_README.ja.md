# DSSI Core A Sprint 2.2 更新手順

このZIPをDSSI-Core-Aリポジトリ直下へ上書き展開してください。

```powershell
Expand-Archive `
  "$HOME\Downloads\DSSI-Core-A-Sprint2.2-update.zip" `
  -DestinationPath "C:\UserWorkspace\10_PUBLIC_GITHUB\DSSI\DSSI-Core-A" `
  -Force
```

展開後、書式整形と全検査を実行します。

```powershell
cd "C:\UserWorkspace\10_PUBLIC_GITHUB\DSSI\DSSI-Core-A"
npm.cmd run format
npm.cmd run check
```

正常時のバージョンは `dssi-core-a@0.3.2` です。

その後、`chrome://extensions` でDSSI Core Aを再読み込みし、観測ログ画面で「通常ログ」「診断ログ」を切り替えて確認してください。
