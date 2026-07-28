import type { DssiSettings } from '../core/models/settings';
import type {
  SubmissionAssociation,
  SubmissionDescriptor,
  SubmissionMechanism,
} from '../core/models/submission';
import { createObservationRecord } from '../core/observation-factory';
import { analyzeSubmission } from '../core/submission-analyzer';
import { FactChipPresenter } from '../ui/fact-chip';

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
  readonly #presenter = new FactChipPresenter();
  readonly #pending = new WeakMap<HTMLFormElement, PendingSubmissionCandidate>();

  public constructor(settings: DssiSettings, sessionId: string) {
    this.#settings = settings;
    this.#sessionId = sessionId;
  }

  public start(): void {
    document.addEventListener('submit', this.#onSubmit, true);
    document.addEventListener('click', this.#onClick, true);
    document.addEventListener('keydown', this.#onKeyDown, true);
  }

  #shouldPresent(descriptor: SubmissionDescriptor, confirmed: boolean): boolean {
    if (!confirmed) return this.#settings.viscosityLevel === 3;
    if (this.#settings.viscosityLevel >= 2) return true;
    return (
      descriptor.destinationRelation === 'cross_origin' || descriptor.destinationScheme === 'http'
    );
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
    const cuePresented = this.#shouldPresent(descriptor, confirmed);
    if (cuePresented)
      this.#presenter.showSubmission(descriptor, this.#settings.viscosityLevel, confirmed);

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

    void chrome.runtime.sendMessage({ type: 'DSSI_OBSERVATION_RECORD', record }).catch(() => {
      // Navigation can destroy the extension context. Do not interfere with the page action.
    });
  }

  readonly #onSubmit = (event: SubmitEvent): void => {
    const form = resolveFormFromEvent(event);
    if (!form) return;

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
    const control = resolveSubmitControl(event);
    if (!control) return;
    const form =
      control instanceof HTMLButtonElement || control instanceof HTMLInputElement
        ? control.form
        : null;
    if (!form) return;

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
    if (event.key !== 'Enter' || event.isComposing) return;
    const form = resolveFormFromEvent(event);
    if (!form) return;

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
