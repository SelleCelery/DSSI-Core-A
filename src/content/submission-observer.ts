import type { UserActionType } from '../core/models/network';
import {
  effectiveCueLevel,
  communicationPulseAvailable,
  type DssiSettings,
} from '../core/models/settings';
import type {
  SubmissionAssociation,
  SubmissionDescriptor,
  SubmissionMechanism,
} from '../core/models/submission';
import { createObservationRecord } from '../core/observation-factory';
import { createPrivacySafeRecord } from '../core/privacy-safe-logger';
import { browserUiLanguage, resolveUiLanguage } from '../i18n/ui';
import { analyzeSubmission } from '../core/submission-analyzer';
import { CommunicationPulsePresenter } from '../ui/communication-pulse';
import type { DisplayStateController } from '../ui/display-state-controller';
import { FactChipPresenter } from '../ui/fact-chip';
import { applyRuntimeSettings } from './runtime-settings';

const SUBMIT_CORRELATION_WINDOW_MS = 1500;

interface PendingSubmissionCandidate {
  observedAt: number;
  trusted: boolean;
  mechanism: 'submitter_activation' | 'enter_key_candidate';
}

function resolveSubmitControl(event: Event): HTMLElement | undefined {
  for (const target of event.composedPath()) {
    if (!(target instanceof HTMLElement)) continue;
    if (target instanceof HTMLButtonElement && (target.type || 'submit') === 'submit')
      return target;
    if (target instanceof HTMLInputElement && ['submit', 'image'].includes(target.type))
      return target;
  }
  return undefined;
}

function resolveFormFromEvent(event: Event): HTMLFormElement | undefined {
  if (event.target instanceof HTMLFormElement) return event.target;
  const control = resolveSubmitControl(event);
  if (control instanceof HTMLButtonElement || control instanceof HTMLInputElement) {
    return control.form ?? undefined;
  }
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
    return event.target.form ?? undefined;
  }
  return undefined;
}

function descriptorFor(
  form: HTMLFormElement,
  mechanism: SubmissionMechanism,
  association: SubmissionAssociation,
): SubmissionDescriptor {
  return analyzeSubmission({
    action: form.getAttribute('action') ?? location.href,
    method: form.getAttribute('method') ?? 'get',
    encoding: form.getAttribute('enctype') ?? 'application/x-www-form-urlencoded',
    currentUrl: location.href,
    mechanism,
    association,
  });
}

export class SubmissionObserver {
  readonly #settings: DssiSettings;
  readonly #sessionId: string;
  readonly #domainKey = location.hostname || 'unknown';
  readonly #presenter: FactChipPresenter;
  readonly #pulsePresenter: CommunicationPulsePresenter;
  readonly #pending = new WeakMap<HTMLFormElement, PendingSubmissionCandidate>();
  #networkPulseEnabled: boolean;
  #enabled: boolean;

  public constructor(
    settings: DssiSettings,
    sessionId: string,
    displayController: DisplayStateController,
  ) {
    this.#settings = settings;
    this.#sessionId = sessionId;
    const language = resolveUiLanguage(settings.uiLanguage, browserUiLanguage());
    this.#presenter = new FactChipPresenter(displayController, settings.factChipPosition, language);
    this.#pulsePresenter = new CommunicationPulsePresenter({
      displayController,
      hostname: this.#domainKey,
      size: settings.communicationPulseSize,
      enabled: settings.enabled && communicationPulseAvailable(settings),
      language,
    });
    this.#enabled = settings.enabled;
    this.#networkPulseEnabled = settings.networkObservationEnabled;
  }

  public setEnabled(enabled: boolean): void {
    this.#enabled = enabled;
    this.#pulsePresenter.setEnabled(enabled && communicationPulseAvailable(this.#settings));
  }

  public setNetworkObservationEnabled(enabled: boolean): void {
    this.#networkPulseEnabled = enabled;
  }

  public updateSettings(settings: DssiSettings): void {
    applyRuntimeSettings(this.#settings, settings);
    this.#networkPulseEnabled = settings.enabled && settings.networkObservationEnabled;
    this.#enabled = settings.enabled;
    this.#pulsePresenter.update({
      size: settings.communicationPulseSize,
      enabled: settings.enabled && communicationPulseAvailable(settings),
      language: resolveUiLanguage(settings.uiLanguage, browserUiLanguage()),
    });
  }

  public start(): void {
    document.addEventListener('submit', this.#onSubmit, true);
    document.addEventListener('click', this.#onClick, true);
    document.addEventListener('keydown', this.#onKeyDown, true);
  }

  #shouldPresent(descriptor: SubmissionDescriptor, confirmed: boolean): boolean {
    const cueLevel = effectiveCueLevel(this.#settings);
    if (!confirmed) return cueLevel === 3;
    if (cueLevel >= 2) return true;
    return (
      descriptor.destinationRelation === 'cross_origin' || descriptor.destinationScheme === 'http'
    );
  }

  #sendActionPulse(actionType: UserActionType): void {
    if (!this.#enabled || !this.#networkPulseEnabled) return;
    void chrome.runtime
      .sendMessage({
        type: 'DSSI_USER_ACTION_PULSE',
        pulse: {
          sessionId: this.#sessionId,
          domainKey: this.#domainKey,
          viscosityLevel: this.#settings.viscosityLevel,
          actionType,
          observedAt: Date.now(),
        },
      })
      .catch(() => {
        // Transient correlation metadata must not interfere with the page action.
      });
  }

  #report(
    descriptor: SubmissionDescriptor,
    triggerType: 'submit_attempt' | 'submitter_activation_observed' | 'enter_submit_candidate',
    evidence:
      | 'direct_trusted_event'
      | 'correlated_trusted_events'
      | 'inferred_from_trusted_event'
      | 'untrusted_or_unknown',
    confirmed: boolean,
  ): void {
    if (!this.#enabled) return;
    if (confirmed) this.#pulsePresenter.showSubmission(descriptor);

    const cuePresented = this.#shouldPresent(descriptor, confirmed);
    if (cuePresented) {
      this.#presenter.showSubmission(descriptor, effectiveCueLevel(this.#settings), confirmed);
    }

    const record = createObservationRecord(
      {
        sessionId: this.#sessionId,
        domainKey: this.#domainKey,
        viscosityLevel: this.#settings.viscosityLevel,
      },
      {
        surfaceType: 'page',
        triggerType,
        observationScope: descriptor.declaredDestinationObservable
          ? 'declared_submission_boundary'
          : 'submission_boundary_partial',
        operationEvidence: evidence,
        cuePresented,
        submission: descriptor,
      },
    );

    const safeRecord = createPrivacySafeRecord(record);
    void chrome.runtime
      .sendMessage({ type: 'DSSI_OBSERVATION_RECORD', record: safeRecord })
      .catch(() => {
        // Navigation can destroy the extension context. Do not interfere with the page action.
      });
  }

  readonly #onSubmit = (event: SubmitEvent): void => {
    if (!this.#enabled) return;
    const form = resolveFormFromEvent(event);
    if (!form) return;

    if (event.isTrusted) this.#sendActionPulse('form_submit');

    const pending = this.#pending.get(form);
    const isCorrelated =
      event.isTrusted &&
      pending?.trusted === true &&
      performance.now() - pending.observedAt <= SUBMIT_CORRELATION_WINDOW_MS;
    this.#pending.delete(form);

    this.#report(
      descriptorFor(
        form,
        'form_submit_event',
        isCorrelated ? 'correlated_submit_event' : 'submit_event_without_prior_candidate',
      ),
      'submit_attempt',
      isCorrelated
        ? 'correlated_trusted_events'
        : event.isTrusted
          ? 'direct_trusted_event'
          : 'untrusted_or_unknown',
      true,
    );
  };

  readonly #onClick = (event: MouseEvent): void => {
    if (!this.#enabled) return;
    const control = resolveSubmitControl(event);
    if (!control) return;
    const form =
      control instanceof HTMLButtonElement || control instanceof HTMLInputElement
        ? control.form
        : null;
    if (!form) return;

    if (event.isTrusted) this.#sendActionPulse('submit_control');

    this.#pending.set(form, {
      observedAt: performance.now(),
      trusted: event.isTrusted,
      mechanism: 'submitter_activation',
    });

    this.#report(
      descriptorFor(form, 'submitter_activation', 'declared_submit_control'),
      'submitter_activation_observed',
      event.isTrusted ? 'direct_trusted_event' : 'untrusted_or_unknown',
      false,
    );
  };

  readonly #onKeyDown = (event: KeyboardEvent): void => {
    if (!this.#enabled) return;
    if (event.key !== 'Enter' || event.isComposing) return;
    const form = resolveFormFromEvent(event);
    if (!form) return;

    if (event.isTrusted) this.#sendActionPulse('enter_candidate');

    this.#pending.set(form, {
      observedAt: performance.now(),
      trusted: event.isTrusted,
      mechanism: 'enter_key_candidate',
    });

    this.#report(
      descriptorFor(form, 'enter_key_candidate', 'enter_key_candidate'),
      'enter_submit_candidate',
      event.isTrusted ? 'inferred_from_trusted_event' : 'untrusted_or_unknown',
      false,
    );
  };
}
