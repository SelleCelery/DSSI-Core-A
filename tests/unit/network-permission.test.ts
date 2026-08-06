import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  NETWORK_METADATA_PERMISSION_REQUEST,
  removeNetworkMetadataPermission,
} from '../../src/core/network-permission';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('network metadata permission boundary', () => {
  it('requests and removes only optional webRequest, never required host scope', () => {
    expect(NETWORK_METADATA_PERMISSION_REQUEST).toEqual({ permissions: ['webRequest'] });
    expect(NETWORK_METADATA_PERMISSION_REQUEST.origins).toBeUndefined();
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
  });

  it('removes the isolated optional permission when it is present', async () => {
    const remove = vi.fn().mockResolvedValue(true);
    vi.stubGlobal('chrome', {
      permissions: {
        contains: vi.fn().mockResolvedValue(true),
        remove,
      },
    });

    await expect(removeNetworkMetadataPermission()).resolves.toBe(true);
    expect(remove).toHaveBeenCalledWith({ permissions: ['webRequest'] });
  });
});
