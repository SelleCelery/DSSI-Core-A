import { afterEach, describe, expect, it, vi } from 'vitest';
import manifest from '../../src/manifest/manifest.json';
import {
  NETWORK_METADATA_API_PERMISSION,
  NETWORK_METADATA_HOST_PERMISSION,
  NETWORK_METADATA_PERMISSION_REQUEST,
  hasNetworkMetadataPermission,
  removeNetworkMetadataPermission,
} from '../../src/core/network-permission';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('network metadata permission boundary', () => {
  it('requests both webRequest and the host access required by webRequest', () => {
    expect(NETWORK_METADATA_API_PERMISSION).toEqual({ permissions: ['webRequest'] });
    expect(NETWORK_METADATA_HOST_PERMISSION).toEqual({
      origins: ['http://*/*', 'https://*/*'],
    });
    expect(NETWORK_METADATA_PERMISSION_REQUEST).toEqual({
      permissions: ['webRequest'],
      origins: ['http://*/*', 'https://*/*'],
    });
  });

  it('declares the requested host access as optional in the manifest', () => {
    expect(manifest.optional_permissions).toEqual(['webRequest']);
    expect(manifest.optional_host_permissions).toEqual(['http://*/*', 'https://*/*']);
  });

  it('confirms the complete permission bundle before enabling the listener', async () => {
    const contains = vi.fn().mockResolvedValue(true);
    vi.stubGlobal('chrome', { permissions: { contains } });

    await expect(hasNetworkMetadataPermission()).resolves.toBe(true);
    expect(contains).toHaveBeenCalledWith(NETWORK_METADATA_PERMISSION_REQUEST);
  });

  it('skips removal when optional webRequest is already absent', async () => {
    const remove = vi.fn();
    vi.stubGlobal('chrome', {
      permissions: {
        contains: vi.fn().mockResolvedValue(false),
        remove,
      },
    });

    await expect(removeNetworkMetadataPermission()).resolves.toBe(true);
    expect(remove).not.toHaveBeenCalled();
    expect(chrome.permissions.contains).toHaveBeenCalledWith(NETWORK_METADATA_API_PERMISSION);
  });

  it('removes only webRequest while retaining the host scope shared with content scripts', async () => {
    const remove = vi.fn().mockResolvedValue(true);
    vi.stubGlobal('chrome', {
      permissions: {
        contains: vi.fn().mockResolvedValue(true),
        remove,
      },
    });

    await expect(removeNetworkMetadataPermission()).resolves.toBe(true);
    expect(remove).toHaveBeenCalledWith(NETWORK_METADATA_API_PERMISSION);
    expect(remove).not.toHaveBeenCalledWith(NETWORK_METADATA_PERMISSION_REQUEST);
  });
});
