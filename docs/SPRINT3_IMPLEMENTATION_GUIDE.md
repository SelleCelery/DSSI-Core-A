# Sprint 3 Implementation Guide

## Version

DSSI Core A 0.4.0

## Sprint objective

Sprint 3 adds two related boundaries:

1. A formal lifecycle for transient classification evidence, reduced metadata, and persistent records.
2. Optional browser-level observation of fetch/XHR and Beacon/Ping request starts near recent input activity.

It does not inspect request payloads and does not claim that input content was sent.

## Architecture

```text
DOM input event
  ↓
privacy-safe input activity pulse
  ↓ same tab/frame, 2500ms window
Chrome webRequest onBeforeRequest
  ↓
raw URL is reduced immediately
  ↓
method + scheme + host + origin relation + mechanism
  ↓
closed-schema ObservationRecord
  ↓
chrome.storage.session
```

## Permission model

Base permissions:

```json
["storage"]
```

Optional permissions:

```json
["webRequest"]
```

Optional host permissions:

```json
["http://*/*", "https://*/*"]
```

The options page requests the optional capability only when the user enables communication-metadata observation. Removing the setting removes the permission.

## Observed network classes

- `xmlhttprequest`: represented as `fetch_or_xhr`
- `ping`: represented as `beacon_or_ping`

DSSI cannot distinguish fetch from XHR through this resource-type label alone.

## Data boundary

The `webRequest` callback receives a request URL as transient API input. `network-analyzer.ts` returns only:

- normalized method
- destination relation
- destination scheme
- destination host
- mechanism
- recent-input correlation label
- `payloadObservation: not_requested`

It does not return path, query, fragment, credentials, headers, or body.

## Correlation

An `InputActivityPulse` is emitted after an observed input-surface event only when network observation is enabled. It contains classification metadata but no input value or raw DOM labels.

A request is recorded only when:

- optional permission is present
- the setting is enabled
- request type is supported
- tab and frame identifiers are available
- an input pulse exists in the same tab/frame
- the pulse is no more than 2500ms old

Repeated equivalent network records are suppressed for 1200ms using tab, frame, host, method, and mechanism.

## Privacy boundary enforcement

Observation records are checked:

1. before a Content Script runtime message
2. after Service Worker receipt/enrichment
3. before session storage persistence

The record validator uses a closed key-and-value allowlist. Unknown keys, nested objects, unexpected arrays, host strings containing URL path/query/credentials, and any payload state other than `not_requested` are rejected.

## UI

The options page exposes an opt-in checkbox for communication metadata observation.

The activity log adds:

- boundary source
- network mechanism
- input correlation
- payload observation state

A factual chip may state that a communication start was observed near input activity. It also states that payload relation and causality are not confirmed.

## Manual test

1. Build and reload the extension.
2. Open the options page.
3. Enable communication metadata observation and accept the browser permission prompt.
4. Open the fixture page through HTTP/HTTPS rather than `file://`.
5. Focus or type in an input surface.
6. Within 2.5 seconds, activate the Sprint 3 custom fetch test button.
7. Open the activity log.

Expected record:

```text
観測事実: 入力操作と近接した通信開始を観測
操作証拠: ブラウザ通信APIから観測
観測範囲: 通信開始メタデータのみ
method: POST
通信機構: fetch / XHR分類
入力相関: 同一tab / frame / document（document ID取得時）で直近の入力操作
payload: 未要求
```

The test URL contains a private path and query token, but neither should appear in the log. Only the host may remain.

## Automated tests

- `network-analyzer.test.ts`: URL reduction and method/mechanism classification
- `network-correlation.test.ts`: 2500ms correlation and 1200ms dedupe boundaries
- `network-observation-policy.test.ts`: no body/header request options
- `privacy-safe-logger.test.ts`: closed-schema and URL/payload rejection
- `observation-presentation.test.ts`: Japanese labels and boundary source

## Known limits

- No payload inspection
- No response or server-receipt confirmation
- No WebSocket message observation
- No guarantee that communication contains input content
- No log for requests outside the 2500ms window
- No complete coverage of browser-internal or Service Worker traffic
- No blocking
- No legal or safety conclusion

## Sprint 3 acceptance

Sprint 3 is accepted when:

- optional permission can be granted and removed
- correlated request-start metadata appears in the activity log
- request body and headers are not requested
- URL path/query/fragment do not appear in stored records
- disabling the setting stops input pulses and listener operation
- all local checks pass in the maintainer environment
