# DSSI Core A v0.4.0 TypeScript型修正

対象: `src/background/service-worker.ts`

## 原因

- `@types/chrome` 0.2.2 には `chrome.webRequest.WebRequestBodyDetails` という公開型がない。
- `onBeforeRequest.addListener` のコールバック型は、現在の型定義上 `BlockingResponse | undefined` を返す形になっており、明示的な `(): void` と一致しない。

## 修正

イベント定義そのものから、リスナー型とdetails型を抽出する。

```ts
type OnBeforeRequestListener = Parameters<typeof chrome.webRequest.onBeforeRequest.addListener>[0];

type OnBeforeRequestDetails = Parameters<OnBeforeRequestListener>[0];
```

リスナーは `undefined` を明示的に返す。

```ts
const networkRequestListener: OnBeforeRequestListener = (details) => {
  void handleNetworkRequest(details);
  return undefined;
};
```

## 適用後

```powershell
npm.cmd run format
npm.cmd run check
```
