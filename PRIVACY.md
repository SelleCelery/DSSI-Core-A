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
