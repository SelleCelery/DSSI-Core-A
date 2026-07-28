# Sprint 1.1 Implementation Guide

> **Sprint 1.2 note:** The `observability state` column described below was an interim model.
> Sprint 1.2 separates operation evidence, input-surface classification confidence, and boundary
> observation scope. The historical description is retained to document the transition.

## Purpose

Sprint 1.1 returns observed facts to the user instead of leaving them only in developer storage.

```text
input event
→ metadata-only observation record
→ session log
→ popup summary / log viewer
```

At viscosity Level 3, the content script also shows a short factual chip for the inferred input route.

## Added surfaces

### Popup recent observations

The popup displays up to five recent input-related observations. Page-start records remain in the complete log but are omitted from this short summary.

Displayed information is limited to:

- observation time;
- domain;
- classified input-surface type;
- observed or inferred action.

### Observation log viewer

`logs.html` reads the current `chrome.storage.session` log and presents it as a table. It shows:

- time;
- domain;
- surface classification;
- observed fact or input-origin inference;
- observability state;
- classification basis;
- whether a factual chip was displayed.

The page can refresh and clear the current session log. It does not export or persist the records.

### Level 3 input-origin chip

Level 3 now presents one factual chip when an input route is first identified for the focused surface:

- keyboard confirmed;
- paste confirmed;
- autofill or input-assistance suspected;
- script or unknown update;
- unknown.

Autofill and input-assistance identification remains an inference. The wording therefore states possibility rather than certainty.

## Main files

- `src/core/observation-presentation.ts` — converts internal enum values into user-facing Japanese labels.
- `src/storage/session-buffer.ts` — exposes safe session-record retrieval in addition to append, count, and clear operations.
- `src/popup/popup.ts` — renders recent observations and opens the complete viewer.
- `src/logs/logs.ts` — renders and clears the complete session log.
- `src/ui/fact-chip.ts` — renders Level 3 input-origin facts.
- `src/content/input-surface-observer.ts` — marks an input-origin log record as cue-presented when the Level 3 chip is shown.

## Privacy boundary

Sprint 1.1 does not expand the collected data. It only makes already-recorded metadata visible.

The viewer does not contain:

- field values;
- passwords;
- payment numbers;
- clipboard contents;
- prompt, comment, email, or message bodies;
- raw network request bodies.

## Manual verification

1. Run `npm run check` and reload `dist/` from `chrome://extensions`.
2. Set viscosity to Level 2 and focus, type, and paste in the fixture page.
3. Open the popup and confirm that recent observations appear.
4. Open **観測ログを表示** and confirm that the complete metadata table appears.
5. Set viscosity to Level 3, reload the fixture page, then type and paste.
6. Confirm that input-origin chips appear only at Level 3.
7. Clear the log and confirm that both the viewer and popup count return to zero.
