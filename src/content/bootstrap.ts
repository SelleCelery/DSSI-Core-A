import { loadSettings } from '../storage/settings-store';
import type { ObservationLogRecord } from '../core/models/observation';

function createId(): string {
  return crypto.randomUUID();
}

function domainKey(): string {
  return location.hostname || 'unknown';
}

async function reportPageObservation(): Promise<void> {
  const settings = await loadSettings();
  if (!settings.enabled) return;

  const record: ObservationLogRecord = {
    eventId: createId(),
    timestamp: Date.now(),
    sessionId: createId(),
    domainKey: domainKey(),
    surfaceType: 'page',
    triggerType: 'page_observation_started',
    observability: 'partially_observable',
    viscosityLevel: settings.viscosityLevel,
    cuePresented: false,
  };

  await chrome.runtime.sendMessage({
    type: 'DSSI_OBSERVATION_RECORD',
    record,
  });
}

void reportPageObservation();
