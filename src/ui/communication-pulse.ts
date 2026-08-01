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

const HOST_ID = 'dssi-core-a-communication-pulse-host';
const MAX_VISIBLE_PULSES = 8;

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
      host.style.setProperty('top', '52px');
      host.style.setProperty('left', '50%');
      host.style.setProperty('transform', 'translateX(-50%)');
      break;
    case 'top_right':
      host.style.setProperty('top', '52px');
      host.style.setProperty('right', '12px');
      break;
    case 'right':
      host.style.setProperty('right', '12px');
      host.style.setProperty('top', 'calc(50% + 52px)');
      host.style.setProperty('transform', 'translateY(-50%)');
      break;
    case 'bottom_right':
      host.style.setProperty('right', '12px');
      host.style.setProperty('bottom', '52px');
      break;
    case 'bottom':
      host.style.setProperty('bottom', '52px');
      host.style.setProperty('left', '50%');
      host.style.setProperty('transform', 'translateX(-50%)');
      break;
    case 'bottom_left':
      host.style.setProperty('left', '12px');
      host.style.setProperty('bottom', '52px');
      break;
    case 'left':
      host.style.setProperty('left', '12px');
      host.style.setProperty('top', 'calc(50% + 52px)');
      host.style.setProperty('transform', 'translateY(-50%)');
      break;
    case 'top_left':
      host.style.setProperty('top', '52px');
      host.style.setProperty('left', '12px');
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

function ensureHost(position: FactChipPosition, size: CommunicationPulseSize): PulseHost {
  const existing = document.getElementById(HOST_ID);
  if (existing instanceof HTMLDivElement && existing.shadowRoot) {
    const stream = existing.shadowRoot.querySelector<HTMLDivElement>('.stream');
    if (stream) {
      existing.dataset.size = size;
      applyPulseHostPosition(existing, position);
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
    .stream {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: 3px;
      max-width: min(220px, calc(100vw - 24px));
      pointer-events: none;
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
    .pulse[data-size="medium"] {
      --pulse-size: 18px;
    }
    .pulse[data-visible="true"] {
      opacity: 1;
      transform: scale(1);
    }
    .pulse[data-kind="fetch_or_xhr"] {
      color: rgba(157, 143, 164, 0.92);
    }
    .pulse[data-kind="beacon_or_ping"] {
      color: rgba(134, 151, 140, 0.92);
    }
    .pulse[data-kind="dom_submit"] {
      color: rgba(205, 204, 198, 0.92);
    }
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
    .cookie[data-state="detected"] {
      background: rgba(174, 155, 133, 0.95);
    }
    .cookie[data-state="not_observed"],
    .cookie[data-state="unavailable"] {
      border-style: dashed;
      opacity: 0.75;
    }
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
      .pulse { transition: none; }
    }
  `;

  const stream = document.createElement('div');
  stream.className = 'stream';
  stream.setAttribute('aria-hidden', 'true');
  root.append(style, stream);
  document.documentElement.append(host);
  return { host, root, stream };
}

export class CommunicationPulsePresenter {
  readonly #options: CommunicationPulsePresenterOptions;
  #position: FactChipPosition;

  public constructor(options: CommunicationPulsePresenterOptions) {
    this.#options = options;
    this.#position = options.position;
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
    window.setTimeout(() => {
      pulse.setAttribute('data-visible', 'false');
      window.setTimeout(() => pulse.remove(), 140);
    }, this.#options.durationMs);
  }
}
