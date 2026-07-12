# Sprint 1 Implementation Guide

## Purpose

Sprint 1 implements the first DSSI product loop:

```text
Action Surface touched
→ input surface classified
→ observable metadata recorded
→ factual cue shown according to viscosity
```

The implementation does not read, store, or transmit the entered text itself.

## File responsibilities

### `src/content/bootstrap.ts`

Loads settings and starts the page observer. This is the content-script entry point included in the built extension.

### `src/content/input-surface-observer.ts`

Connects browser events to DSSI. It observes:

- `focusin` / `focusout`
- `keydown`
- `paste`
- `beforeinput`
- `input`
- DOM additions through `MutationObserver`

It never reads an input element's `value`.

### `src/content/surface-descriptor.ts`

Converts DOM metadata into a small descriptor. It may read structural metadata such as:

- element type;
- `autocomplete`;
- `name`, `id`, `aria-label`, and `placeholder`;
- associated label text;
- `contenteditable` and `role`.

The descriptor is used locally and is not written to the observation log.

### `src/core/surface-classifier.ts`

Pure classification logic. It maps a structural descriptor to one of:

- password;
- email or ID;
- payment;
- personal information;
- free text;
- unknown.

Classification confidence is recorded as explicit, heuristic, or generic.

### `src/core/input-origin.ts`

Infers the input route from event evidence:

- keyboard confirmed;
- paste confirmed;
- autofill or password manager suspected;
- script or unknown update;
- unknown.

Autofill and password-manager use are only estimates. DSSI does not claim certainty when the browser does not expose it.

### `src/core/cue-policy.ts`

Decides whether to show a factual chip.

- Level 1: password and payment only;
- Level 2: classified input surfaces;
- Level 3: all input surfaces, including unknown surfaces.

### `src/ui/fact-chip.ts`

Displays the factual chip in an isolated Shadow DOM host. The chip is visual output only and does not alter the field value or stop input.

### `src/core/observation-factory.ts`

Creates the metadata-only observation record. Optional values are added only when they exist.

## Data flow

```text
DOM event
  ↓
surface-descriptor
  ↓
surface-classifier / input-origin
  ↓
cue-policy
  ├─ factual chip
  └─ metadata-only observation record
         ↓
service worker
         ↓
chrome.storage.session
```

## Privacy boundary

The following are not accessed for logging:

- field value;
- selected text;
- clipboard content;
- password;
- card number;
- comment or prompt body.

The log contains only classifications, timestamps, domain, observability state, viscosity, and whether a cue was displayed.

## Manual test

1. Build and reload the extension.
2. In the repository root, run:

   ```powershell
   python -m http.server 4173
   ```

3. Open:

   ```text
   http://localhost:4173/tests/fixtures/input-surfaces.html
   ```

4. Test focus, typing, paste, browser autofill, and the dynamically added field.
5. Open the DSSI popup and confirm that the session observation count increases.
