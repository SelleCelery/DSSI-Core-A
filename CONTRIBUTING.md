# Contributing to DSSI Core A

DSSI Core A accepts changes that strengthen user awareness without substituting user judgment.

## Required checks

Before submitting a change:

```bash
npm install
npm run check
```

## Privacy boundary

A contribution must not persist or transmit:

- field values
- passwords or authentication secrets
- payment numbers
- clipboard contents
- prompt, comment, email, chat, or message bodies
- raw request bodies

Observation logs must contain structural metadata only.

## Message boundary

Use factual statements such as:

> This form sends to a different origin.

Do not use unsupported judgments such as:

> This site is dangerous.

## Permissions

Do not add permissions for planned future features. Each permission must be required by current implemented functionality and documented in the same change.
