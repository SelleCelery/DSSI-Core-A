import type { NetworkDescriptor } from '../core/models/network';
import {
  effectiveCueLevel,
  communicationPulseAvailable,
  type ViscosityLevel,
} from '../core/models/settings';
import {
  applyHostDisplayProfile,
  isHostDisplayProfileStale,
  loadHostDisplayProfile,
  markHostObserved,
} from '../storage/host-display-profile-store';
import { loadSettings } from '../storage/settings-store';
import { CommunicationPulsePresenter } from '../ui/communication-pulse';
import { FactChipPresenter } from '../ui/fact-chip';
import { initializeTransientDisplayState } from '../ui/transient-display-state';
import { InputSurfaceObserver } from './input-surface-observer';
import { SubmissionObserver } from './submission-observer';

interface NetworkActivityNotice {
  type: 'DSSI_NETWORK_ACTIVITY_NOTICE';
  descriptor: NetworkDescriptor;
  viscosityLevel: ViscosityLevel;
}

async function bootstrap(): Promise<void> {
  const hostname = location.hostname || 'unknown';
  const [globalSettings, hostProfile] = await Promise.all([
    loadSettings(),
    loadHostDisplayProfile(hostname),
  ]);
  const settings = applyHostDisplayProfile(globalSettings, hostProfile);
  if (!settings.enabled) return;

  initializeTransientDisplayState({
    communicationTextVisible: settings.communicationTextChipEnabled,
    pulseVisible: settings.communicationPulseEnabled,
  });

  const sessionId = crypto.randomUUID();
  const inputObserver = new InputSurfaceObserver(settings, sessionId);
  inputObserver.start();
  const submissionObserver = new SubmissionObserver(settings, sessionId);
  submissionObserver.start();

  const presenter = new FactChipPresenter(settings.factChipPosition, {
    hostname,
  });
  const pulsePresenter = new CommunicationPulsePresenter({
    hostname,
    position: settings.factChipPosition,
    durationMs: settings.communicationPulseDurationMs,
    size: settings.communicationPulseSize,
    enabled: communicationPulseAvailable(settings),
    domColor: settings.communicationPulseDomColor,
    webRequestColor: settings.communicationPulseWebRequestColor,
    opacity: settings.communicationPulseOpacity,
  });

  if (window.top === window) {
    const observed = await markHostObserved(hostname);
    if (observed.firstObservation) {
      presenter.showFirstHostObservation(effectiveCueLevel(settings));
    } else if (hostProfile && isHostDisplayProfileStale(hostProfile)) {
      presenter.showHostProfileReview(effectiveCueLevel(settings));
    }
  }

  if (settings.reportingMode === 'max_coverage' && window.top === window) {
    window.setTimeout(() => presenter.showCoverageBoundary(effectiveCueLevel(settings)), 2500);
  }

  chrome.runtime.onMessage.addListener((message: NetworkActivityNotice) => {
    if (message.type !== 'DSSI_NETWORK_ACTIVITY_NOTICE') return false;

    pulsePresenter.showNetwork(message.descriptor);
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
