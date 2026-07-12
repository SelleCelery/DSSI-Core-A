# DSSI Core A Privacy Baseline

> Status: Development baseline, not yet the final Chrome Web Store privacy policy.

DSSI Core A exists to strengthen user judgment. It must not become a new surveillance layer.

## Initial data handling

The Sprint 0 build processes and stores only what is required to operate the extension foundation:

- extension settings in `chrome.storage.local`
- metadata-only observation records in `chrome.storage.session`

The initial build does not send data to a DSSI-managed server.

## Prohibited persistence

The extension must not persist:

- typed field values
- passwords or authentication secrets
- payment card numbers
- clipboard contents
- prompt, comment, email, chat, or message bodies
- raw request bodies

## Observation boundary

DSSI Core A does not guarantee complete visibility into every page, frame, shadow tree, script, synchronization path, or network transmission. An absent warning is not a safety certification.

## User control

Users can disable the extension, change viscosity level, and clear the current session observation log.

## Sprint 1 input recognition

Sprint 1 observes structural browser events and field metadata. It does not read field values for logging or classification.

The implementation may inspect the field's type, autocomplete metadata, name, identifier, accessibility label, placeholder, associated label text, contenteditable state, and role. These structural strings are used locally to determine a category and are not stored in the observation log.

Input-origin classification is conservative. Keyboard and paste events can be confirmed from event evidence; autofill or password-manager use is recorded only as suspected when the browser does not expose a definitive source.
