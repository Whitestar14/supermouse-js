
import { Supermouse } from '@supermousejs/core';
import { Dot } from '@supermousejs/dot';
import { Ring } from '@supermousejs/ring';
import { Sparkles } from '@supermousejs/sparkles';
import { Text } from '@supermousejs/text';
import { TextRing } from '@supermousejs/text-ring';
import { Magnetic } from '@supermousejs/magnetic';
import { Pointer } from '@supermousejs/pointer';
import { Icon } from '@supermousejs/icon';

export type ControlType = 'range' | 'color' | 'toggle' | 'text' | 'select';

export interface ControlSchema {
  key: string;
  label: string;
  type: ControlType;
  defaultValue: any;
  min?: number;
  max?: number;
  step?: number;
  options?: string[]; // for select
  unit?: string; // e.g. 'px', 'ms', 'deg'
  description?: string;
}

export interface PresetRecipe {
  id: string;
  name: string;
  description: string;
  icon: string;
  schema: ControlSchema[];
  setup: (app: Supermouse, config: any) => void;
}

const POINTER_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <g transform="rotate(90 16 16)">
    <path class="inner" d="M25,30a5.82,5.82,0,0,1-1.09-.17l-.2-.07-7.36-3.48a.72.72,0,0,0-.35-.08.78.78,0,0,0-.33.07L8.24,29.54a.66.66,0,0,1-.2.06,5.17,5.17,0,0,1-1,.15,3.6,3.6,0,0,1-3.29-5L12.68,4.2a3.59,3.59,0,0,1,6.58,0l9,20.74A3.6,3.6,0,0,1,25,30Z" fill="#F2F5F8" />
    <path class="outer" d="M16,3A2.59,2.59,0,0,1,18.34,4.6l9,20.74A2.59,2.59,0,0,1,25,29a5.42,5.42,0,0,1-.86-.15l-7.37-3.48a1.84,1.84,0,0,0-.77-.17,1.69,1.69,0,0,0-.73.16l-7.4,3.31a5.89,5.89,0,0,1-.79.12,2.59,2.59,0,0,1-2.37-3.62L13.6,4.6A2.58,2.58,0,0,1,16,3m0-2h0A4.58,4.58,0,0,0,11.76,3.8L2.84,24.33A4.58,4.58,0,0,0,7,30.75a6.08,6.08,0,0,0,1.21-.17,1.87,1.87,0,0,0,.4-.13L16,27.18l7.29,3.44a1.64,1.64,0,0,0,.39.14A6.37,6.37,0,0,0,25,31a4.59,4.59,0,0,0,4.21-6.41l-9-20.75A4.62,4.62,0,0,0,16,1Z" fill="#111920" />
  </g>
</svg>
`;

const ICON_SVGS: Record<string, string> = {
  default: `<svg viewBox="0 0 24 24" fill="white" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(-25deg)"><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/></svg>`,
  hand: `<svg viewBox="0 0 24 24" fill="white" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>`,
  text: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h8"/><path d="M12 4v16"/><path d="M8 20h8"/></svg>`,
  // CSS Keyframe Animation provided by plugin style injection
  loading: `<svg class="supermouse-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>`
};
ICON_SVGS.pointer = ICON_SVGS.hand;

export const RECIPES: PresetRecipe[] = [
  {
    id: 'basic-dot',
    name: 'Precision Dot',
    description: 'The standard verified cursor. Minimalist and fast.',
    icon: '●',
    schema: [
      { key: 'size', label: 'Size', type: 'range', min: 4, max: 40, step: 1, defaultValue: 10, unit: 'px', description: 'Diameter in pixels' },
      { key: 'color', label: 'Color', type: 'color', defaultValue: '#000000' },
      { key: 'mixBlendMode', label: 'Blend Mode', type: 'select', options: ['normal', 'difference', 'exclusion'], defaultValue: 'normal' }
    ],
    setup: (app, config) => {
      app.use(Dot({
        size: () => config.size,
        color: () => config.color,
        mixBlendMode: () => config.mixBlendMode
      }));
    }
  },
  {
    id: 'context-icon',
    name: 'Context Icons',
    description: 'Swaps SVG icons based on semantic tags (links, inputs) or custom attributes.',
    icon: '⬡',
    schema: [
        { key: 'size', label: 'Size', type: 'range', min: 16, max: 48, defaultValue: 24, unit: 'px' },
        { key: 'color', label: 'Color', type: 'color', defaultValue: '#000000' },
        { key: 'transitionDuration', label: 'Transition', type: 'range', min: 0, max: 500, defaultValue: 200, unit: 'ms', description: 'Morph duration' },
        { key: 'followStrategy', label: 'Follow Mode', type: 'select', options: ['smooth', 'raw'], defaultValue: 'smooth' },
        { key: 'anchor', label: 'Anchor Point', type: 'select', options: ['center', 'top-left'], defaultValue: 'top-left', description: 'Align "Top Left" for arrows.' }
    ],
    setup: (app, config) => {
        app.options.ignoreOnNative = false;
        app.use(Icon({
            icons: ICON_SVGS,
            size: () => config.size,
            color: () => config.color,
            transitionDuration: config.transitionDuration, 
            followStrategy: () => config.followStrategy,
            anchor: () => config.anchor
        }));
    }
  },
  {
    id: 'vehicle-pointer',
    name: 'Vehicle Pointer',
    description: 'A brutalist arrow that rotates based on velocity.',
    icon: '➤',
    schema: [
        { key: 'size', label: 'Size', type: 'range', min: 16, max: 64, defaultValue: 32, unit: 'px' },
        { key: 'color', label: 'Color', type: 'color', defaultValue: '#000000' },
        { key: 'restingAngle', label: 'Rest Angle', type: 'range', min: -180, max: 180, defaultValue: -45, unit: 'deg', description: 'Angle when stopped' },
        { key: 'returnToRest', label: 'Return to Rest', type: 'toggle', defaultValue: true, description: 'Snap back to rest angle when stopped' },
        { key: 'restDelay', label: 'Rest Delay', type: 'range', min: 0, max: 2000, step: 50, defaultValue: 200, unit: 'ms', description: 'Wait time before resetting' }
    ],
    setup: (app, config) => {
        app.use(Pointer({
            size: () => config.size,
            color: () => config.color,
            restingAngle: () => config.restingAngle,
            returnToRest: () => config.returnToRest,
            restDelay: () => config.restDelay,
            svg: POINTER_SVG
        }));
    }
  },
  {
    id: 'text-ring',
    name: 'Text Ring',
    description: 'Rotates a text message around your cursor.',
    icon: '◎',
    schema: [
      { key: 'text', label: 'Message', type: 'text', defaultValue: 'SUPERMOUSE • V2 • ' },
      { key: 'radius', label: 'Radius', type: 'range', min: 20, max: 100, defaultValue: 60, unit: 'px' },
      { key: 'spread', label: 'Auto-Fit (Spread)', type: 'toggle', defaultValue: true, description: 'Evenly distributes text along the circle.' },
      { key: 'speed', label: 'Speed', type: 'range', min: -5, max: 5, step: 0.1, defaultValue: 0.5, unit: 'deg/f' },
      { key: 'fontSize', label: 'Font Size', type: 'range', min: 8, max: 32, defaultValue: 12, unit: 'px' },
      { key: 'color', label: 'Color', type: 'color', defaultValue: '#000000' }
    ],
    setup: (app, config) => {
      app.use(Dot({ size: 6, color: () => config.color }));
      app.use(TextRing({
        text: () => config.text,
        radius: () => config.radius,
        fontSize: () => config.fontSize,
        speed: () => config.speed,
        color: () => config.color,
        spread: config.spread // Static option
      }));
    }
  },
  {
    id: 'magnetic-button',
    name: 'Magnetic Force',
    description: 'Attracts the cursor to interactive elements using the Magnetic plugin.',
    icon: '🧲',
    schema: [
      { key: 'attraction', label: 'Attraction', type: 'range', min: 0.1, max: 1, step: 0.1, defaultValue: 0.4, description: 'How strongly it sticks (0-1)' },
      { key: 'distance', label: 'Range', type: 'range', min: 50, max: 200, step: 10, defaultValue: 120, unit: 'px', description: 'Capture radius' }
    ],
    setup: (app, config) => {
      app.use(Magnetic({
        attraction: () => config.attraction,
        distance: () => config.distance
      }));
      app.use(Dot({ size: 8, color: '#000' }));
      app.use(Ring({ size: 30, color: '#000', enableStick: false }));
      
      setTimeout(() => {
        const btns = document.querySelectorAll('button, [data-hover]');
        btns.forEach(b => b.setAttribute('data-supermouse-magnetic', 'true'));
      }, 50);
    }
  },
  {
    id: 'ghost-trail',
    name: 'Ghost Trail',
    description: 'A high-latency trail effect using transparency.',
    icon: '👻',
    schema: [
        { key: 'size', label: 'Size', type: 'range', min: 10, max: 50, defaultValue: 20, unit: 'px' },
        { key: 'color', label: 'Color', type: 'color', defaultValue: '#6366f1' },
        { key: 'opacity', label: 'Opacity', type: 'range', min: 0.1, max: 1, step: 0.1, defaultValue: 0.5 },
    ],
    setup: (app, config) => {
       app.use(Dot({ size: 4, color: () => config.color }));
       app.use(Ring({
         size: () => config.size,
         color: () => config.color,
         mixBlendMode: 'normal'
       }));
    }
  },
  {
    id: 'sparkles',
    name: 'Fairy Dust',
    description: 'Emits particles while moving. Magical.',
    icon: '✨',
    schema: [
      { key: 'color', label: 'Sparkle Color', type: 'color', defaultValue: '#fbbf24' },
      { key: 'velocity', label: 'Min Speed', type: 'range', min: 0, max: 50, defaultValue: 10, unit: 'px/f', description: 'Speed required to spawn' }
    ],
    setup: (app, config) => {
      app.use(Dot({ size: 8, color: () => config.color }));
      app.use(Sparkles({
        color: () => config.color,
        minVelocity: config.velocity // Static option
      }));
    }
  },
  {
    id: 'text-cursor',
    name: 'Context Label',
    description: 'Displays a label next to the cursor when hovering elements.',
    icon: '💬',
    schema: [
        { key: 'offsetY', label: 'Vertical Offset', type: 'range', min: 10, max: 50, defaultValue: 24, unit: 'px' }
    ],
    setup: (app, config) => {
        app.use(Dot({ size: 8, color: 'black' }));
        app.use(Text({
            offset: [0, config.offsetY], // Static option
            duration: 200
        }));
    }
  }
];
