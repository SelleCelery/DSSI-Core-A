# DSSI Core A v0.4.5 通信パルスアイコン検証報告

## 静的検証

- TypeScript strict型検査
- ESLint
- Prettier
- Vitest
- production build

## 自動試験対象

- methodから外周形への閉じた対応
- 通信方式から中央文字S/F/Bへの対応
- DOMとwebRequestの観測経路分類
- Cookieヘッダー状態から●/−/·/?への対応
- 本文未観測を保持したdescriptor縮約

## 実ブラウザ受入項目

1. GETが円、POSTが四角形として表示される。
2. PUT、PATCH、DELETEがそれぞれひし形、六角形、三角形として区別できる。
3. 標準formは中央S、fetch/XHRはF、Beacon/PingはBになる。
4. DOM観測は濃いマゼンタ、webRequest観測は淡いシアンになる。
5. 色だけでなく外形と中央文字でも意味が残る。
6. Cookieヘッダー検出は●、未検出は−、未観測は·、判定不能は?になる。
7. 別オリジンでは左上短線が残る。
8. 通信パルスと簡易ログで同じ視覚文法を使う。
9. 本文、Cookie値、URL path/queryは表示されない。
10. 色は安全、危険、注意、警告を意味しない。
