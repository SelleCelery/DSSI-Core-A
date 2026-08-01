# Changelog

## 0.4.3 - Sprint 3.3

- Added a log-page Coverage Manifest dialog so observation limits can be checked while reading records.
- Added synchronized top and bottom horizontal scrollbars for the wide observation table.
- Expanded fact-chip placement to eight clockwise positions, including right-bottom and left-bottom.
- Added an optional small communication-pulse display for Level 2, Level 3, and MAX.
- Added geometric visual separation for DOM form boundaries, fetch/XHR traffic, and Beacon/Ping traffic.
- Added compact method glyphs, Cookie-header detection markers, and a cross-origin corner mark.
- Kept all pulse colors low-saturation and non-evaluative; colors identify observation routes rather than safety or danger.
- Added configurable pulse duration and size while keeping each mechanism icon at approximately five millimeters or less.
- Kept network pulses metadata-only and explicitly body-unobserved.
- Added shared Coverage Manifest rendering for the options and log pages.

## 0.4.2 - Sprint 3.2

- Added MAX as a reporting mode separate from viscosity Levels 1-3.
- Added diagnostic recording for supported network activity when DSSI cannot correlate a recent content edit or trusted standard-form operation.
- Added transient standard-form action pulses and a two-second action-to-network correlation path for delayed submit scenarios.
- Added aggregated MAX diagnostic chips so short communication bursts are shown as one cognitive cue while diagnostic records remain individual.
- Added a dynamic Coverage Manifest that separates observed, observed-then-reduced, not-observed-by-design, currently-unobservable, and unknown-residual regions.
- Added explicit permission-state reporting without treating permission-excluded traffic as blocked traffic.
- Added top, left, bottom, and right chip positions with a small interactive move handle; the chip body remains pointer-transparent.
- Added settings persistence for reporting mode and chip position.
- Kept request bodies, Cookie values, saved-Cookie inspection, page-main-world memory inspection, and established-stream messages outside Core A.
- Advanced the privacy-safe observation schema to version 9.

## 0.4.1 - Sprint 3.1

- Removed input-surface focus from the normal activity log and from network-correlation pulses.
- Kept focus as a transient chip at Level 3 and at Level 2 for password, payment, and personal-information surfaces.
- Decoupled transient content-edit pulse refresh from duplicate activity-log suppression.
- Added the content-script observation timestamp to the closed transient pulse so the 2500ms window is measured from the observed edit rather than Service Worker receipt.
- Renamed new network correlation records to content-edit correlation while preserving legacy record rendering.
- Moved optional network observation to `onBeforeSendHeaders` and added `Cookie` request-header-name detection.
- Added closed Cookie detection states: detected, not detected, not observed, and unavailable.
- Added neutral page-observation timing states without inferring initialization, authentication, or application purpose.
- Added Cookie-name, focus-policy, page-timing, pulse, and privacy-boundary tests.
- Updated the page chip to the approved low-obstruction semi-transparent presentation.

## 0.4.0 - Sprint 3

- Added an explicit transient-evidence, reduction, persistence, and purge lifecycle.
- Changed the privacy-safe logger to a closed record schema with unknown-field and nested-payload rejection.
- Added validation before Content Script messaging, after Service Worker receipt, and before session storage persistence.
- Added optional `webRequest` and optional HTTP/HTTPS host permissions.
- Added opt-in request-start observation for `xmlhttprequest` and `ping` resource classes.
- Correlates request starts with input activity in the same tab/frame within 2500ms.
- Retains only method, scheme, host, origin relation, mechanism, and payload-not-requested state.
- Does not request request bodies or headers and does not persist URL path, query, fragment, or credentials.
- Added network metadata chips, log columns, tests, glossary, ADR, and data-lifecycle documentation.

## 0.3.2 - Sprint 2.2

- Separated user-facing activity logs from implementation diagnostic logs.
- Moved page observation start records to the diagnostic layer.
- Suppressed repeated top-frame page-start records within a short window.
- Renamed main-page/iframe labels to top-frame/embedded-frame terminology.
- Added privacy-safe structural metadata for unknown input surfaces.
- Added independent clear controls for activity and diagnostic logs.

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
