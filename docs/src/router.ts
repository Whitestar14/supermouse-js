
import { createRouter, createWebHashHistory } from 'vue-router';
import Landing from './pages/Landing.vue';
import Docs from './pages/Docs.vue';
import Playground from './pages/Playground.vue';

const routes = [
  { path: '/', component: Landing, name: 'LANDING' },
  { path: '/docs', component: Docs, name: 'DOCS' },
  { path: '/playground', component: Playground, name: 'PLAYGROUND' },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth',
        top: 20
      }
    }
    return { top: 0 }
  },
});
