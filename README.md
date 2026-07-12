# DSSI Core A

DSSI Core A is an awareness-first cognitive safety layer for Chromium browsers.

> 最後に止めるのではなく、最初に気づけるようにする。

The extension is designed to present observable facts and observation limits before or during high-impact browser actions. It does not substitute the user's judgment and does not claim complete interception or complete safety.

## Status

Sprint 1 — Input Recognition

This repository currently provides:

- Manifest V3 extension scaffold
- TypeScript and esbuild build pipeline
- password / email-ID / payment / personal-information / free-text classification
- focus, keyboard, paste, input, and dynamically-added field observation
- conservative input-origin inference
- viscosity-controlled factual chips
- local settings and session-only metadata log
- privacy-safe logger with prohibited raw-data guards
- lint, format, typecheck, test, and build commands

Sprint 1 establishes the first product loop: an action surface is touched, classified, logged as metadata, and—when policy permits—explained by a short factual chip.

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

See [PRIVACY.md](./PRIVACY.md), [the Sprint 1 implementation guide](./docs/SPRINT1_IMPLEMENTATION_GUIDE.md), and the product documents under [docs/product](./docs/product).

## License

GNU General Public License v3.0 or later. See [LICENSE](./LICENSE).
