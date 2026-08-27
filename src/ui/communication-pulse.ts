import { factChipPositionLabel, nextFactChipPosition } from '../core/fact-chip-position';
import {
  communicationPulseAriaLabel,
  communicationPulseFromNetwork,
  communicationPulseFromSubmission,
  type CommunicationPulseDescriptor,
} from '../core/communication-pulse';
import type { NetworkDescriptor } from '../core/models/network';
import type { UiLanguage } from '../i18n/ui';
import type {
  CommunicationPulseColor,
  CommunicationPulseDurationMs,
  CommunicationPulseOpacity,
  CommunicationPulseSize,
  FactChipPosition,
} from '../core/models/settings';
import type { SubmissionDescriptor } from '../core/models/submission';
import {
  applyCommunicationPulseVisualOptions,
  createCommunicationPulseIcon,
  type CommunicationPulseVisualOptions,
} from './communication-pulse-icon';
import type { DisplayStateController } from './display-state-controller';
import {
  setPulsePaused,
  subscribeTransientDisplayState,
  transientDisplayState,
} from './transient-display-state';
import { communicationPulseTransparencyPercent } from './communication-pulse-transparency';

export const COMMUNICATION_PULSE_HOST_ID = 'dssi-core-a-communication-pulse-host';
const MAX_VISIBLE_PULSES = 32;
const PULSE_COLORS: readonly CommunicationPulseColor[] = ['magenta', 'cyan', 'yellow', 'neutral'];
const PULSE_OPACITIES: readonly CommunicationPulseOpacity[] = [1, 0.8, 0.6, 0.4];

interface ActivePulseVisualState extends CommunicationPulseVisualOptions {
  hostname: string;
  position: FactChipPosition;
  durationMs: CommunicationPulseDurationMs;
  observationSettingsPanelVisible: boolean;
  language: UiLanguage;
  savedProfile: boolean;
  dirty: boolean;
}

function currentPulseVisualState(
  options: CommunicationPulsePresenterOptions,
): ActivePulseVisualState {
  const view = options.displayController.snapshot();
  const display = view.display.current;
  return {
    hostname: options.hostname,
    domColor: display.communicationPulseDomColor,
    webRequestColor: display.communicationPulseWebRequestColor,
    opacity: display.communicationPulseOpacity,
    position: display.factChipPosition,
    durationMs: display.communicationPulseDurationMs,
    observationSettingsPanelVisible: display.observationSettingsPanelVisible,
    language: options.language,
    savedProfile: view.display.committed.source.kind === 'host',
    dirty: view.display.dirty,
  };
}

function currentPulseCommandBundle(options: CommunicationPulsePresenterOptions) {
  return options.displayController.commandSnapshot().display.current;
}

function nextValue<T>(values: readonly T[], current: T): T {
  const index = values.indexOf(current);
  return values[(index + 1) % values.length] ?? values[0] ?? current;
}

function localized(language: UiLanguage, ja: string, en: string): string {
  return language === 'ja' ? ja : en;
}

function colorLabel(color: CommunicationPulseColor, language: UiLanguage): string {
  switch (color) {
    case 'magenta':
      return language === 'ja' ? 'マゼンタ' : 'Magenta';
    case 'cyan':
      return language === 'ja' ? 'シアン' : 'Cyan';
    case 'yellow':
      return language === 'ja' ? 'イエロー' : 'Yellow';
    case 'neutral':
      return language === 'ja' ? '無色' : 'Neutral';
  }
}

interface CommunicationPulsePresenterOptions {
  displayController: DisplayStateController;
  hostname: string;
  size: CommunicationPulseSize;
  enabled: boolean;
  language: UiLanguage;
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

function pinIcon(filled: boolean): SVGSVGElement {
  const namespace = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(namespace, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.classList.add('pin-icon');

  const path = document.createElementNS(namespace, 'path');
  path.setAttribute(
    'd',
    'M8.6 3.5h6.8l-.9 5.1 2.9 3v1.7H13v6.2l-1 1.5-1-1.5v-6.2H6.6v-1.7l2.9-3-.9-5.1Z',
  );
  path.setAttribute('fill', filled ? 'currentColor' : 'none');
  path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-width', '1.6');
  path.setAttribute('stroke-linejoin', 'round');
  svg.append(path);
  return svg;
}

function showToast(root: ShadowRoot, message: string): void {
  const toast = root.querySelector<HTMLDivElement>('.toast');
  if (!toast) return;
  toast.textContent = message;
  toast.dataset.visible = 'true';
  const priorTimer = Number(toast.dataset.timer ?? '0');
  if (priorTimer > 0) window.clearTimeout(priorTimer);
  const timer = window.setTimeout(() => {
    toast.dataset.visible = 'false';
    delete toast.dataset.timer;
  }, 1900);
  toast.dataset.timer = String(timer);
}

function refreshPulseVisuals(root: ShadowRoot, visual: ActivePulseVisualState): void {
  for (const icon of root.querySelectorAll<HTMLElement>('.communication-pulse-icon')) {
    const route = icon.dataset.route;
    if (route !== 'dom' && route !== 'web_request') continue;
    applyCommunicationPulseVisualOptions(icon, route, visual);
  }
}

function refreshControls(root: ShadowRoot, options: CommunicationPulsePresenterOptions): void {
  const state = transientDisplayState();
  const visual = currentPulseVisualState(options);
  const stream = root.querySelector<HTMLDivElement>('.stream');
  const controls = root.querySelector<HTMLDivElement>('.controls');
  const panelLauncher = root.querySelector<HTMLButtonElement>('[data-action="open-panel"]');
  const pause = root.querySelector<HTMLButtonElement>('[data-action="pause"]');
  const visibility = root.querySelector<HTMLButtonElement>('[data-action="visibility"]');
  const text = root.querySelector<HTMLButtonElement>('[data-action="text"]');
  const domColor = root.querySelector<HTMLButtonElement>('[data-action="dom-color"]');
  const webRequestColor = root.querySelector<HTMLButtonElement>('[data-action="webrequest-color"]');
  const opacity = root.querySelector<HTMLButtonElement>('[data-action="opacity"]');
  const move = root.querySelector<HTMLButtonElement>('[data-action="move"]');
  const pin = root.querySelector<HTMLButtonElement>('[data-action="pin"]');
  const host = root.host instanceof HTMLDivElement ? root.host : undefined;

  const language = visual.language;
  const panelVisible = visual.observationSettingsPanelVisible;
  if (controls) controls.hidden = !panelVisible;
  if (panelLauncher) panelLauncher.hidden = panelVisible;
  if (stream) stream.hidden = !state.pulseVisible;
  if (pause) {
    pause.textContent = state.pulsePaused ? '▶' : 'Ⅱ';
    pause.title = state.pulsePaused
      ? localized(language, '通信パルス表示を再開', 'Resume communication pulses')
      : localized(language, '通信パルス表示を一時停止', 'Pause communication pulses');
    pause.setAttribute('aria-label', pause.title);
    pause.dataset.active = String(state.pulsePaused);
  }
  if (visibility) {
    visibility.textContent = state.pulseVisible ? '◉' : '○';
    visibility.title = state.pulseVisible
      ? localized(
          language,
          'このページで通信パルスを一時的に非表示',
          'Temporarily hide communication pulses on this page',
        )
      : localized(
          language,
          'このページで通信パルスを一時的に表示',
          'Temporarily show communication pulses on this page',
        );
    visibility.setAttribute('aria-label', visibility.title);
    visibility.dataset.active = String(!state.pulseVisible);
  }
  if (text) {
    text.textContent = 'T';
    text.title = state.communicationTextVisible
      ? localized(
          language,
          'このページで通信説明チップを一時的に非表示',
          'Temporarily hide communication text chips on this page',
        )
      : localized(
          language,
          'このページで通信説明チップを一時的に表示',
          'Temporarily show communication text chips on this page',
        );
    text.setAttribute('aria-label', text.title);
    text.dataset.active = String(!state.communicationTextVisible);
  }
  if (domColor) {
    domColor.textContent = 'D';
    domColor.title = localized(
      language,
      `DOM観測色：${colorLabel(visual.domColor, language)}（クリックで変更）`,
      `DOM observation color: ${colorLabel(visual.domColor, language)} (click to change)`,
    );
    domColor.setAttribute('aria-label', domColor.title);
    domColor.dataset.color = visual.domColor;
  }
  if (webRequestColor) {
    webRequestColor.textContent = 'W';
    webRequestColor.title = localized(
      language,
      `webRequest観測色：${colorLabel(visual.webRequestColor, language)}（クリックで変更）`,
      `webRequest observation color: ${colorLabel(visual.webRequestColor, language)} (click to change)`,
    );
    webRequestColor.setAttribute('aria-label', webRequestColor.title);
    webRequestColor.dataset.color = visual.webRequestColor;
  }
  if (opacity) {
    opacity.textContent = 'α';
    const transparency = communicationPulseTransparencyPercent(visual.opacity);
    opacity.title = localized(
      language,
      `通信パルス背景の透過率：${transparency}%（クリックで変更）`,
      `Communication-pulse background transparency: ${transparency}% (click to change)`,
    );
    opacity.setAttribute('aria-label', opacity.title);
  }
  if (move) {
    move.textContent = '↻';
    const next = nextFactChipPosition(visual.position);
    move.title = localized(
      language,
      `通信パルスコンソールを${factChipPositionLabel(next, 'ja')}へ移動`,
      `Move the communication-pulse console to ${factChipPositionLabel(next, 'en')}`,
    );
    move.setAttribute('aria-label', move.title);
  }
  if (pin) {
    pin.replaceChildren(pinIcon(visual.savedProfile));
    const hostname = visual.hostname;
    pin.title = visual.savedProfile
      ? visual.dirty
        ? localized(
            language,
            `変更した表示設定で ${hostname} の保存内容を上書き`,
            `Overwrite the saved ${hostname} profile with the current display settings`,
          )
        : localized(
            language,
            `${hostname} に表示設定が保存されています`,
            `A display profile is saved for ${hostname}`,
          )
      : localized(
          language,
          `現在の表示設定を ${hostname} に保存`,
          `Save the current display settings for ${hostname}`,
        );
    pin.setAttribute('aria-label', pin.title);
    pin.dataset.saved = String(visual.savedProfile);
    pin.dataset.dirty = String(visual.dirty);
  }
  if (host) {
    host.dataset.profileState = visual.savedProfile
      ? visual.dirty
        ? 'saved_profile_with_temporary_changes'
        : 'saved_profile'
      : visual.dirty
        ? 'temporary_override'
        : 'global_default';
  }
}

function ensureHost(options: CommunicationPulsePresenterOptions): PulseHost {
  const visual = currentPulseVisualState(options);
  const existing = document.getElementById(COMMUNICATION_PULSE_HOST_ID);
  if (existing instanceof HTMLDivElement && existing.shadowRoot) {
    const stream = existing.shadowRoot.querySelector<HTMLDivElement>('.stream');
    if (stream) {
      existing.dataset.size = options.size;
      existing.dataset.hostname = options.hostname;
      applyPulseHostPosition(existing, visual.position);
      refreshControls(existing.shadowRoot, options);
      return { host: existing, root: existing.shadowRoot, stream };
    }
  }

  const host = document.createElement('div');
  host.id = COMMUNICATION_PULSE_HOST_ID;
  host.dataset.size = options.size;
  host.dataset.hostname = options.hostname;
  host.style.setProperty('all', 'initial');
  host.style.setProperty('position', 'fixed');
  host.style.setProperty('z-index', '2147483646');
  host.style.setProperty('pointer-events', 'none');
  applyPulseHostPosition(host, visual.position);

  const root = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = `
    :host { all: initial; }
    .hud {
      position: relative;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px;
      border: 1px solid transparent;
      border-radius: 8px;
      pointer-events: none;
      transition: border-color 120ms ease, border-style 120ms ease, background 120ms ease;
    }
    :host([data-profile-state="temporary_override"]) .hud {
      border-style: dashed;
      border-color: rgba(232, 226, 210, 0.62);
      background: rgba(35, 35, 34, 0.12);
    }
    :host([data-profile-state="saved_profile"]) .hud {
      border-color: rgba(232, 226, 210, 0.76);
      background: rgba(35, 35, 34, 0.18);
    }
    :host([data-profile-state="saved_profile_with_temporary_changes"]) .hud {
      border-style: dashed;
      border-color: rgba(232, 226, 210, 0.88);
      background: rgba(35, 35, 34, 0.24);
    }
    :host([data-position="left"]) .hud,
    :host([data-position="right"]) .hud {
      flex-direction: column;
    }
    .controls {
      display: flex;
      gap: 3px;
      padding: 3px;
      border: 1px solid rgba(215, 214, 208, 0.18);
      border-radius: 6px;
      background: rgba(30, 30, 29, 0.5);
      opacity: 0.58;
      transition: opacity 120ms ease;
      pointer-events: auto;
    }
    .controls[hidden],
    .panel-launcher[hidden] {
      display: none;
    }
    .panel-launcher {
      flex: 0 0 auto;
      pointer-events: auto;
      opacity: 0.58;
      transition: opacity 120ms ease;
    }
    .panel-launcher:hover,
    .panel-launcher:focus-visible {
      opacity: 1;
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
      width: 24px;
      height: 24px;
      padding: 0;
      border: 1px solid rgba(215, 214, 208, 0.24);
      border-radius: 4px;
      background: rgba(48, 48, 46, 0.42);
      color: rgba(225, 223, 216, 0.9);
      font: 10px/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
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
    button[data-action="pin"] {
      width: 28px;
    }
    button[data-action="pin"][data-saved="true"] {
      border-color: rgba(232, 226, 210, 0.76);
      background: rgba(86, 80, 72, 0.62);
    }
    button[data-action="pin"][data-dirty="true"] {
      border-style: dashed;
    }
    .pin-icon {
      width: 14px;
      height: 14px;
      display: block;
      margin: auto;
    }
    .toast {
      position: absolute;
      left: 50%;
      top: calc(100% + 6px);
      z-index: 2;
      max-width: min(360px, calc(100vw - 24px));
      padding: 5px 8px;
      border: 1px solid rgba(232, 226, 210, 0.42);
      border-radius: 6px;
      background: rgba(30, 30, 29, 0.94);
      color: rgba(244, 241, 234, 0.96);
      font: 11px/1.35 system-ui, sans-serif;
      width: max-content;
      white-space: normal;
      overflow-wrap: anywhere;
      pointer-events: none;
      opacity: 0;
      transform: translate(-50%, -4px);
      transition: opacity 120ms ease, transform 120ms ease;
    }
    .toast[data-visible="true"] {
      opacity: 1;
      transform: translate(-50%, 0);
    }
    :host([data-position="left"]) .toast,
    :host([data-position="top_left"]) .toast,
    :host([data-position="bottom_left"]) .toast {
      left: 0;
      transform: translate(0, -4px);
    }
    :host([data-position="left"]) .toast[data-visible="true"],
    :host([data-position="top_left"]) .toast[data-visible="true"],
    :host([data-position="bottom_left"]) .toast[data-visible="true"] {
      transform: translate(0, 0);
    }
    :host([data-position="right"]) .toast,
    :host([data-position="top_right"]) .toast,
    :host([data-position="bottom_right"]) .toast {
      right: 0;
      left: auto;
      transform: translate(0, -4px);
    }
    :host([data-position="right"]) .toast[data-visible="true"],
    :host([data-position="top_right"]) .toast[data-visible="true"],
    :host([data-position="bottom_right"]) .toast[data-visible="true"] {
      transform: translate(0, 0);
    }
    :host([data-position^="bottom"]) .toast,
    :host([data-position="bottom"]) .toast {
      top: auto;
      bottom: calc(100% + 6px);
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
      background: transparent;
    }
    .pulse[data-size="medium"] { --pulse-size: 18px; }
    .pulse[data-visible="true"] { opacity: 1; transform: scale(1); }
    .communication-pulse-icon {
      --route-stroke: rgba(220, 220, 214, 0.92);
      --route-fill: rgba(92, 94, 96, 0.5);
      --route-text: rgba(248, 248, 244, 0.98);
      --pulse-background-opacity: 0.7;
      position: absolute;
      inset: 0;
      display: block;
      color: var(--route-stroke);
      border-radius: inherit;
      background: rgba(32, 33, 35, var(--pulse-background-opacity));
      backdrop-filter: blur(2px);
      -webkit-backdrop-filter: blur(2px);
    }
    .method-shape {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      overflow: visible;
      fill: var(--route-fill);
      fill-opacity: var(--pulse-background-opacity);
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
      .pulse, .controls, .panel-launcher { transition: none; }
    }
  `;

  const controls = document.createElement('div');
  controls.className = 'controls';

  const pause = button(
    'Ⅱ',
    localized(options.language, '通信パルス表示を一時停止', 'Pause communication pulses'),
  );
  pause.dataset.action = 'pause';
  pause.addEventListener('click', () => {
    setPulsePaused(!transientDisplayState().pulsePaused);
  });

  const clear = button(
    '⌧',
    localized(options.language, '表示中の通信パルスを消去', 'Clear visible communication pulses'),
  );
  clear.dataset.action = 'clear';
  clear.addEventListener('click', () => {
    stream.replaceChildren();
  });

  const visibility = button(
    '◉',
    localized(
      options.language,
      'このページで通信パルスを一時的に非表示',
      'Temporarily hide communication pulses on this page',
    ),
  );
  visibility.dataset.action = 'visibility';
  visibility.addEventListener('click', () => {
    const visible = !currentPulseCommandBundle(options).communicationPulseEnabled;
    options.displayController.updateDraft({ communicationPulseEnabled: visible });
  });

  const text = button(
    'T',
    localized(
      options.language,
      'このページで通信説明チップを一時的に非表示',
      'Temporarily hide communication text chips on this page',
    ),
  );
  text.dataset.action = 'text';
  text.addEventListener('click', () => {
    const visible = !transientDisplayState().communicationTextVisible;
    options.displayController.updateDraft({ communicationTextChipEnabled: visible });
  });

  const domColor = button(
    'D',
    localized(options.language, 'DOM観測色を変更', 'Change DOM observation color'),
  );
  domColor.dataset.action = 'dom-color';
  domColor.addEventListener('click', () => {
    const visual = currentPulseCommandBundle(options);
    options.displayController.updateDraft({
      communicationPulseDomColor: nextValue(PULSE_COLORS, visual.communicationPulseDomColor),
    });
  });

  const webRequestColor = button(
    'W',
    localized(options.language, 'webRequest観測色を変更', 'Change webRequest observation color'),
  );
  webRequestColor.dataset.action = 'webrequest-color';
  webRequestColor.addEventListener('click', () => {
    const visual = currentPulseCommandBundle(options);
    options.displayController.updateDraft({
      communicationPulseWebRequestColor: nextValue(
        PULSE_COLORS,
        visual.communicationPulseWebRequestColor,
      ),
    });
  });

  const opacity = button(
    'α',
    localized(
      options.language,
      '通信パルス背景の透過率を変更',
      'Change communication-pulse background transparency',
    ),
  );
  opacity.dataset.action = 'opacity';
  opacity.addEventListener('click', () => {
    const visual = currentPulseCommandBundle(options);
    options.displayController.updateDraft({
      communicationPulseOpacity: nextValue(PULSE_OPACITIES, visual.communicationPulseOpacity),
    });
  });

  const move = button(
    '↻',
    localized(
      options.language,
      '通信パルスコンソールを時計回りに移動',
      'Move the communication-pulse console clockwise',
    ),
  );
  move.dataset.action = 'move';
  move.addEventListener('click', () => {
    const visual = currentPulseCommandBundle(options);
    const next = nextFactChipPosition(visual.factChipPosition);
    options.displayController.updateDraft({ factChipPosition: next });
  });

  const pin = button(
    '',
    localized(
      options.language,
      `現在の表示設定を ${options.hostname} に保存`,
      `Save the current display settings for ${options.hostname}`,
    ),
  );
  pin.dataset.action = 'pin';
  pin.append(
    pinIcon(options.displayController.snapshot().display.committed.source.kind === 'host'),
  );
  pin.addEventListener('click', () => {
    void options.displayController
      .saveHostDraft()
      .then((response) => {
        showToast(
          root,
          response.ok
            ? localized(
                options.language,
                `${options.hostname} の表示設定束を保存しました`,
                `Saved the display settings bundle for ${options.hostname}`,
              )
            : localized(
                options.language,
                '別の設定変更を検出したため、保存せず最新状態を読み直しました',
                'Another settings change was detected; the latest saved state was reloaded',
              ),
        );
      })
      .catch(() =>
        showToast(
          root,
          localized(options.language, '表示設定を保存できませんでした', 'Could not save settings'),
        ),
      );
  });

  const reset = button(
    '⌫',
    localized(
      options.language,
      'このホストの表示設定を解除し、全体設定へ戻す',
      'Remove this host profile and return to global settings',
    ),
  );
  reset.dataset.action = 'reset';
  reset.addEventListener('click', () => {
    void options.displayController
      .removeHostMemory()
      .then((response) => {
        showToast(
          root,
          response.ok
            ? localized(
                options.language,
                'ホスト別設定を削除し、全体設定へ戻しました',
                'Removed the host profile and returned to global settings',
              )
            : localized(
                options.language,
                '別の設定変更を検出したため、解除せず最新状態を読み直しました',
                'Another settings change was detected; the host profile was not removed',
              ),
        );
      })
      .catch(() =>
        showToast(
          root,
          localized(options.language, 'ホスト別設定を解除できませんでした', 'Could not reset'),
        ),
      );
  });

  const closePanel = button(
    '×',
    localized(options.language, '観測設定パネルを閉じる', 'Close observation settings panel'),
  );
  closePanel.dataset.action = 'close-panel';
  closePanel.addEventListener('click', () => {
    options.displayController.updateDraft({ observationSettingsPanelVisible: false });
  });

  controls.append(
    pause,
    clear,
    visibility,
    text,
    domColor,
    webRequestColor,
    opacity,
    move,
    pin,
    reset,
    closePanel,
  );

  const panelLauncher = button(
    '⚙',
    localized(options.language, '観測設定パネルを開く', 'Open observation settings panel'),
  );
  panelLauncher.className = 'panel-launcher';
  panelLauncher.dataset.action = 'open-panel';
  panelLauncher.addEventListener('click', () => {
    options.displayController.updateDraft({ observationSettingsPanelVisible: true });
  });

  const stream = document.createElement('div');
  stream.className = 'stream';
  stream.setAttribute('aria-hidden', 'true');

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');

  const hud = document.createElement('div');
  hud.className = 'hud';
  hud.append(toast, panelLauncher, controls, stream);

  root.append(style, hud);
  document.documentElement.append(host);
  subscribeTransientDisplayState(() => refreshControls(root, options));
  refreshControls(root, options);
  return { host, root, stream };
}

export class CommunicationPulsePresenter {
  readonly #options: CommunicationPulsePresenterOptions;

  public constructor(options: CommunicationPulsePresenterOptions) {
    this.#options = options;
    options.displayController.subscribe((view) => {
      const display = view.display.current;
      if (this.#options.enabled) ensureHost(this.#options);
      const host = document.getElementById(COMMUNICATION_PULSE_HOST_ID);
      if (host instanceof HTMLDivElement && host.shadowRoot) {
        applyPulseHostPosition(host, display.factChipPosition);
        host.dataset.memoryRevision = view.renderRevision;
        host.dataset.memorySource = view.display.committed.source.kind;
        const visual = currentPulseVisualState(this.#options);
        refreshPulseVisuals(host.shadowRoot, visual);
        refreshControls(host.shadowRoot, this.#options);
      }
      options.displayController.acknowledge('communication_pulse', view.renderRevision);
      options.displayController.acknowledge('settings_panel', view.renderRevision);
    });
  }

  public setEnabled(enabled: boolean): void {
    this.#options.enabled = enabled;
    const host = document.getElementById(COMMUNICATION_PULSE_HOST_ID);
    if (!enabled) {
      host?.remove();
      return;
    }
    ensureHost(this.#options);
  }

  public update(options: Partial<CommunicationPulsePresenterOptions>): void {
    Object.assign(this.#options, options);
    this.setEnabled(this.#options.enabled);
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

    const { stream } = ensureHost(this.#options);
    while (stream.childElementCount >= MAX_VISIBLE_PULSES) {
      stream.firstElementChild?.remove();
    }

    const pulse = document.createElement('span');
    pulse.className = 'pulse';
    pulse.dataset.kind = descriptor.kind;
    pulse.dataset.size = this.#options.size;
    pulse.title = communicationPulseAriaLabel(descriptor, this.#options.language);

    const visual = currentPulseVisualState(this.#options);
    pulse.append(
      createCommunicationPulseIcon(descriptor, {
        domColor: visual.domColor,
        webRequestColor: visual.webRequestColor,
        opacity: visual.opacity,
      }),
    );

    stream.append(pulse);
    requestAnimationFrame(() => pulse.setAttribute('data-visible', 'true'));

    if (visual.durationMs === 0) return;
    window.setTimeout(() => {
      pulse.setAttribute('data-visible', 'false');
      window.setTimeout(() => pulse.remove(), 140);
    }, visual.durationMs);
  }
}
