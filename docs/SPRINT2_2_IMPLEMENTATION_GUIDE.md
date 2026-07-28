# Sprint 2.2 Implementation Guide

## Purpose

Sprint 2.2 separates observations needed for user judgment from records needed only to diagnose extension behavior.

## Log layers

- **Activity log**: focus, input-origin evidence, paste evidence, and form-submission boundary observations.
- **Diagnostic log**: content-script page-start records. These do not imply user input or transmission.

Top-frame page starts for the same tab and domain are suppressed when repeated within five seconds. Embedded-frame page-start records remain suppressed entirely; actual embedded-frame interactions are still recorded in the activity log.

## Frame terminology

- `top`: displayed as **トップフレーム**.
- `iframe`: displayed as **埋め込みフレーム** with top-level and frame domains.

The labels describe browser document structure, not which service is socially or functionally primary.

## Unknown input surfaces

When a surface cannot be classified, DSSI may record only:

- tag name;
- input `type`;
- ARIA `role`;
- whether it is `contenteditable`;
- syntactically valid autocomplete tokens.

DSSI does not include `name`, `id`, label text, placeholder text, or input values in this diagnostic structure.

## Files

- `src/storage/session-buffer.ts`: separate activity and diagnostic stores.
- `src/background/service-worker.ts`: frame enrichment and page-start suppression.
- `src/logs/logs.ts`: log-layer switching and clearing.
- `src/content/surface-descriptor.ts`: privacy-safe unknown-surface structure.
- `src/core/observation-presentation.ts`: frame and structure labels.

## Known limits

- Duplicate suppression uses tab, domain, and a five-second time window; it is not a proof that two starts belong to the same document.
- The diagnostic layer is still session-local and not an audit trail.
- Unknown-surface structure improves classification debugging but does not identify the semantic purpose of the field.
