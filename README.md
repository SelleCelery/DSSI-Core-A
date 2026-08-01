# DSSI Core A

DSSI Core A is an awareness-first cognitive safety layer for Chromium browsers.

> 最後に止めるのではなく、最初に気づけるようにする。

The extension is designed to present observable facts and observation limits before or during high-impact browser actions. It does not substitute the user's judgment and does not claim complete interception or complete safety.

## Status

Sprint 3.3 — Real-Time Boundary Pulse Visualization

This repository currently provides:

- Manifest V3 extension scaffold
- TypeScript and esbuild build pipeline
- password / email-ID / payment / personal-information / free-text classification
- keyboard, paste, input, focus-cue, and dynamically-added field observation
- trusted-event correlation and conservative input-origin inference
- viscosity-controlled factual chips
- local settings and separate session-only activity / diagnostic metadata logs
- popup summary and complete observation-log viewer
- separate operation evidence, classification confidence, and boundary observation scope
- two-stage paste observation: event observed and reflection confirmed
- top-frame / embedded-frame context with start-noise suppression
- same-form correlation between submit candidates and later submit events
- Level 3 factual chips for inferred input route
- closed-schema privacy boundary with three-stage validation
- optional browser network metadata observation for content-edit-near and standard-form-operation-near fetch/XHR and Beacon/Ping requests
- MAX reporting mode for operation-correlation-unconfirmed target communication diagnostics
- dynamic Coverage Manifest for observed, reduced, deliberately unobserved, currently unobservable, and unknown-residual regions
- movable factual chips with persistent eight-direction placement
- optional geometric communication pulses for DOM form, fetch/XHR, and Beacon/Ping observations
- log-page Coverage Manifest dialog and synchronized top/bottom table scrollbars
- lint, format, typecheck, test, and build commands

Sprint 3.3 retains the Sprint 3.2 MAX and privacy boundaries while adding a real-time, metadata-only communication-pulse layer. MAX does not request broader content access; it reports supported communication diagnostics even when DSSI cannot correlate a recent content edit or trusted standard-form operation. It also exposes a Coverage Manifest showing what DSSI observes, what it reduces, what it deliberately refuses to observe, what the current platform does not expose, and the remaining unknown residual. Header values are not accessed by DSSI logic and are never copied into messages, records, storage, or UI. Request bodies are not requested, full URL paths and queries are not persisted, and no payload relation, user intent, authentication purpose, or server receipt is claimed.

## Requirements

- Node.js 20 or later
- npm 10 or later
- Chrome or a Chromium-based browser

## Development

```bash
npm install
npm run check
```

The built extension is written to `dist/`.

### Load as an unpacked extension

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Choose **Load unpacked**.
4. Select this repository's `dist/` directory.

## Privacy baseline

The initial build does not persist:

- field values
- passwords
- payment numbers
- clipboard contents
- prompt, comment, email, or message bodies
- request bodies and raw request-header values
- URL paths, queries, fragments, or credentials in observation records

The session log stores structural metadata only and can be cleared from the options page.

See [PRIVACY.md](./PRIVACY.md), [the Sprint 1 implementation guide](./docs/SPRINT1_IMPLEMENTATION_GUIDE.md), [the Sprint 1.1 implementation guide](./docs/SPRINT1_1_IMPLEMENTATION_GUIDE.md), [the Sprint 1.2 implementation guide](./docs/SPRINT1_2_IMPLEMENTATION_GUIDE.md), [the Sprint 2 implementation guide](./docs/SPRINT2_IMPLEMENTATION_GUIDE.md), [the Sprint 2.1 implementation guide](./docs/SPRINT2_1_IMPLEMENTATION_GUIDE.md), [the Sprint 2.2 implementation guide](./docs/SPRINT2_2_IMPLEMENTATION_GUIDE.md), [the Sprint 3 implementation guide](./docs/SPRINT3_IMPLEMENTATION_GUIDE.md), [the Sprint 3.1 implementation guide](./docs/SPRINT3_1_IMPLEMENTATION_GUIDE.md), [the Sprint 3.2 implementation guide](./docs/SPRINT3_2_IMPLEMENTATION_GUIDE.md), [the Sprint 3.3 implementation guide](docs/SPRINT3_3_0_IMPLEMENTATION_GUIDE.md), [the data lifecycle and purge boundary](./docs/DATA_LIFECYCLE_AND_PURGE_BOUNDARY_v0.4.ja.md), [the operational glossary](./docs/DSSI_Core_A_Operational_Glossary.ja.md), and the product documents under [docs/product](./docs/product).

## License

GNU General Public License v3.0 or later. See [LICENSE](./LICENSE).

## Sprint 2: submission boundary

DSSI now observes standard HTML form submission surfaces and records only declared metadata: method, encoding, and destination relation/host. It distinguishes submit-control activation, Enter-key candidates, and trusted submit events. It does not read form values, query values, request bodies, fetch/XHR traffic, service-worker traffic, or server receipt.

## Sprint 2.1: real-page refinement

Real-page tests showed that embedded frames and DOM submit associations needed separate treatment. Sprint 2.1 records top-frame and iframe context, suppresses iframe page-start-only noise, and identifies whether a submit event was correlated with a prior trusted click or Enter candidate on the same form.

## Sprint 2.2: log-layer separation

The normal activity log now contains only observations relevant to user actions and judgment. Content-script page-start records are stored separately as diagnostics. Unknown input surfaces may include only tag, normalized input type, safe role token, contenteditable state, and safe autocomplete tokens; labels, placeholders, IDs, names, and values remain excluded.

## Sprint 3: transient evidence and optional communication metadata

Network metadata observation is disabled by default. When the user enables it, the options page requests optional `webRequest` and HTTP/HTTPS host permissions. DSSI records supported request metadata only when a trusted content edit was observed within 2.5 seconds in the same tab and frame, with document correlation when the browser provides a document identifier.

The browser API temporarily supplies a complete request URL and, in Sprint 3.1, a request-header collection. DSSI immediately reduces the URL to scheme, host, method, resource-class-derived mechanism, and same/cross-origin relation. It scans header names only for `Cookie` and reduces the result to a closed detection state. Path, query, fragment, credentials, request body, header values, response body, and server receipt are not persisted or claimed.

Focus is no longer an activity-log fact or a network-correlation pulse. It remains a transient awareness cue at Level 3, and at Level 2 for password, payment, and personal-information fields.

## Sprint 3.2: MAX coverage reporting

MAX is not viscosity Level 4. Viscosity remains a three-level cue policy. MAX is a separate reporting mode that includes Level 3 awareness cues and adds diagnostic communication reporting and observation-boundary visibility.

In standard mode, supported communication metadata is retained when it follows a trusted content edit within 2.5 seconds or a trusted standard-form operation within 2 seconds. In MAX, supported requests without either correlation are stored in the diagnostic log and presented through an 800ms aggregate chip. “Operation correlation unconfirmed” does not mean that no user operation occurred.

The options page includes a dynamic Coverage Manifest. It distinguishes observation, immediate reduction, design refusal, current technical unobservability, and unknown residual. MAX does not inspect stored Cookie values, request bodies, page-main-world memory, in-memory cache contents, or messages inside already-established WebSocket or WebTransport sessions.

Fact chips remain pointer-transparent except for a small move handle. Clicking the handle cycles clockwise through eight positions and persists the selection.

## Sprint 3.3: real-time boundary pulse visualization

The log viewer can open the same dynamic Coverage Manifest used by the options page, so observation limits remain available while records are interpreted. The wide table now has synchronized horizontal scroll controls above and below the table.

Fact-chip placement now supports top, top-right, right, bottom-right, bottom, bottom-left, left, and top-left. The move handle follows this clockwise order and the communication-pulse layer follows the same position.

Level 2, Level 3, and MAX can display small geometric communication pulses. A square denotes a DOM standard-form boundary, a circle denotes fetch/XHR observed through `webRequest`, and a wave form denotes Beacon/Ping. A compact letter indicates method, the Cookie marker reports only header-name detection state, and a corner mark indicates cross-origin relation. The muted graphite, plum-gray, sage-gray, and copper-gray colors identify observation routes only; they do not encode safety, danger, or warning. Network pulses remain request-body-unobserved.
