import { shouldPresentCue } from '../core/cue-policy';
import { assessInputOrigin } from '../core/input-origin';
import type { InputSurfaceClassification } from '../core/models/input-surface';
import type {
  InputOrigin,
  ObservationScope,
  OperationEvidence,
  TriggerType,
} from '../core/models/observation';
import type { DssiSettings } from '../core/models/settings';
import { createObservationRecord } from '../core/observation-factory';
import { classifyInputSurface } from '../core/surface-classifier';
import { FactChipPresenter } from '../ui/fact-chip';
import { describeInputSurface, findInputSurfaces, resolveInputSurface } from './surface-descriptor';

interface SurfaceRuntimeState {
  lastKeyboardAt?: number;
  lastKeyboardTrusted?: boolean;
  lastPasteAt?: number;
  lastPasteTrusted?: boolean;
  lastPasteReflectionLoggedAt?: number;
  lastInputType?: string;
  keyboardLogged: boolean;
  inferredOrigins: Set<InputOrigin>;
}

function focusTrigger(classification: InputSurfaceClassification): TriggerType {
  switch (classification.surfaceType) {
    case 'password':
      return 'password_field_focus';
    case 'email_or_id':
      return 'email_or_id_field_focus';
    case 'payment':
      return 'payment_field_focus';
    case 'personal_information':
      return 'personal_info_field_focus';
    case 'free_text':
      return 'free_text_surface_focus';
    default:
      return 'unknown_input_surface_focus';
  }
}

function triggerForInputOrigin(origin: InputOrigin): TriggerType {
  switch (origin) {
    case 'keyboard_confirmed':
      return 'keyboard_input_started';
    case 'paste_confirmed':
      return 'paste_reflected_in_field';
    case 'autofill_or_manager_suspected':
      return 'autofill_or_manager_suspected';
    case 'script_or_unknown_update':
    case 'unknown':
      return 'script_or_unknown_value_change';
  }
}

export class InputSurfaceObserver {
  readonly #settings: DssiSettings;
  readonly #sessionId = crypto.randomUUID();
  readonly #domainKey = location.hostname || 'unknown';
  readonly #presenter = new FactChipPresenter();
  readonly #knownSurfaces = new WeakSet<Element>();
  readonly #runtime = new WeakMap<Element, SurfaceRuntimeState>();
  #mutationObserver: MutationObserver | undefined;

  public constructor(settings: DssiSettings) {
    this.#settings = settings;
  }

  public start(): void {
    this.#reportPageStart();
    this.#registerSurfaces(document);

    document.addEventListener('focusin', this.#onFocusIn, true);
    document.addEventListener('focusout', this.#onFocusOut, true);
    document.addEventListener('keydown', this.#onKeyDown, true);
    document.addEventListener('paste', this.#onPaste, true);
    document.addEventListener('beforeinput', this.#onBeforeInput, true);
    document.addEventListener('input', this.#onInput, true);

    this.#mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof Element) {
            this.#registerSurfaces(node);
          }
        }
      }
    });

    this.#startMutationObservation();
  }

  #startMutationObservation(): void {
    const observationRoot = document.documentElement;
    if (observationRoot && this.#mutationObserver) {
      this.#mutationObserver.observe(observationRoot, { childList: true, subtree: true });
      return;
    }

    document.addEventListener(
      'DOMContentLoaded',
      () => {
        const root = document.documentElement;
        if (root && this.#mutationObserver) {
          this.#registerSurfaces(document);
          this.#mutationObserver.observe(root, { childList: true, subtree: true });
        }
      },
      { once: true },
    );
  }

  #registerSurfaces(root: ParentNode): void {
    for (const surface of findInputSurfaces(root)) {
      this.#knownSurfaces.add(surface);
    }
  }

  #stateFor(surface: Element): SurfaceRuntimeState {
    const existing = this.#runtime.get(surface);
    if (existing) return existing;

    const created: SurfaceRuntimeState = {
      keyboardLogged: false,
      inferredOrigins: new Set<InputOrigin>(),
    };
    this.#runtime.set(surface, created);
    return created;
  }

  #classificationFor(surface: Element): InputSurfaceClassification {
    this.#knownSurfaces.add(surface);
    return classifyInputSurface(describeInputSurface(surface));
  }

  #reportPageStart(): void {
    void this.#sendRecord(
      createObservationRecord(
        {
          sessionId: this.#sessionId,
          domainKey: this.#domainKey,
          viscosityLevel: this.#settings.viscosityLevel,
        },
        {
          surfaceType: 'page',
          triggerType: 'page_observation_started',
          observationScope: 'page_surface_partial',
          operationEvidence: 'extension_observation',
          cuePresented: false,
        },
      ),
    );
  }

  #reportSurfaceEvent(
    surface: Element,
    triggerType: TriggerType,
    operationEvidence: OperationEvidence,
    inputOrigin?: InputOrigin,
    observationScope: ObservationScope = 'input_surface_and_dom_events',
  ): void {
    const classification = this.#classificationFor(surface);
    const isFocusCue =
      triggerType.endsWith('_field_focus') ||
      triggerType === 'free_text_surface_focus' ||
      triggerType === 'unknown_input_surface_focus';
    const surfaceCuePresented = isFocusCue
      ? shouldPresentCue(this.#settings.viscosityLevel, classification.surfaceType)
      : false;
    const inputOriginCuePresented =
      inputOrigin !== undefined && this.#settings.viscosityLevel === 3;
    const cuePresented = surfaceCuePresented || inputOriginCuePresented;

    if (surfaceCuePresented) {
      this.#presenter.show(classification.surfaceType, this.#settings.viscosityLevel);
    } else if (inputOriginCuePresented && inputOrigin !== undefined) {
      this.#presenter.showInputOrigin(
        inputOrigin,
        classification.surfaceType,
        this.#settings.viscosityLevel,
      );
    }

    void this.#sendRecord(
      createObservationRecord(
        {
          sessionId: this.#sessionId,
          domainKey: this.#domainKey,
          viscosityLevel: this.#settings.viscosityLevel,
        },
        {
          surfaceType: classification.surfaceType,
          triggerType,
          observationScope,
          operationEvidence,
          cuePresented,
          ...(inputOrigin === undefined ? {} : { inputOrigin }),
          classificationConfidence: classification.confidence,
        },
      ),
    );
  }

  async #sendRecord(record: ReturnType<typeof createObservationRecord>): Promise<void> {
    try {
      await chrome.runtime.sendMessage({
        type: 'DSSI_OBSERVATION_RECORD',
        record,
      });
    } catch {
      // The extension context can disappear while a page is reloading.
      // Observation must fail closed without touching page input.
    }
  }

  readonly #onFocusIn = (event: FocusEvent): void => {
    const surface = resolveInputSurface(event);
    if (!surface) return;

    const classification = this.#classificationFor(surface);
    this.#reportSurfaceEvent(
      surface,
      focusTrigger(classification),
      event.isTrusted ? 'direct_trusted_event' : 'untrusted_or_unknown',
    );
  };

  readonly #onFocusOut = (event: FocusEvent): void => {
    const surface = resolveInputSurface(event);
    if (!surface) return;

    const state = this.#stateFor(surface);
    state.keyboardLogged = false;
    delete state.lastKeyboardAt;
    delete state.lastKeyboardTrusted;
    delete state.lastPasteAt;
    delete state.lastPasteTrusted;
    delete state.lastPasteReflectionLoggedAt;
    delete state.lastInputType;
    state.inferredOrigins.clear();
  };

  readonly #onKeyDown = (event: KeyboardEvent): void => {
    const surface = resolveInputSurface(event);
    if (!surface) return;

    const state = this.#stateFor(surface);
    state.lastKeyboardAt = performance.now();
    state.lastKeyboardTrusted = event.isTrusted;
  };

  readonly #onPaste = (event: ClipboardEvent): void => {
    const surface = resolveInputSurface(event);
    if (!surface) return;

    const state = this.#stateFor(surface);
    state.lastPasteAt = performance.now();
    state.lastPasteTrusted = event.isTrusted;

    this.#reportSurfaceEvent(
      surface,
      'paste_event_observed',
      event.isTrusted ? 'direct_trusted_event' : 'untrusted_or_unknown',
    );
  };

  readonly #onBeforeInput = (event: InputEvent): void => {
    const surface = resolveInputSurface(event);
    if (!surface) return;

    this.#stateFor(surface).lastInputType = event.inputType;
  };

  readonly #onInput = (event: Event): void => {
    const surface = resolveInputSurface(event);
    if (!surface) return;

    const state = this.#stateFor(surface);
    const inputEvent = event instanceof InputEvent ? event : undefined;
    const now = performance.now();
    const assessment = assessInputOrigin({
      now,
      ...(state.lastKeyboardAt === undefined ? {} : { lastKeyboardAt: state.lastKeyboardAt }),
      ...(state.lastKeyboardTrusted === undefined
        ? {}
        : { lastKeyboardTrusted: state.lastKeyboardTrusted }),
      ...(state.lastPasteAt === undefined ? {} : { lastPasteAt: state.lastPasteAt }),
      ...(state.lastPasteTrusted === undefined ? {} : { lastPasteTrusted: state.lastPasteTrusted }),
      ...(inputEvent?.inputType === undefined && state.lastInputType === undefined
        ? {}
        : { inputType: inputEvent?.inputType ?? state.lastInputType }),
      isTrusted: event.isTrusted,
    });
    const { origin, operationEvidence } = assessment;
    delete state.lastInputType;

    if (origin === 'keyboard_confirmed' && state.keyboardLogged) return;
    if (
      origin === 'paste_confirmed' &&
      state.lastPasteReflectionLoggedAt !== undefined &&
      now - state.lastPasteReflectionLoggedAt <= 200
    ) {
      return;
    }
    if (origin !== 'paste_confirmed' && state.inferredOrigins.has(origin)) return;

    if (origin === 'keyboard_confirmed') {
      state.keyboardLogged = true;
      delete state.lastKeyboardAt;
      delete state.lastKeyboardTrusted;
    }
    if (origin === 'paste_confirmed') {
      state.lastPasteReflectionLoggedAt = now;
      delete state.lastPasteAt;
      delete state.lastPasteTrusted;
    }
    if (origin !== 'paste_confirmed') state.inferredOrigins.add(origin);

    this.#reportSurfaceEvent(surface, triggerForInputOrigin(origin), operationEvidence, origin);
  };
}
