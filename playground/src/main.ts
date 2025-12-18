import { Supermouse } from '@supermousejs/core';
import { Dot } from '@supermousejs/dot';
import { Ring } from '@supermousejs/ring';
import { Text } from '@supermousejs/text';
import { Sparkles } from '@supermousejs/sparkles';

const mouse = new Supermouse();

mouse
  .use(Dot())
  .use(Ring())
  .use(Text())
  .use(Sparkles());

// Create a test button
const btn = document.createElement('button');
btn.innerText = "HOVER FOR TEXT";
btn.setAttribute('data-cursor-text', 'HELLO V2!'); // Matches Text logic
Object.assign(btn.style, {
  marginTop: '20vh',
  marginLeft: '10vw',
  padding: '20px',
  fontSize: '2rem',
  cursor: 'none'
});
document.body.appendChild(btn);