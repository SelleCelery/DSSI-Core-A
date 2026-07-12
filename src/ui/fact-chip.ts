import type { SurfaceType } from '../core/models/observation';
import type { ViscosityLevel } from '../core/models/settings';

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

function ensureHost(): ShadowRoot {
  const existing = document.getElementById(HOST_ID);
  if (existing?.shadowRoot) return existing.shadowRoot;

  const host = document.createElement('div');
  host.id = HOST_ID;
  host.style.setProperty('all', 'initial');
  host.style.setProperty('position', 'fixed');
  host.style.setProperty('right', '16px');
  host.style.setProperty('bottom', '16px');
  host.style.setProperty('z-index', '2147483647');
  host.style.setProperty('pointer-events', 'none');

  const root = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = `
    .chip {
      box-sizing: border-box;
      max-width: min(360px, calc(100vw - 32px));
      padding: 11px 13px;
      border: 1px solid rgba(100, 116, 139, 0.45);
      border-radius: 10px;
      background: rgba(15, 23, 42, 0.96);
      color: #f8fafc;
      font: 13px/1.5 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      letter-spacing: normal;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.28);
      opacity: 0;
      transform: translateY(8px);
      transition: opacity 120ms ease, transform 120ms ease;
    }
    .chip[data-visible="true"] {
      opacity: 1;
      transform: translateY(0);
    }
    .title {
      display: block;
      margin-bottom: 3px;
      font-weight: 700;
    }
    .detail {
      color: #cbd5e1;
    }
  `;
  root.append(style);
  document.documentElement.append(host);
  return root;
}

function detailForCurrentPage(): string {
  if (location.protocol === 'http:') {
    return 'このページはHTTPです。通信経路は暗号化されていません。';
  }
  return 'DSSIは入力内容そのものを保存しません。';
}

export class FactChipPresenter {
  #hideTimer: number | undefined;

  public show(surfaceType: SurfaceType, viscosityLevel: ViscosityLevel): void {
    const root = ensureHost();
    root.querySelector('.chip')?.remove();

    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.setAttribute('role', 'status');
    chip.setAttribute('aria-live', 'polite');

    const title = document.createElement('span');
    title.className = 'title';
    title.textContent = SURFACE_MESSAGES[surfaceType];

    const detail = document.createElement('span');
    detail.className = 'detail';
    detail.textContent = detailForCurrentPage();

    chip.append(title, detail);
    root.append(chip);
    requestAnimationFrame(() => chip.setAttribute('data-visible', 'true'));

    if (this.#hideTimer !== undefined) {
      window.clearTimeout(this.#hideTimer);
    }

    const duration = viscosityLevel === 1 ? 4000 : viscosityLevel === 2 ? 6500 : 9000;
    this.#hideTimer = window.setTimeout(() => {
      chip.setAttribute('data-visible', 'false');
      window.setTimeout(() => chip.remove(), 180);
    }, duration);
  }
}
