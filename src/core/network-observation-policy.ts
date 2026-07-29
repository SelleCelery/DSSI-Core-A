/**
 * Closed Sprint 3 network-observation policy.
 * The webRequest listener intentionally does not request requestBody or headers.
 */
export const NETWORK_URL_PATTERNS = ['http://*/*', 'https://*/*'] as const;
export const NETWORK_RESOURCE_TYPES = ['xmlhttprequest', 'ping'] as const;
export const NETWORK_EXTRA_INFO_SPEC = [] as const;

export const NETWORK_DATA_POLICY = Object.freeze({
  requestBody: 'not_requested',
  requestHeaders: 'not_requested',
  responseHeaders: 'not_requested',
  responseBody: 'not_observable',
  rawUrlPersistence: 'prohibited',
  retainedLocator: 'scheme_and_host_only',
} as const);
