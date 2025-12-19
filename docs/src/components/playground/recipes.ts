
import { Supermouse } from '@supermousejs/core';
import { Dot } from '@supermousejs/dot';
import { Ring } from '@supermousejs/ring';
import { Sparkles } from '@supermousejs/sparkles';
import { Text } from '@supermousejs/text';

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
