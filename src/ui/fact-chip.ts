import { factChipPositionLabel, nextFactChipPosition } from '../core/fact-chip-position';
import { DIAGNOSTIC_CHIP_AGGREGATION_WINDOW_MS } from '../core/network-correlation';
import type { NetworkDescriptor, NetworkMethod } from '../core/models/network';
import type { InputOrigin, SurfaceType } from '../core/models/observation';
import type { FactChipPosition, ViscosityLevel } from '../core/models/settings';
import type { SubmissionDescriptor } from '../core/models/submission';
import { inputOriginLabel, surfaceTypeLabel } from '../core/observation-presentation';
import { saveHostDisplayProfile } from '../storage/host-display-profile-store';
import { setCommunicationTextVisible, transientDisplayState } from './transient-display-state';

const HOST_ID = 'dssi-core-a-fact-chip-host';

const SURFACE_MESSAGES: Readonly<Record<SurfaceType, string>> = {
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

function detailForCurrentPage(): string {
  if (location.protocol === 'http:') {
    return 'このページはHTTPです。通信経路は暗号化されていません。';
  }
  return 'DSSIは入力内容そのものを保存しません。';
}

function mechanismLabel(mechanism: NetworkDescriptor['mechanism']): string {
  return mechanism === 'fetch_or_xhr' ? 'fetch/XHR系' : 'Beacon/Ping系';
}

function destinationRelationLabel(descriptor: NetworkDescriptor): string {
  return descriptor.destinationRelation === 'same_origin'
    ? '同一オリジン'
    : descriptor.destinationRelation === 'cross_origin'
      ? '別オリジン'
      : descriptor.destinationRelation === 'non_http'
        ? 'HTTP以外'
        : '通信先関係不明';
}

interface FactChipPresenterOptions {
  hostname?: string;
}

export class FactChipPresenter {
  #hideTimer: number | undefined;
  #diagnosticTimer: number | undefined;
  #diagnosticAggregate: DiagnosticNetworkAggregate | undefined;
  readonly #initialPosition: FactChipPosition;
  readonly #hostname: string;

  public constructor(
    initialPosition: FactChipPosition = 'right',
    options: FactChipPresenterOptions = {},
  ) {
    this.#initialPosition = initialPosition;
    this.#hostname = options.hostname ?? location.hostname ?? 'unknown';
  }

  #canShowCommunicationText(): boolean {
    return transientDisplayState().communicationTextVisible;
  }

  public show(surfaceType: SurfaceType, viscosityLevel: ViscosityLevel): void {
    this.#render(
      SURFACE_MESSAGES[surfaceType],
      detailForCurrentPage(),
      viscosityLevel,
      'attention',
    );
  }

  public showCoverageBoundary(viscosityLevel: ViscosityLevel): void {
    this.#render(
      'MAX報告モード',
      '観測可能な診断事象を表示します。本文、保存Cookie、ページ内部メモリ、確立済み通信路などは観測外です。',
      viscosityLevel,
      'attention',
    );
  }

  public showFirstHostObservation(viscosityLevel: ViscosityLevel): void {
    this.#render(
      '初回観測ホスト',
      'このホストでは、保存済みの観測表示履歴がありません。粘性レベルは自動変更していません。',
      viscosityLevel,
      'attention',
    );
  }

  public showHostProfileReview(viscosityLevel: ViscosityLevel): void {
    this.#render(
      'ホスト表示設定の再確認',
      'このホストの表示設定は長期間更新されていません。必要に応じて全体設定へ戻して再観測できます。',
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
      inputOriginLabel(inputOrigin),
      `${surfaceTypeLabel(surfaceType)}として観測しました。入力内容は取得していません。`,
      viscosityLevel,
      'attention',
    );
  }

  public showNetwork(descriptor: NetworkDescriptor, viscosityLevel: ViscosityLevel): void {
    if (!this.#canShowCommunicationText()) return;
    const relation = destinationRelationLabel(descriptor);
    const host = descriptor.destinationHost === 'unknown' ? '' : ` · ${descriptor.destinationHost}`;
    const cookie =
      descriptor.cookieHeaderDetection === 'detected'
        ? 'Cookieヘッダー検出'
        : descriptor.cookieHeaderDetection === 'not_detected'
          ? 'Cookieヘッダー未検出'
          : descriptor.cookieHeaderDetection === 'unavailable'
            ? 'Cookieヘッダー判定不能'
            : 'Cookieヘッダー未観測';
    const title =
      descriptor.correlation === 'recent_submit_operation'
        ? '送信操作と近接した通信開始を観測'
        : '内容変更と近接した通信開始を観測';
    this.#render(
      title,
      `${mechanismLabel(descriptor.mechanism)} · ${descriptor.method} · ${relation}${host} · ${cookie}。本文は取得せず、入力内容との因果関係も確認していません。`,
      viscosityLevel,
      'communication',
    );
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
      const mechanismSummary = [...completed.mechanisms].map(mechanismLabel).join('・');
      const relationParts: string[] = [];
      if (completed.sameOriginCount > 0) relationParts.push(`同一 ${completed.sameOriginCount}`);
      if (completed.crossOriginCount > 0) relationParts.push(`別 ${completed.crossOriginCount}`);
      const relationSummary = relationParts.length > 0 ? ` · ${relationParts.join(' / ')}` : '';
      const hostSummary =
        completed.destinationHosts.size === 1
          ? ` · ${[...completed.destinationHosts][0] ?? ''}`
          : completed.destinationHosts.size > 1
            ? ' · 複数通信先'
            : '';
      const cookie = completed.cookieDetected ? ' · Cookieヘッダー検出を含む' : '';

      this.#render(
        `通信活動 ${completed.count}件`,
        `${methodSummary} · ${mechanismSummary}${relationSummary}${hostSummary}${cookie}。相関可能な利用者操作は確認していません。本文と通信目的は未確認です。`,
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
        ? '同一オリジン'
        : descriptor.destinationRelation === 'cross_origin'
          ? '別オリジン'
          : descriptor.destinationRelation === 'non_http'
            ? 'HTTP以外'
            : '送信先不明';
    const title = confirmed
      ? descriptor.association === 'correlated_submit_event'
        ? 'フォーム操作とsubmitイベントを相関'
        : 'フォームsubmitイベントを観測'
      : descriptor.association === 'declared_submit_control'
        ? 'フォーム関連submit要素を観測'
        : 'Enterによる送信候補を観測';
    const host = descriptor.destinationHost === 'unknown' ? '' : ` · ${descriptor.destinationHost}`;
    this.#render(
      title,
      `${descriptor.method} · ${relation}${host}。実際の通信成立やサーバー到達は未確認です。`,
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
    const { root, host } = ensureHost(this.#initialPosition);
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
    const current =
      (host.dataset.position as FactChipPosition | undefined) ?? this.#initialPosition;
    const next = nextFactChipPosition(current);
    move.textContent = '↻';
    move.setAttribute('aria-label', `チップ表示位置を${factChipPositionLabel(next)}へ変更`);
    move.title = `${factChipPositionLabel(next)}へ移動`;
    move.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const from = (host.dataset.position as FactChipPosition | undefined) ?? this.#initialPosition;
      const to = nextFactChipPosition(from);
      applyHostPosition(host, to);
      window.dispatchEvent(new CustomEvent('dssi-core-a-chip-position-changed', { detail: to }));
      const following = nextFactChipPosition(to);
      move.setAttribute('aria-label', `チップ表示位置を${factChipPositionLabel(following)}へ変更`);
      move.title = `${factChipPositionLabel(following)}へ移動`;
      void saveHostDisplayProfile(this.#hostname, { position: to });
    });

    const controls = document.createElement('span');
    controls.className = 'controls';

    if (category === 'communication') {
      const mute = document.createElement('button');
      mute.className = 'control mute';
      mute.type = 'button';
      mute.textContent = 'T';
      mute.setAttribute('aria-label', 'このホストの通信説明チップを非表示にして保存');
      mute.title = '通信説明チップを非表示にして保存';
      mute.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        setCommunicationTextVisible(false);
        void saveHostDisplayProfile(this.#hostname, {
          communicationTextVisible: false,
        });
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
