# Sprint 3.1 Implementation Guide

## Version

DSSI Core A 0.4.1

## Sprint objective

Sprint 3.1 refines the meaning of the Sprint 3 communication correlation.

The implementation separates four events that had become too easy to conflate:

```text
focus on an input surface
trusted content edit
activity-log record creation
browser network activity
```

Focus remains useful as an awareness cue, but it is not evidence that content changed and is therefore removed from the activity log and network-correlation path.

## Focus policy

Focus is handled as a transient cue only.

| Viscosity | Focus cue                                                 |
| --------- | --------------------------------------------------------- |
| Level 1   | none                                                      |
| Level 2   | password, payment, and personal-information surfaces only |
| Level 3   | all recognized input surfaces                             |

Focus does not:

- create an `ObservationRecord`
- refresh an input/network correlation pulse
- appear in the normal activity log

Legacy focus records already present in the current session remain renderable until the session log is cleared.

## Content-edit pulse

A transient pulse is refreshed for every trusted `input` event and every trusted `paste` event while optional network observation is enabled.

This update occurs before activity-log duplicate suppression. Therefore, suppressing a repeated “keyboard input started” log does not suppress the correlation clock.

The pulse contains only:

- DSSI session ID
- domain key
- input-surface classification
- classification confidence
- viscosity level
- wall-clock observation time assigned in the Content Script

It contains no field value, label, placeholder, element ID, element name, URL, clipboard body, or request data.

## Correlation clock

The current window is:

```text
2500ms
```

The timestamp is assigned at the Content Script observation boundary rather than when the Service Worker later receives the runtime message.

A network record is created only when the supported communication event is no more than 2500ms after that content-edit timestamp in the same tab and frame, with document-ID comparison when both sides provide one.

The record states a time correlation only. It does not prove that the edited content was present in the request.

## Network observation phase

Sprint 3.1 registers:

```text
chrome.webRequest.onBeforeSendHeaders
```

Supported Chrome resource classes remain:

- `xmlhttprequest` → `fetch_or_xhr`
- `ping` → `beacon_or_ping`

The listener requests:

```text
requestHeaders
extraHeaders
```

only to determine whether Chrome exposes a request header whose name is `Cookie`.

Request-body access is not requested.

## Cookie header-name detection

The detection function reads only `header.name`.

It reduces the observation to one of four states:

```text
detected
not_detected
not_observed
unavailable
```

Meaning:

- `detected`: `Cookie` was found among the header names Chrome supplied
- `not_detected`: it was not found in the supplied collection
- `not_observed`: the record did not use header-name observation
- `unavailable`: Chrome did not supply a header collection for the event

`not_detected` does not prove that no Cookie existed.

Chrome may place header values in the callback object before DSSI code receives it. DSSI does not claim that values never entered browser or JavaScript memory. The implemented guarantee is narrower and testable:

- DSSI detection logic does not access header values
- values are not copied into runtime messages
- values are not copied into `NetworkDescriptor`
- values are not copied into `ObservationRecord`
- values are not persisted, displayed, or logged to console

## Page-observation timing

Each new network record may include a neutral relation to DSSI's own page-observation start:

```text
within_5s_of_page_observation
after_5s_of_page_observation
unknown
```

This field does not classify the request as initialization, authentication, session restoration, analytics, or any other application purpose.

## New record semantics

New Sprint 3.1 records use:

```text
triggerType: network_activity_after_content_edit
networkCorrelation: recent_content_edit
schemaVersion: 8
```

Older Sprint 3 records remain renderable with legacy labels.

## Persistence boundary

The retained network fields are limited to:

- normalized method
- scheme
- host
- same/cross-origin relation
- Chrome resource-class-derived mechanism
- content-edit time correlation
- page-observation timing category
- Cookie header-name detection state
- `payloadObservation: not_requested`

The following are not retained:

- URL path
- URL query
- URL fragment
- URL credentials
- request body
- request-header values
- response headers
- response body
- Cookie names, values, or count

## Relevant files

```text
src/content/input-surface-observer.ts
src/core/cue-policy.ts
src/core/input-activity-policy.ts
src/core/input-activity-pulse.ts
src/core/models/network.ts
src/core/cookie-header-detection.ts
src/core/page-observation-timing.ts
src/core/network-analyzer.ts
src/core/network-observation-policy.ts
src/background/service-worker.ts
src/core/observation-factory.ts
src/core/privacy-safe-logger.ts
src/core/observation-presentation.ts
src/ui/fact-chip.ts
src/logs/logs.ts
src/logs/logs.html
src/options/options.html
```

## Manual acceptance test

1. Build and reload the extension.
2. Enable optional communication-metadata observation.
3. Start the fixture through HTTP:

```powershell
cd "C:\UserWorkspace\10_PUBLIC_GITHUB\DSSI\DSSI-Core-A"
py -m http.server 4173
```

4. Open:

```text
http://localhost:4173/tests/fixtures/input-surfaces.html
```

5. Confirm that focus alone does not create a normal-log record.
6. At Level 3, confirm a focus chip. At Level 2, confirm it only for sensitive fields.
7. Type an ordinary character into a free-text field, including after the first keyboard activity log has already been deduplicated.
8. Within 2.5 seconds, press the JavaScript communication test button.
9. Confirm a `fetch/XHR` POST record with `recent_content_edit` semantics.
10. Confirm that the test path, query token, and request-body marker do not appear in the log.
11. Set the fixture Cookie, edit again, and send; inspect the Cookie detection result.
12. Clear the fixture Cookie, edit again, and send; inspect the result without interpreting “未検出” as proof of absence.

## Automated tests

- `cue-policy.test.ts`: Level-specific focus cues
- `input-activity-policy.test.ts`: focus exclusion and trusted edit pulse rules
- `input-activity-pulse.test.ts`: closed transient pulse including observation timestamp
- `network-correlation.test.ts`: exact 2500ms boundary
- `cookie-header-detection.test.ts`: name-only detection and no value getter access
- `page-observation-timing.test.ts`: exact 5-second neutral timing boundary
- `network-analyzer.test.ts`: safe URL reduction and new closed states
- `privacy-safe-logger.test.ts`: schema 8 and closed categorical values
- `observation-presentation.test.ts`: current and legacy semantics

## Known limits

- A runtime-message race remains theoretically possible when a network request starts before the Service Worker receives an immediately preceding pulse. The source timestamp prevents receipt delay from shortening the logical 2500ms window, but Sprint 3.1 does not buffer unmatched network events for later reconciliation.
- `xmlhttprequest` does not distinguish fetch from XHR.
- Cookie header-name observation depends on what Chrome exposes.
- Header-name detection does not identify authentication purpose.
- No request or response body is observed.
- No server receipt, processing success, or causal relation is established.
