# Sprint 2.1 Implementation Guide

## Purpose

Sprint 2.1 refines the declared-form boundary after real-page testing exposed two ambiguities:

1. subframe initialization logs obscured user-relevant activity;
2. a submit-associated DOM control was too easily read as proof of the user's intended transmission.

## Frame boundary

The service worker enriches each record from `MessageSender`:

- `frameType`: `top` or `iframe`;
- `topLevelDomain`: host of the browser tab;
- `frameDomain`: host of the document where the observation occurred.

Page-start records from iframes are suppressed. Actual input and submission observations inside iframes remain logged with both domains.

## Submission association

Submission observations now distinguish:

- `declared_submit_control`: a trusted click occurred on a submit-capable element associated with a form;
- `enter_key_candidate`: Enter occurred in a form-associated control;
- `correlated_submit_event`: a submit event occurred on the same form within 1.5 seconds of a trusted candidate;
- `submit_event_without_prior_candidate`: a submit event was observed without a correlated prior candidate.

None of these states assert network transmission, server receipt, persistence, or safety.

## Privacy boundary

No control text, form values, request bodies, URL paths, query strings, fragments, or credentials are added. Frame metadata is limited to hostnames and top/iframe relation.
