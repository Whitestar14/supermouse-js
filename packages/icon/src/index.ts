
import { type SupermousePlugin, dom, Layers, resolve, type ValueOrGetter } from '@supermousejs/core';

export interface IconMap {
  [key: string]: string;
}

export type IconAnchor = 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface IconOptions {
  /** Map of icon names to SVG strings */
  icons: IconMap;
  /** Initial/Default state name. Default 'default' */
  defaultState?: string;
  /** Automatically switch to 'pointer' for links/buttons and 'text' for inputs. Default true. */
  useSemanticTags?: boolean;
  /** Transition duration in ms. Default 200. */
  transitionDuration?: number;
  /** Size of the icon. Default 24. */
  size?: ValueOrGetter<number>;
  /** Color of the icon. Default black. */
  color?: ValueOrGetter<string>;
  /** Offset [x, y] for the icon. Default [0, 0] */
  offset?: [number, number];
  /** 
   * Where the cursor visual anchors relative to the mouse point.
   * Use 'top-left' for standard arrow cursors to align the tip with the click.
   * @default 'center'
   */
  anchor?: ValueOrGetter<IconAnchor>;
  /** 
   * Movement strategy. 
   * 'smooth' = uses interpolated position (laggy/cinematic).
   * 'raw' = uses raw pointer position (instant/precise).
   * @default 'smooth'
   */
  followStrategy?: ValueOrGetter<'smooth' | 'raw'>;
}

export const Icon = (options: IconOptions): SupermousePlugin => {
  let el: HTMLDivElement;
  let contentWrapper: HTMLDivElement;
  let styleTag: HTMLStyleElement;
  
  // We reference options directly in update loop for reactivity
  
  let currentState = options.defaultState || 'default';
  let targetState = options.defaultState || 'default';
  let isTransitioning = false;
  let lastDuration = 200;

  // Inject CSS Keyframes for loading spinner if needed
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

  return {
    name: 'icon',
    isEnabled: true,
    
    install(app) {
      injectStyles();
      el = dom.createDiv();
      contentWrapper = dom.createDiv();
      
      // Setup Container
      el.style.zIndex = Layers.CURSOR;
      
      // Setup Content Wrapper (for scaling/transitions)
      contentWrapper.style.position = 'absolute';
      contentWrapper.style.top = '0';
      contentWrapper.style.left = '0';
      contentWrapper.style.width = '100%';
      contentWrapper.style.height = '100%';
      contentWrapper.style.display = 'flex';
      contentWrapper.style.alignItems = 'center';
      contentWrapper.style.justifyContent = 'center';
      
      const duration = options.transitionDuration ?? 200;
      contentWrapper.style.transition = `transform ${duration/2}ms cubic-bezier(0.16, 1, 0.3, 1)`;
      lastDuration = duration;

      contentWrapper.style.transformOrigin = 'center center';
      contentWrapper.style.transform = 'scale(1)';
      
      // Initial content
      contentWrapper.innerHTML = options.icons[currentState] || '';
      
      el.appendChild(contentWrapper);
      app.container.appendChild(el);
      
      app.registerHoverTarget('[data-supermouse-icon]');
    },
    
    update(app) {
      const duration = options.transitionDuration ?? 200;
      const useSemanticTags = options.useSemanticTags ?? true;
      const [userOffX, userOffY] = options.offset || [0, 0];
      const icons = options.icons;

      // Update transition if duration changed
      if (duration !== lastDuration) {
        contentWrapper.style.transition = `transform ${duration/2}ms cubic-bezier(0.16, 1, 0.3, 1)`;
        lastDuration = duration;
      }

      // 1. Determine State
      let nextState = options.defaultState || 'default';
      const hoverTarget = app.state.hoverTarget;
      
      if (hoverTarget) {
        // Explicit attribute
        const attrIcon = hoverTarget.getAttribute('data-supermouse-icon');
        if (attrIcon && icons[attrIcon]) {
          nextState = attrIcon;
        } 
        // Semantic tags
        else if (useSemanticTags) {
          const tag = hoverTarget.tagName.toLowerCase();
          
          if (tag === 'input' || tag === 'textarea' || hoverTarget.isContentEditable) {
             const type = (hoverTarget as HTMLInputElement).type;
             if (type !== 'button' && type !== 'submit' && type !== 'checkbox' && type !== 'radio') {
                if (icons['text']) nextState = 'text';
             } else if (icons['pointer']) {
                nextState = 'pointer';
             }
          } else if (tag === 'a' || tag === 'button' || hoverTarget.closest('a') || hoverTarget.closest('button')) {
             if (icons['pointer']) nextState = 'pointer';
          }
        }
      }
      
      // 2. Handle Transition (Scale Out -> Swap -> Scale In)
      if (nextState !== currentState && !isTransitioning) {
        // Only transition if the new state actually exists in our registry
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
      
      // 3. Update Props
      const size = resolve(options.size, app.state, 24);
      const color = resolve(options.color, app.state, 'black');
      const strategy = resolve(options.followStrategy, app.state, 'smooth');
      const anchor = resolve(options.anchor, app.state, 'center');
      
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.style.color = color;
      
      // 4. Calculate Anchor Offset
      let anchorX = 0;
      let anchorY = 0;
      const half = size / 2;

      switch(anchor) {
        case 'top-left': anchorX = half; anchorY = half; break;
        case 'top-right': anchorX = -half; anchorY = half; break;
        case 'bottom-left': anchorX = half; anchorY = -half; break;
        case 'bottom-right': anchorX = -half; anchorY = -half; break;
      }

      // 5. Position
      const pos = strategy === 'raw' ? app.state.pointer : app.state.smooth;
      dom.setTransform(el, pos.x + userOffX + anchorX, pos.y + userOffY + anchorY);
    },
    
    destroy() { 
        el.remove();
    }
  };
};
