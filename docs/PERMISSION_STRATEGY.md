# Permission Strategy

## Base development manifest

The development manifest loads the content script on HTTP and HTTPS pages so the always-on awareness model can be tested.

Required extension permission:

- `storage` — local settings and session-only observation metadata

The content-script match pattern is broad because the current product purpose is cross-site early awareness. This scope must be reviewed again before store distribution.

## Sprint 3 optional network capability

Network metadata observation is disabled by default.

When the user enables it from the options page, DSSI requests:

- optional permission: `webRequest`
- optional host permissions: `http://*/*`, `https://*/*`

The request starts directly from the user's settings-page click. Disabling the setting removes the optional capability.

The permission is used only for non-blocking request-start metadata observation. DSSI does not request `webRequestBlocking`, request-body access, or header access.

## Release rule

Before store submission, each permission and match pattern must be reviewed against:

- the extension's single disclosed purpose,
- the narrowest access needed by current functionality,
- user-facing disclosure,
- the privacy policy,
- the difference between required and optional capabilities,
- and Chrome Web Store declarations.

The broad optional host permission is a development baseline, not a final distribution decision. Before release, compare:

- all-site optional access,
- site-selective access,
- active-tab-only modes,
- and whether the feature should be excluded from the first public build.

Download permissions remain unrequested until the corresponding feature is implemented.
