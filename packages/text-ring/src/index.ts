import { type SupermousePlugin, dom, Layers, resolve, type ValueOrGetter } from '@supermousejs/core';
import { getCirclePath, getCircumference, formatLoopText } from '@supermousejs/zoetrope';

export interface TextRingOptions {
  /** The text to display. Can be overridden by data-supermouse-text-ring on elements. */
  text?: ValueOrGetter<string>;
  /** Radius of the text circle in pixels. */
  radius?: ValueOrGetter<number>;
  /** Font size in pixels. */
  fontSize?: ValueOrGetter<number>;
  /** Rotation speed in degrees per frame. */
  speed?: ValueOrGetter<number>;
  /** Text color. */
  color?: ValueOrGetter<string>;
  /** CSS class for custom styling (font-family, font-weight). */
  className?: string;
  /** Whether to spread the text to fit the full circumference. */
  spread?: boolean;
}

let instanceCount = 0;

export const TextRing = (options: TextRingOptions = {}): SupermousePlugin => {
  let container: HTMLDivElement;
  let svg: SVGSVGElement;
  let pathEl: SVGPathElement;
  let textPathEl: SVGTextPathElement;
  let textEl: SVGTextElement;
  let textNode: Text;
  
  const pathId = `supermouse-text-ring-path-${instanceCount++}`;

  // Defaults
  const defText = 'SUPERMOUSE • SUPERMOUSE • ';
  const defRadius = 60;
  const defColor = '#000';
  const defFontSize = 12;
  const defSpeed = 0.5;
  const className = options.className || '';
  const spread = options.spread ?? false; 

  // State
  let currentRotation = 0;
  let lastText = '';
  let lastRadius = 0;
  let lastFontSize = 0;

  return {
    name: 'text-ring',
    isEnabled: true,

    install(app) {
      // 1. Create Container
      container = dom.createDiv();
      dom.applyStyles(container, {
        zIndex: Layers.FOLLOWER,
        pointerEvents: 'none',
        willChange: 'transform',
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

      // 2. Create SVG
      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.style.overflow = 'visible';
      svg.style.position = 'absolute';
      svg.style.left = '0';
      svg.style.top = '0';
      
      // 3. Define Path (Circle)
      pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      pathEl.setAttribute('id', pathId);
      pathEl.setAttribute('fill', 'none');
      
      // 4. Create Text
      textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      
      const fs = resolve(options.fontSize, app.state, defFontSize);
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
      
      // Assemble
      textPathEl.appendChild(textNode);
      textEl.appendChild(textPathEl);
      svg.appendChild(pathEl);
      svg.appendChild(textEl);
      container.appendChild(svg);

      app.registerHoverTarget('[data-supermouse-text-ring]');
      app.container.appendChild(container);
    },

    update(app) {
      // 1. Resolve State
      const target = app.state.hoverTarget;
      let text = resolve(options.text, app.state, defText);
      const radius = resolve(options.radius, app.state, defRadius);
      const color = resolve(options.color, app.state, defColor);
      const fontSize = resolve(options.fontSize, app.state, defFontSize);
      const speed = resolve(options.speed, app.state, defSpeed);

      // Check context override
      if (target?.hasAttribute('data-supermouse-text-ring')) {
        const attr = target.getAttribute('data-supermouse-text-ring');
        if (attr) text = attr;
      }

      // 2. Update Geometry via Zoetrope
      if (radius !== lastRadius) {
        pathEl.setAttribute('d', getCirclePath(radius));
        lastRadius = radius;
      }

      // 3. Handle Text Spreading via Zoetrope logic
      if (spread) {
        const circum = getCircumference(radius);
        textPathEl.setAttribute('textLength', String(circum));
        textPathEl.setAttribute('lengthAdjust', 'spacing');
        
        // Zoetrope handles the NBSP suffix logic
        text = formatLoopText(text, true);
      } else {
        textPathEl.removeAttribute('textLength');
        textPathEl.removeAttribute('lengthAdjust');
      }

      // 4. Update Font Size
      if (fontSize !== lastFontSize) {
        textEl.setAttribute('font-size', `${fontSize}px`);
        lastFontSize = fontSize;
      }

      // 5. Update Text
      if (text !== lastText) {
        textNode.textContent = text;
        lastText = text;
      }

      // 6. Styles & Transform
      container.style.color = color;
      currentRotation += speed;
      const { x, y } = app.state.smooth;
      dom.setTransform(container, x, y, currentRotation);
      
      if (container.style.opacity === '0') container.style.opacity = '1';
    },

    onDisable() { container.style.opacity = '0'; },
    onEnable() { container.style.opacity = '1'; },
    destroy() { container.remove(); }
  };
};