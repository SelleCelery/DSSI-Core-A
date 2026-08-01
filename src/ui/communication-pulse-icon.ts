import {
  communicationPulseCookieGlyph,
  communicationPulseKindGlyph,
  communicationPulseMethodShape,
  communicationPulseObservationRoute,
  type CommunicationPulseDescriptor,
  type CommunicationPulseMethod,
  type CommunicationPulseMethodShape,
} from '../core/communication-pulse';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

function svgElement<K extends keyof SVGElementTagNameMap>(
  tagName: K,
  attributes: Readonly<Record<string, string>>,
): SVGElementTagNameMap[K] {
  const element = document.createElementNS(SVG_NAMESPACE, tagName);
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value);
  }
  return element;
}

function appendMethodShape(svg: SVGSVGElement, shape: CommunicationPulseMethodShape): void {
  switch (shape) {
    case 'circle':
      svg.append(svgElement('circle', { cx: '10', cy: '10', r: '7.25' }));
      return;
    case 'square':
      svg.append(
        svgElement('rect', {
          x: '3',
          y: '3',
          width: '14',
          height: '14',
          rx: '0.9',
        }),
      );
      return;
    case 'diamond':
      svg.append(svgElement('polygon', { points: '10,2.4 17.6,10 10,17.6 2.4,10' }));
      return;
    case 'hexagon':
      svg.append(
        svgElement('polygon', {
          points: '6,2.7 14,2.7 18,10 14,17.3 6,17.3 2,10',
        }),
      );
      return;
    case 'triangle':
      svg.append(svgElement('polygon', { points: '10,2.4 17.5,16.8 2.5,16.8' }));
      return;
    case 'capsule':
      svg.append(
        svgElement('rect', {
          x: '2.4',
          y: '5',
          width: '15.2',
          height: '10',
          rx: '5',
        }),
      );
      return;
    case 'octagon':
      svg.append(
        svgElement('polygon', {
          points: '6,2.5 14,2.5 17.5,6 17.5,14 14,17.5 6,17.5 2.5,14 2.5,6',
        }),
      );
      return;
    case 'double_ring':
      svg.append(
        svgElement('circle', { cx: '10', cy: '10', r: '7.25' }),
        svgElement('circle', { cx: '10', cy: '10', r: '4.55' }),
      );
      return;
    case 'vertical_rect':
      svg.append(
        svgElement('rect', {
          x: '5.4',
          y: '2.5',
          width: '9.2',
          height: '15',
          rx: '1.2',
        }),
      );
      return;
    case 'dialog':
      svg.append(
        svgElement('path', {
          d: 'M4 3.2h12a1.5 1.5 0 0 1 1.5 1.5v8.1a1.5 1.5 0 0 1-1.5 1.5H10l-3.7 2.8.8-2.8H4a1.5 1.5 0 0 1-1.5-1.5V4.7A1.5 1.5 0 0 1 4 3.2Z',
        }),
      );
      return;
    case 'unknown': {
      const circle = svgElement('circle', { cx: '10', cy: '10', r: '7.25' });
      circle.classList.add('unknown-method-shape');
      svg.append(circle);
    }
  }
}

export function createCommunicationMethodShapeSvg(method: CommunicationPulseMethod): SVGSVGElement {
  const svg = svgElement('svg', {
    viewBox: '0 0 20 20',
    'aria-hidden': 'true',
  });
  svg.classList.add('method-shape');
  appendMethodShape(svg, communicationPulseMethodShape(method));
  return svg;
}

export function createCommunicationPulseIcon(
  descriptor: CommunicationPulseDescriptor,
): HTMLSpanElement {
  const icon = document.createElement('span');
  icon.className = 'communication-pulse-icon';
  icon.dataset.kind = descriptor.kind;
  icon.dataset.route = communicationPulseObservationRoute(descriptor.kind);
  icon.dataset.method = descriptor.method;
  icon.dataset.methodShape = communicationPulseMethodShape(descriptor.method);

  const shape = createCommunicationMethodShapeSvg(descriptor.method);
  const kind = document.createElement('span');
  kind.className = 'kind-glyph';
  kind.textContent = communicationPulseKindGlyph(descriptor.kind);
  icon.append(shape, kind);

  if (descriptor.cookieState !== 'not_applicable') {
    const cookie = document.createElement('span');
    cookie.className = 'cookie-marker';
    cookie.dataset.state = descriptor.cookieState;
    cookie.textContent = communicationPulseCookieGlyph(descriptor.cookieState);
    icon.append(cookie);
  }

  if (descriptor.destinationRelation === 'cross_origin') {
    const relation = document.createElement('span');
    relation.className = 'relation-marker';
    icon.append(relation);
  }

  return icon;
}
