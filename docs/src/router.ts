
import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router';
import Landing from './pages/Landing.vue';
import Playground from './pages/Playground.vue';
import DocsLayout from './layouts/DocsLayout.vue';

// Dynamic imports for docs pages
const Introduction = () => import('./pages/docs/guide/Introduction.vue');
const Installation = () => import('./pages/docs/guide/Installation.vue');
const Usage = () => import('./pages/docs/guide/Usage.vue');
const Toolchain = () => import('./pages/docs/guide/Toolchain.vue');
const VueIntegration = () => import('./pages/docs/integrations/VueIntegration.vue');
const Architecture = () => import('./pages/docs/advanced/Architecture.vue');
const Authoring = () => import('./pages/docs/advanced/Authoring.vue');
const Contributing = () => import('./pages/docs/advanced/Contributing.vue');
const PluginPage = () => import('./pages/docs/PluginPage.vue');
const ApiReference = () => import('./pages/docs/reference/Api.vue');

const isDev = import.meta.env.DEV;

const routes: RouteRecordRaw[] = [
  { path: '/', component: Landing, name: 'LANDING' },
  { 
    path: '/docs', 
    component: DocsLayout,
    children: [
        { path: '', redirect: '/docs/guide/introduction' },
        { path: 'guide/introduction', component: Introduction, name: 'DOCS_INTRO' },
        { path: 'guide/installation', component: Installation, name: 'DOCS_INSTALL' },
        { path: 'guide/usage', component: Usage, name: 'DOCS_USAGE' },
        { path: 'guide/toolchain', component: Toolchain, name: 'DOCS_TOOLCHAIN' },
        
        { path: 'integrations/vue', component: VueIntegration, name: 'DOCS_INTEGRATION_VUE' },
        // Backwards compatibility for old link if needed, or just 404
        { path: 'adapters/vue', redirect: '/docs/integrations/vue' },

        { path: 'advanced/architecture', component: Architecture, name: 'DOCS_ARCH' },
        { path: 'advanced/authoring', component: Authoring, name: 'DOCS_AUTHORING' },
        { path: 'advanced/contributing', component: Contributing, name: 'DOCS_CONTRIBUTING' },
        { path: 'reference/api', component: ApiReference, name: 'DOCS_API' },
        { path: 'plugins/:id', component: PluginPage, props: true, name: 'DOCS_PLUGIN' }
    ]
  },
];

// Conditionally add Labs route in Dev mode only
if (isDev) {
  routes.push({ 
    path: '/labs', 
    component: Playground, 
    name: 'LABS' 
  });
}

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior(to) {
    if (to.hash) {
      return {
        el: to.hash,
        top: 80
      }
    }
    return { top: 0 }
  },
});
