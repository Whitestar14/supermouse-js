import { Supermouse } from '@supermousejs/core';
import { Dot } from '@supermousejs/dot';
import { Ring } from '@supermousejs/ring';

const mouse = new Supermouse({
  smoothness: 0.15, // V1 feel
});

mouse
  .use(Dot({ color: 'white', size: 8 }))
  .use(Ring({ color: 'white', size: 24, hoverSize: 50 }))
  .use({
    name: 'logger',
    install: () => console.log('Plugins loaded!')
  });