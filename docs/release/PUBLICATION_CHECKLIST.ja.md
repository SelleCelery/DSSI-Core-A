# ConnectBits Public Preview 公開チェックリスト

更新日: 2026-08-27

## 推奨する公開順序

現行の配布方式は、Chrome Web Storeから通常インストールする製品版ではなく、利用者がZIPを展開し、デベロッパーモードで「パッケージ化されていない拡張機能」を読み込む公開プレビューである。

公開は次の二段階に分ける。

1. **GitHub Public Preview**
   - ソース、再現可能な配布ZIP、SHA-256、既知の制約を公開する。
   - GitHub Releaseでは`Pre-release`として扱う。
   - 「一般向けのワンクリックインストールではない」「信頼できるコードを自分で確認して読み込む試験配布」であることを明記する。
2. **Chrome Web Store Unlisted／Private Beta**
   - 一般利用者が通常の拡張機能として導入できる状態を目指す場合に進む。
   - ストア審査、プライバシー申告、権限理由、掲載素材、テスト手順を別途整える。

Chrome公式は、unpacked読み込みを開発中の信頼できるコード向けと位置づけ、一般配布の公式経路をChrome Web Storeまたは管理対象環境に限定している。

- https://developer.chrome.com/docs/extensions/how-to/distribute
- https://developer.chrome.com/docs/webstore/publish/

## A. GitHub Public Previewの公開阻害項目

### A-1. 実機で初回導線を受入確認する

- [ ] WindowsのChromeで、未導入状態から配布フォルダーを読み込む。
- [ ] 初期設定が休止状態のまま、`video-tutorial.html`だけが自動的に開く。
- [ ] チュートリアル途中でタブを閉じ、ポップアップの「使い方チュートリアル／続きを見る」から同じ場面へ戻れる。
- [ ] 設定画面からも同じ再開導線を開ける。
- [ ] タブを閉じたあと、ConnectBitsが自動的に追跡表示しない。
- [ ] 最終場面の「観測方法を選ぶ」で既存の権限・観測方法説明へ移る。
- [ ] 標準、通信メタデータなし、休止の三経路がいずれも完了できる。
- [ ] 任意権限のChrome確認は、利用者が標準設定を選んだ直接操作からだけ表示される。
- [ ] 拡張機能の再読み込み／更新ではチュートリアルが自動再表示されない。
- [ ] 完了後にチュートリアルを開き直すと最初から始まる。

### A-2. チュートリアル表示を実機確認する

- [ ] 28場面を最初から最後まで通し、文章の欠落、重なり、スクロール不能、動画再生失敗がない。
- [ ] 100%、125%、150%表示で、次へ／戻る／最初からの操作が画面外へ消えない。
- [ ] 画面幅が狭い場合にも、舞台と説明が読める。
- [ ] 検索・パスワード・決済のチップが入力欄直下に出て、画面下端では上側へ退避する。
- [ ] 本体のチップ、通信パルス、簡易ログとチュートリアルの表示が一致する。
- [ ] `prefers-reduced-motion`有効時にも内容を確認できる。
- [ ] キーボードだけで全場面を進み、戻り、最終設定へ移れる。

### A-3. 実サイト受入確認を終える

- [ ] ショッピング相当ページで、検索欄の分類、内容変更に近い通信、標準form送信境界、送信後通信を確認する。
- [ ] 動画ページで、ページ接続時、再生開始時、安定再生中、一時停止後のパルス分布を実測する。
- [ ] チュートリアルの本数を実測の正解として読ませず、「この架空例」の表示に留めていることを再確認する。
- [ ] 読み物ページで、標準レベル2のパスワード／決済チップと、MAXの自由記述チップを確認する。
- [ ] 通信本文、入力本文、Cookie値、URLのpath／query／fragmentがログとエクスポートへ入らないことを再確認する。

### A-4. 言語境界を確認する

- [x] 28場面、三つの架空サイト、入力面チップ、通信パルス、簡易ログを日本語・英語で切り替える。
- [x] 保存済みの表示言語が日本語／Englishなら、その指定をブラウザー言語より優先する。
- [x] 表示言語が「ブラウザーに合わせる」の場合だけ、ChromeのUI言語を参照する。
- [ ] 日本語設定、English設定、`auto`＋日本語Chrome、`auto`＋英語Chromeの四条件を実機で通す。
- [ ] 言語設定を変更してチュートリアルを開き直したとき、同じ保存場面を新しい表示言語で再開できることを確認する。

言語の選択は表示だけを変え、保存済みの場面位置、観測値、プライバシー境界は変えない。

### A-5. リリース番号と公開宣言を確定する

- [ ] GitHubに正式な`v0.5.0`がまだない場合は、今回を`v0.5.0 Public Preview`とする。
- [ ] すでに同番号を第三者へ配布・タグ付けしている場合は、内容を上書きせず次の版へ上げる。
- [ ] `package.json`、`src/manifest/manifest.json`、README、導入手順、CHANGELOG、リリースノートの番号を一致させる。
- [ ] `CHANGELOG.md`の`Unreleased`項目を対象版へ移す。
- [ ] Public Previewが保証しないものをリリースノートへ残す。

### A-6. プライバシー・権限説明を最終照合する

- [ ] `PRIVACY.md`と実装の`chrome.storage.local`／`chrome.storage.session`項目を一対一で照合する。
- [ ] チュートリアル状態として保存する版、提示時刻、場面位置、完了時刻を明記する。
- [ ] 全HTTP/HTTPSページに入るcontent scriptの必要性を、短い単一目的とともに説明できるようにする。
- [ ] `webRequest`とoptional host permissionsの必要性、付与時点、撤回範囲を説明できるようにする。
- [ ] 「通信本文を観測対象としていない」がConnectBits側の境界であり、サイト側の非送信を意味しないことをUI・README・Privacyで揃える。
- [ ] `SECURITY.md`に、機微情報を含めずに脆弱性を報告できる実際の連絡経路を加えるか、GitHub Private Vulnerability Reportingを有効にする。

### A-7. 配布物と素材の権利を確定する

- [ ] `assets/tutorial/tutorial-motion-comic.mp4`の作成由来、利用許諾、公開可否を記録する。
- [ ] アイコン、動画、フォント、外部由来コードについて、必要なクレジットまたはライセンスを確認する。
- [ ] チュートリアル内の架空サイト名・ホスト名・商品名が実在サービスとの誤認を招かないか確認する。
- [ ] 配布ZIPにsource map、`node_modules`、テスト、ローカルログ、作業用ファイルが含まれない。

## B. コードと配布の再現確認

### 現在の作業コピーで確認済み

- [x] `npm run typecheck`
- [x] `npm run lint`
- [x] `npm run format:check`
- [x] Vitest 43ファイル・196テスト
- [x] esbuildによる全バンドル生成
- [x] `npm run prepare:release`
- [x] チュートリアルHTML、CSS、JavaScript、動画素材を配布必須ファイルとして検査
- [x] 配布フォルダー内のSHA-256一覧生成
- [x] runtime dependency audit: 0件（`npm audit --omit=dev`）

### 公開候補コミットで再実行する

- [ ] 新しい作業フォルダーへcloneし、`npm ci`から`npm run check`まで通す。
- [ ] Windows PowerShellで`npm.cmd run package:release:windows`を実行する。
- [ ] `ConnectBits-v<version>.zip`と`ConnectBits-v<version>.zip.sha256.txt`を生成する。
- [ ] ZIPを別フォルダーへ展開し、そこからChromeへ読み込む。
- [ ] ZIPハッシュと展開フォルダーの`SHA256SUMS.txt`を照合する。
- [ ] full development dependency auditを再実行し、結果を`SECURITY.md`の記載と一致させる。
- [ ] 公開候補コミットに秘密鍵、token、個人ログ、エクスポート済み観測ログ、ローカルパスがないことを確認する。

## C. GitHub公開面

- [ ] `README.md`と`README.ja.md`の初回導線をチュートリアル込みにする。
- [ ] `docs/release/INSTALL.ja.md`と`INSTALL.en.md`の実手順をWindows実機で再現する。
- [ ] `CITATION.cff`を追加し、作者名、タイトル、版、ライセンス、リポジトリURLを確定する。
- [ ] `RELEASE_NOTES.md`またはGitHub Release本文を日英で用意する。
- [ ] GitHub Actionsで`npm ci`と`npm run check`を実行するCIを追加する。
- [ ] GitHub Issuesを受け付ける範囲、機微情報を投稿しない注意、セキュリティ報告先を明示する。
- [ ] リポジトリのAbout欄に短い説明、ライセンス、主要トピックを設定する。
- [ ] `main`の公開候補コミットを確定し、署名対象と配布対象の対応を記録する。
- [ ] `v<version>`タグを作成する。
- [ ] GitHub ReleaseをまずDraftで作り、ZIP、ZIPのSHA-256、日英リリースノートを添付する。
- [ ] `Pre-release`を選び、配布ZIPがunpacked開発者モード用であることを冒頭に書く。

GitHub Releaseの公式手順:

- https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository

## D. Chrome Web Storeへ進む場合

GitHub Public Previewだけならこの節は後回しにできる。Windows／macOSの一般利用者に通常インストールさせる場合は後回しにできない。

- [ ] Chrome Web Store developer accountと2段階認証を準備する。
- [ ] 単一目的を一文で記述する。
- [ ] `storage`、全HTTP/HTTPSページへのcontent script、任意`webRequest`、任意host permissionsを個別に正当化する。
- [ ] remote codeを実行しないことを確認・申告する。
- [ ] 収集・保存するデータ種別とLimited Useを正確に申告する。
- [ ] 安定したHTTPS URLでプライバシーポリシーを公開する。
- [ ] ストア説明、スクリーンショット、アイコン、必要な掲載画像、サポートURLを用意する。
- [ ] レビュアーがチュートリアル、三つの観測方法、パルス、ログ、削除を再現できるテスト手順を書く。
- [ ] まずPrivateまたはUnlisted betaとして審査し、少人数で受入確認する。
- [ ] 自動公開を外して審査を先に通す場合、承認後の公開期限を管理する。

Chrome公式の審査・申告資料:

- https://developer.chrome.com/docs/webstore/cws-dashboard-privacy/
- https://developer.chrome.com/docs/webstore/program-policies
- https://developer.chrome.com/docs/webstore/publish/

## E. GitHub Release後の研究・アーカイブ導線

- [ ] GitHub Releaseのタグ、リリース本文、配布ZIP、SHA-256を最終確認する。
- [ ] Zenodoへ対象版を保存し、版DOIとconcept DOIを確認する。
- [ ] README、`CITATION.cff`、GitHub ReleaseへDOIを反映する。
- [ ] ORCID Worksへ登録する場合、ソフトウェア成果としての種別、引用、DOIを揃える。
- [ ] Scientific-Ontology側のDSSI研究ノートから、実装版リポジトリ、GitHub Release、DOIへ導線を貼る。
- [ ] DSSI側からScientific-Ontologyへは、実装が依拠する理論的背景として戻る導線を貼る。
- [ ] SO側の文書が「アプリケーションとして成立した」と述べる範囲を、Public Previewの保証範囲より広くしない。

## 今回の公開判断

最短で安全な順序は次である。

1. チュートリアル統合パッチをWindowsのローカルリポジトリへ適用する。
2. A-1からA-4までを実機確認し、特に言語境界を決める。
3. 版番号、Privacy、Security、素材権利を確定する。
4. clean cloneから配布ZIPを再生成する。
5. GitHubでDraft Releaseを作り、`Pre-release`として公開する。
6. GitHub版が安定してからZenodo／ORCID／Scientific-Ontologyの導線を閉じる。
7. 一般利用者向けインストールが必要になった段階でChrome Web StoreのUnlisted betaへ進む。
