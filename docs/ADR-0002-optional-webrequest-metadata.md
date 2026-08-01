# ADR-0002: Optional `webRequest` Metadata Observation

- Status: Accepted for Sprint 3 development baseline
- Version: 0.4.1

## Context

DSSI needs to distinguish a declared HTML form boundary from actual browser-observed network activity without reading input content or request payloads.

A page-world hook for `fetch` and `XMLHttpRequest` would require modifying or wrapping page execution APIs. It would also be bypassable, sensitive to page implementation details, and difficult to describe as a browser-level observation.

Chrome Manifest V3 provides non-blocking `webRequest` observation. The capability requires the `webRequest` permission and matching host permissions.

## Decision

Use optional `webRequest` and optional HTTP/HTTPS host permissions.

Register a non-blocking `onBeforeSendHeaders` listener only after permission is granted. Observe only the following resource classes in Sprint 3:

- `xmlhttprequest` — covers fetch/XHR request classification at the Chrome API level
- `ping` — covers Beacon/Ping request classification

The listener requests `requestHeaders` and `extraHeaders` only so DSSI can detect whether Chrome exposes a request header whose name is `Cookie`. It does not request request-body access. DSSI code does not access, copy, classify, log, display, or persist header values, although Chrome may place values in the callback object before DSSI receives it.

The browser callback temporarily exposes the full request URL. DSSI immediately reduces it to:

- method
- scheme
- host
- same-origin / cross-origin / unknown relation
- resource-class-derived mechanism

Path, query, fragment, credentials, request body, and request-header values do not enter the persisted record. Only the closed Cookie-header detection state may be retained.

Only requests within 2500ms of a trusted content-edit pulse in the same tab and frame are logged. Focus does not create a pulse. This is a time correlation, not a payload or causal proof.

## Consequences

### Positive

- Page JavaScript is not monkeypatched.
- Network observation is opt-in.
- Base installation keeps only the storage permission.
- Request bodies are not requested. Request-header values are not used or persisted by DSSI logic.
- Observation terminology can distinguish DOM events from browser network API events.

### Limitations

- `xmlhttprequest` does not distinguish fetch from XHR.
- No request payload relation is known.
- No response body or server receipt is observed.
- WebSocket messages after connection establishment are not observed.
- Requests outside the correlation window are not logged as content-edit-near activity.
- Service Worker or extension-originated requests may not correlate to a page frame and are excluded.
- Absence of a record does not prove absence of communication.
- A broad optional host permission remains a trust and distribution concern.
- `not_detected` means only that the `Cookie` header name was absent from the header collection Chrome exposed; it does not prove Cookie absence.
- `extraHeaders` increases the sensitivity and potential performance cost of the optional capability and must be reviewed before distribution.
- Page-observation timing is recorded only as a neutral elapsed-time category and does not classify authentication or initialization purpose.

## Rejected alternative

### Page-world API wrapping

Rejected for the Sprint 3 baseline because it would alter the page execution environment, create additional compatibility and tamper boundaries, and still not provide complete observation.

## Review trigger

Revisit this decision before Chrome Web Store distribution, before adding site-specific permission selection, or before observing additional resource types.
