import type { ObservationSelection } from '../core/models/settings';
import { settingsForObservationSelection } from '../core/models/settings';
import {
  NETWORK_METADATA_PERMISSION_REQUEST,
  removeNetworkMetadataPermission,
} from '../core/network-permission';
import {
  browserUiLanguage,
  applyDocumentTranslations,
  resolveUiLanguage,
  t,
  type UiLanguage,
  type UiLanguageSetting,
} from '../i18n/ui';
import { readSettingsMemory, writeGlobalSettingsPatch } from '../storage/settings-memory-client';
import {
  completeOnboardingState,
  loadOnboardingState,
  recordOnboardingPresentation,
  saveOnboardingState,
  type OnboardingReviewMarks,
  type OnboardingState,
} from '../storage/onboarding-store';
import { requiredElement } from '../ui/required-element';

const uiLanguage = requiredElement<HTMLSelectElement>('#uiLanguage');
const stepLabel = requiredElement<HTMLElement>('#stepLabel');
const stepProgress = requiredElement<HTMLProgressElement>('#stepProgress');
const previousStepButton = requiredElement<HTMLButtonElement>('#previousStep');
const nextStepButton = requiredElement<HTMLButtonElement>('#nextStep');
const decideLaterButton = requiredElement<HTMLButtonElement>('#decideLater');
const allowNetworkButton = requiredElement<HTMLButtonElement>('#allowNetwork');
const startLocalOnlyButton = requiredElement<HTMLButtonElement>('#startLocalOnly');
const pauseObservationButton = requiredElement<HTMLButtonElement>('#pauseObservation');
const resetReviewMarksButton = requiredElement<HTMLButtonElement>('#resetReviewMarks');
const networkPermissionDialog = requiredElement<HTMLDialogElement>('#networkPermissionDialog');
const networkPermissionStatus = requiredElement<HTMLElement>('#networkPermissionStatus');
const cancelNetworkPermissionButton = requiredElement<HTMLButtonElement>(
  '#cancelNetworkPermission',
);
const requestNetworkPermissionButton = requiredElement<HTMLButtonElement>(
  '#requestNetworkPermission',
);
const completion = requiredElement<HTMLElement>('#completion');
const wizardControls = requiredElement<HTMLElement>('#wizardControls');
const status = requiredElement<HTMLElement>('#status');
const openObservationLog = requiredElement<HTMLButtonElement>('#openObservationLog');
const openSetupAfter = requiredElement<HTMLButtonElement>('#openSetupAfter');

const reviewMarks: Readonly<Record<keyof OnboardingReviewMarks, HTMLInputElement>> = {
  judgmentBoundary: requiredElement<HTMLInputElement>('#ackJudgment'),
  observationScope: requiredElement<HTMLInputElement>('#ackObservationScope'),
  observationAbsence: requiredElement<HTMLInputElement>('#ackObservationAbsence'),
  permissionDifference: requiredElement<HTMLInputElement>('#ackPermissionDifference'),
  evidenceBoundary: requiredElement<HTMLInputElement>('#ackEvidenceBoundary'),
  highImpactBoundary: requiredElement<HTMLInputElement>('#ackHighImpactBoundary'),
  exportBoundary: requiredElement<HTMLInputElement>('#ackExportBoundary'),
};

let currentStep = 1;
let language: UiLanguage = 'ja';
let onboardingState: OnboardingState | undefined;
let stateSaveChain = Promise.resolve();

function asUiLanguageSetting(value: string): UiLanguageSetting {
  return value === 'ja' || value === 'en' ? value : 'auto';
}

function currentReviewMarks(): OnboardingReviewMarks {
  return {
    judgmentBoundary: reviewMarks.judgmentBoundary.checked,
    observationScope: reviewMarks.observationScope.checked,
    observationAbsence: reviewMarks.observationAbsence.checked,
    permissionDifference: reviewMarks.permissionDifference.checked,
    evidenceBoundary: reviewMarks.evidenceBoundary.checked,
    highImpactBoundary: reviewMarks.highImpactBoundary.checked,
    exportBoundary: reviewMarks.exportBoundary.checked,
  };
}

function ensurePresentationState(): OnboardingState {
  onboardingState ??= recordOnboardingPresentation(undefined, Date.now());
  return onboardingState;
}

function queueOnboardingStateSave(nextState: OnboardingState): void {
  onboardingState = nextState;
  stateSaveChain = stateSaveChain
    .then(() => saveOnboardingState(nextState))
    .catch(() => {
      status.textContent = t(language, 'statusReviewMarkSaveError');
    });
}

function persistReviewMarks(): void {
  queueOnboardingStateSave({
    ...ensurePresentationState(),
    reviewMarks: currentReviewMarks(),
  });
}

function renderStep(): void {
  for (const section of document.querySelectorAll<HTMLElement>('.onboarding-step')) {
    section.hidden = Number(section.dataset.step) !== currentStep;
  }
  stepProgress.value = currentStep;
  stepLabel.textContent = `${t(language, 'step')} ${currentStep} / 4`;
  previousStepButton.disabled = currentStep === 1;
  nextStepButton.hidden = currentStep === 4;
  decideLaterButton.hidden = currentStep === 4;
}

function applyLanguage(next: UiLanguage): void {
  language = next;
  applyDocumentTranslations(document, language);
  renderStep();
}

async function persistLanguage(setting: UiLanguageSetting): Promise<void> {
  const response = await writeGlobalSettingsPatch({ uiLanguage: setting }, 'onboarding');
  if (!response.ok) throw new Error(response.reason ?? 'settings memory write failed');
  applyLanguage(resolveUiLanguage(setting, browserUiLanguage()));
}

async function complete(observationSelection: ObservationSelection): Promise<void> {
  const current = (await readSettingsMemory()).settings;
  const selection = settingsForObservationSelection(current, observationSelection);
  const response = await writeGlobalSettingsPatch(
    {
      enabled: selection.enabled,
      networkObservationEnabled: selection.networkObservationEnabled,
    },
    'onboarding',
  );
  if (!response.ok) throw new Error(response.reason ?? 'settings memory write failed');

  await stateSaveChain;
  const completedState = completeOnboardingState(
    ensurePresentationState(),
    observationSelection,
    Date.now(),
    currentReviewMarks(),
  );
  onboardingState = completedState;
  await saveOnboardingState(completedState);

  for (const section of document.querySelectorAll<HTMLElement>('.onboarding-step')) {
    section.hidden = true;
  }
  wizardControls.hidden = true;
  completion.hidden = false;
  status.textContent = t(language, 'onboardingComplete');
}

uiLanguage.addEventListener('change', () => {
  void persistLanguage(asUiLanguageSetting(uiLanguage.value));
});
previousStepButton.addEventListener('click', () => {
  currentStep = Math.max(1, currentStep - 1);
  renderStep();
});
nextStepButton.addEventListener('click', () => {
  currentStep = Math.min(4, currentStep + 1);
  renderStep();
});
decideLaterButton.addEventListener('click', () => window.close());
for (const input of Object.values(reviewMarks)) {
  input.addEventListener('change', persistReviewMarks);
}
resetReviewMarksButton.addEventListener('click', () => {
  for (const input of Object.values(reviewMarks)) input.checked = false;
  persistReviewMarks();
  status.textContent = t(language, 'statusReviewMarksReset');
});

allowNetworkButton.addEventListener('click', () => {
  networkPermissionStatus.textContent = '';
  networkPermissionDialog.showModal();
});
cancelNetworkPermissionButton.addEventListener('click', () => networkPermissionDialog.close());
requestNetworkPermissionButton.addEventListener('click', () => {
  requestNetworkPermissionButton.disabled = true;
  void chrome.permissions
    .request(NETWORK_METADATA_PERMISSION_REQUEST)
    .then(async (granted) => {
      if (!granted) {
        const message = t(language, 'statusPermissionDenied');
        networkPermissionStatus.textContent = message;
        status.textContent = message;
        return;
      }
      await complete('standard');
      networkPermissionDialog.close();
    })
    .catch(() => {
      const message = t(language, 'statusPermissionError');
      networkPermissionStatus.textContent = message;
      status.textContent = message;
    })
    .finally(() => {
      if (networkPermissionDialog.open) requestNetworkPermissionButton.disabled = false;
    });
});
startLocalOnlyButton.addEventListener('click', () => {
  void removeNetworkMetadataPermission()
    .then((removed) => {
      if (!removed) throw new Error('network metadata permission was not removed');
      return complete('dom_only');
    })
    .catch(() => {
      status.textContent = t(language, 'statusPermissionError');
    });
});
pauseObservationButton.addEventListener('click', () => {
  void removeNetworkMetadataPermission()
    .then((removed) => {
      if (!removed) throw new Error('network metadata permission was not removed');
      return complete('paused');
    })
    .catch(() => {
      status.textContent = t(language, 'statusPermissionError');
    });
});
openObservationLog.addEventListener('click', () => {
  void chrome.tabs.create({ url: chrome.runtime.getURL('logs.html') });
});
openSetupAfter.addEventListener('click', () => void chrome.runtime.openOptionsPage());

void Promise.all([readSettingsMemory(), loadOnboardingState()])
  .then(async ([{ settings }, storedState]) => {
    uiLanguage.value = settings.uiLanguage;
    onboardingState = recordOnboardingPresentation(storedState, Date.now());
    for (const [key, input] of Object.entries(reviewMarks) as [
      keyof OnboardingReviewMarks,
      HTMLInputElement,
    ][]) {
      input.checked = onboardingState.reviewMarks[key];
    }
    await saveOnboardingState(onboardingState);
    applyLanguage(resolveUiLanguage(settings.uiLanguage, browserUiLanguage()));
  })
  .catch(() => {
    status.textContent = t(language, 'statusOnboardingInitializationError');
    applyLanguage(resolveUiLanguage(uiLanguage.value as UiLanguageSetting, browserUiLanguage()));
  });
