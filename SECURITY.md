# Security Policy

DSSI Core A is under active development and has not yet reached a production security release.

## Reporting

Do not include passwords, payment data, private prompts, or other sensitive user content in a vulnerability report. Describe the minimum reproduction steps and affected version.

## Security boundaries

- No external DSSI-managed API is used.
- Raw input content must not enter persistent storage or logs.
- Permissions must remain limited to current implemented features.

- Optional network observation uses non-blocking browser metadata events only after runtime permission grant.
- Request bodies and headers are not requested.
- Full request URLs are transient API inputs and must be reduced before records are created.
- Observation records use a closed allowlist and are validated at three persistence boundaries.
- A missing network record is not proof that no communication occurred.
