# Sprint 3.5-B｜ConnectBits UI and Boundary Alignment 更新手順

## 適用対象

DSSI Core A v0.4.6＋ConnectBits Log Reader Sprint 3.5-A実装済みの作業ツリーを対象とする。

## 適用

リポジトリ直下で更新ZIPを展開する。

```powershell
cd "C:\UserWorkspace\10_PUBLIC_GITHUB\DSSI\DSSI-Core-A"

Expand-Archive `
  "$HOME\Downloads\ConnectBits-Sprint3.5-B-Update-v0.5.0.zip" `
  -DestinationPath "." `
  -Force
```

この更新ZIPは`.gitignore`を含まない。利用者側のホワイトリスト型`.gitignore`を変更しない。

## 検査

```powershell
npm.cmd run format
npm.cmd run check
```

その後、Chromeで次を行う。

1. `chrome://extensions`でConnectBitsを再読み込みする。
2. 既に開いている検証対象ページを再読み込みする。
3. ポップアップ、設置とプライバシー、観測ログ、Log Reader、導入説明を確認する。
4. 日本語／英語を切り替える。
5. JSONログをエクスポートし、Log Readerで再読込する。

## 配布ZIP試作

```powershell
npm.cmd run package:release:windows
```

生成物:

```text
release/
  ConnectBits-v0.5.0-unpacked/
  ConnectBits-v0.5.0.zip
  ConnectBits-v0.5.0.zip.sha256.txt
```

## コミット案

```text
feat(ui): align ConnectBits public UI and permission boundaries for Sprint 3.5-B
```

本文案:

```text
- adopt ConnectBits public branding and bilingual UI
- add first-run setup and optional-permission review
- link setup, observation log, reader, and setup review
- make the compact stream primary and move pulse guidance into dialogs
- align Cookie-header, payload, permission, and use-boundary wording
- localize observation tips and exported use-boundary text
- add release packaging and public-preview installation documents
- update version to 0.5.0
```
