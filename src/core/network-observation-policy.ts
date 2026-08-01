/**
 * Closed Sprint 3.2 network-observation policy.
 * Request bodies are never requested. Request headers are transiently
 * requested only so DSSI can inspect header names for `Cookie`; values are
 * not accessed by DSSI logic and are never copied, logged, displayed, or
 * persisted. `extraHeaders` is required for Chrome to expose Cookie.
 */
export const NETWORK_URL_PATTERNS = ['http://*/*', 'https://*/*'] as const;
export const NETWORK_RESOURCE_TYPES = ['xmlhttprequest', 'ping'] as const;
export const NETWORK_REQUEST_HEADER_EXTRA_INFO_SPEC = ['requestHeaders', 'extraHeaders'] as const;

export const NETWORK_DATA_POLICY = Object.freeze({
  requestBody: 'not_requested',
  requestHeaders: 'transient_name_inspection_only',
  requestHeaderValues: 'not_accessed_or_retained_by_dssi_logic',
  responseHeaders: 'not_requested',
  responseBody: 'not_observable',
  rawUrlPersistence: 'prohibited',
  retainedLocator: 'scheme_and_host_only',
  cookieRetention: 'detection_state_only',
} as const);
