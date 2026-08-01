# Security Policy

DSSI Core A is under active development and has not yet reached a production security release.

## Reporting

Do not include passwords, payment data, private prompts, or other sensitive user content in a vulnerability report. Describe the minimum reproduction steps and affected version.

## Security boundaries

- No external DSSI-managed API is used.
- Raw input content must not enter persistent storage or logs.
- Permissions must remain limited to current implemented features.

- Optional network observation uses non-blocking browser metadata events only after runtime permission grant.
- Request bodies are not requested. Request headers are observed only to detect the `Cookie` header name; header values must not be accessed by DSSI logic or persisted.
- Full request URLs are transient API inputs and must be reduced before records are created.
- Observation records use a closed allowlist and are validated at three persistence boundaries.
- A missing network record is not proof that no communication occurred.

## Sprint 3.4 export boundary

- Host display profiles alter presentation density only; they must not be treated as trust or safety decisions.
- Communication-display controls must not suppress viscosity-bound attention cues.
- Exported JSON and CSV files contain metadata-only DSSI primary observation records and associated observation context.
- Version 0.4.6 does not provide encryption, digital signatures, authenticated integrity, write protection, or tamper-evident verification for exported files.
- A JSON `integrity.status` value of `not_provided` is explicit; it must not be interpreted as a successful integrity check.
- Exported files can be modified after download. DSSI must not claim that a later file is unchanged or that it proves intent, responsibility, communication content, harmfulness, or safety.
- Future encryption or signing work must preserve user control over keys, disclosure, deletion, and verification, and must be designed against coercive monitoring and responsibility attribution.
