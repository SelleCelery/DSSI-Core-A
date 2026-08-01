import type { NetworkDescriptor } from '../core/models/network';
import { effectiveCueLevel, type ViscosityLevel } from '../core/models/settings';
import { loadSettings } from '../storage/settings-store';
import { FactChipPresenter } from '../ui/fact-chip';
import { InputSurfaceObserver } from './input-surface-observer';
import { SubmissionObserver } from './submission-observer';

interface NetworkActivityNotice {
  type: 'DSSI_NETWORK_ACTIVITY_NOTICE';
  descriptor: NetworkDescriptor;
  viscosityLevel: ViscosityLevel;
}

async function bootstrap(): Promise<void> {
  const settings = await loadSettings();
  if (!settings.enabled) return;

  const sessionId = crypto.randomUUID();
  const inputObserver = new InputSurfaceObserver(settings, sessionId);
  inputObserver.start();
  const submissionObserver = new SubmissionObserver(settings, sessionId);
  submissionObserver.start();

  const presenter = new FactChipPresenter(settings.factChipPosition);
  if (settings.reportingMode === 'max_coverage' && window.top === window) {
    presenter.showCoverageBoundary(effectiveCueLevel(settings));
  }

  chrome.runtime.onMessage.addListener((message: NetworkActivityNotice) => {
    if (message.type !== 'DSSI_NETWORK_ACTIVITY_NOTICE') return false;
    if (message.descriptor.correlation === 'no_correlated_user_operation') {
      presenter.queueDiagnosticNetwork(message.descriptor, message.viscosityLevel);
    } else {
      presenter.showNetwork(message.descriptor, message.viscosityLevel);
    }
    return false;
  });

  chrome.storage.onChanged.addListener(
    (_changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
      if (areaName !== 'local') return;
      void loadSettings().then((updated) => {
        const networkEnabled = updated.enabled && updated.networkObservationEnabled;
        inputObserver.setNetworkObservationEnabled(networkEnabled);
        submissionObserver.setNetworkObservationEnabled(networkEnabled);
      });
    },
  );
}

void bootstrap();
