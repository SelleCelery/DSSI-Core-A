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
- [ ] complete v0.3 understanding-recovery review before Sprint 3

## Sprint 3 and later

Follow `docs/product/DSSI_Core_A_Functional_Specification.md`.
