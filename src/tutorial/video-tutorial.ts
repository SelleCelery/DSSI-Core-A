import type { DisplaySettingsBundle } from '../core/models/display-memory';
import type { NetworkDescriptor } from '../core/models/network';
import type { ObservationLogRecord, SurfaceType } from '../core/models/observation';
import { DEFAULT_SETTINGS, type DssiSettings } from '../core/models/settings';
import type { SubmissionDescriptor } from '../core/models/submission';
import { browserUiLanguage, resolveUiLanguage, type UiLanguage } from '../i18n/ui';
import { readSettingsMemory } from '../storage/settings-memory-client';
import {
  COMMUNICATION_PULSE_HOST_ID,
  CommunicationPulsePresenter,
} from '../ui/communication-pulse';
import type { DisplayStateController, DisplayStateView } from '../ui/display-state-controller';
import { FACT_CHIP_HOST_ID, FactChipPresenter } from '../ui/fact-chip';
import {
  renderObservationSimpleStream,
  type TaggedObservationRecord,
} from '../ui/observation-simple-stream';
import { requiredElement } from '../ui/required-element';
import { setCommunicationTextVisible, setPulseVisible } from '../ui/transient-display-state';
import {
  completeTutorialState,
  loadTutorialState,
  recordTutorialPresentation,
  recordTutorialProgress,
  saveTutorialState,
  type TutorialState,
} from '../storage/tutorial-store';

const stage = requiredElement<HTMLElement>('#stage');
const kicker = requiredElement<HTMLElement>('#kicker');
const heading = requiredElement<HTMLElement>('#heading');
const narration = requiredElement<HTMLElement>('#narration');
const nextButton = requiredElement<HTMLButtonElement>('#next');
const backButton = requiredElement<HTMLButtonElement>('#back');
const restartButton = requiredElement<HTMLButtonElement>('#restart');
const progress = requiredElement<HTMLProgressElement>('#progress');
const stepText = requiredElement<HTMLElement>('#stepText');
const clock = requiredElement<HTMLElement>('#clock');
const tutorialContext = requiredElement<HTMLElement>('#tutorialContext');
const tutorialShell = requiredElement<HTMLElement>('#tutorialShell');
const tutorialRenderNote = requiredElement<HTMLElement>('#tutorialRenderNote');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

let language: UiLanguage = resolveUiLanguage('auto', browserUiLanguage());

function local(japanese: string, english: string): string {
  return language === 'ja' ? japanese : english;
}

function applyTutorialLanguage(): void {
  document.documentElement.lang = language;
  document.documentElement.dir = 'ltr';
  document.title = local(
    'ConnectBits — 三つの架空サイトで観測表示を見る',
    'ConnectBits — Reading observation displays across three fictional sites',
  );
  tutorialContext.textContent = local(
    '架空例｜買い物・動画・読み物',
    'Fictional examples | Shopping, video, and reading',
  );
  tutorialShell.setAttribute(
    'aria-label',
    local(
      '買い物、動画、読み物サイトで観測表示を見るチュートリアル',
      'Tutorial for reading observation displays on shopping, video, and reading sites',
    ),
  );
  backButton.textContent = local('一つ戻る', 'Back one scene');
  restartButton.textContent = local('最初から', 'Start over');
  tutorialRenderNote.textContent = local(
    '通信パルス、入力面チップ、簡易ストリームは、ConnectBits本体と同じ描画コードを使っています。',
    'Communication pulses, input-surface chips, and the compact stream use the same rendering code as ConnectBits itself.',
  );
}

type Timer = ReturnType<typeof window.setTimeout>;

interface TutorialFrame {
  time: string;
  kicker: string;
  heading: string;
  next: string;
  stage: () => string;
  text: string;
  lockMs?: number;
  enter?: () => void;
}

class TutorialDisplayController {
  readonly #hostname: string;
  readonly #listeners = new Set<(view: DisplayStateView) => void>();
  readonly #settings: DssiSettings;
  #bundle: DisplaySettingsBundle;
  #source: { kind: 'global' } | { kind: 'host'; hostname: string } = { kind: 'global' };
  #revision = 0;

  public constructor(
    hostname: string,
    options: {
      viscosityLevel?: DssiSettings['viscosityLevel'];
      reportingMode?: DssiSettings['reportingMode'];
      factChipPosition?: DssiSettings['factChipPosition'];
    } = {},
  ) {
    this.#hostname = hostname;
    const factChipPosition = options.factChipPosition ?? 'right';
    this.#settings = {
      ...DEFAULT_SETTINGS,
      enabled: true,
      viscosityLevel: options.viscosityLevel ?? 2,
      reportingMode: options.reportingMode ?? 'standard',
      networkObservationEnabled: true,
      communicationPulseEnabled: true,
      communicationTextChipEnabled: false,
      communicationPulseDurationMs: 10000,
      communicationPulseSize: 'medium',
      factChipPosition,
      uiLanguage: language,
    };
    this.#bundle = {
      communicationPulseEnabled: true,
      communicationTextChipEnabled: false,
      observationSettingsPanelVisible: false,
      factChipPosition,
      communicationPulseDurationMs: 10000,
      communicationPulseOpacity: this.#settings.communicationPulseOpacity,
      communicationPulseDomColor: this.#settings.communicationPulseDomColor,
      communicationPulseWebRequestColor: this.#settings.communicationPulseWebRequestColor,
    };
    setPulseVisible(true);
    setCommunicationTextVisible(false);
  }

  public snapshot(): DisplayStateView {
    const revision = `tutorial:${this.#revision}`;
    return {
      settings: { ...this.#settings, ...this.#bundle },
      display: {
        committed: {
          source: this.#source,
          revision,
          bundle: { ...this.#bundle },
          updatedAt: Date.now(),
        },
        current: { ...this.#bundle },
        draft: {},
        draftBaseRevision: revision,
        draftRevision: this.#revision,
        dirty: false,
      },
      renderRevision: revision,
      synchronization: 'synchronized',
    };
  }

  public commandSnapshot(): DisplayStateView {
    return this.snapshot();
  }

  public subscribe(listener: (view: DisplayStateView) => void): () => void {
    this.#listeners.add(listener);
    listener(this.snapshot());
    return () => this.#listeners.delete(listener);
  }

  public acknowledge(): void {}

  public updateDraft(patch: Partial<DisplaySettingsBundle>): void {
    this.#bundle = { ...this.#bundle, ...patch };
    this.#revision += 1;
    setPulseVisible(this.#bundle.communicationPulseEnabled);
    setCommunicationTextVisible(this.#bundle.communicationTextChipEnabled);
    this.#notify();
  }

  public saveHostDraft(): Promise<{ ok: true }> {
    this.#source = { kind: 'host', hostname: this.#hostname };
    this.#revision += 1;
    this.#notify();
    return Promise.resolve({ ok: true });
  }

  public removeHostMemory(): Promise<{ ok: true }> {
    this.#source = { kind: 'global' };
    this.#revision += 1;
    this.#notify();
    return Promise.resolve({ ok: true });
  }

  #notify(): void {
    const view = this.snapshot();
    for (const listener of this.#listeners) listener(view);
  }
}

let frameIndex = 0;
let timers: Timer[] = [];
let pulsePresenter: CommunicationPulsePresenter | undefined;
let tutorialState: TutorialState | undefined;
let tutorialStateSaveChain = Promise.resolve();

function extensionStorageAvailable(): boolean {
  return typeof chrome !== 'undefined' && chrome.storage?.local !== undefined;
}

function queueTutorialStateSave(nextState: TutorialState): void {
  tutorialState = nextState;
  if (!extensionStorageAvailable()) return;
  tutorialStateSaveChain = tutorialStateSaveChain
    .then(() => saveTutorialState(nextState))
    .catch(() => undefined);
}

function later(action: () => void, delayMs: number): void {
  timers.push(window.setTimeout(action, reduceMotion ? 0 : delayMs));
}

function clearTimers(): void {
  for (const timer of timers) window.clearTimeout(timer);
  timers = [];
}

function browserChrome(address: string): string {
  return `<div class="browser-chrome">
    <span class="browser-dots"><i></i><i></i><i></i></span>
    <span class="address">${address}</span>
  </div>`;
}

interface ShopPageOptions {
  view?: 'browse' | 'checkout';
  activeField?: boolean;
  query?: string;
  status?: string;
  cursor?: boolean;
}

function shopPage(options: ShopPageOptions = {}): string {
  const view = options.view ?? 'browse';
  const checkout = view === 'checkout';
  const cursorPosition = checkout ? 'left:39%;top:64%' : 'left:20%;top:27%';
  const pageBody = checkout
    ? `<div class="shop-checkout">
        <section class="shop-checkout-card">
          <h2>${local('お届け先と注文', 'Delivery and order')}</h2>
          <label>${local('お名前', 'Name')}</label><div class="shop-fake-field"></div>
          <label>${local('お届け先', 'Delivery address')}</label><div class="shop-fake-field"></div>
          <button class="shop-order-button" type="button">${local('注文内容を送信する', 'Submit order')}</button>
        </section>
        <aside class="shop-checkout-card shop-order-summary">
          <h2>${local('注文内容', 'Order summary')}</h2>
          <p>${local('考えすぎる人のための枕', 'A Pillow for People Who Overthink Sleep')}</p><p>${local('数量 1', 'Quantity 1')}</p>
          <p class="shop-order-total">${local('合計 4,280円', 'Total ¥4,280')}</p>
        </aside>
      </div>`
    : `<div class="shop-search-wrap">
        <label class="shop-search ${options.activeField ? 'is-active' : ''}">
          <span class="sr-only">${local('商品を検索', 'Search products')}</span>
          <input id="shopSearch" type="search" value="${options.query ?? ''}" placeholder="${local('何をお探しですか', 'What are you looking for?')}" readonly />
        </label>
        <p id="shopSearchStatus" class="shop-search-status">${options.status ?? ''}</p>
      </div>
      <div class="shop-product-grid">
        <article class="shop-product-card"><div class="shop-product-art">☁</div><h3>${local('考えすぎる人のための枕', 'A Pillow for People Who Overthink Sleep')}</h3><span>${local('4,280円', '¥4,280')}</span></article>
        <article class="shop-product-card"><div class="shop-product-art">◡</div><h3>${local('だいたい片づく小物入れ', 'The Mostly-Tidy Storage Box')}</h3><span>${local('2,100円', '¥2,100')}</span></article>
        <article class="shop-product-card"><div class="shop-product-art">∿</div><h3>${local('飲み頃を待ちすぎるマグ', 'The Mug That Waits Too Long')}</h3><span>${local('1,860円', '¥1,860')}</span></article>
      </div>`;

  return `<div class="browser shop-browser">
    ${browserChrome(`https://pochipochi.example/${checkout ? 'checkout' : 'search'}`)}
    <header class="shop-header">
      <div><strong>${local('ポチポチ商店', 'Click-Click Shop')}</strong><span>${local('だいたい揃う。たぶん届く。', 'Usually in stock. Probably delivered.')}</span></div>
      <span>${local('買い物かご', 'Cart')} ${checkout ? '1' : '0'}</span>
    </header>
    <main class="shop-main">${pageBody}</main>
    ${options.cursor ? `<span id="cursor" class="cursor dark-cursor" style="${cursorPosition}"></span>` : ''}
  </div>`;
}

function videoPage(
  options: {
    playing?: boolean;
    time?: string;
    progress?: string;
    cursor?: boolean;
  } = {},
): string {
  const playing = options.playing ?? false;
  return `<div class="browser">
    ${browserChrome('https://mitamita.example/watch/observation-room')}
    <header class="video-header">
      <div><div class="video-brand">${local('みたみた動画', 'Saw-Saw Video')}</div><div class="video-tagline">${local('見るものいろいろ。分かったかは別。', 'Many things to watch. Understanding is another matter.')}</div></div>
      <span class="viewer-mark">${local('あとで見る', 'Watch later')}</span>
    </header>
    <div class="video-page">
      <div class="player-shell">
        <video id="demoVideo" muted playsinline preload="metadata" src="tutorial/tutorial-motion-comic.mp4"></video>
        <span id="playOverlay" class="play-overlay" ${playing ? 'hidden' : ''} aria-hidden="true">▶</span>
        <div class="player-controls">
          <span id="controlGlyph">${playing ? 'Ⅱ' : '▶'}</span>
          <div class="video-track"><div class="video-progress" style="--video-progress:${options.progress ?? '3%'}"></div></div>
          <span>${options.time ?? '0:00 / 0:18'}</span>
        </div>
      </div>
      <div class="video-meta">
        <div><h3>${local('「神を見ました！」—冥府局・転生課保育室', '“I Saw God!” — Underworld Bureau, Reincarnation Division Nursery')}</h3><span class="channel">${local('冥府局だいたい公式 ・ 17回くらい再生', 'Underworld Bureau, More-or-Less Official · about 17 views')}</span></div>
        <span class="fiction-note">${local('架空動画・外部通信なし', 'Fictional video · no external traffic')}</span>
      </div>
    </div>
    ${options.cursor ? '<span id="cursor" class="cursor" style="left:43%;top:42%"></span>' : ''}
  </div>`;
}

interface ReadingSitePageOptions {
  view?: 'home' | 'article' | 'ending';
  dialog?: 'login' | 'subscription';
  activeField?: 'search' | 'password' | 'payment';
  cursor?: boolean;
}

function readingSitePage(options: ReadingSitePageOptions = {}): string {
  const view = options.view ?? 'home';
  const activeField = options.activeField;
  const pageBody =
    view === 'home'
      ? `<main class="reading-home">
        <section class="reading-hero">
          <p>${local('まだ名前のない仕事、場所、関係を。', 'For work, places, and relationships that do not have names yet.')}</p>
          <h2>${local('ないなら、いったん創設してみる。', 'If it does not exist, try founding it for now.')}</h2>
          <label class="reading-search ${activeField === 'search' ? 'is-active' : ''}">
            <span class="sr-only">${local('投稿を検索', 'Search posts')}</span>
            <input type="search" value="${local('ビット センテンス', 'bits sentence')}" aria-label="${local('投稿を検索', 'Search posts')}" />
            <button type="button">${local('検索', 'Search')}</button>
          </label>
        </section>
        <section class="reading-results">
          <p class="reading-section-label">${local('見つかった考え方', 'Ideas found')}</p>
          <article class="reading-result-card">
            <span>${local('接続と文章', 'Connections and sentences')}</span>
            <h3>${local('ビットをつなげても、センテンスになるのか？', 'Do Connected Bits Become a Sentence?')}</h3>
            <p>${local('点が二つあれば、人は線を引きたくなる。けれど、近くで起きたことと、同じ意味を持つことは別かもしれない。', 'Give people two points and they will want to draw a line. But happening close together and sharing the same meaning may be different things.')}</p>
            <small>${local('未接続 静・6分で読めます', 'Shizuka Unconnected · 6 min read')}</small>
          </article>
        </section>
      </main>`
      : `<main class="reading-article ${view === 'ending' ? 'at-ending' : ''}">
        <div class="article-meta"><span>${local('接続と文章', 'Connections and sentences')}</span><span>${local('2026年8月27日', 'August 27, 2026')}</span></div>
        <h2>${local('ビットをつなげても、<br />センテンスになるのか？', 'Do Connected Bits<br />Become a Sentence?')}</h2>
        <p class="article-author">${local('未接続 静', 'Shizuka Unconnected')}</p>
        <article class="article-body">
          ${
            view === 'ending'
              ? local(
                  `<p>「分かりません」と表示する機械は、役に立たないのだろうか。</p>
                <p>それとも、分かったふりをしない機械が珍しいだけなのだろうか。</p>
                <blockquote>つないだ線には、継ぎ目を残してほしい。<br />観測したこと。考えたこと。まだ、つながっていないこと。</blockquote>
                <p>それを親切と呼ぶか、性格が悪いと呼ぶかは、まだ決めなくていい。</p>`,
                  `<p>Is a machine that displays “I do not know” really useless?</p>
                <p>Or are machines that do not pretend to know simply rare?</p>
                <blockquote>Please leave the joins visible in every line you draw.<br />What was observed. What was considered. What has not yet been connected.</blockquote>
                <p>You do not have to decide yet whether that is kindness or bad manners.</p>`,
                )
              : local(
                  `<p>点が二つあれば、人は線を引きたくなる。</p>
                <p>操作の近くで通信が起きれば、その二つにも理由をつけたくなる。けれど、近くで起きたことと、同じ意味を持つことは、たぶん別だ。</p>
                <p>ConnectBitsという名前は、少し厚かましい。ビットをつなぐところまでは機械にもできる。それをセンテンスにしてしまうのは、だいたい人間だからだ。</p>`,
                  `<p>Give people two points and they will want to draw a line.</p>
                <p>When communication happens near an action, they will want to give those two things a reason as well. But happening close together and sharing the same meaning are probably different things.</p>
                <p>The name ConnectBits is a little presumptuous. A machine can connect bits. Turning them into a sentence is usually something a person does.</p>`,
                )
          }
        </article>
        <div class="reading-subscription">
          <div><strong>${local('創設家見習い便り', "The Founder's Apprentice Letter")}</strong><span>${local('月300円・いつでも終了できます', '¥300/month · cancel anytime')}</span></div>
          <button type="button">${local('購読して続きを読む', 'Subscribe to keep reading')}</button>
        </div>
      </main>`;

  const dialog =
    options.dialog === 'login'
      ? `<div class="reading-dialog-layer">
        <form class="reading-dialog" aria-label="${local('架空のログイン画面', 'Fictional login dialog')}">
          <button class="dialog-close" type="button" aria-label="${local('閉じる', 'Close')}">×</button>
          <p class="dialog-kicker">${local('創設家になろう', "Let's Become a Founder")}</p>
          <h3>${local('ログイン', 'Log in')}</h3>
          <label>${local('メールアドレス', 'Email address')}<input type="email" autocomplete="username" placeholder="name@example.com" /></label>
          <label class="${activeField === 'password' ? 'is-active' : ''}">${local('パスワード', 'Password')}<input type="password" autocomplete="current-password" placeholder="••••••••" /></label>
          <button class="dialog-primary" type="button">${local('ログイン', 'Log in')}</button>
          <small>${local('この画面はチュートリアル用の架空表示です。', 'This is a fictional screen for the tutorial.')}</small>
        </form>
      </div>`
      : options.dialog === 'subscription'
        ? `<div class="reading-dialog-layer">
          <form class="reading-dialog payment-dialog" aria-label="${local('架空の購読画面', 'Fictional subscription dialog')}">
            <button class="dialog-close" type="button" aria-label="${local('閉じる', 'Close')}">×</button>
            <p class="dialog-kicker">${local('創設家見習い便り', "The Founder's Apprentice Letter")}</p>
            <h3>${local('月300円で購読', 'Subscribe for ¥300/month')}</h3>
            <p class="dialog-description">${local('ここでは入力しません。欄を選んだところまで進めます。', 'We will not type here. We will only select the field.')}</p>
            <label class="${activeField === 'payment' ? 'is-active' : ''}">${local('カード番号', 'Card number')}<input type="text" inputmode="numeric" autocomplete="cc-number" placeholder="0000 0000 0000 0000" /></label>
            <div class="payment-row"><label>${local('有効期限', 'Expiry')}<input type="text" autocomplete="cc-exp" placeholder="MM / YY" /></label><label>${local('セキュリティコード', 'Security code')}<input type="text" autocomplete="cc-csc" placeholder="000" /></label></div>
            <button class="dialog-primary" type="button">${local('購読を確定', 'Confirm subscription')}</button>
            <small>${local('実在する決済ではなく、外部送信もありません。', 'This is not a real payment and nothing is sent externally.')}</small>
          </form>
        </div>`
        : '';

  const cursorPosition =
    activeField === 'search'
      ? 'left:54%;top:29%'
      : activeField === 'password'
        ? 'left:57%;top:52%'
        : 'left:56%;top:43%';

  return `<div class="browser reading-browser">
    ${browserChrome(`https://sousetsuka.example/${view === 'home' ? 'search' : 'works/bit-sentence'}`)}
    <header class="reading-header">
      <div><strong>${local('創設家になろう', "Let's Become a Founder")}</strong><span>${local('まだないものは、いったん名前から。', 'If it does not exist yet, start by naming it.')}</span></div>
      <nav><button type="button">${local('考え方を探す', 'Find ideas')}</button><button type="button">${local('ログイン', 'Log in')}</button></nav>
    </header>
    <div class="reading-viewport">${pageBody}</div>
    ${dialog}
    ${options.cursor ? `<span id="cursor" class="cursor dark-cursor" style="${cursorPosition}"></span>` : ''}
  </div>`;
}

function setVideo(seconds: number, playing: boolean): void {
  const video = document.querySelector<HTMLVideoElement>('#demoVideo');
  if (!video) return;
  const apply = (): void => {
    try {
      video.currentTime = seconds;
    } catch {
      // Metadata can still be unavailable in file previews.
    }
    if (playing) void video.play().catch(() => undefined);
    else video.pause();
  };
  if (video.readyState >= 1) apply();
  else video.addEventListener('loadedmetadata', apply, { once: true });
}

function mountProductionPulsePresenter(hostname = 'mitamita.example'): CommunicationPulsePresenter {
  document.getElementById(COMMUNICATION_PULSE_HOST_ID)?.remove();
  const controller = new TutorialDisplayController(hostname);
  const presenter = new CommunicationPulsePresenter({
    displayController: controller as unknown as DisplayStateController,
    hostname,
    size: 'medium',
    enabled: true,
    language,
  });
  const host = requiredElement<HTMLDivElement>(`#${COMMUNICATION_PULSE_HOST_ID}`);
  const browser = requiredElement<HTMLElement>('.browser');
  host.style.setProperty('position', 'absolute');
  browser.append(host);
  pulsePresenter = presenter;
  return presenter;
}

function mountProductionFactChip(
  surfaceType: SurfaceType,
  hostname = 'sousetsuka.example',
): FactChipPresenter {
  document.getElementById(FACT_CHIP_HOST_ID)?.remove();
  const controller = new TutorialDisplayController(hostname, {
    viscosityLevel: 3,
    reportingMode: 'max_coverage',
    factChipPosition: 'top',
  });
  const presenter = new FactChipPresenter(
    controller as unknown as DisplayStateController,
    'top',
    language,
  );
  const anchor = requiredElement<HTMLElement>('.is-active input');
  presenter.show(surfaceType, 3, anchor);
  return presenter;
}

function showFieldCue(surfaceType: SurfaceType, hostname = 'sousetsuka.example'): void {
  const cursor = document.querySelector<HTMLElement>('#cursor');
  if (cursor) {
    later(() => {
      cursor.dataset.clicking = 'true';
    }, 100);
    later(() => {
      cursor.dataset.clicking = 'false';
    }, 240);
  }
  later(() => mountProductionFactChip(surfaceType, hostname), 260);
}

function shoppingSearchDescriptor(): NetworkDescriptor {
  return {
    method: 'GET',
    destinationRelation: 'same_origin',
    destinationScheme: 'https',
    destinationHost: 'pochipochi.example',
    mechanism: 'fetch_or_xhr',
    correlation: 'recent_content_edit',
    payloadObservation: 'not_requested',
    cookieHeaderDetection: 'not_detected',
    pageObservationTiming: 'after_5s_of_page_observation',
  };
}

function shoppingOrderNetworkDescriptor(): NetworkDescriptor {
  return {
    method: 'POST',
    destinationRelation: 'cross_origin',
    destinationScheme: 'https',
    destinationHost: 'api.pochipochi.example',
    mechanism: 'fetch_or_xhr',
    correlation: 'recent_submit_operation',
    payloadObservation: 'not_requested',
    cookieHeaderDetection: 'detected',
    pageObservationTiming: 'after_5s_of_page_observation',
  };
}

function shoppingSubmissionDescriptor(): SubmissionDescriptor {
  return {
    method: 'POST',
    encoding: 'application/x-www-form-urlencoded',
    destinationRelation: 'same_origin',
    destinationScheme: 'https',
    destinationHost: 'pochipochi.example',
    mechanism: 'form_submit_event',
    declaredDestinationObservable: true,
    association: 'correlated_submit_event',
  };
}

function playShoppingSearchScene(): void {
  const presenter = mountProductionPulsePresenter('pochipochi.example');
  const input = requiredElement<HTMLInputElement>('#shopSearch');
  const status = requiredElement<HTMLElement>('#shopSearchStatus');
  const cursor = document.querySelector<HTMLElement>('#cursor');
  if (cursor) {
    later(() => {
      cursor.dataset.clicking = 'true';
    }, 100);
    later(() => {
      cursor.dataset.clicking = 'false';
    }, 240);
  }
  later(() => mountProductionFactChip('free_text', 'pochipochi.example'), 260);
  later(() => {
    input.value = local('眠りを深く考えすぎない枕', 'a pillow for not overthinking sleep');
    status.textContent = local('候補を検索しています…', 'Searching suggestions…');
  }, 560);
  later(() => {
    presenter.showNetwork(shoppingSearchDescriptor());
    status.textContent = local('3件見つかりました', '3 results found');
  }, 980);
}

function showShoppingSearchPulse(): void {
  const presenter = mountProductionPulsePresenter('pochipochi.example');
  later(() => presenter.showNetwork(shoppingSearchDescriptor()), 100);
}

function playShoppingSubmissionScene(): void {
  const presenter = mountProductionPulsePresenter('pochipochi.example');
  const cursor = document.querySelector<HTMLElement>('#cursor');
  if (cursor) {
    later(() => {
      cursor.dataset.clicking = 'true';
    }, 100);
    later(() => {
      cursor.dataset.clicking = 'false';
    }, 260);
  }
  later(() => presenter.showSubmission(shoppingSubmissionDescriptor()), 320);
  later(() => presenter.showNetwork(shoppingOrderNetworkDescriptor()), 760);
}

function showShoppingCookiePulse(): void {
  const presenter = mountProductionPulsePresenter('pochipochi.example');
  later(() => presenter.showNetwork(shoppingOrderNetworkDescriptor()), 100);
}

function networkDescriptor(sequence: number): NetworkDescriptor {
  const crossOrigin = sequence % 6 !== 0;
  const beacon = sequence % 11 === 7;
  const methods = ['GET', 'GET', 'GET', 'POST', 'GET', 'GET', 'POST', 'GET'] as const;
  const cookieStates = ['not_detected', 'detected', 'not_observed', 'detected'] as const;
  return {
    method: beacon ? 'POST' : (methods[sequence % methods.length] ?? 'GET'),
    destinationRelation: crossOrigin ? 'cross_origin' : 'same_origin',
    destinationScheme: 'https',
    destinationHost: crossOrigin ? `media-${sequence % 5}.example` : 'mitamita.example',
    mechanism: beacon ? 'beacon_or_ping' : 'fetch_or_xhr',
    correlation: 'no_correlated_user_operation',
    payloadObservation: 'not_requested',
    cookieHeaderDetection: cookieStates[sequence % cookieStates.length] ?? 'not_observed',
    pageObservationTiming: 'after_5s_of_page_observation',
  };
}

function streamProductionPulses(count: number, startDelay: number, gap: number): void {
  const presenter = pulsePresenter ?? mountProductionPulsePresenter();
  for (let sequence = 0; sequence < count; sequence += 1) {
    later(() => presenter.showNetwork(networkDescriptor(sequence)), startDelay + gap * sequence);
  }
}

function readingNetworkDescriptor(sequence: number): NetworkDescriptor {
  const destinations = [
    'sousetsuka.example',
    'static.sousetsuka.example',
    'sousetsuka.example',
    'counter.example',
    'static.sousetsuka.example',
  ] as const;
  const destinationHost = destinations[sequence % destinations.length] ?? 'sousetsuka.example';
  return {
    method: sequence === 3 ? 'POST' : 'GET',
    destinationRelation: destinationHost === 'sousetsuka.example' ? 'same_origin' : 'cross_origin',
    destinationScheme: 'https',
    destinationHost,
    mechanism: sequence === 3 ? 'beacon_or_ping' : 'fetch_or_xhr',
    correlation: 'no_correlated_user_operation',
    payloadObservation: 'not_requested',
    cookieHeaderDetection: sequence === 0 ? 'detected' : 'not_observed',
    pageObservationTiming: 'after_5s_of_page_observation',
  };
}

function streamReadingPulses(): void {
  const presenter = mountProductionPulsePresenter('sousetsuka.example');
  for (let sequence = 0; sequence < 5; sequence += 1) {
    later(() => presenter.showNetwork(readingNetworkDescriptor(sequence)), 320 + 310 * sequence);
  }
}

function playScene(
  count: number,
  options: {
    seconds: number;
    playing: boolean;
    pauseClick?: boolean;
    pulseGap?: number;
  },
): void {
  const presenter = mountProductionPulsePresenter();
  pulsePresenter = presenter;
  setVideo(options.seconds, options.playing);
  const cursor = document.querySelector<HTMLElement>('#cursor');
  if (cursor) {
    later(() => {
      cursor.dataset.clicking = 'true';
    }, 110);
    later(() => {
      cursor.dataset.clicking = 'false';
    }, 260);
  }
  if (options.pauseClick) {
    later(() => {
      setVideo(options.seconds, false);
      const glyph = document.querySelector<HTMLElement>('#controlGlyph');
      const overlay = document.querySelector<HTMLElement>('#playOverlay');
      if (glyph) glyph.textContent = '▶';
      if (overlay) overlay.hidden = false;
    }, 330);
  }
  streamProductionPulses(
    count,
    options.pauseClick ? 500 : 360,
    options.pulseGap ?? (options.pauseClick ? 145 : 76),
  );
}

function showVideoPageLoadScene(): void {
  mountProductionPulsePresenter();
  setVideo(0.2, false);
  streamProductionPulses(24, 240, 82);
}

const logDestinations = [
  ['www.google.co.jp', 'cross_origin', 'GET', 'fetch_or_xhr', 'not_detected'],
  ['www.google.com', 'cross_origin', 'GET', 'fetch_or_xhr', 'detected'],
  ['googleads.g.doubleclick.net', 'cross_origin', 'GET', 'fetch_or_xhr', 'not_observed'],
  ['mug.criteo.example', 'cross_origin', 'GET', 'fetch_or_xhr', 'detected'],
  ['analytics.shortvideo.example', 'cross_origin', 'POST', 'beacon_or_ping', 'detected'],
  ['gum.criteo.example', 'same_origin', 'GET', 'fetch_or_xhr', 'detected'],
  ['media.mitamita.example', 'cross_origin', 'GET', 'fetch_or_xhr', 'not_detected'],
  ['mitamita.example', 'same_origin', 'GET', 'fetch_or_xhr', 'detected'],
] as const;

function tutorialRecords(): TaggedObservationRecord[] {
  const baseTimestamp = new Date('2026-08-26T20:16:14+09:00').getTime();
  return logDestinations.map(
    (
      [host, relation, method, mechanism, cookieHeaderDetection],
      sequence,
    ): TaggedObservationRecord => {
      const embedded = host === 'gum.criteo.example';
      const record: ObservationLogRecord = {
        schemaVersion: 10,
        eventId: `tutorial-${sequence}`,
        timestamp: baseTimestamp - Math.floor(sequence / 4) * 1000,
        sessionId: 'tutorial-session',
        settingsSnapshotId: 'tutorial-settings',
        domainKey: embedded ? host : 'mitamita.example',
        logLayer: 'activity',
        frameType: embedded ? 'iframe' : 'top',
        topLevelDomain: 'mitamita.example',
        frameDomain: embedded ? host : 'mitamita.example',
        surfaceType: 'page',
        triggerType: 'network_activity_without_correlated_operation',
        observationScope: 'network_metadata_only',
        operationEvidence: 'browser_network_api_observation',
        classificationConfidence: 'unknown',
        viscosityLevel: 2,
        cuePresented: true,
        destinationRelation: relation,
        destinationScheme: 'https',
        destinationHost: host,
        networkMethod: method,
        networkMechanism: mechanism,
        networkCorrelation: 'no_correlated_user_operation',
        networkPayloadObservation: 'not_requested',
        cookieHeaderDetection,
        pageObservationTiming: 'after_5s_of_page_observation',
      };
      return { record, layer: 'activity' };
    },
  );
}

function shoppingRecords(): TaggedObservationRecord[] {
  const searchTimestamp = new Date('2026-08-26T19:42:16+09:00').getTime();
  const submitTimestamp = new Date('2026-08-26T19:44:08+09:00').getTime();
  return [
    {
      layer: 'activity',
      record: {
        schemaVersion: 10,
        eventId: 'tutorial-shopping-search-network',
        timestamp: searchTimestamp,
        sessionId: 'tutorial-shopping-session',
        settingsSnapshotId: 'tutorial-settings',
        domainKey: 'pochipochi.example',
        logLayer: 'activity',
        frameType: 'top',
        topLevelDomain: 'pochipochi.example',
        frameDomain: 'pochipochi.example',
        surfaceType: 'free_text',
        surfaceTagName: 'INPUT',
        surfaceInputType: 'search',
        triggerType: 'network_activity_after_content_edit',
        observationScope: 'network_metadata_only',
        operationEvidence: 'browser_network_api_observation',
        classificationConfidence: 'explicit',
        viscosityLevel: 2,
        cuePresented: true,
        destinationRelation: 'same_origin',
        destinationScheme: 'https',
        destinationHost: 'pochipochi.example',
        networkMethod: 'GET',
        networkMechanism: 'fetch_or_xhr',
        networkCorrelation: 'recent_content_edit',
        networkPayloadObservation: 'not_requested',
        cookieHeaderDetection: 'not_detected',
        pageObservationTiming: 'after_5s_of_page_observation',
      },
    },
    {
      layer: 'activity',
      record: {
        schemaVersion: 10,
        eventId: 'tutorial-shopping-submit',
        timestamp: submitTimestamp,
        sessionId: 'tutorial-shopping-session',
        settingsSnapshotId: 'tutorial-settings',
        domainKey: 'pochipochi.example',
        logLayer: 'activity',
        frameType: 'top',
        topLevelDomain: 'pochipochi.example',
        frameDomain: 'pochipochi.example',
        surfaceType: 'personal_information',
        surfaceTagName: 'FORM',
        triggerType: 'submit_attempt',
        observationScope: 'declared_submission_boundary',
        operationEvidence: 'direct_trusted_event',
        classificationConfidence: 'heuristic',
        viscosityLevel: 2,
        cuePresented: true,
        submissionMethod: 'POST',
        submissionEncoding: 'application/x-www-form-urlencoded',
        destinationRelation: 'same_origin',
        destinationScheme: 'https',
        destinationHost: 'pochipochi.example',
        submissionMechanism: 'form_submit_event',
        submissionAssociation: 'correlated_submit_event',
        declaredDestinationObservable: true,
      },
    },
    {
      layer: 'activity',
      record: {
        schemaVersion: 10,
        eventId: 'tutorial-shopping-submit-network',
        timestamp: submitTimestamp + 420,
        sessionId: 'tutorial-shopping-session',
        settingsSnapshotId: 'tutorial-settings',
        domainKey: 'pochipochi.example',
        logLayer: 'activity',
        frameType: 'top',
        topLevelDomain: 'pochipochi.example',
        frameDomain: 'pochipochi.example',
        surfaceType: 'page',
        triggerType: 'network_activity_after_submit_operation',
        observationScope: 'network_metadata_only',
        operationEvidence: 'browser_network_api_observation',
        classificationConfidence: 'unknown',
        viscosityLevel: 2,
        cuePresented: true,
        destinationRelation: 'cross_origin',
        destinationScheme: 'https',
        destinationHost: 'api.pochipochi.example',
        networkMethod: 'POST',
        networkMechanism: 'fetch_or_xhr',
        networkCorrelation: 'recent_submit_operation',
        networkPayloadObservation: 'not_requested',
        cookieHeaderDetection: 'detected',
        pageObservationTiming: 'after_5s_of_page_observation',
      },
    },
  ];
}

interface TutorialLogOptions {
  showColumnGuide?: boolean;
  title?: string;
  subtitle?: string;
  count?: number;
}

interface TutorialLogRenderOptions {
  openIndex?: number;
  focusSummaryIndex?: number;
  focusGlyphs?: boolean;
  focusDestinations?: boolean;
  focusDetailTerms?: readonly string[];
}

function logPage(options: TutorialLogOptions = {}): string {
  return `<div class="browser">
    ${browserChrome(local('ConnectBits 観測ログ', 'ConnectBits Observation Log'))}
    <div class="tutorial-log">
      <header class="tutorial-log-head">
        <div><h2>${options.title ?? local('観測ログ', 'Observation log')}</h2><p>${options.subtitle ?? local('通常ログと診断ログを、簡易ストリームから照合できます。', 'Review activity and diagnostic records in the compact stream.')}</p></div>
      </header>
      <div class="log-control-groups">
        <div class="log-tabs" role="tablist" aria-label="${local('ログ区分', 'Log layer')}">
          <button type="button" aria-selected="true">${local('全時系列', 'All timeline')}</button>
          <button type="button" aria-selected="false">${local('通常のみ', 'Activity only')}</button>
          <button type="button" aria-selected="false">${local('診断のみ', 'Diagnostic only')}</button>
        </div>
        <div class="log-tabs" role="tablist" aria-label="${local('表示形式', 'View format')}">
          <button type="button" aria-selected="true">${local('簡易ストリーム', 'Compact stream')}</button>
          <button type="button" aria-selected="false">${local('詳細表（高度な確認）', 'Detailed table (advanced)')}</button>
        </div>
      </div>
      <div class="stream-toolbar"><p class="small">${local('全時系列 · 件数:', 'All timeline · records:')} <strong>${options.count ?? 8}</strong></p></div>
      ${
        options.showColumnGuide
          ? `<div class="tutorial-log-key" aria-hidden="true">
        <span>${local('時刻', 'Time')}</span><span>${local('通信の印', 'Communication mark')}</span><span>${local('観測したこと', 'Observed fact')}</span><span>${local('通信先の名前', 'Destination name')}</span><span>${local('操作との近さ', 'Nearness to action')}</span>
      </div>`
          : ''
      }
      <div id="tutorialLogStream" class="simple-stream" aria-live="polite"></div>
      <p class="tutorial-guide-note">${local('金色の枠は、このチュートリアルだけの読み方の案内です。', 'Gold outlines are reading guides used only in this tutorial.')}</p>
    </div>
  </div>`;
}

function focusElement(element: Element | undefined): void {
  if (element instanceof HTMLElement) element.dataset.tutorialFocus = 'true';
}

function renderLog(
  options: TutorialLogRenderOptions = {},
  records: TaggedObservationRecord[] = tutorialRecords(),
): void {
  const container = requiredElement<HTMLElement>('#tutorialLogStream');
  renderObservationSimpleStream(container, records, {
    language,
    visualOptions: {
      domColor: DEFAULT_SETTINGS.communicationPulseDomColor,
      webRequestColor: DEFAULT_SETTINGS.communicationPulseWebRequestColor,
      opacity: DEFAULT_SETTINGS.communicationPulseOpacity,
    },
  });
  const entries = container.querySelectorAll<HTMLDetailsElement>('.stream-entry');

  if (options.focusSummaryIndex !== undefined) {
    focusElement(entries[options.focusSummaryIndex]?.querySelector('summary') ?? undefined);
  }

  if (options.focusGlyphs) {
    for (const glyph of container.querySelectorAll('.stream-glyph')) focusElement(glyph);
  }

  if (options.focusDestinations) {
    for (const destination of container.querySelectorAll('.stream-destination')) {
      focusElement(destination);
    }
  }

  if (options.openIndex === undefined) return;
  const entry = entries[options.openIndex];
  if (!entry) return;
  entry.open = true;

  let scrollTarget: HTMLElement = entry;
  if (options.focusDetailTerms !== undefined) {
    const terms = new Set(options.focusDetailTerms);
    for (const term of entry.querySelectorAll<HTMLElement>('.stream-detail dt')) {
      if (!terms.has(term.textContent ?? '')) continue;
      focusElement(term);
      const description = term.nextElementSibling;
      focusElement(description ?? undefined);
      scrollTarget = term;
    }
  }
  requestAnimationFrame(() => scrollTarget.scrollIntoView({ block: 'center' }));
}

function createFrames(): TutorialFrame[] {
  const shoppingFrames: TutorialFrame[] = [
    {
      time: '--:--:--',
      kicker: local('架空例｜買い物', 'Fictional example | Shopping'),
      heading: local('今日は、少しだけ買い物をします', 'Today, we will do a little shopping'),
      next: local('店へ入る', 'Enter the shop'),
      stage: () => `<div class="cover shopping-cover"><div class="cover-inner">
      <p class="cover-kicker">${local('ある日の、架空の買い物', 'One day, in a fictional shop')}</p>
      <h2>${local('ポチポチ商店', 'Click-Click Shop')}</h2>
      <p>${local('だいたい揃う。たぶん届く。<br />いつもの買い物の裏で起きることを、少しだけのぞいてみます。', 'Usually in stock. Probably delivered.<br />Let us briefly look at what happens behind an ordinary shopping trip.')}</p>
      <span class="fiction-badge">${local('実在しないサイト・入力も外部送信もしません', 'Fictional site · nothing you enter is sent externally')}</span>
    </div></div>`,
      text: local(
        '<p>試験ではありません。覚える必要もありません。</p><p>「次へ」を押すたびに時間が少し進みます。ConnectBitsには何が見え、何がまだ見えないのかを順番に眺めます。</p>',
        '<p>This is not a test. You do not need to memorize anything.</p><p>Each time you choose “Next,” time moves forward a little. We will look in order at what ConnectBits can see and what it still cannot see.</p>',
      ),
    },
    {
      time: '19:42:10',
      kicker: local('買い物 1｜商品を探す', 'Shopping 1 | Finding a product'),
      heading: local('見た目は、普通の買い物ページです', 'It looks like an ordinary shopping page'),
      next: local('検索欄へ入力する', 'Type in the search field'),
      stage: shopPage,
      text: local(
        '<p>商品ページを開きました。今のところ、特に変わったことはありません。</p><p class="small">この紙芝居は、ConnectBitsが観測できる出来事の一部を再現します。ページの裏側すべてを見せるものではありません。</p>',
        '<p>We opened a product page. So far, nothing looks unusual.</p><p class="small">This walkthrough recreates some events that ConnectBits can observe. It does not show everything happening behind the page.</p>',
      ),
    },
    {
      time: '19:42:16',
      kicker: local('買い物 2｜送信前', 'Shopping 2 | Before submission'),
      heading: local('送信ボタンは、まだ押していません', 'We have not pressed a submit button'),
      next: local('この表示を読む', 'Read this display'),
      lockMs: 1800,
      stage: () => shopPage({ activeField: true, cursor: true }),
      enter: playShoppingSearchScene,
      text: local(
        `<p>検索欄を選ぶと、まず灰色のチップが欄のすぐ下に現れます。これは通信ではなく、入力欄の種類を知らせるConnectBitsの表示です。</p>
      <p>そのあと文字が入り、少し遅れて右端に通信パルスが一つ現れます。</p>
      <div class="tutorial-reading-card"><strong>まずは、起きた順番だけ</strong><p>欄を選んだ。文字を入れた。その近くで通信が始まった。</p></div>`,
        `<p>When we select the search field, a gray chip first appears directly below it. This is not communication. It is ConnectBits identifying the type of input field.</p>
      <p>Text then appears, and shortly afterward one communication pulse appears at the right edge.</p>
      <div class="tutorial-reading-card"><strong>For now, just note the order</strong><p>Selected the field. Entered text. Communication started near that time.</p></div>`,
      ),
    },
    {
      time: '19:42:16',
      kicker: local('買い物 3｜最初の通信', 'Shopping 3 | First communication'),
      heading: local(
        '文字を入れたすぐあとに、通信が始まりました',
        'Communication started just after text was entered',
      ),
      next: local('商品を選び、注文へ進む', 'Choose a product and continue'),
      stage: () =>
        shopPage({
          query: local('眠りを深く考えすぎない枕', 'a pillow for not overthinking sleep'),
          status: local('3件見つかりました', '3 results found'),
        }),
      enter: showShoppingSearchPulse,
      text: local(
        `<p>丸い形はGET、中央のFはページ上のプログラムによる通信をブラウザー側で観測した印です。</p>
      <div class="tutorial-reading-card"><strong>ここまでに分かったこと</strong><p>文字を入れた時刻と、通信が始まった時刻が近かった。</p></div>
      <p class="small">検索候補だったのか、入力文字を送ったのか、別の通信が重なったのかは、この表示だけでは一つに決めません。</p>`,
        `<p>The circle represents GET. The F in the center means the browser side observed communication made by page code.</p>
      <div class="tutorial-reading-card"><strong>What we know so far</strong><p>The time text was entered was close to the time communication started.</p></div>
      <p class="small">This display alone does not decide whether it was for search suggestions, sent the typed text, or happened to overlap with unrelated communication.</p>`,
      ),
    },
    {
      time: '19:44:03',
      kicker: local('買い物 4｜注文画面', 'Shopping 4 | Order page'),
      heading: local('今度は、自分で「送る」を押します', 'This time, we press “Submit” ourselves'),
      next: local('注文内容を送信する', 'Submit the order'),
      stage: () => shopPage({ view: 'checkout', cursor: true }),
      text: local(
        '<p>商品を選び、注文画面まで進みました。</p><p>ボタンを押すことと、そのあと通信が始まることは、よく一続きに見えます。ConnectBitsでは二つを別々の出来事として表示します。</p><p class="small">実際の購入、決済、外部通信は行いません。</p>',
        '<p>We chose a product and reached the order page.</p><p>Pressing a button and communication starting afterward often look like one continuous event. ConnectBits displays them as two separate events.</p><p class="small">No real purchase, payment, or external communication takes place.</p>',
      ),
    },
    {
      time: '19:44:08',
      kicker: local('買い物 5｜「送る」のあと', 'Shopping 5 | After “Submit”'),
      heading: local('Sの後に、Fが現れました', 'An F appeared after the S'),
      next: local('右上の●を見る', 'Look at the ● in the corner'),
      lockMs: 1500,
      stage: () => shopPage({ view: 'checkout', cursor: true }),
      enter: playShoppingSubmissionScene,
      text: local(
        `<p>濃いマゼンタのSは、ページ上で標準formの送信境界を観測した印です。その後の淡いシアンのFは、ブラウザー側で通信開始を観測した印です。</p>
      <p class="small">四角はPOST。左上の短い線は、観測したページ部分とは別オリジンの通信先だったことを示します。</p>
      <div class="tutorial-reading-card"><strong>手掛かりは増えました</strong><p>「送る」のすぐあとにPOST通信が始まりました。ただし、何を送ったか、届いたか、同じ用件だったかまでは確認していません。</p></div>`,
        `<p>The dark magenta S marks a standard-form submission boundary observed on the page. The pale cyan F that follows marks a request start observed through the browser.</p>
      <p class="small">The square means POST. The short line at the upper left means the destination had a different origin from the observed page frame.</p>
      <div class="tutorial-reading-card"><strong>We have more clues</strong><p>POST communication started just after “Submit.” We have not confirmed what was sent, whether it arrived, or whether both events served the same purpose.</p></div>`,
      ),
    },
    {
      time: '19:44:08',
      kicker: local(
        '買い物 6｜Cookieという小さな記憶',
        'Shopping 6 | The small memory called a Cookie',
      ),
      heading: local(
        '右上の●は、中身を見た印ではありません',
        'The ● does not mean that content was read',
      ),
      next: local('もし、よくない通信だったら？', 'What if it was unwanted communication?'),
      stage: () => shopPage({ view: 'checkout' }),
      enter: showShoppingCookiePulse,
      text: local(
        `<p>Cookieは、サイトがブラウザーへ置く小さな記録です。ログイン状態、買い物かご、表示の好みなどを覚えるために使われることがあります。</p>
      <p>通信時にCookieを運ぶヘッダーが付くことがあります。●は、そのヘッダーの存在を検出した印です。</p>
      <ul class="tutorial-symbol-list"><li><b>●</b> Cookieヘッダーを検出</li><li><b>−</b> 観測範囲では未検出</li></ul>
      <p class="small">Cookieの名前や値は取得しません。通信本文もConnectBitsの観測対象ではありません。</p>`,
        `<p>A Cookie is a small record a site places in the browser. It can be used to remember a login state, shopping cart, or display preference.</p>
      <p>Communication can include a header that carries Cookies. The ● marks detection of that header's presence.</p>
      <ul class="tutorial-symbol-list"><li><b>●</b> Cookie header detected</li><li><b>−</b> Not detected within the observation scope</li></ul>
      <p class="small">ConnectBits does not collect Cookie names or values. Network payloads are also outside its observation scope.</p>`,
      ),
    },
    {
      time: '19:44:08',
      kicker: local('買い物 7｜もしもの話', 'Shopping 7 | A hypothetical'),
      heading: local('もし、よくない通信だったとしても', 'Even if the communication was unwanted'),
      next: local('あとから記録を見る', 'Review the record'),
      stage: () => `<div class="cover"><div class="cover-inner">
      <p class="cover-kicker">${local('同じ印から、いくつもの事情が考えられる', 'The same marks can fit several circumstances')}</p>
      <h2>${local('見えた形だけでは決まらない', 'The visible shape does not decide the answer')}</h2>
      <div class="tutorial-hypothesis-grid"><span>${local('注文を進めるために必要だった', 'It was needed to process the order')}</span><span>${local('利用状況を数えるためだった', 'It counted how the service was used')}</span><span>${local('送ってほしくない情報まで含んでいた', 'It included information you did not want sent')}</span></div>
    </div></div>`,
      text: local(
        `<p>送ってほしくない情報が含まれていたとしても、ConnectBitsが勝手に「安全だった」とすることはありません。</p>
      <p>反対に、POST、別オリジン、Cookieヘッダーありという印だけで「危険だった」とも決められません。同じ見え方に、違う事情があり得るからです。</p>
      <div class="tutorial-reading-card"><strong>さらに確かめるなら</strong><p>サイトの説明、通信先の主体、実際の送信内容など、別の調べ方が必要です。深い調査ほど、調べる側も私的な内容へ近づきます。</p></div>`,
        `<p>If it included information you did not want sent, ConnectBits does not simply declare it safe.</p>
      <p>Conversely, POST, a cross-origin destination, and a Cookie-header mark do not by themselves establish danger. Different circumstances can produce the same visible pattern.</p>
      <div class="tutorial-reading-card"><strong>To investigate further</strong><p>You would need other methods, such as reviewing the site's explanation, identifying who operates the destination, or inspecting what was actually sent. Deeper investigation also brings the investigator closer to private content.</p></div>`,
      ),
    },
    {
      time: '19:44:12',
      kicker: local('買い物 8｜あとから見返す', 'Shopping 8 | Looking back'),
      heading: local('さっきの出来事が、順番に残っています', 'The recent events remain in order'),
      next: local('動画サイトへ行く', 'Go to the video site'),
      stage: () =>
        logPage({
          showColumnGuide: true,
          subtitle: local(
            'ポチポチ商店で観測した架空記録',
            'Fictional records observed at Click-Click Shop',
          ),
          count: 3,
        }),
      enter: () => renderLog({ focusSummaryIndex: 0 }, shoppingRecords()),
      text: local(
        `<p>検索文字の変更に近いGET通信、ページ上の送信境界、その直後のPOST通信が、別々の行に残ります。</p>
      <p>ログは答えの一覧ではありません。いつ何を観測し、どの部分を観測対象にしていないかを、あとから取り違えずに見直す場所です。</p>
      <p class="small">次の動画サイトでは通信の数を眺めたあと、このログの基本的な読み方をもう少し詳しく見ます。</p>`,
        `<p>A GET request near a change to the search text, a submission boundary on the page, and the POST request just after it remain as separate rows.</p>
      <p>The log is not a list of answers. It is a place to review, without mixing them up, what was observed, when it was observed, and what was outside the observation scope.</p>
      <p class="small">On the next video site, we will first watch the number of communications, then look more closely at the basics of reading this log.</p>`,
      ),
    },
  ];

  return [
    ...shoppingFrames,
    {
      time: '--:--:--',
      kicker: local('架空例｜動画', 'Fictional example | Video'),
      heading: local('次は、短い動画を見ます', 'Next, we will watch a short video'),
      next: local('動画サイトへ行く', 'Go to the video site'),
      stage: () => `<div class="cover"><div class="cover-inner">
      <p class="cover-kicker">${local('ある日の、架空の動画', 'One day, on a fictional video site')}</p>
      <h2>${local('みたみた動画', 'Saw-Saw Video')}</h2>
      <p>${local('見るものいろいろ。分かったかは別。<br />一本の短い動画を眺めます。', 'Many things to watch. Understanding is another matter.<br />We will watch one short video.')}</p>
      <span class="fiction-badge">${local('実在しないサイト・外部通信なし', 'Fictional site · no external traffic')}</span>
    </div></div>`,
      text: local(
        '<p>再生して、通信の出方だけ見てみます。</p><p class="small">細かい意味は、あとでログを開いてから。</p>',
        '<p>We will play it and watch only how communication appears.</p><p class="small">We will consider the details after opening the log.</p>',
      ),
    },
    {
      time: '20:16:02',
      kicker: local('動画 1｜ページを開く', 'Video 1 | Opening the page'),
      heading: local(
        '再生する前から、通信は始まっています',
        'Communication starts before playback',
      ),
      next: local('再生する', 'Play the video'),
      lockMs: 2500,
      stage: () => videoPage(),
      enter: showVideoPageLoadScene,
      text: local(
        '<p>動画ページへ接続した時点で、この例では通信パルスがまとまって現れました。</p><p class="small">動画データ、画面を作る部品、計測など、いくつもの事情が考えられます。パルスだけで用途は決めません。</p>',
        '<p>In this example, a cluster of communication pulses appears as soon as the video page is reached.</p><p class="small">They could relate to video data, components used to build the page, measurement, or other circumstances. Pulses alone do not establish their purpose.</p>',
      ),
    },
    {
      time: '20:16:08',
      kicker: local('動画 2｜再生', 'Video 2 | Playback'),
      heading: local(
        '再生すると、さらにまとまって出ました',
        'Another cluster appears when playback starts',
      ),
      next: local('そのまま少し見る', 'Keep watching for a moment'),
      lockMs: 2750,
      stage: () => videoPage({ playing: true, cursor: true }),
      enter: () => playScene(28, { seconds: 0.2, playing: true }),
      text: local(
        '<p>再生を始めた直後、通信の印が重なって現れました。</p><p class="small">本数や間隔はサイトや場面で変わります。今は、この例で起きた順番だけ見ます。</p>',
        '<p>Just after playback started, several communication marks appeared close together.</p><p class="small">The number and spacing vary by site and situation. For now, we are only looking at the order in this example.</p>',
      ),
    },
    {
      time: '20:16:11',
      kicker: local('動画 3｜再生中', 'Video 3 | During playback'),
      heading: local(
        'その後は、間をあけてぽつぽつ出ています',
        'Afterward, a few appear with gaps between them',
      ),
      next: local('いったん停止する', 'Pause the video'),
      lockMs: 2400,
      stage: () => videoPage({ playing: true, time: '0:06 / 0:18', progress: '38%' }),
      enter: () => playScene(5, { seconds: 6, playing: true, pulseGap: 380 }),
      text: local(
        '<p>最初のまとまりが過ぎたあとも、この例では少しずつ現れました。</p><p class="small">多い・少ないの意味は、ここでは決めません。</p>',
        '<p>In this example, a few more appear after the first cluster has passed.</p><p class="small">We do not assign meaning here to whether that is many or few.</p>',
      ),
    },
    {
      time: '20:16:14',
      kicker: local('動画 4｜一時停止', 'Video 4 | Pausing'),
      heading: local('止めても、少し出ます', 'A few appear even after pausing'),
      next: local('ログを見てみる', 'Look at the log'),
      lockMs: 2200,
      stage: () => videoPage({ playing: true, time: '0:07 / 0:18', progress: '42%', cursor: true }),
      enter: () => playScene(4, { seconds: 6.2, playing: true, pauseClick: true, pulseGap: 390 }),
      text: local(
        '<p>停止したあとにも、この例ではいくつか現れました。</p><p class="small">何のための通信だったかは、パルスだけでは決めません。</p>',
        '<p>In this example, several appear after the video is paused.</p><p class="small">Pulses alone do not establish what the communication was for.</p>',
      ),
    },
    {
      time: '20:16:18',
      kicker: local('動画 5｜観測ログ', 'Video 5 | Observation log'),
      heading: local(
        'この動画例の一行は、通信が始まった一件です',
        'One row in this video example is one observed request start',
      ),
      next: local('通信先の名前を見る', 'Look at the destination name'),
      stage: () => logPage({ showColumnGuide: true }),
      enter: () => renderLog({ focusSummaryIndex: 0 }),
      text: local(
        `<p>左から、時刻、通信の印、観測したこと、通信先の名前、直前の操作との時間的な近さが並びます。</p>
      <div class="tutorial-reading-card"><strong>この一行が言っていること</strong><p>20時16分14秒ごろ、一つの通信が始まった。</p></div>
      <p class="small">届いたか、中身は何か、なぜ必要かまでは、この一行では分かりません。実際の全時系列には、入力面や送信操作などのページ内観測も一行ずつ入ります。</p>`,
        `<p>From left to right, the row shows the time, communication mark, observed fact, destination name, and temporal nearness to the preceding action.</p>
      <div class="tutorial-reading-card"><strong>What this row says</strong><p>At about 20:16:14, one communication event started.</p></div>
      <p class="small">This row does not tell us whether it arrived, what it contained, or why it was needed. The actual full timeline also includes one row for each observed page event, such as an input surface or submission action.</p>`,
      ),
    },
    {
      time: '20:16:18',
      kicker: local('動画 6｜通信の印', 'Video 6 | Communication marks'),
      heading: local(
        '形と文字は、通信の方式を小さくまとめたものです',
        'Shapes and letters compactly summarize the mechanism',
      ),
      next: local('通信先の名前を見る', 'Look at the destination name'),
      stage: logPage,
      enter: () => renderLog({ focusGlyphs: true }),
      text: local(
        `<div class="tutorial-glyph-guide"><span><b>○</b><small>GET</small>情報を受け取るときなど</span><span><b>□</b><small>POST</small>情報を渡すときなど</span><span><b>F</b><small>fetch／XHR</small>ページからの通信</span><span><b>B</b><small>Beacon／Ping</small>小さな送信に使われる仕組み</span><span><b>S</b><small>標準form</small>ページ上の送信操作</span></div>
      <p>外側の形はGETやPOSTなどの方式、中央の文字と色は、ConnectBitsがどの仕組み・経路を観測したかを表します。</p>
      <p class="small">形や色は安全・危険の評価ではありません。Sはページ上の送信境界で、実際の通信開始や到着を示すものではありません。この版が通信開始として見るのは主にFとBで、ブラウザーの全通信一覧ではありません。</p>`,
        `<div class="tutorial-glyph-guide"><span><b>○</b><small>GET</small>Often used to receive information</span><span><b>□</b><small>POST</small>Often used to provide information</span><span><b>F</b><small>fetch / XHR</small>Communication from page code</span><span><b>B</b><small>Beacon / Ping</small>A mechanism used for small transmissions</span><span><b>S</b><small>standard form</small>A submission action on the page</span></div>
      <p>The outer shape represents a method such as GET or POST. The letter and color in the center represent the mechanism and observation route seen by ConnectBits.</p>
      <p class="small">Shape and color are not safety or danger ratings. S marks a submission boundary on the page; it does not show that communication started or arrived. This version mainly sees F and B as request starts and is not a complete list of browser traffic.</p>`,
      ),
    },
    {
      time: '20:16:18',
      kicker: local('動画 7｜通信先の名前', 'Video 7 | Destination names'),
      heading: local(
        '長い住所のうち、行き先の名前を残します',
        'From a long address, ConnectBits keeps the destination name',
      ),
      next: local('同一／別オリジンを見る', 'Review same and cross origin'),
      stage: logPage,
      enter: () => renderLog({ focusDestinations: true }),
      text: local(
        `<p><code>www.google.com</code> や <code>media.mitamita.example</code> のような部分が、ホスト名です。インターネット上の行き先を表す名前です。日常には、まとめて「ドメイン」と呼ばれることもあります。</p>
      <div class="tutorial-address-example"><span>もとのURL</span><code>https://media.example/video/12?...</code><span>ログに残す範囲</span><code>https ＋ media.example</code></div>
      <p class="small"><code>www.example.com</code> と <code>media.example.com</code> は、共通部分があっても別のホスト名です。URLの後ろにあるページ名や検索文字列は残しません。ホスト名だけでは、運営者、通信目的、安全性までは決まりません。</p>`,
        `<p>A part such as <code>www.google.com</code> or <code>media.mitamita.example</code> is a hostname. It names a destination on the internet. In everyday speech, people may loosely call these “domains.”</p>
      <div class="tutorial-address-example"><span>Original URL</span><code>https://media.example/video/12?...</code><span>What the log keeps</span><code>https + media.example</code></div>
      <p class="small"><code>www.example.com</code> and <code>media.example.com</code> are different hostnames even though they share part of a name. ConnectBits does not keep the page path or search string after the hostname. A hostname alone does not establish the operator, purpose, or safety of communication.</p>`,
      ),
    },
    {
      time: '20:16:18',
      kicker: local('動画 8｜一件の詳細', 'Video 8 | Details of one record'),
      heading: local(
        '「別オリジン」は、通信元と行き先が別という意味です',
        '“Cross-origin” means the source and destination origins differ',
      ),
      next: local('観測フレームも見る', 'Review the observed frame'),
      stage: logPage,
      enter: () =>
        renderLog({
          openIndex: 0,
          focusDetailTerms: [
            local('観測フレーム', 'Observed frame'),
            local('フレーム関係', 'Frame relation'),
            local('送信先／通信先', 'Declared / observed destination'),
          ],
        }),
      text: local(
        `<p>オリジンは、だいたい「通信の出発点を区別する住所」です。<strong>http／https・ホスト名・ポート番号</strong>の組み合わせで分かれます。</p>
      <div class="tutorial-reading-card"><strong>別オリジン</strong><p>観測したページ部分のオリジンと、通信先のオリジンが違う。パルスでは左上の短い線でも示します。</p></div>
      <p class="small">別オリジンは「別会社」「危険」という意味ではありません。同じサービスでも、画像や動画を別のホストから受け取ることがあります。</p>`,
        `<p>An origin is roughly an address that distinguishes where communication starts. It is defined by the combination of <strong>http/https, hostname, and port number</strong>.</p>
      <div class="tutorial-reading-card"><strong>Cross-origin</strong><p>The origin of the observed page frame differs from the destination origin. A pulse also shows this with a short line at the upper left.</p></div>
      <p class="small">Cross-origin does not mean “another company” or “dangerous.” A service may receive images or video from a different host.</p>`,
      ),
    },
    {
      time: '20:16:18',
      kicker: local('動画 9｜ページの中のページ', 'Video 9 | A page inside a page'),
      heading: local(
        '「同一」は、アドレスバーとの比較とは限りません',
        '“Same” is not always a comparison with the address bar',
      ),
      next: local('Cookieの表示を見る', 'Review the Cookie display'),
      stage: logPage,
      enter: () =>
        renderLog({
          openIndex: 5,
          focusDetailTerms: [
            local('観測フレーム', 'Observed frame'),
            local('フレーム関係', 'Frame relation'),
            local('送信先／通信先', 'Declared / observed destination'),
          ],
        }),
      text: local(
        `<p>ウェブページの中には、別の場所から読み込まれた小さなページ部分があります。ConnectBitsでは、それを<strong>観測フレーム</strong>として分けます。</p>
      <div class="tutorial-reading-card"><strong>この「同一オリジン」</strong><p>埋め込まれたページ部分と、その通信先が同じオリジンだった。</p></div>
      <p class="small">上のアドレスバーにある閲覧サイトと同じ、という意味ではない場合があります。</p>`,
        `<p>A web page can contain a smaller page frame loaded from somewhere else. ConnectBits separates it as the <strong>observed frame</strong>.</p>
      <div class="tutorial-reading-card"><strong>“Same-origin” in this record</strong><p>The embedded page frame and its communication destination had the same origin.</p></div>
      <p class="small">It may not mean the destination matches the site shown in the address bar.</p>`,
      ),
    },
    {
      time: '20:16:18',
      kicker: local('動画 10｜Cookieと通信本文', 'Video 10 | Cookies and network payloads'),
      heading: local(
        'Cookieは「小さな記憶」です。ただし中身は見ません',
        'A Cookie is a “small memory,” but ConnectBits does not read its content',
      ),
      next: local('最初に見る場所を確認', 'Review where to start'),
      stage: logPage,
      enter: () =>
        renderLog({
          openIndex: 1,
          focusDetailTerms: [
            local('Cookieヘッダー', 'Cookie header'),
            local('通信本文', 'Network payload'),
          ],
        }),
      text: local(
        `<p>Cookieは、ログイン状態、買い物かご、表示設定などを覚えるため、ブラウザーに置かれる小さな記録です。計測など、別の目的に使われることもあります。</p>
      <ul class="tutorial-symbol-list"><li><b>●</b> Cookieヘッダーの存在を検出</li><li><b>−</b> 観測範囲では未検出</li><li><b>·</b> 未観測</li><li><b>?</b> 判定不能</li></ul>
      <p class="small">ConnectBitsはCookieの値を取得せず、通信本文を観測対象としていません。●は「中身を読んだ」「個人情報を確認した」という表示ではありません。</p>`,
        `<p>A Cookie is a small record placed in the browser to remember login state, a shopping cart, display settings, or other information. It can also be used for measurement and other purposes.</p>
      <ul class="tutorial-symbol-list"><li><b>●</b> Cookie-header presence detected</li><li><b>−</b> Not detected within the observation scope</li><li><b>·</b> Not observed</li><li><b>?</b> Could not be determined</li></ul>
      <p class="small">ConnectBits does not collect Cookie values, and network payloads are outside its observation scope. ● does not mean that content was read or personal information was identified.</p>`,
      ),
    },
    {
      time: '20:16:20',
      kicker: local('動画 11｜最初の見方', 'Video 11 | A first way to read the log'),
      heading: local(
        '全部を理解しなくても、三つから見られます',
        'You can start with three questions without understanding everything',
      ),
      next: local('動画編を終える', 'Finish the video section'),
      stage: logPage,
      enter: () => renderLog({ focusSummaryIndex: 0 }),
      text: local(
        `<ol class="tutorial-check-list"><li><strong>いつ</strong><span>再生や停止など、自分の操作と時刻が近いか</span></li><li><strong>どこへ</strong><span>通信先のホスト名に見覚えがあるか</span></li><li><strong>どこから</strong><span>閲覧ページか、埋め込まれたフレームか</span></li></ol>
      <p>見覚えがあっても安全とは限らず、知らない名前でも危険とは限りません。まず「自分が想定していた通信か」を考えるための手掛かりです。</p>
      <p class="small">必要なら、そのサイトのプライバシー説明やCookie設定に同じ名前があるかを照合します。</p>`,
        `<ol class="tutorial-check-list"><li><strong>When</strong><span>Was the time close to an action you took, such as play or pause?</span></li><li><strong>Where to</strong><span>Do you recognize the destination hostname?</span></li><li><strong>Where from</strong><span>Was it the page you were viewing or an embedded frame?</span></li></ol>
      <p>A familiar name is not necessarily safe, and an unfamiliar one is not necessarily dangerous. These are clues for first asking whether the communication matched what you expected.</p>
      <p class="small">If needed, compare the name with the site's privacy explanation or Cookie settings.</p>`,
      ),
    },
    {
      time: '20:16:26',
      kicker: local('動画 12｜この編の終わり', 'Video 12 | End of this section'),
      heading: local(
        '数から、一件の根拠へ戻れます',
        'You can return from the count to each underlying record',
      ),
      next: local('読み物サイトへ行く', 'Go to the reading site'),
      stage: () => `<div class="cover"><div class="cover-inner">
      <p class="cover-kicker">${local('動画サイトで見えたこと', 'What appeared on the video site')}</p>
      <h2>${local('再生中も、停止後も。', 'During playback and after pausing.')}</h2>
      <p>${local('この例では、開始時にまとまり、その後はぽつぽつ続きました。<br />ログでは、いつ・どこから・どこへを一件ずつ見られます。', 'In this example, communication clustered at the start and then continued intermittently.<br />The log lets you review when, where from, and where to for each record.')}</p>
    </div></div>`,
      text: local(
        `<p>ConnectBitsが記録するのは、通信開始の時刻、観測フレーム、通信先、方式、Cookieヘッダーの存在状態などです。</p>
      <div class="tutorial-reading-card"><strong>記録しないもの</strong><p>入力内容、通信本文、Cookieの値、通信の目的、安全・危険の結論。</p></div>
      <p class="small">全部を答えるためではなく、何が確認でき、どこから先がまだ分からないかを分けるためのログです。</p>`,
        `<p>ConnectBits records details such as request-start time, observed frame, destination, mechanism, and Cookie-header detection state.</p>
      <div class="tutorial-reading-card"><strong>What it does not record</strong><p>Input content, network payloads, Cookie values, communication purpose, or a safe/dangerous conclusion.</p></div>
      <p class="small">The log is not meant to answer everything. It separates what can be checked from what remains unknown.</p>`,
      ),
    },
    {
      time: '--:--:--',
      kicker: local('架空例｜読み物', 'Fictional example | Reading'),
      heading: local('最後は、静かな読み物サイトです', 'Finally, a quiet reading site'),
      next: local('創設家になろうへ', "Go to Let's Become a Founder"),
      stage: () => `<div class="cover reading-cover"><div class="cover-inner">
      <p class="cover-kicker">${local('ある日の、架空の読み物', 'One day, on a fictional reading site')}</p>
      <h2>${local('創設家になろう', "Let's Become a Founder")}</h2>
      <p>${local('まだないものは、いったん名前から。<br />考え方を投稿する、実在しないサイトです。', 'If it does not exist yet, start by naming it.<br />This is a fictional site for posting ideas.')}</p>
      <span class="fiction-badge">${local('実在しないサイト・入力も外部送信もしません', 'Fictional site · nothing you enter is sent externally')}</span>
    </div></div>`,
      text: local(
        '<p>ここでは通信の数より、検索・ログイン・購読画面で出る入力欄のチップを見ます。</p><p class="small">入力はせず、欄を選ぶところまでです。</p>',
        '<p>Here we will focus less on the number of communications and more on the input-field chips shown during search, login, and subscription.</p><p class="small">We will only select fields, without entering anything.</p>',
      ),
    },
    {
      time: '20:18:03',
      kicker: local('読み物 1｜検索欄', 'Reading 1 | Search field'),
      heading: local(
        '検索欄を選ぶと、「自由記述欄」と出ます',
        'Selecting search displays “Free-text field”',
      ),
      next: local('文章を開く', 'Open the article'),
      stage: () => readingSitePage({ activeField: 'search', cursor: true }),
      enter: () => showFieldCue('free_text'),
      text: local(
        `<p>このチップは、検索文字を読んだという表示ではありません。ページ上の欄の構造から、自由記述欄として分類したという表示です。</p>
      <div class="tutorial-reading-card"><strong>ここで見ていないもの</strong><p>入力した検索語、その意味、検索先へ届いたかどうか。</p></div>
      <p class="small">この検索欄の表示は、すべての入力面を知らせるMAX報告モードの例です。標準レベル2では、パスワードや決済などの敏感な欄に絞ります。</p>`,
        `<p>This chip does not mean the search text was read. It means the field was classified as a free-text field from its structure on the page.</p>
      <div class="tutorial-reading-card"><strong>What is not being observed here</strong><p>The search terms you enter, their meaning, or whether they reached the search destination.</p></div>
      <p class="small">This search-field display is an example of MAX reporting mode, which identifies all input surfaces. Standard Level 2 limits chips to sensitive fields such as passwords and payment information.</p>`,
      ),
    },
    {
      time: '20:18:10',
      kicker: local('読み物 2｜文章を読む', 'Reading 2 | Reading an article'),
      heading: local(
        '文章を開くと、通信は少しだけ出ました',
        'A few communications appear when the article opens',
      ),
      next: local('ログイン画面を見る', 'Look at the login dialog'),
      lockMs: 1800,
      stage: () => readingSitePage({ view: 'article' }),
      enter: streamReadingPulses,
      text: local(
        `<p>今回は五つほどです。少ないことは、安全や単純さの証明ではありません。</p>
      <p class="small">ただ読んでいた時間にも通信が始まった。その事実だけ残して、先へ進みます。</p>`,
        `<p>There are about five in this example. A small number does not prove safety or simplicity.</p>
      <p class="small">Communication started while we were simply reading. We will keep only that fact and continue.</p>`,
      ),
    },
    {
      time: '20:18:18',
      kicker: local('読み物 3｜ログイン', 'Reading 3 | Login'),
      heading: local(
        'パスワード欄は、敏感な入力面として知らせます',
        'A password field is identified as a sensitive input surface',
      ),
      next: local('購読画面を見る', 'Look at the subscription dialog'),
      stage: () =>
        readingSitePage({
          view: 'article',
          dialog: 'login',
          activeField: 'password',
          cursor: true,
        }),
      enter: () => showFieldCue('password'),
      text: local(
        `<p><code>type=password</code> など、ページが持つ欄の構造からパスワード入力欄として検出します。</p>
      <div class="tutorial-reading-card"><strong>この表示が言わないこと</strong><p>パスワードの値を読んだ、保存した、サイトが危険だ、という意味ではありません。</p></div>
      <p class="small">標準レベル2でも表示される、入力前の注意チップです。</p>`,
        `<p>ConnectBits detects a password input field from page structure such as <code>type=password</code>.</p>
      <div class="tutorial-reading-card"><strong>What this display does not say</strong><p>It does not mean the password value was read or stored, or that the site is dangerous.</p></div>
      <p class="small">This is a pre-entry attention chip that also appears at standard Level 2.</p>`,
      ),
    },
    {
      time: '20:18:25',
      kicker: local('読み物 4｜購読と決済', 'Reading 4 | Subscription and payment'),
      heading: local(
        'カード欄では、「決済情報」と出ます',
        'The card field displays “Payment information”',
      ),
      next: local('最後の文章を読む', 'Read the final passage'),
      stage: () =>
        readingSitePage({
          view: 'article',
          dialog: 'subscription',
          activeField: 'payment',
          cursor: true,
        }),
      enter: () => showFieldCue('payment'),
      text: local(
        `<p>カード番号用の指定や、欄の名前・周囲の表記から、決済情報の入力欄として分類します。</p>
      <div class="tutorial-reading-card"><strong>分類するもの／取得しないもの</strong><p>欄の種類は分類します。カード番号、有効期限、セキュリティコードは取得しません。</p></div>
      <p class="small">これも決済の安全性や、運営者の信頼性を評価する表示ではありません。</p>`,
        `<p>ConnectBits classifies the field as payment information from a card-number designation, the field name, and surrounding labels.</p>
      <div class="tutorial-reading-card"><strong>What is classified / what is not collected</strong><p>The field type is classified. The card number, expiry date, and security code are not collected.</p></div>
      <p class="small">This display also does not evaluate payment safety or the operator's trustworthiness.</p>`,
      ),
    },
    {
      time: '20:18:36',
      kicker: local('チュートリアルの終わり', 'End of the tutorial'),
      heading: local(
        '自分で確かめたい人は、使ってみてください',
        'If you want to check for yourself, try using it',
      ),
      next: local('観測方法を選ぶ', 'Choose an observation method'),
      stage: () => readingSitePage({ view: 'ending' }),
      text: local(
        `<p>ConnectBitsが提示するのは、入力欄の種類、ページ上の操作、通信開始の時刻や行き先など、同じ観測条件なら誰でも確かめ直せる事実だけです。</p>
      <p>より深く調べるほど、今度はConnectBits自身が入力内容や通信内容へ近づきます。それは、観測する道具であるConnectBits自身の透明性を損なう可能性があります。</p>
      <div class="tutorial-reading-card"><strong>ConnectBitsがすること</strong><p>特別な答えを作るのではなく、分かるはずのことを、見失いにくい形へ並べるだけです。</p></div>
      <p class="small">ここまでです。</p>`,
        `<p>ConnectBits presents only facts that anyone can check again under the same observation conditions: the type of input field, actions on the page, and the time and destination of a request start.</p>
      <p>The deeper ConnectBits investigates, the closer it comes to input content and network payloads. That could reduce the transparency of ConnectBits itself as an observation tool.</p>
      <div class="tutorial-reading-card"><strong>What ConnectBits does</strong><p>It does not invent a special answer. It only arranges what should be knowable in a form that is harder to lose sight of.</p></div>
      <p class="small">That is all.</p>`,
      ),
    },
  ];
}

let frames: TutorialFrame[] = [];

function persistCurrentFrame(): void {
  if (tutorialState === undefined) return;
  let nextState = recordTutorialProgress(tutorialState, frameIndex, frames.length);
  if (frameIndex === frames.length - 1) {
    nextState = completeTutorialState(nextState, Date.now());
  }
  queueTutorialStateSave(nextState);
}

function renderFrame(nextIndex: number, persist = true): void {
  clearTimers();
  document.querySelector<HTMLVideoElement>('#demoVideo')?.pause();
  document.getElementById(COMMUNICATION_PULSE_HOST_ID)?.remove();
  document.getElementById(FACT_CHIP_HOST_ID)?.remove();
  pulsePresenter = undefined;
  frameIndex = Math.max(0, Math.min(frames.length - 1, nextIndex));
  const frame = frames[frameIndex];
  if (!frame) return;
  stage.innerHTML = frame.stage();
  kicker.textContent = frame.kicker;
  heading.textContent = frame.heading;
  narration.innerHTML = frame.text;
  nextButton.textContent = frame.next;
  nextButton.disabled = false;
  backButton.disabled = frameIndex === 0;
  progress.max = frames.length;
  progress.value = frameIndex + 1;
  stepText.textContent = local(
    `場面 ${frameIndex + 1} / ${frames.length}`,
    `Scene ${frameIndex + 1} / ${frames.length}`,
  );
  clock.textContent = frame.time;
  frame.enter?.();
  if (persist) persistCurrentFrame();
  if (frame.lockMs !== undefined) {
    nextButton.disabled = true;
    later(() => {
      nextButton.disabled = false;
    }, frame.lockMs);
  }
}

nextButton.addEventListener('click', () => {
  if (frameIndex !== frames.length - 1) {
    renderFrame(frameIndex + 1);
    return;
  }
  if (!extensionStorageAvailable()) {
    renderFrame(0);
    return;
  }
  void tutorialStateSaveChain.then(() => {
    window.location.assign(chrome.runtime.getURL('onboarding.html'));
  });
});
backButton.addEventListener('click', () => renderFrame(frameIndex - 1));
restartButton.addEventListener('click', () => renderFrame(0));

async function initializeTutorial(): Promise<void> {
  if (extensionStorageAvailable()) {
    try {
      const settingsMemory = await readSettingsMemory();
      language = resolveUiLanguage(settingsMemory.settings.uiLanguage, browserUiLanguage());
    } catch {
      language = resolveUiLanguage('auto', browserUiLanguage());
    }
  }
  applyTutorialLanguage();
  frames = createFrames();

  if (!extensionStorageAvailable()) {
    renderFrame(0, false);
    return;
  }
  try {
    const storedState = await loadTutorialState();
    tutorialState = recordTutorialPresentation(storedState, Date.now(), frames.length);
    await saveTutorialState(tutorialState);
    renderFrame(tutorialState.completedAt === undefined ? tutorialState.lastFrameIndex : 0, false);
  } catch {
    tutorialState = recordTutorialPresentation(undefined, Date.now(), frames.length);
    renderFrame(0, false);
  }
}

void initializeTutorial();
