# Permission Strategy

## Sprint 0 development manifest

The development manifest loads the content script on HTTP and HTTPS pages so the always-on awareness model can be tested.

## Release rule

Before store submission, each permission and match pattern must be reviewed against:

- the extension's single disclosed purpose,
- the narrowest access needed by current functionality,
- user-facing disclosure,
- the privacy policy,
- and Chrome Web Store declarations.

Network and download permissions are not included in Sprint 0. They will be evaluated only when their corresponding features are implemented.
