import { factChipPositionLabel, nextFactChipPosition } from '../core/fact-chip-position';
import { DIAGNOSTIC_CHIP_AGGREGATION_WINDOW_MS } from '../core/network-correlation';
import type { NetworkDescriptor, NetworkMethod } from '../core/models/network';
import type { InputOrigin, SurfaceType } from '../core/models/observation';
import type { FactChipPosition, ViscosityLevel } from '../core/models/settings';
import type { SubmissionDescriptor } from '../core/models/submission';
import type { UiLanguage } from '../i18n/ui';
import { browserUiLanguage, resolveUiLanguage } from '../i18n/ui';
import { inputOriginLabel, surfaceTypeLabel } from '../core/observation-presentation';
import type { DisplayStateController } from './display-state-controller';
import { transientDisplayState } from './transient-display-state';

const HOST_ID = 'dssi-core-a-fact-chip-host';

const SURFACE_MESSAGES: Readonly<Record<UiLanguage, Readonly<Record<SurfaceType, string>>>> = {
  ja: {
    page: 'このページの観測を開始しました。',
    password: 'パスワード入力欄として検出しました。',
    email_or_id: 'メールアドレスまたはIDの入力欄として検出しました。',
    payment: '決済情報の入力欄として検出しました。',
    personal_information: '個人情報の入力欄として検出しました。',
    free_text: '自由記述欄として検出しました。送信前に内容の種類を確認してください。',
    ai_prompt: '生成AIへの入力面として検出しました。',
    comment: 'コメント入力面として検出しました。',
    chat: 'チャット入力面として検出しました。',
    webmail: 'メール本文の入力面として検出しました。',
    cloud_editor: 'クラウド編集面として検出しました。',
    consent: '同意操作面として検出しました。',
    download_link: 'ダウンロード操作として検出しました。',
    external_navigation: '外部サイトへの遷移として検出しました。',
    unknown: '入力面として検出しましたが、種類は判定できません。',
  },
  en: {
    page: 'Page observation started.',
    password: 'Detected a password field.',
    email_or_id: 'Detected an email-address or ID field.',
    payment: 'Detected a payment-information field.',
    personal_information: 'Detected a personal-information field.',
    free_text: 'Detected a free-text surface. Review the kind of information before submission.',
    ai_prompt: 'Detected a generative-AI input surface.',
    comment: 'Detected a comment surface.',
    chat: 'Detected a chat surface.',
    webmail: 'Detected an email-body surface.',
    cloud_editor: 'Detected a cloud-editing surface.',
    consent: 'Detected a consent control.',
    download_link: 'Detected a download action.',
    external_navigation: 'Detected navigation to an external site.',
    unknown: 'Detected an input surface, but its type could not be classified.',
  },
};

interface ChipHost {
  host: HTMLDivElement;
  root: ShadowRoot;
}

interface DiagnosticNetworkAggregate {
  count: number;
  methods: Map<NetworkMethod, number>;
  mechanisms: Set<NetworkDescriptor['mechanism']>;
  destinationHosts: Set<string>;
  sameOriginCount: number;
  crossOriginCount: number;
  cookieDetected: boolean;
  viscosityLevel: ViscosityLevel;
}

type ChipCategory = 'attention' | 'communication';

function applyHostPosition(host: HTMLDivElement, position: FactChipPosition): void {
  host.dataset.position = position;
  for (const property of ['top', 'right', 'bottom', 'left', 'transform']) {
    host.style.removeProperty(property);
  }

  switch (position) {
    case 'top':
      host.style.setProperty('top', '38px');
      host.style.setProperty('left', '50%');
      host.style.setProperty('transform', 'translateX(-50%)');
      break;
    case 'top_right':
      host.style.setProperty('top', '38px');
      host.style.setProperty('right', '10px');
      break;
    case 'right':
      host.style.setProperty('right', '38px');
      host.style.setProperty('top', '50%');
      host.style.setProperty('transform', 'translateY(-50%)');
      break;
    case 'bottom_right':
      host.style.setProperty('right', '10px');
      host.style.setProperty('bottom', '38px');
      break;
    case 'bottom':
      host.style.setProperty('bottom', '38px');
      host.style.setProperty('left', '50%');
      host.style.setProperty('transform', 'translateX(-50%)');
      break;
    case 'bottom_left':
      host.style.setProperty('left', '10px');
      host.style.setProperty('bottom', '38px');
      break;
    case 'left':
      host.style.setProperty('left', '38px');
      host.style.setProperty('top', '50%');
      host.style.setProperty('transform', 'translateY(-50%)');
      break;
    case 'top_left':
      host.style.setProperty('top', '38px');
      host.style.setProperty('left', '10px');
      break;
  }
}

function ensureHost(initialPosition: FactChipPosition): ChipHost {
  const existing = document.getElementById(HOST_ID);
  if (existing instanceof HTMLDivElement && existing.shadowRoot) {
    return { host: existing, root: existing.shadowRoot };
  }

  const host = document.createElement('div');
  host.id = HOST_ID;
  host.style.setProperty('all', 'initial');
  host.style.setProperty('position', 'fixed');
  host.style.setProperty('z-index', '2147483647');
  host.style.setProperty('pointer-events', 'none');
  applyHostPosition(host, initialPosition);

  const root = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = `
    .chip {
      position: relative;
      box-sizing: border-box;
      max-width: min(360px, calc(100vw - 20px));
      padding: 6px 34px 6px 10px;
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 8px;
      background: rgba(64, 64, 64, 0.32);
      color: rgba(255, 255, 255, 0.9);
      font: 12px/1.35 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      letter-spacing: normal;
      box-shadow: none;
      backdrop-filter: blur(3px);
      -webkit-backdrop-filter: blur(3px);
      opacity: 0;
      transform: translateY(8px);
      transition: opacity 120ms ease, transform 120ms ease;
      pointer-events: none;
    }
    .chip[data-category="communication"] { padding-right: 58px; }
    .chip[data-visible="true"] { opacity: 1; transform: translateY(0); }
    .title { display: block; margin-bottom: 2px; font-weight: 600; }
    .detail { color: rgba(255, 255, 255, 0.68); }
    .controls {
      position: absolute;
      top: 4px;
      right: 4px;
      display: flex;
      gap: 3px;
      pointer-events: auto;
    }
    .control {
      box-sizing: border-box;
      width: 24px;
      height: 24px;
      padding: 0;
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: 6px;
      background: rgba(32, 32, 32, 0.32);
      color: rgba(255, 255, 255, 0.82);
      font: 12px/1 system-ui, sans-serif;
      cursor: pointer;
      pointer-events: auto;
    }
    .control:focus-visible {
      outline: 2px solid rgba(255, 255, 255, 0.9);
      outline-offset: 2px;
    }
  `;
  root.append(style);
  document.documentElement.append(host);
  return { host, root };
}

function detailForCurrentPage(language: UiLanguage): string {
  if (location.protocol === 'http:') {
    return language === 'ja'
      ? 'このページはHTTPです。通信経路は暗号化されていません。'
      : 'This page uses HTTP. The transport path is not encrypted.';
  }
  return language === 'ja'
    ? 'ConnectBitsは入力内容そのものを保存しません。'
    : 'ConnectBits does not store the input content itself.';
}

function mechanismLabel(mechanism: NetworkDescriptor['mechanism'], language: UiLanguage): string {
  return mechanism === 'fetch_or_xhr'
    ? language === 'ja'
      ? 'fetch/XHR系'
      : 'fetch/XHR'
    : language === 'ja'
      ? 'Beacon/Ping系'
      : 'Beacon/Ping';
}

function destinationRelationLabel(descriptor: NetworkDescriptor, language: UiLanguage): string {
  if (language === 'ja') {
    return descriptor.destinationRelation === 'same_origin'
      ? '同一オリジン'
      : descriptor.destinationRelation === 'cross_origin'
        ? '別オリジン'
        : descriptor.destinationRelation === 'non_http'
          ? 'HTTP以外'
          : '通信先関係不明';
  }
  return descriptor.destinationRelation === 'same_origin'
    ? 'same origin'
    : descriptor.destinationRelation === 'cross_origin'
      ? 'cross origin'
      : descriptor.destinationRelation === 'non_http'
        ? 'non-HTTP'
        : 'destination relation unknown';
}

export class FactChipPresenter {
  #hideTimer: number | undefined;
  #diagnosticTimer: number | undefined;
  #diagnosticAggregate: DiagnosticNetworkAggregate | undefined;
  #position: FactChipPosition;
  #language: UiLanguage;
  readonly #displayController: DisplayStateController;

  public constructor(
    displayController: DisplayStateController,
    initialPosition: FactChipPosition = 'right',
    language: UiLanguage = 'ja',
  ) {
    this.#displayController = displayController;
    this.#position = initialPosition;
    this.#language = language;
    displayController.subscribe((view) => {
      this.#position = view.display.current.factChipPosition;
      this.#language = resolveUiLanguage(view.settings.uiLanguage, browserUiLanguage());
      const host = document.getElementById(HOST_ID);
      if (host instanceof HTMLDivElement) {
        applyHostPosition(host, this.#position);
        host.dataset.memoryRevision = view.renderRevision;
        host.dataset.memorySource = view.display.committed.source.kind;
      }
      displayController.acknowledge('text_chip', view.renderRevision);
    });
  }

  #canShowCommunicationText(): boolean {
    return transientDisplayState().communicationTextVisible;
  }

  public show(surfaceType: SurfaceType, viscosityLevel: ViscosityLevel): void {
    this.#render(
      SURFACE_MESSAGES[this.#language][surfaceType],
      detailForCurrentPage(this.#language),
      viscosityLevel,
      'attention',
    );
  }

  public showCoverageBoundary(viscosityLevel: ViscosityLevel): void {
    this.#render(
      this.#language === 'ja' ? 'MAX報告モード' : 'MAX reporting mode',
      this.#language === 'ja'
        ? '観測可能な診断事象を表示します。通信本文、保存Cookie、ページ内部メモリ、確立済み通信路などは観測外です。'
        : 'Shows observable diagnostic events. Network payloads, stored Cookies, page-internal memory, and established communication streams remain outside the observation boundary.',
      viscosityLevel,
      'attention',
    );
  }

  public showFirstHostObservation(viscosityLevel: ViscosityLevel): void {
    this.#render(
      this.#language === 'ja' ? '初回観測ホスト' : 'First observation of this host',
      this.#language === 'ja'
        ? 'このホストでは、保存済みの観測表示履歴がありません。粘性レベルは自動変更していません。'
        : 'No saved display profile exists for this host. ConnectBits did not change the viscosity level automatically.',
      viscosityLevel,
      'attention',
    );
  }

  public showHostProfileReview(viscosityLevel: ViscosityLevel): void {
    this.#render(
      this.#language === 'ja' ? 'ホスト表示設定の再確認' : 'Review host display settings',
      this.#language === 'ja'
        ? 'このホストの表示設定は長期間更新されていません。必要に応じて全体設定へ戻して再観測できます。'
        : 'This host display profile has not been updated for an extended period. You can return to global settings and observe again.',
      viscosityLevel,
      'attention',
    );
  }

  public showInputOrigin(
    inputOrigin: InputOrigin,
    surfaceType: SurfaceType,
    viscosityLevel: ViscosityLevel,
  ): void {
    this.#render(
      inputOriginLabel(inputOrigin, this.#language),
      this.#language === 'ja'
        ? `${surfaceTypeLabel(surfaceType, this.#language)}として観測しました。入力内容は取得していません。`
        : `Observed as ${surfaceTypeLabel(surfaceType, this.#language)}. Input content was not collected.`,
      viscosityLevel,
      'attention',
    );
  }

  public showNetwork(descriptor: NetworkDescriptor, viscosityLevel: ViscosityLevel): void {
    if (!this.#canShowCommunicationText()) return;
    const relation = destinationRelationLabel(descriptor, this.#language);
    const host = descriptor.destinationHost === 'unknown' ? '' : ` · ${descriptor.destinationHost}`;
    const cookie =
      descriptor.cookieHeaderDetection === 'detected'
        ? this.#language === 'ja'
          ? 'Cookieヘッダーの存在を検出（値は未取得）'
          : 'Cookie header presence detected; values not collected'
        : descriptor.cookieHeaderDetection === 'not_detected'
          ? this.#language === 'ja'
            ? 'Cookieヘッダー未検出（不存在の証明ではない）'
            : 'Cookie header not detected; not proof of absence'
          : descriptor.cookieHeaderDetection === 'unavailable'
            ? this.#language === 'ja'
              ? 'Cookieヘッダー判定不能'
              : 'Cookie-header state unavailable'
            : this.#language === 'ja'
              ? 'Cookieヘッダー未観測'
              : 'Cookie header not observed';
    const title =
      descriptor.correlation === 'recent_submit_operation'
        ? this.#language === 'ja'
          ? '送信操作と近接した通信開始を観測'
          : 'Request start observed near a submission action'
        : this.#language === 'ja'
          ? '内容変更と近接した通信開始を観測'
          : 'Request start observed near a content edit';
    const detail =
      this.#language === 'ja'
        ? `${mechanismLabel(descriptor.mechanism, this.#language)} · ${descriptor.method} · ${relation}${host} · ${cookie}。通信本文は要求・取得せず、入力内容との因果関係も確認していません。`
        : `${mechanismLabel(descriptor.mechanism, this.#language)} · ${descriptor.method} · ${relation}${host} · ${cookie}. Network payloads were not requested or collected, and no causal relation to input content was established.`;
    this.#render(title, detail, viscosityLevel, 'communication');
  }

  public queueDiagnosticNetwork(
    descriptor: NetworkDescriptor,
    viscosityLevel: ViscosityLevel,
  ): void {
    if (!this.#canShowCommunicationText()) return;
    const aggregate = this.#diagnosticAggregate ?? {
      count: 0,
      methods: new Map<NetworkMethod, number>(),
      mechanisms: new Set<NetworkDescriptor['mechanism']>(),
      destinationHosts: new Set<string>(),
      sameOriginCount: 0,
      crossOriginCount: 0,
      cookieDetected: false,
      viscosityLevel,
    };

    aggregate.count += 1;
    aggregate.methods.set(descriptor.method, (aggregate.methods.get(descriptor.method) ?? 0) + 1);
    aggregate.mechanisms.add(descriptor.mechanism);
    if (descriptor.destinationHost !== 'unknown') {
      aggregate.destinationHosts.add(descriptor.destinationHost);
    }
    if (descriptor.destinationRelation === 'same_origin') aggregate.sameOriginCount += 1;
    if (descriptor.destinationRelation === 'cross_origin') aggregate.crossOriginCount += 1;
    aggregate.cookieDetected ||= descriptor.cookieHeaderDetection === 'detected';
    aggregate.viscosityLevel = viscosityLevel;
    this.#diagnosticAggregate = aggregate;

    if (this.#diagnosticTimer !== undefined) return;
    this.#diagnosticTimer = window.setTimeout(() => {
      this.#diagnosticTimer = undefined;
      const completed = this.#diagnosticAggregate;
      this.#diagnosticAggregate = undefined;
      if (!completed || !this.#canShowCommunicationText()) return;

      const methodSummary = [...completed.methods.entries()]
        .map(([method, count]) => `${method} ${count}`)
        .join(' / ');
      const mechanismSummary = [...completed.mechanisms]
        .map((mechanism) => mechanismLabel(mechanism, this.#language))
        .join(' · ');
      const relationParts: string[] = [];
      if (completed.sameOriginCount > 0) {
        relationParts.push(
          this.#language === 'ja'
            ? `同一 ${completed.sameOriginCount}`
            : `same ${completed.sameOriginCount}`,
        );
      }
      if (completed.crossOriginCount > 0) {
        relationParts.push(
          this.#language === 'ja'
            ? `別 ${completed.crossOriginCount}`
            : `cross ${completed.crossOriginCount}`,
        );
      }
      const relationSummary = relationParts.length > 0 ? ` · ${relationParts.join(' / ')}` : '';
      const hostSummary =
        completed.destinationHosts.size === 1
          ? ` · ${[...completed.destinationHosts][0] ?? ''}`
          : completed.destinationHosts.size > 1
            ? this.#language === 'ja'
              ? ' · 複数通信先'
              : ' · multiple destinations'
            : '';
      const cookie = completed.cookieDetected
        ? this.#language === 'ja'
          ? ' · Cookieヘッダーの存在検出を含む（値は未取得）'
          : ' · includes Cookie-header presence detection; values not collected'
        : '';

      this.#render(
        this.#language === 'ja'
          ? `通信活動 ${completed.count}件`
          : `${completed.count} communication events`,
        this.#language === 'ja'
          ? `${methodSummary} · ${mechanismSummary}${relationSummary}${hostSummary}${cookie}。相関可能な利用者操作は確認していません。通信本文と通信目的は未確認です。`
          : `${methodSummary} · ${mechanismSummary}${relationSummary}${hostSummary}${cookie}. No correlatable user action was observed. Network payload and purpose remain unconfirmed.`,
        completed.viscosityLevel,
        'communication',
      );
    }, DIAGNOSTIC_CHIP_AGGREGATION_WINDOW_MS);
  }

  public showSubmission(
    descriptor: SubmissionDescriptor,
    viscosityLevel: ViscosityLevel,
    confirmed: boolean,
  ): void {
    if (!this.#canShowCommunicationText()) return;
    const relation =
      descriptor.destinationRelation === 'same_origin'
        ? this.#language === 'ja'
          ? '同一オリジン'
          : 'same origin'
        : descriptor.destinationRelation === 'cross_origin'
          ? this.#language === 'ja'
            ? '別オリジン'
            : 'cross origin'
          : descriptor.destinationRelation === 'non_http'
            ? this.#language === 'ja'
              ? 'HTTP以外'
              : 'non-HTTP'
            : this.#language === 'ja'
              ? '送信先不明'
              : 'destination unknown';
    const title = confirmed
      ? descriptor.association === 'correlated_submit_event'
        ? this.#language === 'ja'
          ? 'フォーム操作とsubmitイベントを相関'
          : 'Form action correlated with a submit event'
        : this.#language === 'ja'
          ? 'フォームsubmitイベントを観測'
          : 'Form submit event observed'
      : descriptor.association === 'declared_submit_control'
        ? this.#language === 'ja'
          ? 'フォーム関連submit要素を観測'
          : 'Form-associated submit element observed'
        : this.#language === 'ja'
          ? 'Enterによる送信候補を観測'
          : 'Enter-based submission candidate observed';
    const host = descriptor.destinationHost === 'unknown' ? '' : ` · ${descriptor.destinationHost}`;
    this.#render(
      title,
      this.#language === 'ja'
        ? `${descriptor.method} · ${relation}${host}。実際の通信成立やサーバー到達は未確認です。`
        : `${descriptor.method} · ${relation}${host}. Request completion and server receipt were not confirmed.`,
      viscosityLevel,
      'communication',
    );
  }

  #render(
    titleText: string,
    detailText: string,
    viscosityLevel: ViscosityLevel,
    category: ChipCategory,
  ): void {
    const { root, host } = ensureHost(this.#position);
    root.querySelector('.chip')?.remove();

    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.dataset.category = category;
    chip.setAttribute('role', 'status');
    chip.setAttribute('aria-live', 'polite');

    const title = document.createElement('span');
    title.className = 'title';
    title.textContent = titleText;

    const detail = document.createElement('span');
    detail.className = 'detail';
    detail.textContent = detailText;

    const move = document.createElement('button');
    move.className = 'control move';
    move.type = 'button';
    const current = (host.dataset.position as FactChipPosition | undefined) ?? this.#position;
    const next = nextFactChipPosition(current);
    move.textContent = '↻';
    move.setAttribute(
      'aria-label',
      this.#language === 'ja'
        ? `チップ表示位置を${factChipPositionLabel(next, this.#language)}へ変更`
        : `Move chip to ${factChipPositionLabel(next, this.#language)}`,
    );
    move.title =
      this.#language === 'ja'
        ? `${factChipPositionLabel(next, this.#language)}へ移動`
        : `Move to ${factChipPositionLabel(next, this.#language)}`;
    move.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const from = this.#displayController.commandSnapshot().display.current.factChipPosition;
      const to = nextFactChipPosition(from);
      this.#displayController.updateDraft({ factChipPosition: to });
      const following = nextFactChipPosition(to);
      move.setAttribute(
        'aria-label',
        this.#language === 'ja'
          ? `チップ表示位置を${factChipPositionLabel(following, this.#language)}へ変更`
          : `Move chip to ${factChipPositionLabel(following, this.#language)}`,
      );
      move.title =
        this.#language === 'ja'
          ? `${factChipPositionLabel(following, this.#language)}へ移動`
          : `Move to ${factChipPositionLabel(following, this.#language)}`;
    });

    const controls = document.createElement('span');
    controls.className = 'controls';

    if (category === 'communication') {
      const mute = document.createElement('button');
      mute.className = 'control mute';
      mute.type = 'button';
      mute.textContent = 'T';
      const muteLabel =
        this.#language === 'ja'
          ? 'このページで通信説明チップを一時的に非表示'
          : 'Temporarily hide communication text chips on this page';
      mute.setAttribute('aria-label', muteLabel);
      mute.title = muteLabel;
      mute.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.#displayController.updateDraft({ communicationTextChipEnabled: false });
        chip.setAttribute('data-visible', 'false');
        window.setTimeout(() => chip.remove(), 180);
      });
      controls.append(mute);
    }
    controls.append(move);

    chip.append(title, detail, controls);
    root.append(chip);
    requestAnimationFrame(() => chip.setAttribute('data-visible', 'true'));

    if (this.#hideTimer !== undefined) window.clearTimeout(this.#hideTimer);
    const duration = viscosityLevel === 1 ? 4000 : viscosityLevel === 2 ? 6500 : 9000;
    this.#hideTimer = window.setTimeout(() => {
      chip.setAttribute('data-visible', 'false');
      window.setTimeout(() => chip.remove(), 180);
    }, duration);
  }
}
