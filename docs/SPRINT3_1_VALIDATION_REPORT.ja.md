# DSSI Core A Sprint 3.1 検証報告

## 対象

- version: 0.4.1
- schema: 8
- scope: focus policy, content-edit pulse refresh, Cookie header-name detection, page-observation timing

## この作成環境で確認したもの

### 型整合

ローカルに用意したChrome型定義と最小Vitest型スタブを使い、TypeScriptのソースとテストについて`tsc --noEmit`を実行した。

確認対象:

- `onBeforeSendHeaders`のイベント由来details型
- `requestHeaders`と`extraHeaders`のextra-info指定
- schema 8
- 新しいtrigger/correlation値
- Cookie検出状態
- page timing状態
- transient pulseの`observedAt`

### 静的設計確認

- focus handlerはObservationRecordを生成しない
- focus handlerはnetwork pulseを送らない
- trusted paste/inputは活動ログ重複判定より前にpulseを更新する
- Cookie検出関数は`header.name`だけを読む
- request body用extra-infoを指定していない
- URL縮約結果にpath/query/fragment/credentialsを返さない
- ObservationRecordは閉じたキーと値集合で検査される

### 純粋関数の実行確認

TypeScriptを一時的にCommonJSへ出力し、Node.jsのassertで次を実行確認した。

- Cookieヘッダー名の検出／未検出／判定不能
- Cookie value getterへアクセスしないこと
- 5秒境界
- 2.5秒境界
- focus除外
- pulseの閉じた形
- URLのhost縮約
- `recent_content_edit`の生成

### 単体テストとして追加・更新した事項

- Level別focus cue
- focusによるpulse不生成
- trusted paste/inputによるpulse更新
- pulse timestampの型検査
- 2500ms境界
- 5000ms page timing境界
- Cookieヘッダー名の大文字小文字非依存検出
- Cookie value getterへアクセスしないこと
- Cookie/page timingの不正値拒否
- 現行形式と旧形式の表示分離

## この環境で完走していないもの

この作成環境では依存パッケージの取得が完了せず、次の正式コマンド全体は完走していない。

```text
npm ci
npm run lint
npm run format:check
npm test
npm run build
npm run check
```

したがって、配布物はユーザー環境で必ず次を実行する必要がある。

```powershell
npm.cmd run format
npm.cmd run check
```

## 実ブラウザで確認すべき項目

1. focusだけでは通常ログが増えない
2. Level 3ではfocus chipが出る
3. Level 2ではpassword/payment/personal informationだけfocus chipが出る
4. 同じ自由記述欄で二回目以降の通常文字入力でも2.5秒窓が更新される
5. fetch/XHR GET/POSTが内容変更近接通信として記録される
6. Beacon/Pingが記録される
7. Cookie設定時の検出状態
8. Cookie削除時の未検出または判定不能状態
9. URL path/query/body marker/header valueがログへ出ない
10. ページ観測開始との時間関係が用途推定語を使わず表示される
11. 権限解除後に通信観測が停止する
12. iframe/document ID条件が既存動作を壊していない

## 合格条件

- `npm.cmd run check`が完走する
- 上記1〜10が期待どおりである
- 保存ログに入力本文、URL path/query、request body、request-header値がない
- 「未検出」をCookie不存在と表示しない
- 通信相関を入力内容送信または認証用途と断定しない
