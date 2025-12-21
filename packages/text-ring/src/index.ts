
import { definePlugin, dom, Layers, normalize, type ValueOrGetter } from '@supermousejs/core';
import { getCirclePath, getCircumference, formatLoopText } from '@supermousejs/zoetrope';

export interface TextRingOptions {
  name?: string;
  isEnabled?: boolean;
  text?: ValueOrGetter<string>;
  radius?: ValueOrGetter<number>;
  fontSize?: ValueOrGetter<number>;
  speed?: ValueOrGetter<number>;
  color?: ValueOrGetter<string>;
  className?: string;
  spread?: boolean;
}

let instanceCount = 0;

export const TextRing = (options: TextRingOptions = {}) => {
  let svg: SVGSVGElement;
  let pathEl: SVGPathElement;
  let textPathEl: SVGTextPathElement;
  let textEl: SVGTextElement;
  let textNode: Text;
  
  const pathId = `supermouse-text-ring-path-${instanceCount++}`;

  const defText = 'SUPERMOUSE • SUPERMOUSE • ';
  const defRadius = 60;
  const defFontSize = 12;
  const defSpeed = 0.5;
  const className = options.className || '';
  const spread = options.spread ?? false; 

  const getText = normalize(options.text, defText);
  const getRadius = normalize(options.radius, defRadius);
  const getFontSize = normalize(options.fontSize, defFontSize);
  const getSpeed = normalize(options.speed, defSpeed);

  let currentRotation = 0;
  let lastText = '';
  let lastRadius = 0;
  let lastFontSize = 0;

  return definePlugin<HTMLDivElement, TextRingOptions>({
    name: 'text-ring',
    selector: '[data-supermouse-text-ring]',

    create: (app) => {
      const container = dom.createActor('div') as HTMLDivElement;
      dom.applyStyles(container, {
        zIndex: Layers.FOLLOWER,
        transition: 'opacity 0.2s ease',
        opacity: '1',
        width: '0px',
        height: '0px',
        overflow: 'visible',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      });
      if (className) container.classList.add(className);

      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.style.overflow = 'visible';
      svg.style.position = 'absolute';
      svg.style.left = '0';
      svg.style.top = '0';
      
      pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      pathEl.setAttribute('id', pathId);
      pathEl.setAttribute('fill', 'none');
      
      textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      
      const fs = getFontSize(app.state);
      textEl.setAttribute('font-size', `${fs}px`);
      lastFontSize = fs;

      textEl.setAttribute('fill', 'currentColor');
      textEl.style.textTransform = 'uppercase';
      textEl.style.letterSpacing = '2px';

      textPathEl = document.createElementNS('http://www.w3.org/2000/svg', 'textPath');
      textPathEl.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `#${pathId}`);
      textPathEl.setAttribute('href', `#${pathId}`);
      textPathEl.setAttribute('startOffset', '0%');
      
      textNode = document.createTextNode('');
      
      textPathEl.appendChild(textNode);
      textEl.appendChild(textPathEl);
      svg.appendChild(pathEl);
      svg.appendChild(textEl);
      container.appendChild(svg);

      return container;
    },

    styles: {
      color: 'color'
    },

    update: (app, container) => {
      const target = app.state.hoverTarget;
      let text = getText(app.state);
      const radius = getRadius(app.state);
      const fontSize = getFontSize(app.state);
      const speed = getSpeed(app.state);

      if (target?.hasAttribute('data-supermouse-text-ring')) {
        const attr = target.getAttribute('data-supermouse-text-ring');
        if (attr) text = attr;
      }

      if (radius !== lastRadius) {
        pathEl.setAttribute('d', getCirclePath(radius));
        lastRadius = radius;
      }

      if (spread) {
        const circum = getCircumference(radius);
        textPathEl.setAttribute('textLength', String(circum));
        textPathEl.setAttribute('lengthAdjust', 'spacing');
        text = formatLoopText(text, true);
      } else {
        textPathEl.removeAttribute('textLength');
        textPathEl.removeAttribute('lengthAdjust');
      }

      if (fontSize !== lastFontSize) {
        textEl.setAttribute('font-size', `${fontSize}px`);
        lastFontSize = fontSize;
      }

      if (text !== lastText) {
        textNode.textContent = text;
        lastText = text;
      }

      currentRotation += speed;
      const { x, y } = app.state.smooth;
      dom.setTransform(container, x, y, currentRotation);
    }
  }, options);
};
