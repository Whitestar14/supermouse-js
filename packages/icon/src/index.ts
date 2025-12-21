
import { definePlugin, dom, math, Layers, normalize, type ValueOrGetter } from '@supermousejs/core';

export interface IconMap {
  [key: string]: string;
}

export type IconAnchor = 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface IconOptions {
  name?: string;
  isEnabled?: boolean;
  icons: IconMap;
  defaultState?: string;
  useSemanticTags?: boolean;
  transitionDuration?: number;
  size?: ValueOrGetter<number>;
  color?: ValueOrGetter<string>;
  offset?: [number, number];
  anchor?: ValueOrGetter<IconAnchor>;
  followStrategy?: ValueOrGetter<'smooth' | 'raw'>;
  rotateWithVelocity?: ValueOrGetter<boolean>;
}

export const Icon = (options: IconOptions) => {
  let contentWrapper: HTMLDivElement;
  let styleTag: HTMLStyleElement;
  
  let currentState = options.defaultState || 'default';
  let targetState = options.defaultState || 'default';
  let isTransitioning = false;
  let lastDuration = 200;

  let currentRotation = 0;
  let lastTargetRotation = 0;

  const getSize = normalize(options.size, 24);
  const getStrategy = normalize(options.followStrategy, 'smooth');
  const getAnchor = normalize(options.anchor, 'center');
  const getShouldRotate = normalize(options.rotateWithVelocity, false);

  const injectStyles = () => {
    if (!document.getElementById('supermouse-icon-styles')) {
        styleTag = document.createElement('style');
        styleTag.id = 'supermouse-icon-styles';
        styleTag.textContent = `
          @keyframes supermouse-spin { 100% { transform: rotate(360deg); } }
          .supermouse-spin { animation: supermouse-spin 1s linear infinite; transform-origin: center; }
        `;
        document.head.appendChild(styleTag);
    }
  };

  return definePlugin<HTMLDivElement, IconOptions>({
    name: 'icon',
    selector: '[data-supermouse-icon]',

    create: () => {
      injectStyles();
      const el = dom.createDiv();
      contentWrapper = dom.createDiv();
      
      el.style.zIndex = Layers.CURSOR;
      
      dom.applyStyles(contentWrapper, {
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      });
      
      const duration = options.transitionDuration ?? 200;
      contentWrapper.style.transition = `transform ${duration/2}ms cubic-bezier(0.16, 1, 0.3, 1)`;
      lastDuration = duration;

      contentWrapper.style.transformOrigin = 'center center';
      contentWrapper.style.transform = 'scale(1)';
      
      contentWrapper.innerHTML = options.icons[currentState] || '';
      
      el.appendChild(contentWrapper);
      return el;
    },

    styles: {
      color: 'color'
    },

    update: (app, el) => {
      const duration = options.transitionDuration ?? 200;
      const useSemanticTags = options.useSemanticTags ?? true;
      const [userOffX, userOffY] = options.offset || [0, 0];
      const icons = options.icons;

      if (duration !== lastDuration) {
        contentWrapper.style.transition = `transform ${duration/2}ms cubic-bezier(0.16, 1, 0.3, 1)`;
        lastDuration = duration;
      }

      // Determine State
      let nextState = options.defaultState || 'default';
      const hoverTarget = app.state.hoverTarget;
      
      if (hoverTarget) {
        const attrIcon = hoverTarget.getAttribute('data-supermouse-icon');
        if (attrIcon && icons[attrIcon]) {
          nextState = attrIcon;
        } 
        else if (useSemanticTags) {
          const tag = hoverTarget.tagName.toLowerCase();
          
          if (tag === 'input' || tag === 'textarea' || hoverTarget.isContentEditable) {
             const type = (hoverTarget as HTMLInputElement).type;
             if (type !== 'button' && type !== 'submit' && type !== 'checkbox' && type !== 'radio' && type !== 'range') {
                if (icons['text']) nextState = 'text';
             } else if (icons['pointer']) {
                nextState = 'pointer';
             }
          } else if (tag === 'a' || tag === 'button' || hoverTarget.closest('a') || hoverTarget.closest('button')) {
             if (icons['pointer']) nextState = 'pointer';
          }
        }
      }
      
      if (nextState !== currentState && !isTransitioning) {
        if (icons[nextState] || nextState === (options.defaultState || 'default')) {
            targetState = nextState;
            isTransitioning = true;
            
            contentWrapper.style.transform = 'scale(0)';
            
            setTimeout(() => {
              currentState = targetState;
              contentWrapper.innerHTML = icons[currentState] || '';
              contentWrapper.style.transform = 'scale(1)';
              
              setTimeout(() => {
                isTransitioning = false;
              }, duration / 2);
            }, duration / 2);
        }
      }
      
      const size = getSize(app.state);
      const strategy = getStrategy(app.state);
      const anchor = getAnchor(app.state);
      const shouldRotate = getShouldRotate(app.state);
      
      dom.setStyle(el, 'width', `${size}px`);
      dom.setStyle(el, 'height', `${size}px`);
      
      let anchorX = 0;
      let anchorY = 0;
      const half = size / 2;

      switch(anchor) {
        case 'top-left': anchorX = half; anchorY = half; break;
        case 'top-right': anchorX = -half; anchorY = half; break;
        case 'bottom-left': anchorX = half; anchorY = -half; break;
        case 'bottom-right': anchorX = -half; anchorY = -half; break;
      }

      const isSemanticState = currentState === 'pointer' || currentState === 'text';
      
      if (shouldRotate && !isSemanticState && !app.state.reducedMotion) {
        const { x: vx, y: vy } = app.state.velocity;
        const speed = math.dist(vx, vy);
        
        if (speed > 1) {
          lastTargetRotation = math.angle(vx, vy);
        }
        
        const diff = lastTargetRotation - currentRotation;
        let delta = ((diff + 180) % 360) - 180;
        if (delta < -180) delta += 360;
        
        currentRotation += delta * 0.15;
      } else {
        const diff = 0 - currentRotation;
        let delta = ((diff + 180) % 360) - 180;
        if (delta < -180) delta += 360;
        currentRotation += delta * 0.15;
      }

      const pos = strategy === 'raw' ? app.state.pointer : app.state.smooth;
      dom.setTransform(el, pos.x + userOffX + anchorX, pos.y + userOffY + anchorY, currentRotation);
    }
  }, options);
};
