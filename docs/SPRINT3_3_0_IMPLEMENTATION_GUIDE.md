# Sprint 3.3 Implementation Guide

## Purpose

Sprint 3.3 converts Sprint 3.2's observation records into a real-time boundary-learning interface without expanding payload access.

The sprint adds:

1. Coverage Manifest access from the log viewer.
2. Synchronized top and bottom horizontal scrolling for the wide log table.
3. Eight-position factual-chip placement.
4. Optional small communication pulses for Level 2, Level 3, and MAX.
5. Shape-first, non-evaluative visual encoding.

## Communication pulse model

A pulse is derived only from already-safe descriptors.

```text
DOM form submit descriptor
or
NetworkDescriptor
  ↓
CommunicationPulseDescriptor
  ↓
short-lived geometric icon
```

The pulse model contains only:

- observation kind
- method
- destination relation
- Cookie header-name detection state, when applicable
- body-observation state fixed to `not_observed`

No input value, request body, Cookie value, URL path, query, fragment, label, element ID, or server response enters the pulse model.

## Geometry

- Square: DOM standard-form submit boundary.
- Circle with internal lines: fetch/XHR observed through `webRequest`.
- Dot and arcs: Beacon/Ping observed through `webRequest`.
- Center glyph: method.
- Top-right marker: Cookie header-name detection state.
- Top-left corner mark: cross-origin relation.

Each mechanism icon is 16px or 18px, approximately 4.2mm or 4.8mm at the CSS reference pixel density.

## Color

The implementation uses low-saturation graphite, plum-gray, sage-gray, and copper-gray. Color is never used for safety, danger, warning, or trust. Shape, line, dot, dash, and letter remain the primary carriers of meaning.

## Visibility policy

Communication pulses are shown only when:

- the setting is enabled; and
- viscosity is Level 2 or Level 3, or reporting mode is MAX.

MAX remains separate from viscosity Levels 1-3.

## Placement

The shared position order is:

```text
top
→ top-right
→ right
→ bottom-right
→ bottom
→ bottom-left
→ left
→ top-left
→ top
```

The factual-chip move handle dispatches a local position-change event so the communication-pulse host follows immediately on the current page. The selected position is persisted in `chrome.storage.local`.

## Log viewer

The log viewer reuses the same Coverage Manifest generator and renderer as the options page. The observation table has a mirrored top scrollbar synchronized with the native bottom scrollbar. A `ResizeObserver` updates the mirrored width when the table changes.

## Privacy boundary

Sprint 3.3 does not add permissions and does not widen the network filter. It does not request request bodies, inspect saved Cookies, enter the page main world, or inspect messages inside established WebSocket/WebTransport sessions.
