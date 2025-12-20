import { Supermouse } from '@supermousejs/core';
import { Dot } from '@supermousejs/dot';
import { Ring } from '@supermousejs/ring';
import { Sparkles } from '@supermousejs/sparkles';
import { Text } from '@supermousejs/text';
import { TextRing } from '@supermousejs/text-ring';
import { Magnetic } from '@supermousejs/magnetic';

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

export const RECIPES: PresetRecipe[] = [
  {
    id: 'basic-dot',
    name: 'Precision Dot',
    description: 'The standard verified cursor. Minimalist and fast.',
    icon: '●',
    schema: [
      { key: 'size', label: 'Size', type: 'range', min: 4, max: 40, step: 1, defaultValue: 10, description: 'Diameter in pixels' },
      { key: 'color', label: 'Color', type: 'color', defaultValue: '#000000' },
      { key: 'mixBlendMode', label: 'Blend Mode', type: 'select', options: ['normal', 'difference', 'exclusion'], defaultValue: 'normal' }
    ],
    setup: (app, config) => {
      app.use(Dot({
        size: () => config.size,
        color: () => config.color,
        mixBlendMode: config.mixBlendMode
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
      { key: 'radius', label: 'Radius', type: 'range', min: 20, max: 100, defaultValue: 60 },
      { key: 'spread', label: 'Auto-Fit (Spread)', type: 'toggle', defaultValue: true, description: 'Evenly distributes text along the circle.' },
      { key: 'speed', label: 'Speed', type: 'range', min: -5, max: 5, step: 0.1, defaultValue: 0.5 },
      { key: 'fontSize', label: 'Font Size', type: 'range', min: 8, max: 32, defaultValue: 12 },
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
        spread: config.spread
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
      { key: 'distance', label: 'Range', type: 'range', min: 50, max: 200, step: 10, defaultValue: 120, description: 'Capture radius in px' }
    ],
    setup: (app, config) => {
      app.use(Magnetic({
        attraction: config.attraction,
        distance: config.distance
      }));
      app.use(Dot({ size: 8, color: '#000' }));
      app.use(Ring({ size: 30, color: '#000', enableStick: false }));
      
      // Inject some magnetic data attributes into the playground for testing
      setTimeout(() => {
        const btns = document.querySelectorAll('button, [data-hover]');
        btns.forEach(b => b.setAttribute('data-supermouse-magnetic', 'true'));
      }, 100);
    }
  },
  {
    id: 'ghost-trail',
    name: 'Ghost Trail',
    description: 'A high-latency trail effect using transparency.',
    icon: '👻',
    schema: [
        { key: 'size', label: 'Size', type: 'range', min: 10, max: 50, defaultValue: 20 },
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
      { key: 'velocity', label: 'Min Speed', type: 'range', min: 0, max: 50, defaultValue: 10, description: 'Speed required to spawn' }
    ],
    setup: (app, config) => {
      app.use(Dot({ size: 8, color: () => config.color }));
      app.use(Sparkles({
        color: () => config.color,
        minVelocity: config.velocity
      }));
    }
  },
  {
    id: 'text-cursor',
    name: 'Context Label',
    description: 'Displays a label next to the cursor when hovering elements.',
    icon: '💬',
    schema: [
        { key: 'offsetY', label: 'Vertical Offset', type: 'range', min: 10, max: 50, defaultValue: 24 }
    ],
    setup: (app, config) => {
        app.use(Dot({ size: 8, color: 'black' }));
        app.use(Text({
            offset: [0, config.offsetY],
            duration: 200
        }));
    }
  }
];