# ConnectBits Documentation Map

> Status: Public Preview preparation
> Current boundary: installer and release hardening
> Development lineage: DSSI Core A

この索引は、現行仕様と履歴資料を混同せず、必要な説明へ戻れる返路を維持するための文書地図である。日本語文書がある場合は日本語を正本として扱い、英語文書は公開インターフェースまたは通約として位置づける。

## まず読む文書

| 役割               | 文書                                                                                                 | 状態             |
| ------------------ | ---------------------------------------------------------------------------------------------------- | ---------------- |
| 製品概要           | [日本語README](../README.ja.md) / [English README](../README.md)                                     | 現行             |
| 導入               | [日本語の導入・更新手順](./release/INSTALL.ja.md) / [English install guide](./release/INSTALL.en.md) | 現行             |
| インストーラー境界 | [インストーラー試作仕様](./release/INSTALLER_PROTOTYPE.ja.md)                                        | 実装・受入確認中 |
| 公開工程           | [Public Preview 公開チェックリスト](./release/PUBLICATION_CHECKLIST.ja.md)                           | 受入確認待ち     |
| プライバシー       | [Privacy Notice](../PRIVACY.md)                                                                      | 現行             |
| セキュリティ       | [Security Policy](../SECURITY.md)                                                                    | 現行             |
| 開発予定           | [Development Roadmap](./DEVELOPMENT_ROADMAP.md)                                                      | 現行             |

## 現行の設計・運用文書

| 役割       | 文書                                                                                                  |
| ---------- | ----------------------------------------------------------------------------------------------------- |
| 設計原則   | [DSSI Core A設計原則](./DSSI_Core_A_Architectural_Design_Principles.ja.md)                            |
| 運用語彙   | [DSSI Core A運用用語集](./DSSI_Core_A_Operational_Glossary.ja.md)                                     |
| データ境界 | [データライフサイクルとパージ境界](./DATA_LIFECYCLE_AND_PURGE_BOUNDARY.ja.md)                         |
| 権限方針   | [Permission Strategy](./PERMISSION_STRATEGY.md)                                                       |
| 公開前検査 | [理念・コード境界整合チェックリスト](./BOUNDARY_ALIGNMENT_CHECKLIST.ja.md)                            |
| コード読解 | [開発者コード読解マップ](./DEVELOPER_CODE_READING_MAP.ja.md)                                          |
| UI語彙     | [UI文言・内部値対応表](./UI_MESSAGE_MAP.ja.md)                                                        |
| UI観察     | [UI運用観察票](./UI_OBSERVATION_BACKLOG.ja.md)                                                        |
| 導入境界   | [観測境界の選択・確認・撤回 実装ガイド](./OBSERVATION_BOUNDARY_ONBOARDING_IMPLEMENTATION_GUIDE.ja.md) |
| 導入検証   | [観測境界導入フロー検証報告](./OBSERVATION_BOUNDARY_ONBOARDING_VALIDATION_REPORT.ja.md)               |

## 製品仕様

`product/` は要求定義・機能仕様を保持する。実装より先行する記述があり得るため、現行動作の判定ではソース、テスト、検証報告と照合する。

- [DSSI Core A Requirements Definition](./product/DSSI_Core_A_Requirements_Definition.md)
- [DSSI Core A Functional Specification](./product/DSSI_Core_A_Functional_Specification.md)
- [ConnectBits Log Reader 要件定義](./product/ConnectBits_Log_Reader_Requirements_Definition.ja.md)
- [ConnectBits Log Reader 機能仕様](./product/ConnectBits_Log_Reader_Functional_Specification.ja.md)

## 実装・検証履歴

`SPRINT*_IMPLEMENTATION_GUIDE` と `SPRINT*_VALIDATION_REPORT` は、その時点の判断と検証条件を保存する履歴資料である。現在の公開境界を単独で定義する正本ではない。現行状態はRoadmap、README、Privacy、Security、最新ソースとテストから確認する。

Sprint 3.5-AはLog Reader、Sprint 3.5-BはConnectBits公開UI・日英表示・導入説明・境界整合を扱う。

## 研究文書

`research/` はDSSIの研究上の生成過程を保持する。製品の具体的保証や観測能力を直接定める文書ではない。

## 更新原則

- 文書ファイル名へ版番号を埋め込まない。対象版は本文メタデータ、CHANGELOG、Git tag、Releaseへ置く。
- 現行仕様、検証履歴、研究ノートを同じ権威として扱わない。
- 観測事実、技術的一般論、運営者のみが説明できる目的を分離する。
- 可視化と意味決定、ログと証拠、権限許可と必要性・妥当性を同一視しない。
