# Sprint 1.2 Implementation Guide

## Purpose

Sprint 1.2 refines the boundary model created in Sprint 1 and made visible in Sprint 1.1.
It does not add submit or network inspection. It separates claims that were previously
compressed into the single `observability` field.

The implementation now records three independent dimensions:

1. **Operation evidence** — how the claim about an operation is supported.
2. **Input-surface classification confidence** — how the input surface was classified.
3. **Boundary observation scope** — which technical layer DSSI actually observed.

This prevents a generic free-text field from being described as globally “high uncertainty”
merely because its semantic purpose is unknown.

## Observation boundary

Sprint 1.2 observes:

- DOM input surfaces;
- trusted and untrusted browser events visible to the content script;
- temporal correlation among `paste`, `keydown`, `beforeinput`, and `input` events;
- structural attributes used to classify an input surface.

Sprint 1.2 does not yet observe or prove:

- the final submission destination;
- whether a page transmitted data during input;
- whether a remote system stored the input;
- whether the page or destination is safe;
- closed implementation details hidden from the extension.

Therefore the normal scope label is **Input surface and DOM events observed** rather than
**Observable**.

## Paste detection

Paste is represented as two separate observations.

### 1. Paste event observed

The content script receives a `paste` event on a supported input surface.

- `event.isTrusted === true` produces `direct_trusted_event` evidence.
- an untrusted synthetic event produces `untrusted_or_unknown` evidence.
- no clipboard body is read or stored.

### 2. Paste reflection confirmed

A subsequent trusted `input` event indicates paste through one of these paths:

- `inputType` contains `paste` and a recent trusted `paste` event exists;
- a trusted `input` event occurs within 300 ms of a trusted `paste` event;
- a trusted `input` event itself explicitly reports a paste input type.

The first two paths are recorded as correlated trusted events. The third is recorded as a
direct trusted event because the trusted input event itself reports the insertion source. The
shorter 300 ms fallback window prevents later keyboard input from being attributed to an old
paste event.

A page that cancels paste with `preventDefault()` should normally produce only the first log.

## Keyboard detection

Keyboard input is confirmed only after a trusted `keydown` event is correlated with a trusted
`input` event on the same input surface within 1,200 ms. A keydown event alone is not logged as
reflected input.

## Autofill and input assistance

A trusted input event without recent trusted keyboard or paste evidence can be classified as
`autofill_or_manager_suspected`. This remains an inference because browsers do not provide a
uniform, authoritative origin signal for every autofill or password-manager operation.

## Log columns

| Column                             | Meaning                                                                      |
| ---------------------------------- | ---------------------------------------------------------------------------- |
| Observation fact                   | The event or inference being reported                                        |
| Operation evidence                 | Direct event, correlated event sequence, inference, or insufficient evidence |
| Input-surface classification basis | Explicit metadata, semantic heuristic, generic classification, or no basis   |
| Boundary observation scope         | The technical layer actually observed                                        |

`Input surface and DOM events observed` does not mean that transmission, storage, destination,
or safety was observed.

## Legacy records

`chrome.storage.session` can retain Sprint 1/1.1 records during a browser session. The log viewer
renders these as legacy records and explicitly states that the old field mixed classification
uncertainty with boundary observability. Clearing the session log removes them.

## Manual test fixture

Run a local server from the repository root:

```powershell
python -m http.server 4173
```

Open:

```text
http://localhost:4173/tests/fixtures/input-surfaces.html
```

The fixture includes:

- normal text, password, payment, personal-information, textarea, and contenteditable surfaces;
- a paste-blocked textarea that calls `preventDefault()`;
- a button that dispatches an untrusted synthetic paste event;
- a dynamically inserted input field.

Expected paste results:

- normal paste: paste event observed, then paste reflection confirmed;
- blocked paste: paste event observed only;
- synthetic paste: paste event observed with untrusted or insufficient evidence.

## Known deferred issue

Settings are currently read when the content script starts. A viscosity-level change may require
the target page to be reloaded. Live settings propagation remains a known issue and is not part
of Sprint 1.2 because it does not affect the correctness of the observation-boundary model.
