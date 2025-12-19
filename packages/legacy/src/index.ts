
import { Supermouse as Core } from '@supermousejs/core';
import { Dot } from '@supermousejs/dot';
import { Ring } from '@supermousejs/ring';

/**
 * Supermouse v1 Compatibility Wrapper
 * 
 * This class mimics the API of Supermouse v1 but uses the 
 * high-performance v2 engine and plugins under the hood.
 */
export default class Supermouse {
  app: Core | null = null;
  options: any;

  constructor(options: any = {}) {
    this.options = { ...options };
    this.init();
  }

  init() {
    // 1. Map v1 "Smoothness" (0-1) to v2 "Smoothness"
    // v1 defaulted to 0.2 approx.
    const smooth = this.options.ringSmoothness || 0.15;

    // 2. Initialize v2 Core
    this.app = new Core({
      smoothness: smooth,
      enableTouch: false, // v1 was mostly desktop
      hideCursor: true,
      ignoreOnNative: true
    });

    // 3. Resolve Theme Colors
    const theme = this.resolveTheme(this.options.theme);

    // 4. Add Dot Plugin (Map pointerSize)
    let dotSize = 8;
    if (this.options.pointerSize) {
      // v1 allowed [w, h] arrays, v2 prefers single number (diameter)
      dotSize = Array.isArray(this.options.pointerSize) 
        ? Math.max(...this.options.pointerSize) 
        : this.options.pointerSize;
    }

    this.app.use(Dot({
      size: dotSize,
      color: theme.dotColor,
      zIndex: '9999'
    }));

    // 5. Add Ring Plugin (Map ringSize)
    let ringSize = 20;
    if (this.options.ringSize) {
      ringSize = Array.isArray(this.options.ringSize) 
        ? Math.max(...this.options.ringSize) 
        : this.options.ringSize;
    }

    this.app.use(Ring({
      size: ringSize,
      color: theme.ringColor,
      borderWidth: this.options.ringThickness || 2,
      enableStick: true, // v1 had sticky behavior implicitly on hovers sometimes
      enableSkew: true   // Enable the new physics skew for extra flair
    }));
  }

  /**
   * Maps v1 theme strings to hex colors.
   */
  resolveTheme(themeName: string) {
    const themes: Record<string, { dotColor: string, ringColor: string }> = {
      default: { dotColor: '#000000', ringColor: 'rgba(0,0,0,0.5)' },
      neon:    { dotColor: '#ccff00', ringColor: '#00ccff' },
      dark:    { dotColor: '#ffffff', ringColor: 'rgba(255,255,255,0.5)' },
      mirror:  { dotColor: 'white',   ringColor: 'white' } // approximated
    };

    if (themeName && themes[themeName]) {
      return themes[themeName];
    }
    return themes.default;
  }

  // --- v1 API Proxies ---

  destroy() {
    if (this.app) {
      this.app.destroy();
      this.app = null;
    }
  }

  startAnimation() {
    this.app?.enable();
  }

  stopAnimation() {
    this.app?.disable();
  }

  // Legacy setters - mapped to internal state updates if possible, 
  // or no-ops if they require a full re-init (v2 is declarative).
  setTheme() { console.warn('[Supermouse] setTheme is deprecated in v2.'); return this; }
  setPointerSize() { console.warn('[Supermouse] setPointerSize is deprecated in v2.'); return this; }
  setRingSize() { console.warn('[Supermouse] setRingSize is deprecated in v2.'); return this; }
}
