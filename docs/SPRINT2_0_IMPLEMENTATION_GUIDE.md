# Sprint 2 Implementation Guide

## Purpose

Sprint 2 moves from input-surface observation to the declared submission boundary of standard HTML forms.

## Evidence stages

1. `submitter_activation_observed`: a trusted submit button or input was activated. This is a candidate, not proof of submission.
2. `enter_submit_candidate`: Enter was pressed inside a form. This is an inferred candidate because Enter does not always submit.
3. `submit_attempt`: a form `submit` event was observed. This confirms the browser-side form submission event, not network transmission or server receipt.

## Metadata retained

- HTTP method
- form encoding
- same-origin / cross-origin / non-HTTP / unknown relation
- destination scheme and host
- observation evidence and scope

DSSI intentionally does not retain the action path, query string, fragment, user information, form values, request body, or clipboard/input content.

## Blind spots

Sprint 2 does not yet observe `fetch`, `XMLHttpRequest`, WebSocket, beacon, service-worker interception, browser-native password-manager transport, or actual server receipt. A declared form action can also be changed by page scripts after observation.

## Manual test

Use `tests/fixtures/input-surfaces.html`. Forms cancel navigation so the event sequence remains visible in the session log.
