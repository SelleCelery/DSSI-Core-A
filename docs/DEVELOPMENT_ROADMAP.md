# Development Roadmap

## Sprint 0 — Foundation

- [x] Git repository scaffold
- [x] TypeScript build
- [x] Manifest V3 scaffold
- [x] lint / format / typecheck / test
- [x] privacy-safe logger
- [x] popup and options foundation

## Sprint 1 — Input Recognition

- [x] content script event capture
- [x] MutationObserver delta scanning
- [x] input, textarea, contenteditable detection
- [x] password / email-ID / payment / free-text classification
- [x] input-origin inference
- [x] passive factual chip
- [x] fixture page and core classification tests

## Sprint 1.1 — Observation Feedback

- [x] popup recent-observation summary
- [x] complete session-log viewer
- [x] Level 3 input-route chips
- [x] user-facing Japanese labels

## Sprint 1.2 — Evidence and Boundary Separation

- [x] separate operation evidence from input-surface classification confidence
- [x] separate boundary observation scope from semantic classification uncertainty
- [x] split paste-event observation from paste-reflection confirmation
- [x] require trusted events for confirmed keyboard and paste paths
- [x] preserve legacy Sprint 1/1.1 session-log rendering
- [x] add blocked-paste and synthetic-event fixture cases
- [ ] propagate settings changes to active tabs without page reload

## Sprint 2 — Declared Form Submission Boundary

- [x] observe standard form submit events
- [x] separate submit-control activation and Enter candidates
- [x] expose declared method, encoding, and destination relation
- [x] avoid logging form values, URL query, fragment, path, and request bodies

## Sprint 2.1 — Frame and Submission Correlation

- [x] distinguish top-frame and iframe observations
- [x] suppress iframe page-start noise while retaining iframe interactions
- [x] correlate submit candidates with later submit events on the same form
- [x] separate DOM submit-control association from user-intent claims
- [ ] propagate settings changes to active tabs without page reload

## Sprint 2.2 — Activity and Diagnostic Log Separation

- [x] separate user-facing activity logs from implementation diagnostics
- [x] move page-start records to the diagnostic layer
- [x] suppress short-window duplicate top-frame page starts
- [x] rename frame labels to top-frame / embedded-frame terminology
- [x] add privacy-safe structural metadata for unknown input surfaces
- [x] add independent log clearing controls
- [x] complete v0.3 understanding-recovery review before Sprint 3

## Sprint 3 — Data Lifecycle and Optional Network Metadata

- [x] distinguish transient raw evidence, correlation state, safe metadata, and persistent records
- [x] enforce a closed ObservationRecord persistence schema
- [x] validate records at Content Script, Service Worker, and storage boundaries
- [x] add optional `webRequest` and optional HTTP/HTTPS host permissions
- [x] observe `xmlhttprequest` and `ping` request starts without request-body access
- [x] correlate network activity with input activity in the same tab/frame
- [x] retain only method, scheme, host, relation, mechanism, and payload-not-requested state
- [x] add operational glossary and purge-boundary documentation
- [ ] run the full maintainer `npm run check` and real-browser acceptance test
- [ ] add browser integration tests

The original product functional specification placed the network metadata spike later. It was advanced after the v0.3 understanding-recovery review exposed data-lifecycle and persistence-boundary requirements. Network observation remains auxiliary rather than the primary Core A boundary.

## Sprint 3.1 — Content-Edit Correlation Refinement

- [x] remove focus from normal logs and network-correlation pulses
- [x] retain focus only as a viscosity-controlled transient cue
- [x] refresh the transient pulse for every trusted content edit independently of log deduplication
- [x] timestamp pulses at the Content Script observation boundary
- [x] distinguish new content-edit correlation records from legacy input-activity records
- [x] detect only the `Cookie` request-header name and reduce it to closed states
- [x] record neutral page-observation timing without purpose inference
- [x] preserve the low-obstruction semi-transparent fact-chip presentation
- [ ] run full maintainer `npm run check` in the repository environment
- [ ] complete real-browser tests for Cookie detected / not detected / unavailable states
- [ ] add browser integration tests for focus exclusion and repeated edit pulse refresh

## Sprint 4 and later

Continue from `docs/product/DSSI_Core_A_Functional_Specification.md`, reconciling the original sequence with verified implementation history.

## Sprint 3.2 — MAX Coverage Reporting

- [x] add MAX as a reporting mode separate from viscosity Levels 1-3
- [x] add standard-form-operation-to-network transient correlation
- [x] keep operation-correlation-unconfirmed target communication in the diagnostic layer
- [x] aggregate MAX communication chips without aggregating persisted diagnostic records
- [x] add a dynamic Coverage Manifest
- [x] separate observed, reduced, deliberately unobserved, currently unobservable, and unknown-residual regions
- [x] expose optional network-permission state in the Coverage Manifest
- [x] add persistent top / left / bottom / right fact-chip placement
- [x] keep the chip body pointer-transparent and make only the move handle interactive
- [ ] complete real-browser MAX traffic-volume tests
- [ ] verify standard-form action correlation against multiple SPA and navigation patterns
- [ ] evaluate general button-operation correlation without collecting labels or identifiers

## Sprint 3.3 — Real-Time Boundary Pulse Visualization

- [x] expose the Coverage Manifest from the log viewer
- [x] synchronize top and bottom horizontal scrollbars for the observation table
- [x] expand factual-chip placement to eight clockwise positions
- [x] persist right-bottom and left-bottom placement options
- [x] add optional communication pulses for Level 2, Level 3, and MAX
- [x] distinguish DOM form, fetch/XHR, and Beacon/Ping by geometry
- [x] distinguish methods and Cookie-header detection states without inspecting values
- [x] mark cross-origin relation without using danger semantics
- [x] use low-saturation, non-evaluative colors and preserve shape-first readability
- [x] make pulse duration and size configurable
- [x] preserve request-body non-observation and existing privacy boundaries
- [ ] complete real-browser visual-density tests on high-traffic SPA pages
- [ ] evaluate active-tab settings propagation without page reload
