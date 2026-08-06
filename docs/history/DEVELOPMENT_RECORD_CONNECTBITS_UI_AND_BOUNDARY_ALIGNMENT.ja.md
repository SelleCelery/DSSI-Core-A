# ConnectBits 開発記録｜UI and Boundary Alignment

## Sprint

Sprint 3.5-B｜ConnectBits UI and Boundary Alignment

## 位置づけ

v0.4.6までに成立したDSSI Core A本体とSprint 3.5-A Log Readerへ、新しい観測能力を追加せず、公開製品名、表示階層、日英UI、導入判断、配布経路を与えた。

## 中心判断

1. 公開名はConnectBits、DSSI Core Aは開発系列名とする。
2. 観測ログの簡易ストリームを通常の読解入口とし、詳細表は高度な確認として残す。
3. 技術説明は常時露出させず、必要な位置からdialogで参照できるようにする。
4. `not_requested`をYes／Noへ縮約せず、「通信本文を要求・取得していない」という設計境界として表示する。
5. Cookieは保存領域や値を調べたように見せず、request header上の存在状態として表示する。
6. 権限付与はAPIアクセス可能性であり、必要性・妥当性への包括同意とは扱わない。
7. 未提示の将来用途への包括同意を取得しない。
8. 問い合わせ入口を閉じず、個別調査・修正・期限付き対応を保証しないという資源境界を分離して示す。
9. Log Readerは原ファイルへ書き戻さず、一般的技術用途を個別サイトの目的として確定しない。
10. v0.5のインストーラーは、再現可能な配布ZIP生成と初回ローカル導入説明の二層で構成する。

## 追加した返路

- Setup & PrivacyからObservation Log、Log Reader、setup reviewへ移動できる。
- Observation LogからSetup & Privacy、Log Reader、setup reviewへ戻れる。
- Log Readerから現行ログと設定へ戻れる。
- 導入説明は初回だけでなく後から再表示できる。
- 任意権限を拒否した状態でもローカルDOM観測から開始できる。

## 非実装

- Cookie保存領域の閲覧
- Local Storage／IndexedDB／履歴／位置情報の観測
- request／response payloadの取得
- 危険度、違法性、追跡目的の自動判定
- ログ編集、再保存、証拠化、署名
- OSインストーラー、自動更新、ストア公開

## 公開前に残る作業

- 利用者環境の`npm.cmd run check`
- Chrome実画面での日英表示確認
- 主要サイトでのUI運用観察
- 理念・コード境界整合チェックリストの開発者確認
- Windows上の配布ZIP生成確認
- ConnectBits名称の最終確認
