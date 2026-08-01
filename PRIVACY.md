# DSSI Core A Privacy Baseline

> Status: Development baseline, not yet the final Chrome Web Store privacy policy.

DSSI Core A exists to strengthen user judgment. It must not become a new surveillance layer.

## Initial data handling

The Sprint 0 build processes and stores only what is required to operate the extension foundation:

- extension settings in `chrome.storage.local`
- metadata-only observation records in `chrome.storage.session`

The initial build does not send data to a DSSI-managed server.

## Prohibited persistence

The extension must not persist:

- typed field values
- passwords or authentication secrets
- payment card numbers
- clipboard contents
- prompt, comment, email, chat, or message bodies
- request bodies and raw request-header values
- URL paths, queries, fragments, or credentials in observation records

## Observation boundary

DSSI Core A does not guarantee complete visibility into every page, frame, shadow tree, script, synchronization path, or network transmission. An absent warning is not a safety certification.

## User control

Users can disable the extension, change viscosity level, and clear the current session observation log.

## Sprint 1 input recognition

Sprint 1 observes structural browser events and field metadata. It does not read field values for logging or classification.

The implementation may inspect the field's type, autocomplete metadata, name, identifier, accessibility label, placeholder, associated label text, contenteditable state, and role. These structural strings are used locally to determine a category and are not stored in the observation log.

Input-origin classification is conservative. Keyboard and paste events can be confirmed from event evidence; autofill or password-manager use is recorded only as suspected when the browser does not expose a definitive source.

## Sprint 2.2 diagnostic separation

DSSI separates user-facing activity records from implementation diagnostic records. Page-start diagnostics are session-local and are not presented as evidence of user input or transmission.

For an unclassified input surface, DSSI may retain only limited structural metadata: tag name, normalized input type, a syntactically safe role token, contenteditable state, and syntactically safe autocomplete tokens. It does not retain the element name, ID, label text, placeholder text, or field value for this purpose.

## Sprint 3 transient evidence and network metadata

Sprint 3 distinguishes transient raw evidence from retained metadata. Structural strings used for input classification remain local to the classification call and do not enter the observation record.

Optional communication-metadata observation uses Chrome `webRequest` only after the user grants the optional permission and matching HTTP/HTTPS host access. Request-body access is not requested.

Sprint 3.1 uses the send-header observation phase because Chrome exposes the `Cookie` header only through request-header observation with the additional header view. The callback object may therefore contain header values before DSSI code receives it. DSSI logic reads only each header name, reduces the result to `detected`, `not_detected`, `not_observed`, or `unavailable`, and does not copy, classify, log, display, or persist header values.

The browser callback also temporarily provides the full request URL. DSSI immediately reduces it to method, scheme, host, resource class, and same/cross-origin relation. It does not retain path, query, fragment, credentials, request body, header values, or response content.

Only request starts within 2500ms of a trusted content edit in the same tab, frame, and document when a document identifier is available are recorded. Focus does not create a correlation pulse. This time correlation does not prove that input content was included in the request.

`not_detected` means only that the `Cookie` header name was not found in the header collection Chrome exposed to DSSI. It is not proof that no Cookie existed or that no state-bearing information accompanied the request.

Observation records are validated before a Content Script message, after Service Worker receipt, and immediately before `chrome.storage.session` persistence. Unknown fields, nested payloads, and raw URL-like host values are rejected.

Future user-requested evidence preservation is not implemented. It must use a separate explicit-consent record type and storage path rather than weakening the normal observation-log boundary.

## Sprint 3.2 MAX reporting and coverage responsibility

MAX is a reporting mode, not a fourth viscosity level and not a broader content-access permission. It includes Level 3 cues, records supported communication diagnostics when DSSI cannot correlate a recent trusted content edit or standard-form operation, and displays DSSI's known observation boundaries.

Standard activity records may use either of these transient correlations:

- trusted content edit to supported request start within 2500ms
- trusted standard-form submit operation to supported request start within 2000ms

MAX diagnostic records may use the closed state `no_correlated_user_operation`. This means only that DSSI did not confirm one of its currently supported correlation signals. It does not prove that no user operation occurred, that communication was automatic, that the user did not intend it, or that input content was present.

The Coverage Manifest separates:

- observed facts
- facts observed and immediately reduced
- technically reachable areas deliberately not connected because of privacy or permission boundaries
- areas not observable through the current browser and extension architecture
- unknown residual not guaranteed to be exhaustively listed

Core A deliberately does not connect to stored-Cookie inspection, request bodies, raw Cookie or Authorization values, page-main-world memory inspection, or invasive wrapping of page networking APIs. It also cannot guarantee visibility into in-memory cache handling, already-established WebSocket or WebTransport message flows, permission-excluded traffic, browser-private traffic, or events that occurred before DSSI observation began.

A chip-position handle stores only one categorical preference: top, left, bottom, or right. The chip body remains pointer-transparent so normal page interaction is not intercepted.

## Sprint 3.3 communication-pulse presentation

Communication pulses are derived only from already privacy-safe DOM submission descriptors and network descriptors. They do not add permissions, request bodies, Cookie values, URL paths, queries, fragments, form values, or page-main-world memory.

Pulse color and geometry identify observation routes and metadata states only. They do not classify traffic as safe, dangerous, suspicious, or intended. Network pulses always represent body-unobserved metadata.

## Sprint 3.4 hostname profiles and log export

Hostname-scoped display profiles are stored in `chrome.storage.local`. They may contain pulse visibility, communication-explanation visibility, chip position, route-color choices, pulse opacity, and update time. They are display preferences only. They do not store a safety score, trust decision, permission decision, browsing content, or communication content.

The first-observation registry stores the normalized hostname and first/last observation times so DSSI can indicate a new observation target and later return a review cue. Repeated page loads update this registry no more than once per hour per hostname.

Observation-log export is initiated explicitly from the log viewer. JSON export includes DSSI primary observation records, export-time settings, referenced record-time settings snapshots when available, the Coverage Manifest, export scope, exclusions, and use boundaries. CSV contains a flat row per observation record. Selecting CSV alone also produces a context JSON file because nested observation conditions cannot be represented faithfully in a flat table.

Export does not add host aggregation, communication-purpose classification, danger or safety scoring, missing-value inference, input content, Cookie values, request bodies, or complete URLs. It performs record selection and timestamp ordering only.

After download, exported files are outside `chrome.storage.session` and inside the user's file-management boundary. Version 0.4.6 does not encrypt, digitally sign, authenticate, or make exported files read-only. The files can be copied, edited, disclosed, compelled, or misinterpreted by software or people with access to them. The exported use-boundary statement therefore says that the records do not prove user intent, responsibility, communication content, harmfulness, or safety.
