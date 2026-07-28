# DSSI Core A

DSSI Core A is an awareness-first cognitive safety layer for Chromium browsers.

> 最後に止めるのではなく、最初に気づけるようにする。

The extension is designed to present observable facts and observation limits before or during high-impact browser actions. It does not substitute the user's judgment and does not claim complete interception or complete safety.

## Status

Sprint 2.1 — Frame and Submission Correlation

This repository currently provides:

- Manifest V3 extension scaffold
- TypeScript and esbuild build pipeline
- password / email-ID / payment / personal-information / free-text classification
- focus, keyboard, paste, input, and dynamically-added field observation
- trusted-event correlation and conservative input-origin inference
- viscosity-controlled factual chips
- local settings and session-only metadata log
- popup summary and complete observation-log viewer
- separate operation evidence, classification confidence, and boundary observation scope
- two-stage paste observation: event observed and reflection confirmed
- top-frame / iframe context with subframe start-noise suppression
- same-form correlation between submit candidates and later submit events
- Level 3 factual chips for inferred input route
- privacy-safe logger with prohibited raw-data guards
- lint, format, typecheck, test, and build commands

Sprint 2.1 additionally distinguishes main-page and iframe activity, suppresses iframe initialization noise, and separates DOM-level submit controls from submit events correlated on the same form. It still does not claim network transmission or server receipt.

## Requirements

- Node.js 20 or later
- npm 10 or later
- Chrome or a Chromium-based browser

## Development

```bash
npm install
npm run check
```

The built extension is written to `dist/`.

### Load as an unpacked extension

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Choose **Load unpacked**.
4. Select this repository's `dist/` directory.

## Privacy baseline

The initial build does not persist:

- field values
- passwords
- payment numbers
- clipboard contents
- prompt, comment, email, or message bodies
- raw request bodies

The session log stores structural metadata only and can be cleared from the options page.

See [PRIVACY.md](./PRIVACY.md), [the Sprint 1 implementation guide](./docs/SPRINT1_IMPLEMENTATION_GUIDE.md), [the Sprint 1.1 implementation guide](./docs/SPRINT1_1_IMPLEMENTATION_GUIDE.md), [the Sprint 1.2 implementation guide](./docs/SPRINT1_2_IMPLEMENTATION_GUIDE.md), [the Sprint 2 implementation guide](./docs/SPRINT2_IMPLEMENTATION_GUIDE.md), [the Sprint 2.1 implementation guide](./docs/SPRINT2_1_IMPLEMENTATION_GUIDE.md), and the product documents under [docs/product](./docs/product).

## License

GNU General Public License v3.0 or later. See [LICENSE](./LICENSE).

## Sprint 2: submission boundary

DSSI now observes standard HTML form submission surfaces and records only declared metadata: method, encoding, and destination relation/host. It distinguishes submit-control activation, Enter-key candidates, and trusted submit events. It does not read form values, query values, request bodies, fetch/XHR traffic, service-worker traffic, or server receipt.

## Sprint 2.1: real-page refinement

Real-page tests showed that embedded frames and DOM submit associations needed separate treatment. Sprint 2.1 records top-frame and iframe context, suppresses iframe page-start-only noise, and identifies whether a submit event was correlated with a prior trusted click or Enter candidate on the same form.
