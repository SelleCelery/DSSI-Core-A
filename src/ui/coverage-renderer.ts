import {
  coverageReasonLabel,
  coverageStatusLabel,
  type CoverageManifestEntry,
} from '../core/coverage-manifest';

export function renderCoverageManifest(
  container: HTMLElement,
  entries: CoverageManifestEntry[],
): void {
  container.replaceChildren();

  for (const entry of entries) {
    const article = document.createElement('article');
    article.className = 'coverage-entry';

    const heading = document.createElement('h3');
    heading.textContent = entry.label;

    const badges = document.createElement('p');
    badges.className = 'coverage-badges';

    const statusBadge = document.createElement('span');
    statusBadge.className = `coverage-status coverage-${entry.status}`;
    statusBadge.textContent = coverageStatusLabel(entry.status);

    const reasonBadge = document.createElement('span');
    reasonBadge.className = 'coverage-reason';
    reasonBadge.textContent = coverageReasonLabel(entry.reason);

    badges.append(statusBadge, reasonBadge);

    if (entry.permissionGranted !== undefined) {
      const permissionBadge = document.createElement('span');
      permissionBadge.className = 'coverage-reason';
      permissionBadge.textContent = entry.permissionGranted ? '権限あり' : '権限なし';
      badges.append(permissionBadge);
    }

    const detail = document.createElement('p');
    detail.textContent = entry.detail;

    const availability = document.createElement('p');
    availability.className = 'small';
    availability.textContent = entry.enabled ? '現在有効' : '現在は観測経路へ未接続';

    article.append(heading, badges, detail, availability);
    container.append(article);
  }
}
