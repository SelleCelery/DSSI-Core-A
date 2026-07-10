# ADR-0001: Core A is a browser extension

- Status: Accepted
- Date: 2026-07-11

## Context

Core A must observe browser action surfaces as early as possible: focus, input, paste, submit, navigation, download, and consent.

## Decision

Core A will be implemented first as a Chromium Manifest V3 extension using TypeScript. Python or a native companion is not a required dependency for the initial product.

## Consequences

- DOM and browser-action observation remain close to the user interaction surface.
- Installation and distribution are simpler than a desktop companion application.
- OS-level observation and complete network interception remain outside Core A.
- Native or Python components may be evaluated later only for specific validated blind spots.
