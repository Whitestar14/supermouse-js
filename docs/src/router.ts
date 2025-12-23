
import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router';
import Landing from './pages/Landing.vue';
import Playground from './pages/Playground.vue';
import DocsLayout from './layouts/DocsLayout.vue';

// Dynamic imports for docs pages
const Introduction = () => import('./pages/docs/guide/Introduction.vue');
const Installation = () => import('./pages/docs/guide/Installation.vue');
const Usage = () => import('./pages/docs/guide/Usage.vue');
const Architecture = () => import('./pages/docs/advanced/Architecture.vue');
const Toolchain = () => import('./pages/docs/guide/Toolchain.vue');
const Authoring = () => import('./pages/docs/advanced/Authoring.vue');
const Contributing = () => import('./pages/docs/advanced/Contributing.vue');
const PluginPage = () => import('./pages/docs/PluginPage.vue');
const ApiReference = () => import('./pages/docs/reference/Api.vue');

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
        
        // Moved to Advanced
        { path: 'advanced/architecture', component: Architecture, name: 'DOCS_ARCH' },
        
        { path: 'advanced/authoring', component: Authoring, name: 'DOCS_AUTHORING' },
        { path: 'advanced/contributing', component: Contributing, name: 'DOCS_CONTRIBUTING' },
        { path: 'reference/api', component: ApiReference, name: 'DOCS_API' },
        { path: 'plugins/:id', component: PluginPage, props: true, name: 'DOCS_PLUGIN' }
    ]
  },
  { path: '/labs', component: Playground, name: 'LABS' },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (to.hash) {
      return {
        el: to.hash,
        top: 80
      }
    }
    return { top: 0 }
  },
});
