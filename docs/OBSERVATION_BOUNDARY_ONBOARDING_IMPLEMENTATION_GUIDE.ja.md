# 観測境界の選択・確認・撤回｜導入フロー実装ガイド

> Status: Installer and Release Hardening acceptance patch  
> Sprint relation: Sprint 4ではない  
> Authoritative implementation: `src/`、`tests/`、`src/manifest/manifest.json`

## 1. 位置づけ

本改修は、既存機能仕様で「Silent Log and Modes」に予約されているSprint 4を開始するものではない。Sprint 3.5-Bで導入したConnectBits公開UIを、実機受入で見つかった権限境界と選択手続きの不整合に対して閉じる、v0.5系のインストーラー／リリース整備である。

Git上では、まず検証済みのv0.5インストーラー整備状態を基準コミットとして保存し、その次に本改修を独立コミットとして積む。これにより、移送元ZIPにGit履歴が含まれない場合でも、改修前後の差分を復元できる。

推奨コミット:

```text
chore(release): establish v0.5 installer-hardening baseline
feat(onboarding): make observation boundaries selectable and reversible
```

## 2. 発見された不整合

従来の`NETWORK_PERMISSION_REQUEST`は、任意の`webRequest`とHTTP/HTTPS originを一つのオブジェクトへ入れていた。一方、同じHTTP/HTTPS範囲は`content_scripts.matches`によりページ上の限定観測へ必要な範囲でもある。

このオブジェクトをそのまま`chrome.permissions.remove`へ渡すと、Chromeはcontent script側とも重なる範囲を解除しようとしたものとして`You cannot remove required permissions`を返した。この失敗により「通信観測権限なしで開始する」が完了しなかった。

初回改修では、この解除エラーを避けるため、要求側からもHTTP/HTTPS originと`optional_host_permissions`を削除した。しかしChromeの`webRequest`はAPI権限に加えて対象ホストへの権限を必要とする。このため通信観測が成立しなくなった。実機受入で発見したこの回帰を受け、付与と解除を別の権限オブジェクトへ分離した。

## 3. 権限境界

`NETWORK_METADATA_PERMISSION_REQUEST`は、通信観測を成立させる完全な付与要求である。

```ts
{
  permissions: ['webRequest'];
  origins: ['http://*/*', 'https://*/*'];
}
```

manifestには`optional_host_permissions`として同じHTTP/HTTPS範囲を宣言する。この範囲は`content_scripts.matches`とも重なるが、`webRequest`の通信観測には別途ホストアクセスが必要である。

一方、`NETWORK_METADATA_API_PERMISSION`は`webRequest`だけを含む。停止時はこのAPI権限だけを解除し、originを解除対象へ含めない。

通信メタデータ観測を外す操作は、次の順で閉じる。

1. 付与時は`webRequest`とHTTP/HTTPSホストアクセスの両方を要求し、完全な束が許可されたか確認する。
2. 解除時は任意の`webRequest`が現在許可されているか確認する。
3. 未許可なら解除APIを呼ばず、解除済みとして扱う。
4. 許可済みなら`webRequest`だけを解除する。
5. 解除失敗時は選択状態を保存せず、UIへ失敗を返す。

## 4. 三つの観測選択

| 選択                         | `settings.enabled` | `networkObservationEnabled` | 任意`webRequest` |
| ---------------------------- | -----------------: | --------------------------: | ---------------- |
| 標準設定で観測を開始         |             `true` |                      `true` | 要求・保持       |
| 通信メタデータを観測せず開始 |             `true` |                     `false` | 未要求・撤回     |
| 今は観測を開始しない         |            `false` |                     `false` | 未要求・撤回     |

初回の既定値は観測未開始である。説明確認前に、ページ上の限定観測を暗黙に開始しない。

通信メタデータ観測を外しても、ページ上の限定観測を選んでいる間はDOM観測が残る。これは、通信先やHTTP methodなど操作者から直接見えにくい背景通信と、操作者自身が関与し画面上で自覚できる入力開始、貼り付け、標準form送信操作などを同じ追加同意境界に置かないためである。入力本文そのものは取得しない。

## 5. 導入手続き

導入画面は次の順序を守る。

1. 目的、観測面、非観測面、保存、外部送信、判断限界を説明する。
2. 利用者が確認項目をチェックする。
3. 全項目の確認後にだけ三つの選択肢を表示する。
4. 選択に必要な任意権限だけを要求または撤回する。
5. 選択と確認状態をローカル保存する。

導入画面と「設定とプライバシー」は、次を明示する。

> いつでもこの選択は変更できます。

現在の観測状態はCoverage Manifestで、観測中、現在は観測していない、設計上観測しない、現在の仕組みでは観測できない、未知残差を分けて表示する。

## 6. 停止境界

休止選択は表示だけではない。

- Input observerは記録、相関パルス、MutationObserver走査を停止する。
- Submission observerはsubmit、click、Enterに由来する記録と表示を停止する。
- Service Workerは停止後に到着した観測レコードを保存しない。
- ネットワークlistenerが残っていても、設定が停止中なら通信メタデータを処理しない。
- ポップアップから全体を無効化した場合も`webRequest`を撤回し、再開時はDOM限定から始める。

## 7. 併修UI

- 「設置とプライバシー」を「設定とプライバシー」へ統一する。
- 簡易ログで通信methodを持たない観測に使っていた`◇`を`⋯`へ変更し、PUTのひし形と分離する。
- 通信パルスコンソールへ`↻`の時計回り移動ボタンを加える。
- hostname別表示設定の解除は`⌫`へ変更し、移動とリセットの記号を分ける。

チップとコンソールの自由ドラッグ、任意座標保存、画面外復帰は本改修へ含めない。八方向移動の実機確認後に別の表示操作として扱う。

## 8. 完了判定

- 新規導入直後、確認前には観測を開始しない。
- チェック完了前に三択が表示されない。
- 標準設定で`webRequest`を許可して開始できる。
- 権限要求を拒否しても選択状態を偽って保存しない。
- DOM限定で必須権限解除エラーが出ない。
- 休止でDOMと通信メタデータの両方が止まる。
- 後から標準、DOM限定、休止を相互に変更できる。
- `webRequest`撤回後もDOM限定観測は継続する。
- 再読み込み・ブラウザー再起動後も選択が一致する。
- Coverage Manifestと実権限が一致する。
- `⋯`がPUTのひし形として読まれない。
- 通信パルスコンソールの移動とhostname設定解除を別操作として識別できる。
