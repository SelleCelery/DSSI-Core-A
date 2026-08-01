# Sprint 3.2 Implementation Guide

Version: 0.4.2
Observation schema: 9

## Purpose

Sprint 3.2 extends DSSI Core A from selected communication correlation into explicit observation-boundary responsibility.

It adds MAX as a reporting mode separate from viscosity Levels 1-3. MAX does not expand DSSI's content access. It expands what DSSI reports about supported communication events and about the limits of its own observation architecture.

## 1. MAX is not Level 4

The settings model keeps two separate axes:

```ts
viscosityLevel: 1 | 2 | 3;
reportingMode: 'standard' | 'max_coverage';
```

MAX includes Level 3 factual cues and adds diagnostic reporting. It does not create a fourth viscosity state.

## 2. Communication correlation paths

Sprint 3.2 supports three closed network-correlation states for new records.

### Recent content edit

A trusted input or paste event refreshes a transient metadata pulse. A supported request observed within 2500ms in the same tab and frame is retained as an activity record.

### Recent standard-form operation

A trusted standard-form submit control, non-composing Enter candidate, or trusted submit event refreshes a transient action pulse. A supported request observed within 2000ms is retained as an activity record.

The action pulse contains only:

- DSSI session UUID
- domain key
- viscosity level
- closed action category
- observation time

It contains no element label, form action URL, field content, name, ID, or request body.

### Operation correlation unconfirmed

In MAX only, a supported request that does not match either transient pulse is stored in the diagnostic log with:

```text
networkCorrelation = no_correlated_user_operation
```

This state does not assert that no operation happened. It asserts only that DSSI did not confirm one of its currently supported correlation signals.

## 3. Diagnostic chip aggregation

MAX may observe many supported requests in a short period. Individual diagnostic records remain separate, but the page chip aggregates an 800ms burst into one cue.

The aggregate may include:

- count
- GET / POST and other closed method counts
- fetch/XHR and Beacon/Ping mechanisms
- same-origin / cross-origin counts
- one host if all observed requests share it, otherwise a multiple-destination label
- whether at least one event included Cookie-header-name detection

No URL path, query, header value, or request body enters the aggregate.

## 4. Coverage Manifest

The options page generates a Coverage Manifest from the implementation policy and current optional-permission state.

It separates:

1. observed
2. observed then reduced
3. not observed by design
4. not observable currently
5. unknown residual

The manifest is not stored in each observation record. It is a capability-and-boundary description, not an event.

## 5. Deliberate non-observation

Core A does not connect to:

- input bodies
- passwords and payment numbers
- request bodies
- Cookie values or stored-Cookie enumeration
- Authorization values
- clipboard bodies
- page-main-world memory inspection
- invasive wrapping of page fetch, XHR, or WebSocket APIs

Some of these areas may be technically reachable with stronger permissions or page-world injection. Sprint 3.2 records that refusal as a design boundary rather than presenting it as a technical impossibility.

## 6. Current technical limits

The manifest also identifies areas that the current architecture may not observe:

- in-memory cache handling
- messages inside established WebSocket or WebTransport sessions
- permission-excluded communication
- Chrome-private communication
- events before DSSI observation began
- unlisted future or unknown blind spots

## 7. Movable factual chips

Fact chips remain pointer-transparent except for a 24px move handle. Activating the handle cycles:

```text
top -> left -> bottom -> right -> top
```

The categorical position is stored in local settings. No page coordinates or interaction content are stored.

## 8. Log layers

Activity log:

- content-edit-correlated supported requests
- standard-form-operation-correlated supported requests
- existing input and form observations

Diagnostic log:

- page observation start
- MAX operation-correlation-unconfirmed supported requests

## 9. Acceptance checks

1. MAX can be selected independently of viscosity Level 1-3.
2. MAX includes Level 3 focus and input-route cues.
3. A supported request without recent edit or standard-form action is absent in standard mode.
4. The same request appears in the diagnostic log in MAX.
5. Multiple diagnostic requests within 800ms produce one aggregate chip.
6. Standard-form action followed by a supported request within 2 seconds is an activity record.
7. The Coverage Manifest displays all five coverage statuses.
8. Network permission state changes the manifest's active state.
9. The chip move handle cycles top, left, bottom, and right.
10. The chip body remains pointer-transparent.
11. No request body, Cookie value, URL path, query, or page input enters records or UI.
