import type { ConfigurationChangeSource } from '../core/models/configuration';
import type { DisplaySettingsBundle } from '../core/models/display-memory';
import {
  isSettingsMemoryResponse,
  type SessionDisplayDraftWriteMessage,
  type SettingsMemoryResponse,
  type SettingsMemoryWriteMessage,
} from '../core/models/settings-memory';
import type { DssiSettings } from '../core/models/settings';

async function sendMemoryMessage(message: unknown): Promise<SettingsMemoryResponse> {
  const response: unknown = await chrome.runtime.sendMessage(message);
  if (!isSettingsMemoryResponse(response)) {
    throw new TypeError('Invalid settings-memory response');
  }
  return response;
}

export function readSettingsMemory(hostname?: string): Promise<SettingsMemoryResponse> {
  return sendMemoryMessage({
    type: 'DSSI_SETTINGS_MEMORY_READ',
    ...(hostname === undefined ? {} : { hostname }),
  });
}

export function writeGlobalSettingsPatch(
  patch: Partial<DssiSettings>,
  changedFrom: ConfigurationChangeSource,
): Promise<SettingsMemoryResponse> {
  const message: SettingsMemoryWriteMessage = {
    type: 'DSSI_SETTINGS_MEMORY_WRITE',
    operationId: crypto.randomUUID(),
    destination: { kind: 'global' },
    action: 'patch',
    changedFrom,
    patch,
  };
  return sendMemoryMessage(message);
}

export function saveHostDisplayPatch(
  hostname: string,
  baseRevision: string,
  patch: Partial<DisplaySettingsBundle>,
): Promise<SettingsMemoryResponse> {
  const message: SettingsMemoryWriteMessage = {
    type: 'DSSI_SETTINGS_MEMORY_WRITE',
    operationId: crypto.randomUUID(),
    destination: { kind: 'host', hostname },
    action: 'save',
    baseRevision,
    patch,
  };
  return sendMemoryMessage(message);
}

export function removeHostDisplayMemory(
  hostname: string,
  baseRevision: string,
): Promise<SettingsMemoryResponse> {
  const message: SettingsMemoryWriteMessage = {
    type: 'DSSI_SETTINGS_MEMORY_WRITE',
    operationId: crypto.randomUUID(),
    destination: { kind: 'host', hostname },
    action: 'remove',
    baseRevision,
    patch: {},
  };
  return sendMemoryMessage(message);
}

export function persistSessionDisplayDraft(
  hostname: string,
  baseRevision: string,
  patch: Partial<DisplaySettingsBundle>,
): Promise<SettingsMemoryResponse> {
  const message: SessionDisplayDraftWriteMessage = {
    type: 'DSSI_SESSION_DISPLAY_DRAFT_WRITE',
    operationId: crypto.randomUUID(),
    hostname,
    action: Object.keys(patch).length === 0 ? 'remove' : 'save',
    baseRevision,
    patch,
  };
  return sendMemoryMessage(message);
}
