import type { NetworkDescriptor } from '../core/models/network';
import {
  effectiveCueLevel,
  communicationPulseAvailable,
  type ViscosityLevel,
} from '../core/models/settings';
import {
  HOST_PROFILE_REVIEW_AFTER_MS,
  markHostObserved,
} from '../storage/host-display-profile-store';
import { browserUiLanguage, resolveUiLanguage } from '../i18n/ui';
import { readSettingsMemory } from '../storage/settings-memory-client';
import { CommunicationPulsePresenter } from '../ui/communication-pulse';
import { DisplayStateController } from '../ui/display-state-controller';
import { FactChipPresenter } from '../ui/fact-chip';
import { InputSurfaceObserver } from './input-surface-observer';
import { SubmissionObserver } from './submission-observer';
import { applyRuntimeSettings } from './runtime-settings';

interface NetworkActivityNotice {
  type: 'DSSI_NETWORK_ACTIVITY_NOTICE';
  descriptor: NetworkDescriptor;
  viscosityLevel: ViscosityLevel;
}

async function bootstrap(): Promise<void> {
  const hostname = location.hostname || 'unknown';
  const initialMemory = await readSettingsMemory(hostname);
  const displayController = new DisplayStateController(hostname, initialMemory);
  const settings = displayController.snapshot().settings;
  const language = resolveUiLanguage(settings.uiLanguage, browserUiLanguage());

  const sessionId = crypto.randomUUID();
  const inputObserver = new InputSurfaceObserver(settings, sessionId, displayController);
  inputObserver.start();
  const submissionObserver = new SubmissionObserver(settings, sessionId, displayController);
  submissionObserver.start();

  const presenter = new FactChipPresenter(displayController, settings.factChipPosition, language);
  const pulsePresenter = new CommunicationPulsePresenter({
    displayController,
    hostname,
    position: settings.factChipPosition,
    durationMs: settings.communicationPulseDurationMs,
    size: settings.communicationPulseSize,
    enabled: settings.enabled && communicationPulseAvailable(settings),
    domColor: settings.communicationPulseDomColor,
    webRequestColor: settings.communicationPulseWebRequestColor,
    opacity: settings.communicationPulseOpacity,
    language,
  });

  if (settings.enabled && window.top === window) {
    const observed = await markHostObserved(hostname);
    if (observed.firstObservation) {
      presenter.showFirstHostObservation(effectiveCueLevel(settings));
    } else if (
      initialMemory.reaction.source.kind === 'host' &&
      Date.now() - initialMemory.reaction.updatedAt >= HOST_PROFILE_REVIEW_AFTER_MS
    ) {
      presenter.showHostProfileReview(effectiveCueLevel(settings));
    }
  }

  if (settings.enabled && settings.reportingMode === 'max_coverage' && window.top === window) {
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

  displayController.subscribe((view) => {
    const updated = view.settings;
    const transition = applyRuntimeSettings(settings, updated);

    inputObserver.updateSettings(updated);
    submissionObserver.updateSettings(updated);
    pulsePresenter.update({
      position: updated.factChipPosition,
      durationMs: updated.communicationPulseDurationMs,
      size: updated.communicationPulseSize,
      enabled: updated.enabled && communicationPulseAvailable(updated),
      domColor: updated.communicationPulseDomColor,
      webRequestColor: updated.communicationPulseWebRequestColor,
      opacity: updated.communicationPulseOpacity,
      language: resolveUiLanguage(updated.uiLanguage, browserUiLanguage()),
    });

    if (
      transition.becameEnabled &&
      updated.reportingMode === 'max_coverage' &&
      window.top === window
    ) {
      window.setTimeout(() => presenter.showCoverageBoundary(effectiveCueLevel(updated)), 250);
    }
  });

  chrome.storage.onChanged.addListener(
    (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
      if (areaName !== 'local') return;
      if (
        changes.connectBitsConfiguration === undefined &&
        changes.dssiSettings === undefined &&
        changes.connectBitsHostDisplayMemories === undefined &&
        changes.dssiHostDisplayProfiles === undefined
      ) {
        return;
      }
      void displayController.refresh();
    },
  );
}

void bootstrap();
