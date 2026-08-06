# ConnectBits

日本語 | [English](./README.md)

**ConnectBits** は、DSSI Core A系列で開発している、ブラウザー上の境界事象を利用者自身が確認するためのローカル観測インターフェースです。

> 隠れていた接続を、本人が判断できる断片として返す。

ConnectBitsは、入力面、標準フォーム送信境界、通信開始メタデータのうち、実装が観測できた事実と既知の観測限界を表示します。通信本文を収集せず、安全性・適法性・通信目的を判定せず、利用者本人の判断を代行しません。

開発系列名は **DSSI Core A**、現在の公開目標は **v0.5.0 Public Preview** です。

## 現在地点

Sprint 3.5-B「ConnectBits UI and Boundary Alignment」は完了しています。現在はインストーラー／リリース整備段階です。ここでいうインストーラーはOS常駐型の実行ファイルではなく、次の二層を指します。

1. 再現可能な拡張機能配布物を生成するパッケージ工程。
2. 初回起動時に、任意権限を付与する前の判断を支援する導入説明画面。

導入説明を確認したあと、標準設定、通信メタデータを観測しない設定、観測を開始しない休止状態の三つから選びます。いつでも「設定とプライバシー」でこの選択を変更でき、通信メタデータ観測を外すと任意の`webRequest`権限だけが撤回されます。

## 主な機能

- 入力欄の種類と一部のDOM境界事象を、内容を保存せずに分類
- 標準フォームの送信候補・submit成立・通信開始の区別
- 任意権限による、限定された通信開始メタデータ観測
- 観測済み・即時縮約・設計上の非観測・現状観測不能・未知残差を分けるCoverage Manifest
- 粘性レベルとMAX報告モードによる事実チップ／通信パルス表示
- セッション内の観測ログ、JSON／CSVエクスポート
- 保存済みJSONログをローカルで読み取るConnectBits Log Reader
- 日本語・英語UI

## 観測しないもの

ConnectBitsは、観測記録へ次を保存しません。

- 入力本文、パスワード、決済番号
- クリップボード本文
- プロンプト、コメント、メール、チャット、メッセージ本文
- request／response本文、Cookie値、raw header値
- URLのpath、query、fragment、認証情報

表示やログの欠落は、通信や危険の不存在を証明しません。ログは判断支援用の観察資料であり、証拠能力・完全性・網羅性を保証しません。

## Public Previewの導入

[日本語の導入・更新手順](./docs/release/INSTALL.ja.md)を参照してください。現在はChrome Web Storeではなく、配布ZIPを展開し、`chrome://extensions`から「パッケージ化されていない拡張機能」として読み込みます。

拡張機能を更新・再読み込みした後は、既に開いていた観測対象ページも再読み込みしてください。

## 開発と検証

要件:

- Node.js 20以上
- npm 10以上
- ChromeまたはChromium系ブラウザー

```bash
npm ci
npm run check
```

`npm run check` は、型検査、ESLint、Prettier、Vitest、esbuildを順に実行します。ビルド済み拡張機能は `dist/` に生成されます。

Chromeへ開発版を読み込む場合は、`chrome://extensions`でデベロッパーモードを有効にし、`dist/`を選択します。

## 文書

現行仕様、導入、開発資料、履歴の役割分担は[文書地図](./docs/README.md)にまとめています。観測・保存境界は[PRIVACY.md](./PRIVACY.md)と[データライフサイクル／パージ境界](./docs/DATA_LIFECYCLE_AND_PURGE_BOUNDARY.ja.md)を参照してください。

## ライセンス

GNU General Public License v3.0 or later。詳細は[LICENSE](./LICENSE)を参照してください。
