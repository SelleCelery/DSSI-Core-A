# Sprint 3.3 Display Refinement

## Purpose

This revision separates real-time timing awareness from explanatory prose. Communication events are shown primarily as compact geometric pulses, while text chips remain available as an opt-in explanatory layer.

## Saved base settings and page-local overrides

Saved settings define the baseline after page load:

- communication pulse enabled
- communication text chip enabled
- pulse retention duration
- pulse size
- shared display position

The page-local HUD can temporarily:

- pause or resume new pulse presentation
- clear visible pulses
- hide or show pulse presentation
- hide or show text chips

These overrides are held only in the current content-script document and reset when the page is reloaded. They do not alter the stored base settings.

## Retention

`communicationPulseDurationMs` accepts:

- 300, 700, 1500, 3000 milliseconds
- 10000, 30000, 60000 milliseconds
- 0, meaning retain until manual clearing or display-cap eviction

At most 32 individual pulses are kept in the HUD. Oldest pulses are removed first. The HUD does not semantically merge individual observations.

## Presentation lanes

The pulse HUD occupies the viewport edge. Explanatory text chips are placed farther inward on the same selected side or corner. This prevents the higher-area text chip from covering the compact pulse stream.

## Log views

The log page starts in a chronological simple stream combining activity and diagnostic records. Each row contains a compact glyph, observation action, destination, and short correlation status. Opening a row reveals the complete metadata. The previous wide audit table remains available as the detailed view.
