import { Supermouse } from '@supermousejs/core';
import { Dot } from '@supermousejs/dot';
import { Ring } from '@supermousejs/ring';
import { Text } from '@supermousejs/text';      // <-- New!
import { Sparkles } from '@supermousejs/sparkles'; // <-- New!

const mouse = new Supermouse();

mouse
  .use(Dot())
  .use(Ring())
  .use(Text())
  .use(Sparkles());

// Test Interaction
const btn = document.createElement('button');
btn.innerText = "HOVER FOR SPARKLES & TEXT";
btn.setAttribute('data-cursor-text', 'CLICK ME!'); // <-- Test text plugin
Object.assign(btn.style, {
  marginTop: '200px',
  marginLeft: '200px',
  padding: '20px',
  fontSize: '20px',
  cursor: 'none'
});
document.body.appendChild(btn);

// Test Theme Switch
setTimeout(() => {
  console.log("Switching to Neon Theme...");
  document.documentElement.style.setProperty('--sm-color', '#00ff00');
}, 3000);