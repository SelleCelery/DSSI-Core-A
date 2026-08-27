import {
  communicationPulseAriaLabel,
  type CommunicationPulseDescriptor,
} from '../core/communication-pulse';
import type { ObservationLogRecord } from '../core/models/observation';
import {
  boundarySourceLabel,
  classificationConfidenceLabel,
  cookieHeaderDetectionLabel,
  frameContextLabel,
  networkCorrelationLabel,
  networkMechanismLabel,
  networkPayloadObservationLabel,
  observationActionLabel,
  observationScopeLabel,
  operationEvidenceLabel,
  pageObservationTimingLabel,
  submissionAssociationLabel,
  submissionDestinationLabel,
  submissionEncodingLabel,
  submissionMethodLabel,
  surfaceStructureLabel,
  surfaceTypeLabel,
} from '../core/observation-presentation';
import { t, type UiLanguage } from '../i18n/ui';
import {
  createCommunicationPulseIcon,
  type CommunicationPulseVisualOptions,
} from './communication-pulse-icon';

export interface TaggedObservationRecord {
  record: ObservationLogRecord;
  layer: 'activity' | 'diagnostic';
}

export interface ObservationSimpleStreamOptions {
  language: UiLanguage;
  visualOptions?: CommunicationPulseVisualOptions;
}

function local(language: UiLanguage, ja: string, en: string): string {
  return language === 'ja' ? ja : en;
}

function locale(language: UiLanguage): string {
  return language === 'ja' ? 'ja-JP' : 'en-US';
}

function formatTimestamp(timestamp: number, language: UiLanguage): string {
  return new Date(timestamp).toLocaleString(locale(language), {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatClock(timestamp: number, language: UiLanguage): string {
  return new Date(timestamp).toLocaleTimeString(locale(language), {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function communicationDescriptorFromObservationRecord(
  record: ObservationLogRecord,
): CommunicationPulseDescriptor | null {
  if (record.networkMechanism !== undefined && record.networkMethod !== undefined) {
    return {
      kind: record.networkMechanism,
      method: record.networkMethod,
      cookieState: record.cookieHeaderDetection ?? 'not_observed',
      destinationRelation: record.destinationRelation ?? 'unknown',
      bodyObservation: 'not_observed',
    };
  }
  if (record.submissionMethod !== undefined) {
    return {
      kind: 'dom_submit',
      method: record.submissionMethod,
      cookieState: 'not_applicable',
      destinationRelation: record.destinationRelation ?? 'unknown',
      bodyObservation: 'not_observed',
    };
  }
  return null;
}

function createStreamGlyph(
  record: ObservationLogRecord,
  options: ObservationSimpleStreamOptions,
): HTMLSpanElement {
  const wrapper = document.createElement('span');
  wrapper.className = 'stream-glyph';
  const descriptor = communicationDescriptorFromObservationRecord(record);
  if (descriptor === null) {
    wrapper.textContent = '⋯';
    wrapper.title = local(
      options.language,
      '通信methodを持たないページ内観測',
      'Page observation without a communication method',
    );
    wrapper.setAttribute('aria-label', wrapper.title);
    return wrapper;
  }
  const icon = createCommunicationPulseIcon(descriptor, options.visualOptions);
  icon.title = communicationPulseAriaLabel(descriptor, options.language);
  wrapper.append(icon);
  return wrapper;
}

export function shortObservationCorrelation(
  record: ObservationLogRecord,
  language: UiLanguage,
): string {
  switch (record.networkCorrelation) {
    case 'recent_content_edit':
      return local(language, '内容変更近接', 'Near content edit');
    case 'recent_submit_operation':
      return local(language, 'submit近接', 'Near submit');
    case 'no_correlated_user_operation':
      return local(language, '操作相関未確認', 'No action correlated');
    case 'correlation_unavailable':
      return local(language, '相関判定不能', 'Correlation unavailable');
    case 'recent_input_activity':
      return local(language, '入力近接（旧）', 'Near input (legacy)');
    default:
      return record.submissionAssociation === 'correlated_submit_event'
        ? local(language, 'submit成立相関', 'Submit event correlated')
        : '';
  }
}

function detailItem(term: string, description: string): DocumentFragment {
  const fragment = document.createDocumentFragment();
  const dt = document.createElement('dt');
  dt.textContent = term;
  const dd = document.createElement('dd');
  dd.textContent = description;
  fragment.append(dt, dd);
  return fragment;
}

export function createObservationSimpleStreamEntry(
  tagged: TaggedObservationRecord,
  options: ObservationSimpleStreamOptions,
): HTMLDetailsElement {
  const { record, layer } = tagged;
  const { language } = options;
  const details = document.createElement('details');
  details.className = 'stream-entry';
  details.dataset.layer = layer;

  const summary = document.createElement('summary');
  const time = document.createElement('time');
  time.dateTime = new Date(record.timestamp).toISOString();
  time.textContent = formatClock(record.timestamp, language);
  const glyph = createStreamGlyph(record, options);
  glyph.dataset.layer = layer;
  const action = document.createElement('span');
  action.className = 'stream-action';
  action.textContent = observationActionLabel(record, language);
  const destination = document.createElement('span');
  destination.className = 'stream-destination';
  const destinationText = submissionDestinationLabel(record, language);
  destination.textContent = destinationText === '—' ? record.domainKey : destinationText;
  const correlation = document.createElement('span');
  correlation.className = 'stream-correlation';
  correlation.textContent = shortObservationCorrelation(record, language);
  summary.append(time, glyph, action, destination, correlation);

  const detail = document.createElement('dl');
  detail.className = 'stream-detail';
  detail.append(
    detailItem(
      local(language, '記録区分', 'Record layer'),
      layer === 'diagnostic' ? t(language, 'diagnosticLog') : t(language, 'activityLog'),
    ),
    detailItem(t(language, 'time'), formatTimestamp(record.timestamp, language)),
    detailItem(local(language, '観測フレーム', 'Observed frame'), record.domainKey),
    detailItem(
      local(language, 'フレーム関係', 'Frame relation'),
      frameContextLabel(record, language),
    ),
    detailItem(
      local(language, '入力面', 'Input surface'),
      surfaceTypeLabel(record.surfaceType, language),
    ),
    detailItem(local(language, '安全な構造情報', 'Safe structure'), surfaceStructureLabel(record)),
    detailItem(
      local(language, '観測事実', 'Observed fact'),
      observationActionLabel(record, language),
    ),
    detailItem(
      local(language, '操作証拠', 'Operation evidence'),
      operationEvidenceLabel(record.operationEvidence, language),
    ),
    detailItem(
      local(language, '入力面分類根拠', 'Classification basis'),
      classificationConfidenceLabel(record.classificationConfidence, language),
    ),
    detailItem(
      local(language, '境界観測範囲', 'Observation scope'),
      observationScopeLabel(record, language),
    ),
    detailItem(local(language, '境界種別', 'Boundary type'), boundarySourceLabel(record, language)),
    detailItem(
      local(language, '送信関連づけ', 'Submission association'),
      submissionAssociationLabel(record, language),
    ),
    detailItem('method', submissionMethodLabel(record)),
    detailItem(
      local(language, '送信先／通信先', 'Declared / observed destination'),
      submissionDestinationLabel(record, language),
    ),
    detailItem('encoding', submissionEncodingLabel(record)),
    detailItem(
      local(language, '通信方式', 'Communication mechanism'),
      networkMechanismLabel(record, language),
    ),
    detailItem(
      local(language, '操作相関', 'Operation correlation'),
      networkCorrelationLabel(record, language),
    ),
    detailItem(
      local(language, 'ページ観測との時間関係', 'Relation to page observation'),
      pageObservationTimingLabel(record, language),
    ),
    detailItem(
      local(language, 'Cookieヘッダー', 'Cookie header'),
      cookieHeaderDetectionLabel(record, language),
    ),
    detailItem(
      local(language, '通信本文', 'Network payload'),
      networkPayloadObservationLabel(record, language),
    ),
    detailItem(
      local(language, '設定スナップショット', 'Settings snapshot'),
      record.settingsSnapshotId ?? t(language, 'unavailable'),
    ),
    detailItem(
      local(language, '表示方針', 'Presentation policy'),
      record.cuePresented
        ? local(
            language,
            '表示対象（実表示は観測時設定に依存）',
            'Eligible for presentation; actual display depended on observation-time settings',
          )
        : local(language, '表示対象外', 'Not presented'),
    ),
  );
  details.append(summary, detail);
  return details;
}

export function renderObservationSimpleStream(
  container: HTMLElement,
  records: readonly TaggedObservationRecord[],
  options: ObservationSimpleStreamOptions,
): void {
  container.replaceChildren(
    ...records.map((record) => createObservationSimpleStreamEntry(record, options)),
  );
}
