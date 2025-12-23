
import { PluginMeta } from './types';
import { ICONS } from './icons.ts';

export const PLUGINS: PluginMeta[] = [
  {
    id: 'dot',
    name: 'Dot',
    description: 'A minimalist precision point that follows your movements perfectly.',
    icon: ICONS.dot,
    code: `app.use(Dot({ size: 8, color: '#750c7e' }));`
  },
  {
    id: 'ring',
    name: 'Ring',
    description: 'Adds a lagging outer ring. Simple and performant.',
    icon: ICONS.ring,
    code: `app.use(Ring({ size: 32, color: '#000' }));`
  },
  {
    id: 'trail',
    name: 'Trail',
    description: 'Generates procedural particles that trail behind your motion.',
    icon: ICONS.trail,
    code: `app.use(Trail({ length: 12, color: '#f0f' }));`
  },
  {
    id: 'image',
    name: 'Image',
    description: 'Displays a custom image or thumbnail as the cursor hover state.',
    icon: ICONS.image,
    code: `app.use(Image({ rounded: true }));`
  },
  {
    id: 'text',
    name: 'Text',
    description: 'Injects contextual text bubbles near the cursor on interaction.',
    icon: ICONS.text,
    code: `app.use(Text({ font: 'Mono' }));`
  },
  {
    id: 'labs',
    name: 'SmartIcon (Labs)',
    description: 'Advanced state machine that morphs SVGs based on semantic context.',
    icon: ICONS.labs,
    code: `app.use(SmartIcon({ icons: { ... } }));`
  }
];
