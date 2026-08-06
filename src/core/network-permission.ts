export const NETWORK_METADATA_PERMISSION_REQUEST: chrome.permissions.Permissions = {
  permissions: ['webRequest'],
};

export async function hasNetworkMetadataPermission(): Promise<boolean> {
  return chrome.permissions.contains(NETWORK_METADATA_PERMISSION_REQUEST);
}

export async function removeNetworkMetadataPermission(): Promise<boolean> {
  if (!(await hasNetworkMetadataPermission())) return true;
  return chrome.permissions.remove(NETWORK_METADATA_PERMISSION_REQUEST);
}
