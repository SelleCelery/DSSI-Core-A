# ConnectBits / DSSI Core A Security Policy

ConnectBits, developed under DSSI Core A, is under active development and has not yet reached a production security release.

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

## v0.5 local Reader and release boundary

- The Log Reader must accept only a user-selected local JSON file and must not evaluate code, load an external URL, write back to the source file, or transmit the file.
- Reader rendering must use DOM text nodes rather than untrusted HTML insertion.
- The first-run setup must request optional network permission only from an explicit user action and must provide an equal path to start without it.
- UI localization must not alter internal record values or weaken the meaning of privacy-boundary states.
- Release packaging must include only the built extension, its local tutorial asset, localization messages, icons, and installation note. Source, tests, `node_modules`, local logs, and working archives are excluded.
- ConnectBits v0.5 remains a public preview and does not provide automatic update signing, forensic integrity, or evidentiary preservation.

## Development dependency audit

As of 2026-08-05, this package has development dependencies only and no npm runtime dependencies. `npm audit --omit=dev` reports no vulnerabilities. The full development-tree audit still reports unresolved advisories in transitive tooling:

- `brace-expansion`, reached through ESLint and `minimatch`
- `postcss`, reached through Vitest, Vite, and `@vitest/coverage-v8`

These packages are not copied into the distributable browser-extension directory. This separation does not erase development-environment risk. Until upstream fixes are available and adopted, maintainers should avoid running the toolchain against untrusted repository contents or untrusted source-map references, re-run the audit before release, and keep generated source maps outside the distributable package.
