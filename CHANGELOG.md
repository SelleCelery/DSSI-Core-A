# Changelog

## 0.3.1 - Sprint 2.1

- Added top-frame and iframe context to observation records.
- Suppressed iframe page-start-only records while preserving actual iframe interactions.
- Separated form-associated submit controls, Enter candidates, correlated submit events, and standalone submit events.
- Changed submit-control wording so a DOM association is not presented as user-intent confirmation.
- Added frame-context and submission-association columns to the observation log.

## 0.3.0 - Sprint 2

- Added form submission boundary observation.
- Separated submit-control activation, Enter-key candidates, and confirmed submit events.
- Added declared method, encoding, destination relation, scheme, and host metadata.
- Strips query strings, fragments, user information, and all form values from logs.
- Explicitly leaves fetch/XHR, service-worker interception, actual network transmission, and server receipt unobserved.

## 0.2.2 - Sprint 1.2 Evidence and Boundary Separation

- Split operation evidence, input-surface classification confidence, and boundary observation scope into independent log dimensions.
- Replaced the ambiguous generic `observability` claim in new records with an explicit observation scope.
- Stopped labeling every free-text surface as globally high uncertainty.
- Split paste handling into direct paste-event observation and confirmed paste reflection.
- Added trusted-event checks and event-sequence correlation for paste and keyboard confirmation.
- Preserved rendering compatibility for Sprint 1/1.1 session records and labeled them as legacy.
- Added blocked-paste and synthetic-event manual test cases.
- Added Sprint 1.2 implementation documentation.

## 0.2.1 - Sprint 1.1 Observation Feedback

- Added a popup summary of the five most recent input-related observations.
- Added a complete session observation-log viewer with refresh and clear controls.
- Added user-facing Japanese labels for internal observation classifications.
- Added Level 3 factual chips for keyboard, paste, autofill/input-assistance, and uncertain input-origin observations.
- Kept all log display metadata-only; no field values or clipboard bodies were added.
- Added presentation tests and a Sprint 1.1 implementation guide.

## 0.2.0 - Sprint 1 Input Recognition

- Added input, textarea, contenteditable, and role=textbox surface detection.
- Added password, email/ID, payment, personal-information, free-text, and unknown classification.
- Added focus, keyboard, paste, beforeinput, input, and MutationObserver event handling.
- Added conservative keyboard, paste, autofill/password-manager, and unknown input-origin inference.
- Added viscosity-controlled factual chips in an isolated Shadow DOM host.
- Added metadata-only Sprint 1 logs, tests, fixture page, and implementation guide.

## 0.1.0 - Sprint 0 Foundation

- Initialized Manifest V3 TypeScript repository.
- Added build, typecheck, lint, format, and test pipeline.
- Added privacy-safe metadata logger and tests.
- Added popup, options page, local settings, and session log clearing.
- Added development privacy and security baselines.
