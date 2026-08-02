# ConnectBits v0.5 UI文言・内部値対応表

## 原則

- 内部値は安定した閉じた識別子として保持する。
- UI文言は日本語・英語へ通約する。
- 表示文は内部値より強い事実を主張しない。
- 観測しなかった情報をYes／No判定のように表示しない。

## 主要対応

| 内部値／状態                                | 日本語表示                           | English display                         | 禁止する誤読                   |
| ------------------------------------------- | ------------------------------------ | --------------------------------------- | ------------------------------ |
| `networkPayloadObservation = not_requested` | 要求・取得していない                 | Not requested or collected              | 本文を読んでNoと判定した       |
| `cookieHeaderDetection = detected`          | 存在を検出（値は未取得）             | Presence detected; values not collected | Cookie内容を読んだ             |
| `cookieHeaderDetection = not_detected`      | 未検出（不存在の証明ではない）       | Not detected; not proof of absence      | Cookieは存在しない             |
| `no_correlated_user_operation`              | 相関可能な利用者操作を確認していない | No correlatable user action observed    | 利用者は何もしていない         |
| `cross_origin`                              | 別オリジン                           | Cross-origin                            | 第三者提供・追跡・危険         |
| `cuePresented = false`                      | 表示対象外                           | Not presentation eligible               | 通信がなかった                 |
| optional permission granted                 | 通信観測権限：許可済み               | Network-observation permission granted  | 処理の必要性・妥当性へ同意済み |
| `integrity.status = not_provided`           | 完全性保護なし                       | Integrity protection not provided       | 改変された／真正でないと確定   |

## パルス

- 外周形：HTTP method。
- 中央文字：S＝標準form、F＝fetch/XHR、B＝Beacon/Ping。
- 色：観測経路の選択色。危険度ではない。
- 右上記号：Cookieヘッダー存在状態。値ではない。
- 左上短線：別オリジン関係。

## 画面階層

- ポップアップ：現在状態と主要導線だけ。
- 設置とプライバシー：権限、観測境界、表示設定。
- 観測ログ：現在セッションの簡易ストリームを中心に照合。
- 詳細表：高度な確認として折り畳む。
- Log Reader：エクスポート済み原記録の読取専用照合。
- 導入説明：権限付与前の判断材料。
