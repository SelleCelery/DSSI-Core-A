# ConnectBits v0.5 開発者コード読解マップ

## 目的

ConnectBitsの最終責任者が、機能名ではなく、データが境界を通過する順序でコードを理解するための読解順を示す。

## 1. 公開権限と初期設定

1. `src/manifest/manifest.json`
2. `src/core/network-permission.ts`
3. `src/core/network-observation-policy.ts`
4. `src/core/models/settings.ts`
5. `src/storage/settings-store.ts`

確認する問い：

- ブラウザーへ何を要求するか。
- 何が必須で、何が任意か。
- 初期状態で通信観測は無効か。
- MAXが新しい権限を増やさないか。

## 2. 初回導入と利用者判断

1. `src/onboarding/onboarding.html`
2. `src/onboarding/onboarding.ts`
3. `src/storage/onboarding-store.ts`
4. `src/i18n/ui.ts`
5. `src/background/service-worker.ts` の `runtime.onInstalled`

確認する問い：

- 開発者の宣言と利用者の確認が分かれているか。
- 未提示の将来用途へ包括同意を取っていないか。
- 権限なしで開始できるか。
- 問い合わせ不能を利用者の同意で免責していないか。

## 3. DOM観測入口

1. `src/content/bootstrap.ts`
2. `src/content/input-surface-observer.ts`
3. `src/content/submission-observer.ts`
4. `src/content/surface-descriptor.ts`
5. `src/core/surface-classifier.ts`

確認する問い：

- どのDOMイベントを使うか。
- `event.isTrusted`がどこで使われるか。
- 分類用に参照した構造情報が、どこで破棄されるか。
- input valueやclipboard本文へ接触していないか。

## 4. 通信観測入口

1. `src/background/service-worker.ts`
2. `src/core/network-observation-policy.ts`
3. `src/core/cookie-header-detection.ts`
4. `src/core/network-analyzer.ts`
5. `src/core/page-observation-timing.ts`

確認する問い：

- Chrome callbackが一時的に提供する情報は何か。
- 完全URLとheadersをどの行で縮約するか。
- bodyを要求していないことをどこで保証するか。
- 通信通知をどのtab/frameへ返すか。

## 5. 相関

1. `src/core/input-activity-pulse.ts`
2. `src/core/user-action-pulse.ts`
3. `src/core/network-correlation.ts`
4. `src/background/service-worker.ts` の相関context

確認する問い：

- 一時パルスは何を含むか。
- 2.5秒／2秒の窓は何を意味し、何を意味しないか。
- documentId、tabId、frameIdで何を分離するか。
- 相関不能を目的推定へ変えていないか。

## 6. レコード生成とプライバシー境界

1. `src/core/models/observation.ts`
2. `src/core/observation-factory.ts`
3. `src/core/privacy-safe-logger.ts`
4. `src/storage/session-buffer.ts`
5. `src/storage/settings-snapshot-store.ts`

確認する問い：

- 許可されたフィールドの閉集合はどこか。
- 未知フィールド、nested payload、URLらしい値をどこで拒否するか。
- 保存直前までに何段階検査するか。
- 設定スナップショットが過去へ遡及適用されないか。

## 7. 表示

1. `src/core/observation-presentation.ts`
2. `src/core/communication-pulse.ts`
3. `src/ui/communication-pulse-icon.ts`
4. `src/ui/communication-pulse.ts`
5. `src/ui/fact-chip.ts`
6. `src/logs/logs.ts`

確認する問い：

- 内部値がどの日本語・英語へ変換されるか。
- 表示文が観測事実より強くなっていないか。
- Cookieとpayloadの境界が誤読されないか。
- パルス、文章チップ、粘性注意チップが分離されているか。

## 8. エクスポート

1. `src/core/log-export.ts`
2. `src/logs/logs.ts`
3. `src/core/coverage-manifest.ts`

確認する問い：

- 保存時に追加集約・目的分類・危険判定を行わないか。
- JSONとCSVの役割が分かれているか。
- context、coverage、use boundaryが入るか。
- 保存後に完全性・真正性を主張していないか。

## 9. Log Reader

1. `src/core/log-reader/export-parser.ts`
2. `src/core/log-reader/export-validator.ts`
3. `src/core/log-reader/reader-model.ts`
4. `src/core/log-reader/reader-query.ts`
5. `src/core/log-reader/reader-summary.ts`
6. `src/core/log-reader/observation-tips.ts`
7. `src/reader/reader.ts`

確認する問い：

- 原ファイルへ書き戻す経路がないか。
- 未知schemaを黙って補正しないか。
- 集計から原レコードへ戻れるか。
- 一般的技術用途を個別目的として表示しないか。

## 10. ビルド・配布

1. `scripts/build.mjs`
2. `scripts/prepare-release.mjs`
3. `scripts/package-release.ps1`
4. `src/_locales/*/messages.json`
5. `docs/release/INSTALL.*.md`

確認する問い：

- source、node_modules、テスト、作業ログが配布物へ混入しないか。
- manifestとpackageのversionが一致するか。
- onboarding、Reader、localesが配布物に入るか。
- 更新後のページ再読み込みが説明されているか。

## 推奨する実読解手順

各層で一つの具体的レコードを選び、入口から表示まで追跡する。

- paste
- password focus
- standard form submit
- content-edit-near network request
- uncorrelated MAX network request
- JSON export
- Reader reload

各追跡で「入力」「一時値」「縮約」「保存」「表示」「未観測」を表にする。コード理解の完了は、全行を暗記することではなく、変更時にどの責任層を触り、どのテストで境界を確認するか説明できる状態とする。
