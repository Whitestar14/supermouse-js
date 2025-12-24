
import { PLUGINS } from './plugin-data';

const LABS_IDS = ['smart-icon', 'smart-ring', 'sparkles', 'text-ring'];

const standardPlugins = PLUGINS
  .filter(p => !LABS_IDS.includes(p.id))
  .map(p => ({ label: p.name, path: `/docs/plugins/${p.id}` }));

const labPlugins = PLUGINS
  .filter(p => LABS_IDS.includes(p.id))
  .map(p => ({ label: p.name, path: `/docs/plugins/${p.id}` }));

export const DOCS_NAVIGATION = [
  {
    title: 'Guide',
    items: [
      { label: 'Introduction', path: '/docs/guide/introduction' },
      { label: 'Installation', path: '/docs/guide/installation' },
      { label: 'Basic Usage', path: '/docs/guide/usage' },
      { label: 'Cookbook', path: '/docs/guide/cookbook' },
      { label: 'Troubleshooting', path: '/docs/guide/troubleshooting' },
    ]
  },
  {
    title: 'Integrations',
    items: [
      { label: 'Vue.js', path: '/docs/integrations/vue' },
      { label: 'React', path: '/docs/integrations/react' },
    ]
  },
  {
    title: 'Standard Plugins',
    items: standardPlugins
  },
  {
    title: 'Labs',
    items: labPlugins
  },
  {
    title: 'Advanced',
    items: [
      { label: 'Core Concepts', path: '/docs/advanced/architecture' },
      { label: 'Plugin Authoring', path: '/docs/advanced/authoring' },
      { label: 'Contributing', path: '/docs/advanced/contributing' },
      { label: 'API Reference', path: '/docs/reference/api' },
    ]
  }
];
