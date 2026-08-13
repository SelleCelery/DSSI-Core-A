import type { ConfigurationChangeSource } from './configuration';
import type { DisplayMemoryReaction, DisplaySettingsBundle } from './display-memory';
import { isDisplaySettingsPatch } from './display-memory';
import type { DssiSettings } from './settings';

export interface SettingsMemoryReadMessage {
  type: 'DSSI_SETTINGS_MEMORY_READ';
  hostname?: string;
}

export interface GlobalSettingsMemoryWriteMessage {
  type: 'DSSI_SETTINGS_MEMORY_WRITE';
  operationId: string;
  destination: { kind: 'global' };
  action: 'patch';
  changedFrom: ConfigurationChangeSource;
  patch: Partial<DssiSettings>;
}

export interface HostDisplayMemoryWriteMessage {
  type: 'DSSI_SETTINGS_MEMORY_WRITE';
  operationId: string;
  destination: { kind: 'host'; hostname: string };
  action: 'save' | 'remove';
  baseRevision: string;
  patch: Partial<DisplaySettingsBundle>;
}

export type SettingsMemoryWriteMessage =
  GlobalSettingsMemoryWriteMessage | HostDisplayMemoryWriteMessage;

export type SettingsMemoryMessage = SettingsMemoryReadMessage | SettingsMemoryWriteMessage;

export interface SettingsMemoryResponse {
  ok: boolean;
  settings: DssiSettings;
  reaction: DisplayMemoryReaction;
  operationId?: string;
  reason?: 'conflict' | 'invalid_command' | 'storage_error';
}

const CHANGE_SOURCES: readonly ConfigurationChangeSource[] = [
  'onboarding',
  'popup',
  'options',
  'permission_event',
  'migration',
];

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isDestination(value: unknown): value is SettingsMemoryWriteMessage['destination'] {
  if (!isObject(value)) return false;
  if (value.kind === 'global') return true;
  return value.kind === 'host' && typeof value.hostname === 'string';
}

export function isSettingsMemoryReadMessage(value: unknown): value is SettingsMemoryReadMessage {
  if (!isObject(value) || value.type !== 'DSSI_SETTINGS_MEMORY_READ') return false;
  return value.hostname === undefined || typeof value.hostname === 'string';
}

export function isSettingsMemoryWriteMessage(value: unknown): value is SettingsMemoryWriteMessage {
  if (
    !isObject(value) ||
    value.type !== 'DSSI_SETTINGS_MEMORY_WRITE' ||
    typeof value.operationId !== 'string' ||
    !isDestination(value.destination) ||
    !isObject(value.patch)
  ) {
    return false;
  }

  if (value.destination.kind === 'global') {
    return (
      value.action === 'patch' &&
      typeof value.changedFrom === 'string' &&
      CHANGE_SOURCES.includes(value.changedFrom as ConfigurationChangeSource)
    );
  }

  return (
    (value.action === 'save' || value.action === 'remove') &&
    typeof value.baseRevision === 'string' &&
    isDisplaySettingsPatch(value.patch)
  );
}

export function isSettingsMemoryResponse(value: unknown): value is SettingsMemoryResponse {
  if (!isObject(value) || typeof value.ok !== 'boolean') return false;
  return isObject(value.settings) && isObject(value.reaction);
}
