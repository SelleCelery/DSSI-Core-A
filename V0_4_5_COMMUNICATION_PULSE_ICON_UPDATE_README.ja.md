# DSSI Core A v0.4.5 通信パルスアイコン更新

## 目的

Sprint 3.3の小型通信パルスを、約4〜5mmの表示でも瞬時に読み分けやすい視覚文法へ変更する。

## 変更後の読み方

```text
外周形 = HTTP method
中央文字 = 通信方式
色 = 観測経路
右上記号 = Cookieヘッダー名の検出状態
左上短線 = 別オリジン
```

### method外周形

- GET: 円
- POST: 四角形
- PUT: ひし形
- PATCH: 六角形
- DELETE: 三角形
- HEAD: カプセル
- OPTIONS: 八角形
- CONNECT: 二重円
- TRACE: 縦長矩形
- DIALOG: 吹き出し外形
- UNKNOWN: 破線円

### 中央文字

- S: 標準form submit
- F: fetch/XHR
- B: Beacon/Ping

### 観測経路色

- 濃いマゼンタ: DOM観測
- 淡いシアン: webRequest観測

色は安全、危険、警告、注意を示さない。色が判別できない場合も、外周形と中央文字でmethodと通信方式を確認できる。

### Cookieヘッダー記号

- ●: 検出
- −: 未検出
- ·: 未観測
- ?: 判定不能

「未検出」はCookie不存在の保証ではない。

## 適用

```powershell
cd "C:\UserWorkspace\10_PUBLIC_GITHUB\DSSI\DSSI-Core-A"

Expand-Archive `
  "$HOME\Downloads\DSSI-Core-A-v0.4.5-update.zip" `
  -DestinationPath "." `
  -Force

npm.cmd run format
npm.cmd run check
```

Chrome側では、`chrome://extensions`でDSSI Core Aを再読み込みし、観測対象ページも再読み込みする。

## 変更しない境界

- request bodyは要求しない。
- Cookie値は参照、保存、表示しない。
- URL path、query、fragmentは保存しない。
- 通信の安全性、有害性、利用者意図、サーバー到達を判定しない。

## 生成環境での検証

変更したTypeScriptのstrict型検査、通信パルス対応表の実行検査を行った。生成環境の内部npmレジストリでは`yocto-queue@0.1.0`を取得できなかったため、正式な`npm ci`と`npm run check`全体は利用者環境で実行する。
