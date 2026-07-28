import type {
  InputSurfaceDescriptor,
  SafeInputSurfaceStructure,
} from '../core/models/input-surface';

const SUPPORTED_SELECTOR =
  'input, textarea, [contenteditable]:not([contenteditable="false"]), [role="textbox"]';

export function isSupportedInputSurface(element: Element): boolean {
  return element.matches(SUPPORTED_SELECTOR);
}

function associatedLabelText(element: Element): string {
  if (!(element instanceof HTMLElement)) return '';

  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy) {
    return labelledBy
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent ?? '')
      .join(' ');
  }

  if ('labels' in element) {
    const labels = (element as HTMLInputElement | HTMLTextAreaElement).labels;
    if (labels) {
      return [...labels].map((label) => label.textContent ?? '').join(' ');
    }
  }

  return '';
}

export function describeInputSurface(element: Element): InputSurfaceDescriptor {
  const input = element instanceof HTMLInputElement ? element : undefined;
  const autocomplete = element.getAttribute('autocomplete') ?? '';
  const semanticParts = [
    element.getAttribute('name') ?? '',
    element.id,
    element.getAttribute('aria-label') ?? '',
    element.getAttribute('placeholder') ?? '',
    associatedLabelText(element),
  ];

  return {
    tagName: element.tagName.toLowerCase(),
    inputType: input?.type ?? '',
    autocompleteTokens: autocomplete
      .toLowerCase()
      .split(/\s+/)
      .filter((token) => token.length > 0),
    semanticText: semanticParts.join(' '),
    isContentEditable: element instanceof HTMLElement && element.isContentEditable,
    role: element.getAttribute('role') ?? '',
  };
}

export function resolveInputSurface(event: Event): Element | undefined {
  for (const target of event.composedPath()) {
    if (target instanceof Element && isSupportedInputSurface(target)) {
      return target;
    }
  }

  return undefined;
}

export function findInputSurfaces(root: ParentNode): Element[] {
  const matches = [...root.querySelectorAll(SUPPORTED_SELECTOR)];
  if (root instanceof Element && isSupportedInputSurface(root)) {
    matches.unshift(root);
  }
  return matches;
}

const SAFE_STRUCTURE_TOKEN = /^[a-z0-9-]{1,64}$/;

export function describeSafeInputSurfaceStructure(
  descriptor: InputSurfaceDescriptor,
): SafeInputSurfaceStructure {
  return {
    tagName: descriptor.tagName.slice(0, 32),
    inputType: descriptor.inputType.slice(0, 64),
    role: SAFE_STRUCTURE_TOKEN.test(descriptor.role) ? descriptor.role : '',
    isContentEditable: descriptor.isContentEditable,
    autocompleteTokens: descriptor.autocompleteTokens
      .filter((token) => SAFE_STRUCTURE_TOKEN.test(token))
      .slice(0, 8),
  };
}
