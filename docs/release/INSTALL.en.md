# ConnectBits Public Preview v0.5.0 — Install and Update

## 1. Distribution form

The public preview is distributed as an unpacked Chromium extension rather than through the Chrome Web Store.

Expected release artifacts:

- `ConnectBits-v0.5.0.zip`
- `ConnectBits-v0.5.0-unpacked/`

Extract the ZIP to a local working directory. Runtime packages do not include `node_modules`, source files, tests, or development configuration.

## 2. First installation

1. Extract the release ZIP.
2. Open `chrome://extensions` in Chrome or another Chromium-based browser.
3. Enable **Developer mode**.
4. Choose **Load unpacked**.
5. Select the directory that contains `manifest.json` at its root.
6. ConnectBits opens its local usage tutorial in a new tab.
7. Use the fictional shopping, video, and reading sites to review input-surface chips, communication pulses, and the basic observation-log reading flow.
8. From the final frame, continue to the purpose, observation boundary, Chrome permission, and responsibility review.
9. After reviewing the explanation, choose one of the following:
   - start with standard observation;
   - start without communication-metadata observation; or
   - do not start observation now.
10. Reload pages that were already open.

The tutorial does not present a skip button, but its tab can be closed at any time. If it is closed partway through, the last frame is stored locally and used the next time **Tutorial / continue** is opened. The extension does not repeatedly reopen the tutorial, and an update does not show it automatically. After completion, reopening the tutorial starts from the first frame.

Starting without communication metadata and leaving observation paused are normal setup paths. This choice can be changed at any time under **Settings & privacy**. Removing communication-metadata observation withdraws only the optional `webRequest` permission; limited page observation continues when that path remains selected.

## 3. Updating

1. Extract the new release to a new directory or replace the contents of the existing unpacked directory.
2. Open `chrome://extensions`.
3. Press **Reload** on the ConnectBits card.
4. Reload pages that were already open.

Reloading the extension does not guarantee that the new content script is injected into tabs that were already open. Reloading those pages is part of the update procedure.

## 4. Basic verification

- The ConnectBits toolbar popup opens.
- **Setup & privacy**, **Observation log**, and **Log Reader** link to each other.
- The popup and **Settings & privacy** can reopen or continue the tutorial.
- Communication pulses are available at viscosity Level 2 or higher, or in MAX mode.
- A JSON export can be loaded read-only in ConnectBits Log Reader.
- Network payloads, input contents, and Cookie values are absent from observation records.

## 5. Uninstalling

Remove ConnectBits from `chrome://extensions`. Log files exported before removal remain outside the extension and are not deleted automatically.

## 6. Known limits

- Network payloads are not requested or collected.
- Only Cookie-header presence state is detected; values are not collected.
- “Not detected” is not proof that no Cookie or other identifier exists.
- Messages inside established WebSocket or WebTransport sessions are outside the current observation surface.
- Missing pulses or records do not prove that no communication occurred.
- Logs support user judgment; they do not guarantee evidentiary value, completeness, or comprehensive coverage.
