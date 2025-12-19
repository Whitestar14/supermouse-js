
import { PluginMeta } from './types';

export const PLUGINS: PluginMeta[] = [
  {
    id: 'dot',
    name: 'Dot',
    description: 'A minimalist precision point that follows your movements perfectly.',
    icon: '●',
    code: `app.use(Dot({ size: 8, color: '#750c7e' }));`
  },
  {
    id: 'ring',
    name: 'Ring',
    description: 'Adds a lagging outer ring that skews and expands based on velocity.',
    icon: '○',
    code: `app.use(Ring({ size: 32, enableSkew: true }));`
  },
  {
    id: 'sparkles',
    name: 'Sparkles',
    description: 'Generates procedural particles that trail behind your motion.',
    icon: '✨',
    code: `app.use(Sparkles({ count: 12, decay: 0.9 }));`
  },
  {
    id: 'image',
    name: 'Image',
    description: 'Displays a custom image or thumbnail as the cursor hover state.',
    icon: '🖼️',
    code: `app.use(Image({ rounded: true }));`
  },
  {
    id: 'text',
    name: 'Text',
    description: 'Injects contextual text bubbles near the cursor on interaction.',
    icon: '💬',
    code: `app.use(Text({ font: 'Mono' }));`
  }
];
