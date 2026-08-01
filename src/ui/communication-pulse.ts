import { isFactChipPosition } from '../core/fact-chip-position';
import {
  communicationPulseAriaLabel,
  communicationPulseFromNetwork,
  communicationPulseFromSubmission,
  type CommunicationPulseDescriptor,
} from '../core/communication-pulse';
import type { NetworkDescriptor } from '../core/models/network';
import type {
  CommunicationPulseColor,
  CommunicationPulseDurationMs,
  CommunicationPulseOpacity,
  CommunicationPulseSize,
  FactChipPosition,
} from '../core/models/settings';
import type { SubmissionDescriptor } from '../core/models/submission';
import {
  removeHostDisplayProfile,
  saveHostDisplayProfile,
} from '../storage/host-display-profile-store';
import { loadSettings } from '../storage/settings-store';
import {
  applyCommunicationPulseVisualOptions,
  createCommunicationPulseIcon,
  type CommunicationPulseVisualOptions,
} from './communication-pulse-icon';
import {
  setCommunicationTextVisible,
  setPulsePaused,
  setPulseVisible,
  subscribeTransientDisplayState,
  transientDisplayState,
} from './transient-display-state';

const HOST_ID = 'dssi-core-a-communication-pulse-host';
const MAX_VISIBLE_PULSES = 32;
const PULSE_COLORS: readonly CommunicationPulseColor[] = ['magenta', 'cyan', 'yellow', 'neutral'];
const PULSE_OPACITIES: readonly CommunicationPulseOpacity[] = [1, 0.8, 0.6, 0.4];

interface ActivePulseVisualState extends CommunicationPulseVisualOptions {
  hostname: string;
}

let activePulseVisualState: ActivePulseVisualState | undefined;

function ensureActivePulseVisualState(
  options: CommunicationPulsePresenterOptions,
): ActivePulseVisualState {
  if (
    activePulseVisualState === undefined ||
    activePulseVisualState.hostname !== options.hostname
  ) {
    activePulseVisualState = {
      hostname: options.hostname,
      domColor: options.domColor,
      webRequestColor: options.webRequestColor,
      opacity: options.opacity,
    };
  }
  return activePulseVisualState;
}

function nextValue<T>(values: readonly T[], current: T): T {
  const index = values.indexOf(current);
  return values[(index + 1) % values.length] ?? values[0] ?? current;
}

function colorLabel(color: CommunicationPulseColor): string {
  switch (color) {
    case 'magenta':
      return 'マゼンタ';
    case 'cyan':
      return 'シアン';
    case 'yellow':
      return 'イエロー';
    case 'neutral':
      return '無色';
  }
}

interface CommunicationPulsePresenterOptions {
  hostname: string;
  position: FactChipPosition;
  durationMs: CommunicationPulseDurationMs;
  size: CommunicationPulseSize;
  enabled: boolean;
  domColor: CommunicationPulseColor;
  webRequestColor: CommunicationPulseColor;
  opacity: CommunicationPulseOpacity;
}

interface PulseHost {
  host: HTMLDivElement;
  root: ShadowRoot;
  stream: HTMLDivElement;
}

function applyPulseHostPosition(host: HTMLDivElement, position: FactChipPosition): void {
  host.dataset.position = position;
  for (const property of ['top', 'right', 'bottom', 'left', 'transform']) {
    host.style.removeProperty(property);
  }

  switch (position) {
    case 'top':
      host.style.setProperty('top', '8px');
      host.style.setProperty('left', '50%');
      host.style.setProperty('transform', 'translateX(-50%)');
      break;
    case 'top_right':
      host.style.setProperty('top', '8px');
      host.style.setProperty('right', '10px');
      break;
    case 'right':
      host.style.setProperty('right', '8px');
      host.style.setProperty('top', '50%');
      host.style.setProperty('transform', 'translateY(-50%)');
      break;
    case 'bottom_right':
      host.style.setProperty('right', '10px');
      host.style.setProperty('bottom', '8px');
      break;
    case 'bottom':
      host.style.setProperty('bottom', '8px');
      host.style.setProperty('left', '50%');
      host.style.setProperty('transform', 'translateX(-50%)');
      break;
    case 'bottom_left':
      host.style.setProperty('left', '10px');
      host.style.setProperty('bottom', '8px');
      break;
    case 'left':
      host.style.setProperty('left', '8px');
      host.style.setProperty('top', '50%');
      host.style.setProperty('transform', 'translateY(-50%)');
      break;
    case 'top_left':
      host.style.setProperty('top', '8px');
      host.style.setProperty('left', '10px');
      break;
  }
}

function button(label: string, title: string): HTMLButtonElement {
  const element = document.createElement('button');
  element.type = 'button';
  element.textContent = label;
  element.title = title;
  element.setAttribute('aria-label', title);
  return element;
}

function refreshPulseVisuals(root: ShadowRoot): void {
  if (activePulseVisualState === undefined) return;
  for (const icon of root.querySelectorAll<HTMLElement>('.communication-pulse-icon')) {
    const route = icon.dataset.route;
    if (route !== 'dom' && route !== 'web_request') continue;
    applyCommunicationPulseVisualOptions(icon, route, activePulseVisualState);
  }
}

function refreshControls(root: ShadowRoot): void {
  const state = transientDisplayState();
  const stream = root.querySelector<HTMLDivElement>('.stream');
  const pause = root.querySelector<HTMLButtonElement>('[data-action="pause"]');
  const visibility = root.querySelector<HTMLButtonElement>('[data-action="visibility"]');
  const text = root.querySelector<HTMLButtonElement>('[data-action="text"]');
  const domColor = root.querySelector<HTMLButtonElement>('[data-action="dom-color"]');
  const webRequestColor = root.querySelector<HTMLButtonElement>('[data-action="webrequest-color"]');
  const opacity = root.querySelector<HTMLButtonElement>('[data-action="opacity"]');

  if (stream) stream.hidden = !state.pulseVisible;
  if (pause) {
    pause.textContent = state.pulsePaused ? '▶' : 'Ⅱ';
    pause.title = state.pulsePaused ? '通信パルス表示を再開' : '通信パルス表示を一時停止';
    pause.setAttribute('aria-label', pause.title);
    pause.dataset.active = String(state.pulsePaused);
  }
  if (visibility) {
    visibility.textContent = state.pulseVisible ? '◉' : '○';
    visibility.title = state.pulseVisible
      ? 'このホストの通信パルスを非表示にして保存'
      : 'このホストの通信パルスを表示して保存';
    visibility.setAttribute('aria-label', visibility.title);
    visibility.dataset.active = String(!state.pulseVisible);
  }
  if (text) {
    text.textContent = 'T';
    text.title = state.communicationTextVisible
      ? 'このホストの通信説明チップを非表示にして保存'
      : 'このホストの通信説明チップを表示して保存';
    text.setAttribute('aria-label', text.title);
    text.dataset.active = String(!state.communicationTextVisible);
  }
  if (activePulseVisualState && domColor) {
    domColor.textContent = 'D';
    domColor.title = `DOM観測色：${colorLabel(activePulseVisualState.domColor)}（クリックで変更）`;
    domColor.setAttribute('aria-label', domColor.title);
    domColor.dataset.color = activePulseVisualState.domColor;
  }
  if (activePulseVisualState && webRequestColor) {
    webRequestColor.textContent = 'W';
    webRequestColor.title = `webRequest観測色：${colorLabel(activePulseVisualState.webRequestColor)}（クリックで変更）`;
    webRequestColor.setAttribute('aria-label', webRequestColor.title);
    webRequestColor.dataset.color = activePulseVisualState.webRequestColor;
  }
  if (activePulseVisualState && opacity) {
    opacity.textContent = 'α';
    opacity.title = `通信パルス不透明度：${Math.round(activePulseVisualState.opacity * 100)}%（クリックで変更）`;
    opacity.setAttribute('aria-label', opacity.title);
  }
}

function ensureHost(options: CommunicationPulsePresenterOptions): PulseHost {
  ensureActivePulseVisualState(options);
  const existing = document.getElementById(HOST_ID);
  if (existing instanceof HTMLDivElement && existing.shadowRoot) {
    const stream = existing.shadowRoot.querySelector<HTMLDivElement>('.stream');
    if (stream) {
      existing.dataset.size = options.size;
      existing.dataset.hostname = options.hostname;
      applyPulseHostPosition(existing, options.position);
      refreshControls(existing.shadowRoot);
      return { host: existing, root: existing.shadowRoot, stream };
    }
  }

  const host = document.createElement('div');
  host.id = HOST_ID;
  host.dataset.size = options.size;
  host.dataset.hostname = options.hostname;
  host.style.setProperty('all', 'initial');
  host.style.setProperty('position', 'fixed');
  host.style.setProperty('z-index', '2147483646');
  host.style.setProperty('pointer-events', 'none');
  applyPulseHostPosition(host, options.position);

  const root = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = `
    :host { all: initial; }
    .hud {
      display: flex;
      align-items: center;
      gap: 4px;
      pointer-events: none;
    }
    :host([data-position="left"]) .hud,
    :host([data-position="right"]) .hud {
      flex-direction: column;
    }
    .controls {
      display: flex;
      gap: 2px;
      opacity: 0.42;
      transition: opacity 120ms ease;
      pointer-events: auto;
    }
    .controls:hover,
    .controls:focus-within {
      opacity: 1;
    }
    :host([data-position="left"]) .controls,
    :host([data-position="right"]) .controls {
      flex-direction: column;
    }
    button {
      box-sizing: border-box;
      width: 18px;
      height: 18px;
      padding: 0;
      border: 1px solid rgba(215, 214, 208, 0.24);
      border-radius: 4px;
      background: rgba(48, 48, 46, 0.42);
      color: rgba(225, 223, 216, 0.9);
      font: 9px/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      cursor: pointer;
    }
    button[data-active="true"] {
      border-style: dashed;
      background: rgba(82, 76, 84, 0.52);
    }
    button[data-color="magenta"] { border-bottom-color: rgba(213, 64, 166, 0.96); }
    button[data-color="cyan"] { border-bottom-color: rgba(166, 235, 242, 0.96); }
    button[data-color="yellow"] { border-bottom-color: rgba(224, 196, 104, 0.96); }
    button[data-color="neutral"] { border-bottom-color: rgba(220, 220, 214, 0.72); }
    button:focus-visible {
      outline: 2px solid rgba(235, 233, 226, 0.9);
      outline-offset: 1px;
    }
    .stream {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: 3px;
      max-width: min(360px, calc(100vw - 130px));
      pointer-events: none;
    }
    :host([data-position="left"]) .stream,
    :host([data-position="right"]) .stream {
      max-width: 76px;
      max-height: min(420px, calc(100vh - 140px));
    }
    .pulse {
      --pulse-size: 16px;
      position: relative;
      box-sizing: border-box;
      width: var(--pulse-size);
      height: var(--pulse-size);
      flex: 0 0 var(--pulse-size);
      opacity: 0;
      transform: scale(0.72);
      transition: opacity 100ms ease, transform 120ms ease;
      border-radius: 4px;
      background: rgba(32, 33, 35, 0.48);
      backdrop-filter: blur(2px);
      -webkit-backdrop-filter: blur(2px);
    }
    .pulse[data-size="medium"] { --pulse-size: 18px; }
    .pulse[data-visible="true"] { opacity: 1; transform: scale(1); }
    .communication-pulse-icon {
      --route-stroke: rgba(220, 220, 214, 0.92);
      --route-fill: rgba(92, 94, 96, 0.5);
      --route-text: rgba(248, 248, 244, 0.98);
      --pulse-opacity: 0.8;
      position: absolute;
      inset: 0;
      display: block;
      color: var(--route-stroke);
      opacity: var(--pulse-opacity);
    }
    .method-shape {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      overflow: visible;
      fill: var(--route-fill);
      stroke: var(--route-stroke);
      stroke-width: 1.55;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .method-shape .unknown-method-shape { stroke-dasharray: 2 1.4; }
    .kind-glyph {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      color: var(--route-text);
      font: 700 7px/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      text-shadow: 0 0 2px rgba(12, 12, 14, 0.92);
    }
    .cookie-marker {
      position: absolute;
      right: -1px;
      top: -2px;
      display: grid;
      place-items: center;
      box-sizing: border-box;
      min-width: 7px;
      height: 7px;
      color: rgba(248, 244, 236, 0.98);
      font: 700 7px/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      text-shadow: 0 0 2px rgba(10, 10, 12, 0.98), 0 0 3px rgba(10, 10, 12, 0.95);
    }
    .cookie-marker[data-state="not_observed"] { opacity: 0.72; }
    .cookie-marker[data-state="unavailable"] { opacity: 0.95; }
    .relation-marker {
      position: absolute;
      left: -1px;
      top: -1px;
      width: 5px;
      height: 5px;
      border-top: 1px solid rgba(244, 241, 234, 0.9);
      border-left: 1px solid rgba(244, 241, 234, 0.9);
      opacity: 0.9;
    }
    @media (prefers-reduced-motion: reduce) {
      .pulse, .controls { transition: none; }
    }
  `;

  const controls = document.createElement('div');
  controls.className = 'controls';

  const pause = button('Ⅱ', '通信パルス表示を一時停止');
  pause.dataset.action = 'pause';
  pause.addEventListener('click', () => {
    setPulsePaused(!transientDisplayState().pulsePaused);
  });

  const clear = button('×', '表示中の通信パルスを消去');
  clear.dataset.action = 'clear';
  clear.addEventListener('click', () => {
    stream.replaceChildren();
  });

  const visibility = button('◉', 'このホストの通信パルスを非表示にして保存');
  visibility.dataset.action = 'visibility';
  visibility.addEventListener('click', () => {
    const visible = !transientDisplayState().pulseVisible;
    setPulseVisible(visible);
    void saveHostDisplayProfile(options.hostname, { pulseVisible: visible });
  });

  const text = button('T', 'このホストの通信説明チップを非表示にして保存');
  text.dataset.action = 'text';
  text.addEventListener('click', () => {
    const visible = !transientDisplayState().communicationTextVisible;
    setCommunicationTextVisible(visible);
    void saveHostDisplayProfile(options.hostname, {
      communicationTextVisible: visible,
    });
  });

  const domColor = button('D', 'DOM観測色を変更');
  domColor.dataset.action = 'dom-color';
  domColor.addEventListener('click', () => {
    const visual = ensureActivePulseVisualState(options);
    visual.domColor = nextValue(PULSE_COLORS, visual.domColor);
    refreshPulseVisuals(root);
    refreshControls(root);
    void saveHostDisplayProfile(options.hostname, { domColor: visual.domColor });
  });

  const webRequestColor = button('W', 'webRequest観測色を変更');
  webRequestColor.dataset.action = 'webrequest-color';
  webRequestColor.addEventListener('click', () => {
    const visual = ensureActivePulseVisualState(options);
    visual.webRequestColor = nextValue(PULSE_COLORS, visual.webRequestColor);
    refreshPulseVisuals(root);
    refreshControls(root);
    void saveHostDisplayProfile(options.hostname, {
      webRequestColor: visual.webRequestColor,
    });
  });

  const opacity = button('α', '通信パルス不透明度を変更');
  opacity.dataset.action = 'opacity';
  opacity.addEventListener('click', () => {
    const visual = ensureActivePulseVisualState(options);
    visual.opacity = nextValue(PULSE_OPACITIES, visual.opacity);
    refreshPulseVisuals(root);
    refreshControls(root);
    void saveHostDisplayProfile(options.hostname, { pulseOpacity: visual.opacity });
  });

  const reset = button('↺', 'このホストの表示設定を解除し、全体設定へ戻す');
  reset.dataset.action = 'reset';
  reset.addEventListener('click', () => {
    void removeHostDisplayProfile(options.hostname)
      .then(loadSettings)
      .then((settings) => {
        setPulseVisible(settings.communicationPulseEnabled);
        setCommunicationTextVisible(settings.communicationTextChipEnabled);
        activePulseVisualState = {
          hostname: options.hostname,
          domColor: settings.communicationPulseDomColor,
          webRequestColor: settings.communicationPulseWebRequestColor,
          opacity: settings.communicationPulseOpacity,
        };
        refreshPulseVisuals(root);
        refreshControls(root);
        applyPulseHostPosition(host, settings.factChipPosition);
        window.dispatchEvent(
          new CustomEvent('dssi-core-a-chip-position-changed', {
            detail: settings.factChipPosition,
          }),
        );
      });
  });

  controls.append(pause, clear, visibility, text, domColor, webRequestColor, opacity, reset);

  const stream = document.createElement('div');
  stream.className = 'stream';
  stream.setAttribute('aria-hidden', 'true');

  const hud = document.createElement('div');
  hud.className = 'hud';
  hud.append(controls, stream);

  root.append(style, hud);
  document.documentElement.append(host);
  subscribeTransientDisplayState(() => refreshControls(root));
  refreshControls(root);
  return { host, root, stream };
}

export class CommunicationPulsePresenter {
  readonly #options: CommunicationPulsePresenterOptions;
  #position: FactChipPosition;

  public constructor(options: CommunicationPulsePresenterOptions) {
    this.#options = options;
    this.#position = options.position;
    if (options.enabled) ensureHost(options);

    window.addEventListener('dssi-core-a-chip-position-changed', (event) => {
      if (!(event instanceof CustomEvent)) return;
      const candidate: unknown = event.detail;
      if (!isFactChipPosition(candidate)) return;
      this.#position = candidate;
      const host = document.getElementById(HOST_ID);
      if (host instanceof HTMLDivElement) applyPulseHostPosition(host, candidate);
    });
  }

  public showNetwork(descriptor: NetworkDescriptor): void {
    if (!this.#options.enabled) return;
    this.#show(communicationPulseFromNetwork(descriptor));
  }

  public showSubmission(descriptor: SubmissionDescriptor): void {
    if (!this.#options.enabled) return;
    this.#show(communicationPulseFromSubmission(descriptor));
  }

  #show(descriptor: CommunicationPulseDescriptor): void {
    const state = transientDisplayState();
    if (!state.pulseVisible || state.pulsePaused) return;

    const options = { ...this.#options, position: this.#position };
    const { stream } = ensureHost(options);
    while (stream.childElementCount >= MAX_VISIBLE_PULSES) {
      stream.firstElementChild?.remove();
    }

    const pulse = document.createElement('span');
    pulse.className = 'pulse';
    pulse.dataset.kind = descriptor.kind;
    pulse.dataset.size = this.#options.size;
    pulse.title = communicationPulseAriaLabel(descriptor);

    const visual = ensureActivePulseVisualState(this.#options);
    pulse.append(
      createCommunicationPulseIcon(descriptor, {
        domColor: visual.domColor,
        webRequestColor: visual.webRequestColor,
        opacity: visual.opacity,
      }),
    );

    stream.append(pulse);
    requestAnimationFrame(() => pulse.setAttribute('data-visible', 'true'));

    if (this.#options.durationMs === 0) return;
    window.setTimeout(() => {
      pulse.setAttribute('data-visible', 'false');
      window.setTimeout(() => pulse.remove(), 140);
    }, this.#options.durationMs);
  }
}
