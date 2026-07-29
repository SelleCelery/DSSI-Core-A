import type { NetworkDescriptor } from '../core/models/network';
import { loadSettings } from '../storage/settings-store';
import { FactChipPresenter } from '../ui/fact-chip';
import { InputSurfaceObserver } from './input-surface-observer';
import { SubmissionObserver } from './submission-observer';

interface NetworkActivityNotice {
  type: 'DSSI_NETWORK_ACTIVITY_NOTICE';
  descriptor: NetworkDescriptor;
  viscosityLevel: 1 | 2 | 3;
}

async function bootstrap(): Promise<void> {
  const settings = await loadSettings();
  if (!settings.enabled) return;

  const sessionId = crypto.randomUUID();
  const inputObserver = new InputSurfaceObserver(settings, sessionId);
  inputObserver.start();
  new SubmissionObserver(settings, sessionId).start();

  const presenter = new FactChipPresenter();
  chrome.runtime.onMessage.addListener((message: NetworkActivityNotice) => {
    if (message.type !== 'DSSI_NETWORK_ACTIVITY_NOTICE') return false;
    presenter.showNetwork(message.descriptor, message.viscosityLevel);
    return false;
  });

  chrome.storage.onChanged.addListener(
    (_changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
      if (areaName !== 'local') return;
      void loadSettings().then((updated) => {
        inputObserver.setNetworkObservationEnabled(
          updated.enabled && updated.networkObservationEnabled,
        );
      });
    },
  );
}

void bootstrap();
