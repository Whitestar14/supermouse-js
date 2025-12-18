import { Supermouse } from '@supermousejs/core';
import { Dot } from '@supermousejs/dot';
import { Ring } from '@supermousejs/ring';
import { Text } from '@supermousejs/text';
import { Sparkles } from '@supermousejs/sparkles';
import { Magnetic } from '@supermousejs/magnetic';

// 2. Initialize
const mouse = new Supermouse({
  enableTouch: false,
  ignoreOnNative: true, 
  hideCursor: true
});

console.log(mouse.version)
// 3. Register Plugins
mouse
  .use(Magnetic({ force: 0.6 }))
  .use(Dot({ 
    size: 8, 
    color: 'var(--sm-color)'
  }))
  .use(Ring({ 
    size: 20, 
    hoverSize: 45, 
    color: 'var(--sm-color)' 
  }))
  .use(Text({ 
    color: '#111', 
    backgroundColor: '#fff' 
  }))
  .use(Sparkles({
    color: 'var(--sm-color)' 
  }));

// 4. Debug Panel Logic (Throttled)
const debugEl = document.getElementById('debug-panel');
let lastDebugTime = 0;

const updateDebug = (time: number) => {
  if (time - lastDebugTime > 150) {
    if (debugEl) {
      // NOTE: 'client' is now 'pointer' in v2.1
      const { pointer, target, velocity, isHover, isNative, isDown } = mouse.state;
      const vel = Math.abs(velocity.x + velocity.y).toFixed(1);
      
      const html = `
        <div style="color: #888; margin-bottom: 5px; font-weight:bold">CORE STATE</div>
        
        <!-- Show raw mouse vs magnetic target -->
        <div>Raw: <span style="color: #888">${pointer.x.toFixed(0)}, ${pointer.y.toFixed(0)}</span></div>
        <div>Tgt: <span style="color: #0f0">${target.x.toFixed(0)}, ${target.y.toFixed(0)}</span></div>
        
        <div style="margin-top:5px">Vel: ${vel}</div>
        <br>
        <div>Hover: ${isHover ? '✅' : '❌'}</div>
        <div>Click: ${isDown ? '✅' : '❌'}</div>
        <div>Text Mode: ${isNative ? '✅' : '❌'}</div>
      `;
      debugEl.innerHTML = html;
    }
    lastDebugTime = time;
  }
  requestAnimationFrame(updateDebug);
};
requestAnimationFrame(updateDebug);

// 5. Controls & Theme
document.documentElement.style.setProperty('--sm-color', '#750c7e');

let enabled = true;
const toggleBtn = document.getElementById('btn-toggle');
const themeBtn = document.getElementById('btn-theme');
const controlsDiv = document.querySelector('.controls');

// Prevent Supermouse from reacting to the control panel
controlsDiv?.addEventListener('mouseover', (e) => e.stopPropagation());
controlsDiv?.addEventListener('mousedown', (e) => e.stopPropagation());

toggleBtn?.addEventListener('click', () => {
  if (enabled) {
    mouse.disable();
    toggleBtn.innerText = "Enable";
  } else {
    mouse.enable();
    toggleBtn.innerText = "Disable";
  }
  enabled = !enabled;
});

let isNeon = false;
themeBtn?.addEventListener('click', () => {
  if (isNeon) {
    document.documentElement.style.setProperty('--sm-color', '#750c7e');
    document.body.style.backgroundColor = '#111';
    themeBtn.innerText = "Theme: Default";
  } else {
    document.documentElement.style.setProperty('--sm-color', '#00ff00');
    document.body.style.backgroundColor = '#050505';
    themeBtn.innerText = "Theme: Neon";
  }
  isNeon = !isNeon;
});

console.log('Supermouse V2 Playground Ready');