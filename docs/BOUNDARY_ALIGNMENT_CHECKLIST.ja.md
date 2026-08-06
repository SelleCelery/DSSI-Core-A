# ConnectBits 理念・コード境界整合チェックリスト

> Version scope: v0.5 Public Preview

## 目的

本書は、ConnectBitsが公開文書で宣言する観測境界と、実装コードが実際に取得・縮約・保存・表示する情報を照合するための開発者用チェックリストである。

最終責任者は、各項目について「宣言」「実装入口」「縮約」「保存」「表示」「残存リスク」を説明できる状態を目標とする。

## A. 権限

| 確認項目                                   | 宣言                                      | 実装箇所                                                                                             | 確認方法               | 状態       |
| ------------------------------------------ | ----------------------------------------- | ---------------------------------------------------------------------------------------------------- | ---------------------- | ---------- |
| 通常権限は`storage`のみ                    | 必須権限を最小化する                      | `src/manifest/manifest.json`                                                                         | manifest確認           | 要最終確認 |
| `webRequest`とHTTP/HTTPS host accessは任意 | 通信観測を選ばない経路を残す              | manifest、`src/core/network-permission.ts`、`src/onboarding/onboarding.ts`、`src/options/options.ts` | 初回導入と後変更を確認 | 要最終確認 |
| 権限許可を妥当性確認と表示しない           | APIアクセス可能性と行為の妥当性を分離する | `src/i18n/ui.ts`、options/onboarding                                                                 | 日本語・英語表示確認   | 要最終確認 |

## B. 入力情報

| 確認項目                            | 実装入口                                | 保存境界                                                             | 確認観点                                                          |
| ----------------------------------- | --------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 入力本文をログへ入れない            | `src/content/input-surface-observer.ts` | `src/core/observation-factory.ts`、`src/core/privacy-safe-logger.ts` | `value`、`textContent`、clipboard本文がレコードへ接続されないこと |
| パスワード・決済番号を取得しない    | input observer / surface descriptor     | privacy-safe logger                                                  | 分類に必要な構造情報と本文を分離していること                      |
| pasteはイベントと反映だけを観測する | input observer                          | observation model                                                    | clipboard内容を参照・保存しないこと                               |
| unknown surfaceの保存構造を閉じる   | `src/content/surface-descriptor.ts`     | privacy-safe logger                                                  | tag/type/role/contenteditable/autocomplete以外が残らないこと      |

## C. 通信情報

| 確認項目                         | 実装入口                                                                     | 縮約                                                   | 保存・表示                                                                        |
| -------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------- |
| request bodyを要求しない         | `src/background/service-worker.ts`、`src/core/network-observation-policy.ts` | requestBody extraInfoSpecを使わない                    | `networkPayloadObservation = not_requested`のみ                                   |
| 完全URLを保存しない              | webRequest callback                                                          | `src/core/network-analyzer.ts`                         | scheme、host、method、relationへ縮約し、path/query/fragment/credentialsを残さない |
| request headers全体を保存しない  | onBeforeSendHeaders                                                          | `src/core/cookie-header-detection.ts`                  | Cookieヘッダーの存在状態だけを閉じた列挙値へ変換する                              |
| Cookie値を取得・表示・保存しない | cookie detection                                                             | `detected / not_detected / not_observed / unavailable` | UIでは「存在を検出（値は未取得）」と表示する                                      |
| 未検出を不存在と扱わない         | presentation                                                                 | observation-presentation / pulse guide                 | 日本語・英語双方で明記する                                                        |
| response bodyを取得しない        | 観測API                                                                      | 接続経路なし                                           | Coverage ManifestとPrivacy文書に明記する                                          |

## D. 相関と推論

| 確認項目                             | 実装                                      | 表示境界                                             |
| ------------------------------------ | ----------------------------------------- | ---------------------------------------------------- |
| 時間相関を因果と扱わない             | `src/core/network-correlation.ts`         | `src/core/observation-presentation.ts`、技術チップス |
| 無相関を無操作と扱わない             | `no_correlated_user_operation`            | 「相関可能な利用者操作を確認していない」             |
| 一般的用途を個別目的と扱わない       | `src/core/log-reader/observation-tips.ts` | 責任返送文を各チップスへ含める                       |
| 同一／別オリジンを善悪判定に変えない | network analyzer                          | 色・ラベルは関係表示のみ                             |

## E. 保存

| 確認項目                           | 保存先                       | 消去条件                     | 確認観点                                  |
| ---------------------------------- | ---------------------------- | ---------------------------- | ----------------------------------------- |
| セッションログ                     | `chrome.storage.session`     | ブラウザー再起動・明示消去等 | 永続履歴と誤表示しない                    |
| 全体設定・hostname表示プロファイル | `chrome.storage.local`       | 明示リセット・拡張削除       | 安全／信頼評価を保存しない                |
| 初回観測registry                   | local                        | 実装仕様に従う               | hostnameと時刻以外を増やさない            |
| エクスポート                       | 利用者が選ぶダウンロード領域 | 利用者管理                   | 保存後はConnectBitsの管理境界外と明記する |
| Reader                             | メモリ内表示                 | タブ終了                     | 原ファイルへ書戻さず、自動保存しない      |

## F. 外部送信

- ConnectBits管理サーバーへの送信コードがないこと。
- telemetry、analytics、remote logging、外部API、CDN依存がないこと。
- Readerが外部URLを受け付けず、選択したローカルJSONだけを読むこと。
- CSPまたはmanifest構造上、意図しない外部スクリプトを読み込まないこと。
- README、Privacy、導入説明の「外部送信しない」と一致すること。

## G. UI

- 「通信本文」はYes／Noではなく「要求・取得していない」と表示する。
- 「Cookie」は値や保存領域を調べたように見せず、「Cookieヘッダーの存在状態」と表示する。
- 色は安全、危険、警告、注意の判定を表さない。
- 粘性注意チップは通信表示の一時抑制から独立する。
- 権限許可と妥当性判断を別文として表示する。
- 詳細表、簡易ストリーム、Readerの同一内部値に矛盾する表示を与えない。

## H. 公開前の完了判定

各項目を次で記録する。

- `Confirmed`：コード、テスト、手動確認が一致。
- `Partially confirmed`：一部は確認済みだが残存経路あり。
- `Not confirmed`：未読または未検証。
- `Mismatch`：文書と実装が不一致。公開前に修正が必要。
- `Deferred with disclosure`：制約を公開し、後続へ送る。

本チェックリストは免責ではなく、開発者が観測権限を自己監査するための作業記録である。
