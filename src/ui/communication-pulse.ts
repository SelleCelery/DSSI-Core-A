import { isFactChipPosition } from '../core/fact-chip-position';
import {
  communicationPulseAriaLabel,
  communicationPulseFromNetwork,
  communicationPulseFromSubmission,
  communicationPulseMethodGlyph,
  type CommunicationPulseDescriptor,
  type CommunicationPulseKind,
} from '../core/communication-pulse';
import type { NetworkDescriptor } from '../core/models/network';
import type {
  CommunicationPulseDurationMs,
  CommunicationPulseSize,
  FactChipPosition,
} from '../core/models/settings';
import type { SubmissionDescriptor } from '../core/models/submission';
import {
  setPulsePaused,
  setPulseVisible,
  setTextChipVisible,
  subscribeTransientDisplayState,
  transientDisplayState,
} from './transient-display-state';

const HOST_ID = 'dssi-core-a-communication-pulse-host';
const MAX_VISIBLE_PULSES = 32;

interface CommunicationPulsePresenterOptions {
  position: FactChipPosition;
  durationMs: CommunicationPulseDurationMs;
  size: CommunicationPulseSize;
  enabled: boolean;
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

function kindSvg(kind: CommunicationPulseKind): SVGSVGElement {
  const namespace = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(namespace, 'svg');
  svg.setAttribute('viewBox', '0 0 20 20');
  svg.setAttribute('aria-hidden', 'true');

  if (kind === 'dom_submit') {
    const rect = document.createElementNS(namespace, 'rect');
    rect.setAttribute('x', '3.5');
    rect.setAttribute('y', '3.5');
    rect.setAttribute('width', '13');
    rect.setAttribute('height', '13');
    rect.setAttribute('rx', '1.5');
    const path = document.createElementNS(namespace, 'path');
    path.setAttribute('d', 'M7 10h7m-2.5-2.5L14 10l-2.5 2.5');
    svg.append(rect, path);
    return svg;
  }

  if (kind === 'fetch_or_xhr') {
    const circle = document.createElementNS(namespace, 'circle');
    circle.setAttribute('cx', '10');
    circle.setAttribute('cy', '10');
    circle.setAttribute('r', '6.5');
    const path = document.createElementNS(namespace, 'path');
    path.setAttribute('d', 'M5.5 10h9M7 7.5h6M7 12.5h6');
    svg.append(circle, path);
    return svg;
  }

  const dot = document.createElementNS(namespace, 'circle');
  dot.setAttribute('cx', '6');
  dot.setAttribute('cy', '10');
  dot.setAttribute('r', '1.25');
  const inner = document.createElementNS(namespace, 'path');
  inner.setAttribute('d', 'M8.5 6.8a4.5 4.5 0 0 1 0 6.4');
  const outer = document.createElementNS(namespace, 'path');
  outer.setAttribute('d', 'M11 4.5a7.7 7.7 0 0 1 0 11');
  svg.append(dot, inner, outer);
  return svg;
}

function button(label: string, title: string): HTMLButtonElement {
  const element = document.createElement('button');
  element.type = 'button';
  element.textContent = label;
  element.title = title;
  element.setAttribute('aria-label', title);
  return element;
}

function refreshControls(root: ShadowRoot): void {
  const state = transientDisplayState();
  const stream = root.querySelector<HTMLDivElement>('.stream');
  const pause = root.querySelector<HTMLButtonElement>('[data-action="pause"]');
  const visibility = root.querySelector<HTMLButtonElement>('[data-action="visibility"]');
  const text = root.querySelector<HTMLButtonElement>('[data-action="text"]');

  if (stream) stream.hidden = !state.pulseVisible;
  if (pause) {
    pause.textContent = state.pulsePaused ? '▶' : 'Ⅱ';
    pause.title = state.pulsePaused ? '通信パルス表示を再開' : '通信パルス表示を一時停止';
    pause.setAttribute('aria-label', pause.title);
    pause.dataset.active = String(state.pulsePaused);
  }
  if (visibility) {
    visibility.textContent = state.pulseVisible ? '◉' : '○';
    visibility.title = state.pulseVisible ? '通信パルスを一時的に非表示' : '通信パルスを再表示';
    visibility.setAttribute('aria-label', visibility.title);
    visibility.dataset.active = String(!state.pulseVisible);
  }
  if (text) {
    text.textContent = 'T';
    text.title = state.textChipVisible ? '文章チップを一時的に非表示' : '文章チップを再表示';
    text.setAttribute('aria-label', text.title);
    text.dataset.active = String(!state.textChipVisible);
  }
}

function ensureHost(position: FactChipPosition, size: CommunicationPulseSize): PulseHost {
  const existing = document.getElementById(HOST_ID);
  if (existing instanceof HTMLDivElement && existing.shadowRoot) {
    const stream = existing.shadowRoot.querySelector<HTMLDivElement>('.stream');
    if (stream) {
      existing.dataset.size = size;
      applyPulseHostPosition(existing, position);
      refreshControls(existing.shadowRoot);
      return { host: existing, root: existing.shadowRoot, stream };
    }
  }

  const host = document.createElement('div');
  host.id = HOST_ID;
  host.dataset.size = size;
  host.style.setProperty('all', 'initial');
  host.style.setProperty('position', 'fixed');
  host.style.setProperty('z-index', '2147483646');
  host.style.setProperty('pointer-events', 'none');
  applyPulseHostPosition(host, position);

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
      max-width: min(360px, calc(100vw - 110px));
      pointer-events: none;
    }
    :host([data-position="left"]) .stream,
    :host([data-position="right"]) .stream {
      max-width: 76px;
      max-height: min(420px, calc(100vh - 120px));
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
      background: rgba(52, 52, 50, 0.34);
      color: rgba(215, 214, 208, 0.9);
      backdrop-filter: blur(2px);
      -webkit-backdrop-filter: blur(2px);
    }
    .pulse[data-size="medium"] { --pulse-size: 18px; }
    .pulse[data-visible="true"] { opacity: 1; transform: scale(1); }
    .pulse[data-kind="fetch_or_xhr"] { color: rgba(157, 143, 164, 0.92); }
    .pulse[data-kind="beacon_or_ping"] { color: rgba(134, 151, 140, 0.92); }
    .pulse[data-kind="dom_submit"] { color: rgba(205, 204, 198, 0.92); }
    svg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.25;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .method {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      color: rgba(245, 243, 236, 0.95);
      font: 600 7px/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      text-shadow: 0 0 2px rgba(20, 20, 20, 0.85);
    }
    .cookie {
      position: absolute;
      right: -1px;
      top: -1px;
      box-sizing: border-box;
      width: 5px;
      height: 5px;
      border: 1px solid rgba(174, 155, 133, 0.95);
      border-radius: 50%;
      background: transparent;
    }
    .cookie[data-state="detected"] { background: rgba(174, 155, 133, 0.95); }
    .cookie[data-state="not_observed"],
    .cookie[data-state="unavailable"] { border-style: dashed; opacity: 0.75; }
    .relation {
      position: absolute;
      left: -1px;
      top: -1px;
      width: 5px;
      height: 5px;
      border-top: 1px solid currentColor;
      border-left: 1px solid currentColor;
      opacity: 0.82;
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

  const visibility = button('◉', '通信パルスを一時的に非表示');
  visibility.dataset.action = 'visibility';
  visibility.addEventListener('click', () => {
    setPulseVisible(!transientDisplayState().pulseVisible);
  });

  const text = button('T', '文章チップを一時的に非表示');
  text.dataset.action = 'text';
  text.addEventListener('click', () => {
    setTextChipVisible(!transientDisplayState().textChipVisible);
  });

  controls.append(pause, clear, visibility, text);

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
    if (options.enabled) ensureHost(options.position, options.size);

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

    const { stream } = ensureHost(this.#position, this.#options.size);
    while (stream.childElementCount >= MAX_VISIBLE_PULSES) {
      stream.firstElementChild?.remove();
    }

    const pulse = document.createElement('span');
    pulse.className = 'pulse';
    pulse.dataset.kind = descriptor.kind;
    pulse.dataset.size = this.#options.size;
    pulse.title = communicationPulseAriaLabel(descriptor);

    const glyph = kindSvg(descriptor.kind);
    const method = document.createElement('span');
    method.className = 'method';
    method.textContent = communicationPulseMethodGlyph(descriptor.method);
    pulse.append(glyph, method);

    if (descriptor.cookieState !== 'not_applicable') {
      const cookie = document.createElement('span');
      cookie.className = 'cookie';
      cookie.dataset.state = descriptor.cookieState;
      pulse.append(cookie);
    }

    if (descriptor.destinationRelation === 'cross_origin') {
      const relation = document.createElement('span');
      relation.className = 'relation';
      pulse.append(relation);
    }

    stream.append(pulse);
    requestAnimationFrame(() => pulse.setAttribute('data-visible', 'true'));

    if (this.#options.durationMs === 0) return;
    window.setTimeout(() => {
      pulse.setAttribute('data-visible', 'false');
      window.setTimeout(() => pulse.remove(), 140);
    }, this.#options.durationMs);
  }
}
