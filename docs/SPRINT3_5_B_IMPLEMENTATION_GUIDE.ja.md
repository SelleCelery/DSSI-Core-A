# Sprint 3.5-B｜ConnectBits UI and Boundary Alignment 実装ガイド

## 1. 目的

Sprint 3.5-Bは新しい観測能力を追加しない。DSSI Core Aとして成立した機能を、公開名ConnectBitsの軽量なUIへ再配置し、日本語・英語で同じ境界を説明し、初回導入時に権限付与前の判断を可能にする。

中心課題は次である。

- 表示密度を下げても、必要な説明へ戻れる。
- Cookie、通信本文、権限の表示を、実装より強い主張へしない。
- 設置とプライバシー、観測ログ、Log Reader、導入説明を相互接続する。
- 利用者の確認と、開発者が守るべき宣言を混同しない。
- 英語UIを後付け文字列置換ではなく、共通メッセージ層から提供する。

## 2. 実装範囲

### 2.1 公開名と国際化

- 画面上の製品名をConnectBitsへ統一する。
- DSSI Core Aは開発系列として表示する。
- `src/i18n/ui.ts`へ日本語・英語メッセージを集約する。
- `DssiSettings.uiLanguage`へ`auto / ja / en`を追加する。
- manifestはChrome `_locales`を使い、英語をdefault localeとする。

### 2.2 UI階層

- ポップアップは状態と主要導線へ軽量化する。
- optionsを「設置とプライバシー」として整理する。
- logsは簡易ストリームを中心にし、詳細表を高度な確認として残す。
- 「通信パルスの読み方」はクリックで開くdialogへ移す。
- Log Readerを日英表示に対応させる。

### 2.3 文言境界

- `not_requested`を「要求・取得していない」と表示する。
- Cookieはヘッダー存在状態と値非取得を明示する。
- 未検出を不存在の証明にしない。
- 権限許可と必要性・妥当性の判断を分離する。

### 2.4 導入説明

- 初回インストール時だけ`onboarding.html`を開く。
- 観測／非観測、頻度、保存、外部送信、将来変更、問い合わせ境界を分ける。
- 全項目確認後、通信観測権限あり／なしを本人が選ぶ。
- 未提示の将来用途への包括同意とは扱わない。
- 導入説明は後から再表示できる。

### 2.5 配布試作

- `scripts/prepare-release.mjs`でunpackedフォルダーを生成する。
- 必須ファイルを検査し、SHA-256一覧を作る。
- `scripts/package-release.ps1`でWindows上のZIPを生成する。
- 更新後に既存タブの再読み込みが必要であることを日英で説明する。

## 3. 非実装

- 新規観測API。
- Cookie保存領域の閲覧。
- Local Storage、IndexedDB、履歴、位置情報の観測。
- request/response payload取得。
- 危険度、適法性、追跡目的の自動判定。
- ログ編集、再保存、証拠化、署名。
- 自動更新インストーラーとChrome Web Store公開。

## 4. 主要変更ファイル

- `src/i18n/ui.ts`
- `src/_locales/ja/messages.json`
- `src/_locales/en/messages.json`
- `src/manifest/manifest.json`
- `src/onboarding/*`
- `src/popup/*`
- `src/options/*`
- `src/logs/*`
- `src/reader/*`
- `src/ui/base.css`
- `src/core/observation-presentation.ts`
- `src/core/communication-pulse.ts`
- `src/core/coverage-manifest.ts`
- `src/core/log-reader/observation-tips.ts`
- `scripts/build.mjs`
- `scripts/prepare-release.mjs`
- `scripts/package-release.ps1`

## 5. 受入条件

1. 日本語・英語をautoまたは明示選択できる。
2. manifestの名称と説明がブラウザーUI言語に応じて切り替わる。
3. ポップアップ、設置とプライバシー、観測ログ、Reader、導入説明を移動できる。
4. 通信パルスの読み方を簡易ストリーム付近から開ける。
5. 詳細表を残しつつ、簡易ストリームを中心にできる。
6. payloadを「要求・取得していない」と表示する。
7. Cookie値を取得したように見せない。
8. 初回導入で任意権限を本人操作によって選択できる。
9. 権限なしで開始できる。
10. 観測ログを外部送信しない旨を明示する。
11. Readerが原ファイルへ書き戻さない。
12. release ZIP生成手順が再現可能である。
13. 既存の観測・保存境界テストが通る。
14. 新しい言語選択・導入確認の純粋関数テストが通る。

## 6. 実装後の開発者作業

本Sprintの完了は、理念とコードの最終一致を自動的に保証しない。公開前に`BOUNDARY_ALIGNMENT_CHECKLIST.ja.md`を用い、開発者自身が観測入口から表示までコードを追跡する。
