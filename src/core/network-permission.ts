export const NETWORK_METADATA_API_PERMISSION: chrome.permissions.Permissions = {
  permissions: ['webRequest'],
};

export const NETWORK_METADATA_HOST_PERMISSION: chrome.permissions.Permissions = {
  origins: ['http://*/*', 'https://*/*'],
};

export const NETWORK_METADATA_PERMISSION_REQUEST: chrome.permissions.Permissions = {
  ...NETWORK_METADATA_API_PERMISSION,
  ...NETWORK_METADATA_HOST_PERMISSION,
};

export async function hasNetworkMetadataPermission(): Promise<boolean> {
  return chrome.permissions.contains(NETWORK_METADATA_PERMISSION_REQUEST);
}

export async function removeNetworkMetadataPermission(): Promise<boolean> {
  if (!(await chrome.permissions.contains(NETWORK_METADATA_API_PERMISSION))) return true;
  return chrome.permissions.remove(NETWORK_METADATA_API_PERMISSION);
}
