# DSSI Core A Sprint 3.1 更新手順

## 対象

- 更新前: DSSI Core A 0.4.0 / Sprint 3
- 更新後: DSSI Core A 0.4.1 / Sprint 3.1

## 主な変更

- フォーカスを通常ログと通信相関から除外
- Level 3、およびLevel 2の機密入力面でfocus chipだけを表示
- 活動ログ重複抑制と通信相関パルス更新を分離
- 内容変更の観測時刻をContent Script側で付与
- Cookieヘッダー名の検出状態を追加
- ページ観測開始との中立的時間関係を追加
- 半透明・操作透過のfact chipを収録
- schema version 8

## 適用

PowerShellでリポジトリへ移動する。

```powershell
cd "C:\UserWorkspace\10_PUBLIC_GITHUB\DSSI\DSSI-Core-A"
```

現在の変更を確認する。

```powershell
git status
```

Sprint 3を未コミットなら先に固定する。

```powershell
git add .
git commit -m "feat: add privacy-bounded network metadata observation in Sprint 3"
```

更新ZIPを展開する。

```powershell
Expand-Archive `
  "$HOME\Downloads\DSSI-Core-A-Sprint3.1-update.zip" `
  -DestinationPath "." `
  -Force
```

## 検査とビルド

```powershell
npm.cmd run format
npm.cmd run check
```

正常ならpackage versionと`dist/manifest.json`は`0.4.1`になる。

## Chromeへ反映

1. `chrome://extensions`を開く。
2. DSSI Core Aを再読み込みする。
3. 観測対象ページも再読み込みする。
4. 設定画面で通信メタデータ補助観測が有効か確認する。

Content Scriptは既存ページへ自動差し替えされないため、対象ページの再読み込みも必要である。

## 手動テストページ

PowerShellでローカルHTTPサーバーを起動する。

```powershell
py -m http.server 4173
```

Chromeで開く。

```text
http://localhost:4173/tests/fixtures/input-surfaces.html
```

確認手順:

1. Level 3で自由記述欄をクリックし、チップだけ出て通常ログにfocusが残らないことを確認する。
2. Level 2でpassword/payment/personal informationだけfocus chipが出ることを確認する。
3. 自由記述欄へ通常文字を入力する。
4. 同じ欄へさらに入力し、2.5秒以内にJavaScript通信ボタンを押す。
5. 内容変更近接通信が記録されることを確認する。
6. 試験用Cookieを設定し、再度編集して通信する。
7. Cookie検出状態を確認する。
8. Cookieを削除して再試験する。
9. `private-path`、query token、request-body marker、Cookie値がログにないことを確認する。

## 期待する通信ログ

```text
観測事実:
  内容変更操作と近接した通信開始を観測

操作証拠:
  ブラウザ通信APIの通知を観測

入力相関:
  内容変更操作から2.5秒以内の時間相関

Cookieヘッダー検出:
  検出 / 未検出 / 未観測 / 判定不能

本文観測:
  本文を要求していない
```

「未検出」はCookie不存在の保証ではない。

## 固定

```powershell
git add .
git commit -m "refactor: separate focus cues and content-edit network correlation"
git tag -a v0.4.1 -m "DSSI Core A Sprint 3.1 content-edit correlation refinement"
```
