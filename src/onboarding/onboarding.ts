import { NETWORK_PERMISSION_REQUEST } from '../core/network-permission';
import {
  browserUiLanguage,
  applyDocumentTranslations,
  resolveUiLanguage,
  t,
  type UiLanguage,
  type UiLanguageSetting,
} from '../i18n/ui';
import { loadSettings, saveSettings } from '../storage/settings-store';
import {
  ONBOARDING_VERSION,
  onboardingAcknowledgementsComplete,
  saveOnboardingState,
  type OnboardingAcknowledgements,
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
const completion = requiredElement<HTMLElement>('#completion');
const wizardControls = requiredElement<HTMLElement>('#wizardControls');
const status = requiredElement<HTMLElement>('#status');
const openObservationLog = requiredElement<HTMLButtonElement>('#openObservationLog');
const openSetupAfter = requiredElement<HTMLButtonElement>('#openSetupAfter');

const acknowledgements: Readonly<Record<keyof OnboardingAcknowledgements, HTMLInputElement>> = {
  observationBoundary: requiredElement<HTMLInputElement>('#ackObservation'),
  frequency: requiredElement<HTMLInputElement>('#ackFrequency'),
  storage: requiredElement<HTMLInputElement>('#ackStorage'),
  externalTransmission: requiredElement<HTMLInputElement>('#ackExternal'),
  judgmentBoundary: requiredElement<HTMLInputElement>('#ackJudgment'),
  supportBoundary: requiredElement<HTMLInputElement>('#ackSupport'),
  currentDecision: requiredElement<HTMLInputElement>('#ackDecision'),
};

let currentStep = 1;
let language: UiLanguage = 'ja';

function asUiLanguageSetting(value: string): UiLanguageSetting {
  return value === 'ja' || value === 'en' ? value : 'auto';
}

function currentAcknowledgements(): OnboardingAcknowledgements {
  return {
    observationBoundary: acknowledgements.observationBoundary.checked,
    frequency: acknowledgements.frequency.checked,
    storage: acknowledgements.storage.checked,
    externalTransmission: acknowledgements.externalTransmission.checked,
    judgmentBoundary: acknowledgements.judgmentBoundary.checked,
    supportBoundary: acknowledgements.supportBoundary.checked,
    currentDecision: acknowledgements.currentDecision.checked,
  };
}

function renderStep(): void {
  for (const section of document.querySelectorAll<HTMLElement>('.onboarding-step')) {
    section.hidden = Number(section.dataset.step) !== currentStep;
  }
  stepProgress.value = currentStep;
  stepLabel.textContent = `${t(language, 'step')} ${currentStep} / 4`;
  previousStepButton.disabled = currentStep === 1;
  nextStepButton.hidden = currentStep === 4;
  const complete = onboardingAcknowledgementsComplete(currentAcknowledgements());
  allowNetworkButton.disabled = !complete;
  startLocalOnlyButton.disabled = !complete;
}

function applyLanguage(next: UiLanguage): void {
  language = next;
  applyDocumentTranslations(document, language);
  renderStep();
}

async function persistLanguage(setting: UiLanguageSetting): Promise<void> {
  const settings = await loadSettings();
  await saveSettings({ ...settings, uiLanguage: setting });
  applyLanguage(resolveUiLanguage(setting, browserUiLanguage()));
}

async function complete(networkObservationEnabled: boolean): Promise<void> {
  const current = await loadSettings();
  await saveSettings({ ...current, networkObservationEnabled });
  await saveOnboardingState({
    version: ONBOARDING_VERSION,
    completedAt: Date.now(),
    acknowledgements: currentAcknowledgements(),
    networkObservationEnabled,
  });
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
for (const input of Object.values(acknowledgements)) {
  input.addEventListener('change', renderStep);
}
allowNetworkButton.addEventListener('click', () => {
  void chrome.permissions.request(NETWORK_PERMISSION_REQUEST).then((granted) => {
    if (!granted) {
      status.textContent = t(language, 'statusPermissionDenied');
      return;
    }
    void complete(true);
  });
});
startLocalOnlyButton.addEventListener('click', () => {
  void chrome.permissions.remove(NETWORK_PERMISSION_REQUEST).then(() => complete(false));
});
openObservationLog.addEventListener('click', () => {
  void chrome.tabs.create({ url: chrome.runtime.getURL('logs.html') });
});
openSetupAfter.addEventListener('click', () => void chrome.runtime.openOptionsPage());

void loadSettings().then((settings) => {
  uiLanguage.value = settings.uiLanguage;
  applyLanguage(resolveUiLanguage(settings.uiLanguage, browserUiLanguage()));
  for (const input of Object.values(acknowledgements)) {
    input.checked = false;
  }
});
