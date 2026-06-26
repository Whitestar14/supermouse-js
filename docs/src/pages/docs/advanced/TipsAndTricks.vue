<script setup lang="ts">
import DocsSection from "@/components/docs/DocsSection.vue";
import CodeBlock from "@/components/shared/CodeBlock.vue";
import Callout from "@/components/shared/Callout.vue";
import SectionHeader from "@/components/shared/SectionHeader.vue";
import Text from "@/components/shared/Text.vue";
import ApiLink from "@/components/shared/ApiLink.vue";

// Plugin Architecture & Design
const definePluginCode = `export const MyPlugin = (options) =>
  definePlugin({
    name: 'my-plugin',
    create: (app) => { /* return DOM element */ },
    update: (app, el) => { /* update element */ }
  }, options);`;

const plainObjectCode = `export const MyPlugin = (): SupermousePlugin => {
  let el = null;

  return {
    name: 'my-plugin',
    install(app) { /* setup */ },
    update(app) { /* frame update */ },
    destroy() { /* cleanup */ }
  };
};`;

const priorityLogicCode = `definePlugin({
  name: 'my-logic',
  priority: -10,  // ✅ Logic plugins always negative
  update(app) {
    app.state.target.x += 5;
  }
}, options);`;

const priorityVisualCode = `definePlugin({
  name: 'my-visual',
  priority: 0,  // ✅ Visual plugins non-negative
  update(app, el) {
    const { x, y } = app.state.smooth;
    dom.setTransform(el, x, y);
  }
}, options);`;

// State Management
const stateShapeLogicCode = `// Calculates geometry, writes to state.shape
app.state.shape = {
  width: rect.width + padding,
  height: rect.height + padding,
  borderRadius: parseFloat(style.borderRadius)
};`;

const stateShapeVisualCode = `// Reads geometry, morphs accordingly
if (app.state.shape) {
  el.style.width = \`\${app.state.shape.width}px\`;
  el.style.height = \`\${app.state.shape.height}px\`;
} else {
  el.style.width = '20px';  // fallback circle
}`;

const interactionWrongCode = `// ❌ WRONG - Causes layout thrashing every frame
update(app) {
  const color = app.state.hoverTarget?.getAttribute('data-color');
}`;

const interactionCorrectCode = `// ✅ CORRECT - Pre-cached from mouseover
update(app) {
  const color = app.state.interaction.color;
}`;

const interactionPluginCode = `export const MyPlugin = (options) => {
  return definePlugin({
    install(app) {
      app.registerHoverTarget('[data-supermouse-myplugin]');
    },
    update(app) {
      const val = app.state.interaction.myplugin;
      if (val) {
        // Plugin is active for current hover target
      }
    }
  }, options);
};`;

// Performance Optimization
const thrashingWrongCode = `update(app) {
  const rect = app.state.hoverTarget?.getBoundingClientRect();
  const style = window.getComputedStyle(app.state.hoverTarget!);
}`;

const thrashingCorrectCode = `let cachedRect = null;

update(app) {
  if (app.state.hoverTarget && app.state.hoverTarget !== lastTarget) {
    lastTarget = app.state.hoverTarget;
    cachedRect = dom.projectRect(app.state.hoverTarget, app.container);
  }
  if (cachedRect) {
    // Use cached values
  }
}`;

const frameRateWrongCode = "current += (target - current) * 0.1;";

const frameRateCorrectCode = `import { math } from '@supermousejs/utils';

const damping = 10;
current = math.damp(current, target, damping, deltaTime);`;

const allocationWrongCode = `update(app) {
  const delta = { x: target.x - current.x, y: target.y - current.y };
}`;

const allocationCorrectCode = `update(app) {
  const dx = target.x - current.x;
  const dy = target.y - current.y;
  const dist = math.dist(current.x, current.y, target.x, target.y);
}`;

const styleWriteCode = `import { dom } from '@supermousejs/utils';

// Only writes to DOM if value actually changed
dom.setStyle(el, 'width', \`\${size}px\`);
dom.setStyle(el, 'borderColor', color);

// Bulk initialization in install() or create()
dom.applyStyles(el, {
  position: 'fixed',
  pointerEvents: 'none',
  zIndex: Layers.CURSOR
});`;

const transformCode = `// ❌ WRONG - CPU bound
el.style.left = x + 'px';
el.style.top = y + 'px';

// ✅ CORRECT - GPU bound
dom.setTransform(el, x, y); // translate3d + centered automatically`;

// Plugin Composition
const compositionCode = `const app = new Supermouse();

// Order matters!
app.use(Stick({ padding: 15 }));      // Logic: calcs geometry, writes state.shape
app.use(Magnetic({ distance: 100 })); // Logic: adds attraction
app.use(Ring({ size: 30, color: '#fff' }));   // Visual: reads state.shape, morphs
app.use(Dot({ size: 8, color: '#000' }));     // Visual: renders inner dot
app.use(Trail({ length: 12 }));               // Visual: renders trail`;

const conditionalPluginCode = `const app = new Supermouse();
const magneticPlugin = Magnetic({ distance: 100 });

app.use(magneticPlugin);

// Later, disable on certain pages
document.addEventListener('navigate', (e) => {
  if (e.newPage === 'admin') {
    app.disablePlugin('magnetic');
  } else {
    app.enablePlugin('magnetic');
  }
});`;

const enableDisableCode = `definePlugin({
  name: 'my-visual',
  onEnable(app, el) {
    el.style.opacity = '1';
  },
  onDisable(app, el) {
    // Fade out instead of instantly hide
    el.style.transition = 'opacity 0.2s';
    el.style.opacity = '0';
  }
}, options);`;

// Configuration
const normalizeCode = `import { normalize } from '@supermousejs/utils';

export const MyPlugin = (options) => {
  // Normalize accepts: number, string, () => value, or reactive getter
  const getSize = normalize(options.size, 20);      // default 20
  const getColor = normalize(options.color, '#fff'); // default #fff

  return definePlugin({
    update(app) {
      const size = getSize(app.state);    // Call to evaluate
      const color = getColor(app.state);
    }
  }, options);
};`;

const normalizeUsageCode = `MyPlugin({ size: 30 });                        // static
MyPlugin({ size: () => Math.random() * 50 }); // dynamic
MyPlugin({ size: (state) => state.velocity.x }); // reactive`;

const staticOptionsCode = `export interface MyPluginOptions {
  name?: string;
  isEnabled?: boolean;
  /** Size in pixels. Set at construction, not reactive. */
  size?: number;
  /** Color can be a function for dynamic values. */
  color?: ValueOrGetter<string>;
}

export const MyPlugin = (options) => {
  let userSize = options.size ?? 20;

  return definePlugin({
    update(app) {
      // Always read userSize, allow external changes
      const size = userSize;
    }
  }, options);
};`;

// Common Patterns
const rotationCode = `import { math } from '@supermousejs/utils';

let currentRotation = 0;

update(app, el) {
  const targetRotation = app.state.angle;

  // Smooth rotation to prevent jitter
  const smoothing = 0.15;
  currentRotation = math.lerpAngle(currentRotation, targetRotation, smoothing);

  dom.setTransform(el, x, y, currentRotation);
}`;

const timeoutCode = `let stopTime = performance.now();
let isMoving = false;

update(app) {
  const speed = math.dist(app.state.velocity.x, app.state.velocity.y);

  if (speed > 1) {
    isMoving = true;
    stopTime = performance.now();
  } else {
    const stopDuration = performance.now() - stopTime;
    if (stopDuration > 500) {  // After 500ms idle
      isMoving = false;
      // Reset visuals
    }
  }
}`;

const centeredElementCode = `const create = (app) => {
  const el = document.createElement('div');
  el.style.position = 'fixed';
  el.style.pointerEvents = 'none';
  app.container.appendChild(el);
  return el;
};

const update = (app, el) => {
  const { x, y } = app.state.smooth;
  // setTransform automatically centers with translate(-50%, -50%)
  dom.setTransform(el, x, y);
};`;

// Debugging
const tearingFixCode = `// ❌ WRONG - Priority causes visual sync mismatch
priority: 0,
update(app) { app.state.target.x += 5; }

// ✅ CORRECT - Modifies target before physics or visuals run
priority: -10,
update(app) { app.state.target.x += 5; }`;

const thrashingFixCode = `// ❌ WRONG - Queries DOM rect every single frame
update(app) {
  const rect = el.getBoundingClientRect();
}

// ✅ CORRECT - Scrapes targeting class once, caches calculations
let cachedRect = null;
install(app) {
  app.registerHoverTarget('[data-my-attr]');
}
update(app) {
  if (app.state.hoverTarget !== lastTarget) {
    lastTarget = app.state.hoverTarget;
    cachedRect = dom.projectRect(lastTarget, app.container);
  }
}`;

const doctorCode = `import { doctor } from '@supermousejs/utils';

// Run in browser console
doctor();`;

// Advanced Patterns
const multiInstanceCode = `// ❌ WRONG - Creates new HTML element per plugin
app.use(Dot({ color: 'red' }));
app.use(Dot({ color: 'blue' })); // Wasteful, no deduplication`;

const statefulEnableCode = `definePlugin({
  name: 'my-plugin',

  onEnable(app, el) {
    // Reset to initial state
    el.style.opacity = '1';
    el.style.transform = '';
    currentPos.x = 0;
    currentPos.y = 0;
  },

  onDisable(app, el) {
    // Clean visual exit (fade, reset)
    el.style.transition = 'opacity 0.3s ease';
    el.style.opacity = '0';
  }
}, options);`;

const responsiveCode = `const getSize = normalize(options.size, 20);

return definePlugin({
  create: (app) => {
    const el = dom.createCircle(20, 'white');

    // Resize on window change
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      el.style.width = isMobile ? '12px' : '20px';
    };

    window.addEventListener('resize', handleResize);
    return el;
  },
  destroy() {
    window.removeEventListener('resize', handleResize);
  }
}, options);`;

// Publishing
const metaJsonCode = `{
  "name": "my-plugin",
  "description": "Short description of what it does",
  "author": "Your Name",
  "repository": "https://github.com/yourname/supermouse-plugin-xyz",
  "npm": "supermouse-plugin-xyz"
}`;

const magneticCode = `import { Supermouse } from '@supermousejs/core';
import { Magnetic } from '@supermousejs/magnetic';

const app = new Supermouse({ hideCursor: true });

app.use(
  Magnetic({
    strength: 0.2,
    radius: 160,
    easing: 'ease-out',
  })
);
`;

const trailCode = `import { Supermouse } from '@supermousejs/core';
import { Trail } from '@supermousejs/trail';

const app = new Supermouse({ hideCursor: true });

app.use(
  Trail({
    length: 12,
    color: '#eab308',
    width: 8,
    decay: 0.25,
  })
);
`;
</script>

<template>
  <DocsSection label="Advanced" title="Tips & Tricks">
    <!-- Intro -->
    <Callout title="Design Philosophy Tip" class="mb-12">
      Supermouse is built on a modular design. To build amazing cursor experiences, stack multiple
      simple plugins together rather than compiling heavy multi-purpose layers. Keep UI transitions
      instantaneous and physics smooth to create high-precision, premium interfaces.
    </Callout>

    <!-- PLUGIN ARCHITECTURE & DESIGN -->
    <section class="mb-16">
      <SectionHeader :level="2"> Plugin Architecture & Design </SectionHeader>

      <div class="mb-8">
        <SectionHeader :level="3"> Choose the Right Plugin Template </SectionHeader>
        <Text size="sm">
          <strong
            >Use <ApiLink to="defineplugin"><code>definePlugin</code></ApiLink> helper</strong
          >
          for standard visual widgets (like circles, icons, or rings) that represent single DOM
          entities. It manages configuration watches, mounts, style synchronization, and cleanups
          for you.
        </Text>
        <CodeBlock lang="typescript" :code="definePluginCode" :clean="true" />

        <Text size="sm" class="mt-6">
          <strong>Use plain objects</strong> for raw performance hooks, plugins with multiple DOM
          elements, custom canvas contexts, dynamic routing bounds, or logic-only scripts.
        </Text>
        <CodeBlock lang="typescript" :code="plainObjectCode" :clean="true" />
      </div>

      <div class="mb-8">
        <SectionHeader :level="3"> Priority Execution Order </SectionHeader>
        <Text size="sm">
          <strong>Logic plugins must use negative priority</strong> (e.g. <code>-10</code>). These
          write to <ApiLink to="target"><code>state.target</code></ApiLink> (directing where the
          cursor should go) and must run before physics calculations. Using positive or zero
          priority for positioning updates causes frame lag ("tearing") as rendering occurs before
          targets stabilize.
        </Text>
        <CodeBlock lang="typescript" :code="priorityLogicCode" :clean="true" />

        <Text size="sm" class="mt-6">
          <strong>Visual plugins use zero or positive priority.</strong> These hooks run after logic
          and physics steps to read the interpolated
          <ApiLink to="smooth"><code>state.smooth</code></ApiLink> coordinates and update styling.
        </Text>
        <CodeBlock lang="typescript" :code="priorityVisualCode" :clean="true" />
      </div>
    </section>

    <!-- STATE MANAGEMENT & INTER-PLUGIN COMMUNICATION -->
    <section class="mb-16">
      <SectionHeader :level="2"> State Management & Inter-Plugin Communication </SectionHeader>

      <div class="mb-8">
        <SectionHeader :level="3">
          Share Geometry via <ApiLink to="shape"><code>state.shape</code></ApiLink>
        </SectionHeader>
        <Text size="sm">
          Avoid redundant DOM rect measurements. Storing bounds in the shared
          <ApiLink to="shape"><code>state.shape</code></ApiLink> container allows logic layers (like
          Stick) to communicate sizes to rendering layers (like Ring) without directly coupling
          their classes.
        </Text>
        <Text size="sm" weight="medium"> Logic Plugin (Stick): </Text>
        <CodeBlock lang="typescript" :code="stateShapeLogicCode" :clean="true" />

        <Text size="sm" weight="medium" class="mt-4"> Visual Plugin (Ring): </Text>
        <CodeBlock lang="typescript" :code="stateShapeVisualCode" :clean="true" />
      </div>

      <div class="mb-8">
        <SectionHeader :level="3">
          Use <ApiLink to="state.interaction"><code>state.interaction</code></ApiLink> instead of
          DOM Reads
        </SectionHeader>
        <Text size="sm">
          Do not query DOM nodes inside the hot update loop. The input system scrapes attributes
          from active hovered elements and registers them inside the O(1)
          <ApiLink to="state.interaction"><code>state.interaction</code></ApiLink> store, avoiding
          heavy reflow calculations.
        </Text>
        <CodeBlock lang="typescript" :code="interactionWrongCode" :clean="true" />

        <CodeBlock lang="typescript" :code="interactionCorrectCode" :clean="true" />

        <Text size="sm" class="mt-6">
          Define interactive targets in HTML and read them reactively:
        </Text>
        <CodeBlock lang="typescript" :code="interactionPluginCode" :clean="true" />
      </div>
    </section>

    <!-- PERFORMANCE OPTIMIZATION -->
    <section class="mb-16">
      <SectionHeader :level="2"> Performance Optimization </SectionHeader>

      <div class="mb-8">
        <SectionHeader :level="3"> 1. Adhere to the DOM Firewall </SectionHeader>
        <Text size="sm">
          Calling properties like <code>getBoundingClientRect()</code> inside high-frequency frames
          triggers layout thrashing. Perform measurements inside event listener updates or cache
          them on hover target changes.
        </Text>
        <CodeBlock lang="typescript" :code="thrashingWrongCode" :clean="true" />
        <Text size="sm" weight="medium" class="mt-4">
          ✅ Correct - Cache calculations on target shift:
        </Text>
        <CodeBlock lang="typescript" :code="thrashingCorrectCode" :clean="true" />
      </div>

      <div class="mb-8">
        <SectionHeader :level="3"> 2. Frame-Rate Independent Damping </SectionHeader>
        <Text size="sm">
          Ensure velocities and spring timings account for high-refresh screens (e.g. 144Hz). Always
          use the frame delta time (<code>dt</code>) argument or the
          <ApiLink to="damp"><code>math.damp</code></ApiLink> helper.
        </Text>
        <CodeBlock lang="typescript" :code="frameRateWrongCode" :clean="true" />
        <Text size="sm" weight="medium" class="mt-4"> ✅ Correct - Use the damping utility: </Text>
        <CodeBlock lang="typescript" :code="frameRateCorrectCode" :clean="true" />
      </div>

      <div class="mb-8">
        <SectionHeader :level="3"> 3. Allocation Discipline </SectionHeader>
        <Text size="sm">
          Creating objects (`{ x, y }`) inside the render loop triggers garbage collection pauses.
          Reuse persistent local objects or compute indices inline.
        </Text>
        <CodeBlock lang="typescript" :code="allocationWrongCode" :clean="true" />
        <Text size="sm" weight="medium" class="mt-4">
          ✅ Correct - Inline values or use scalar maths:
        </Text>
        <CodeBlock lang="typescript" :code="allocationCorrectCode" :clean="true" />
      </div>

      <div class="mb-8">
        <SectionHeader :level="3"> 4. Smart Styling Writes </SectionHeader>
        <Text size="sm">
          Use the <ApiLink to="setstyle"><code>dom.setStyle</code></ApiLink> helper to skip styling
          writes unless the property value changes. For bulk initialization inside create/install
          hooks, use <ApiLink to="applystyles"><code>dom.applyStyles</code></ApiLink
          >.
        </Text>
        <CodeBlock lang="typescript" :code="styleWriteCode" :clean="true" />
      </div>

      <div class="mb-8">
        <SectionHeader :level="3"> 5. Prefer CSS GPU Transforms </SectionHeader>
        <Text size="sm">
          Never mutate CPU-bound properties like `top/left` inside updates. Use
          <ApiLink to="settransform"><code>dom.setTransform</code></ApiLink> to center elements via
          translate3d, offloading rendering to the GPU.
        </Text>
        <CodeBlock lang="typescript" :code="transformCode" :clean="true" />
      </div>
    </section>

    <!-- PLUGIN COMPOSITION PATTERNS -->
    <section class="mb-16">
      <SectionHeader :level="2"> Plugin Composition Patterns </SectionHeader>

      <div class="mb-8">
        <SectionHeader :level="3"> Stacking Compositions </SectionHeader>
        <Text size="sm">
          Layer multiple single-purpose plugins to construct compound cursors. Differentiating
          priority ensures logic (Stick) feeds coordinates into rendering layers (Ring) correctly.
        </Text>
        <CodeBlock lang="typescript" :code="compositionCode" :clean="true" />
      </div>

      <div class="mb-8">
        <SectionHeader :level="3"> Runtime Dynamic Control </SectionHeader>
        <Text size="sm">
          Call <ApiLink to="disableplugin"><code>disablePlugin()</code></ApiLink> or
          <ApiLink to="enableplugin"><code>enablePlugin()</code></ApiLink> to toggle specific layers
          on routes or configurations.
        </Text>
        <CodeBlock lang="typescript" :code="conditionalPluginCode" :clean="true" />

        <Text size="sm" class="mt-6"> Always write clean visual exits in lifecycle hooks: </Text>
        <CodeBlock lang="typescript" :code="enableDisableCode" :clean="true" />
      </div>
    </section>

    <!-- CONFIGURATION BEST PRACTICES -->
    <section class="mb-16">
      <SectionHeader :level="2"> Configuration Best Practices </SectionHeader>

      <div class="mb-8">
        <SectionHeader :level="3"> Handle Diverse Option Values </SectionHeader>
        <Text size="sm">
          Users might pass static numbers, raw strings, or dynamic getters. The
          <ApiLink to="normalize"><code>normalize()</code></ApiLink> utility compiles any option
          shape into a clean getter.
        </Text>
        <CodeBlock lang="typescript" :code="normalizeCode" :clean="true" />

        <Text size="sm" class="mt-6"> Standard configurations: </Text>
        <CodeBlock lang="typescript" :code="normalizeUsageCode" :clean="true" />
      </div>

      <div class="mb-8">
        <SectionHeader :level="3"> Document Static Restrictions </SectionHeader>
        <Text size="sm">
          Remember that options passed inside constructor calls are static. If users need to adjust
          size or color dynamically, register methods or expose dynamic getter callbacks in the
          options.
        </Text>
        <CodeBlock lang="typescript" :code="staticOptionsCode" :clean="true" />
      </div>
    </section>

    <!-- COMMON PLUGIN PATTERNS -->
    <section class="mb-16">
      <SectionHeader :level="2"> Common Plugin Patterns </SectionHeader>

      <div class="mb-8">
        <SectionHeader :level="3"> Rotation Syncing </SectionHeader>
        <Text size="sm">
          Rotate elements in visual hooks based on cursor travel direction using
          <ApiLink to="lerpangle"><code>math.lerpAngle</code></ApiLink
          >.
        </Text>
        <CodeBlock lang="typescript" :code="rotationCode" :clean="true" />
      </div>

      <div class="mb-8">
        <SectionHeader :level="3"> Sleep Timeouts </SectionHeader>
        <Text size="sm">
          Reset elements to default idle configurations when pointer velocities approach zero using
          performance timestamps.
        </Text>
        <CodeBlock lang="typescript" :code="timeoutCode" :clean="true" />
      </div>

      <div class="mb-8">
        <SectionHeader :level="3"> Precise Element Centering </SectionHeader>
        <Text size="sm">
          Align custom visuals directly on the active cursor using
          <ApiLink to="settransform"><code>dom.setTransform</code></ApiLink
          >.
        </Text>
        <CodeBlock lang="typescript" :code="centeredElementCode" :clean="true" />
      </div>
    </section>

    <!-- DEBUGGING & TROUBLESHOOTING -->
    <section class="mb-16">
      <h2 class="text-2xl font-bold mb-6 text-zinc-900 border-b border-zinc-200 pb-2">
        Debugging & Troubleshooting
      </h2>

      <div class="mb-8">
        <SectionHeader :level="3"> Visual Tearing / Lag </SectionHeader>
        <Text size="sm">
          <strong>Symptom:</strong> The cursor inner dot tracks perfectly, but outer follower layers
          jitter or drift.
        </Text>
        <Text size="sm" class="mt-4">
          <strong>Fix:</strong> Ensure logic-modifying plugins (e.g. Magnetics, Snappers) use a
          negative priority value so they run before visual layers read coordinates.
        </Text>
        <CodeBlock lang="typescript" :code="tearingFixCode" :clean="true" />
      </div>

      <div class="mb-8">
        <SectionHeader :level="3"> Layout Stutters </SectionHeader>
        <Text size="sm">
          <strong>Symptom:</strong> Scrolling or rendering skips frames on hover shifts.
        </Text>
        <Text size="sm" class="mt-4">
          <strong>Fix:</strong> Stop reading sizes inside frame callbacks. Use
          <ApiLink to="registerhovertarget"><code>app.registerHoverTarget()</code></ApiLink> and
          cache client boundaries only when the hover target changes.
        </Text>
        <CodeBlock lang="typescript" :code="thrashingFixCode" :clean="true" />
      </div>

      <div class="mb-8">
        <SectionHeader :level="3"> Audit Configuration </SectionHeader>
        <Text size="sm"> Run the built-in diagnostic test inside the developer console: </Text>
        <CodeBlock lang="typescript" :code="doctorCode" :clean="true" />
      </div>
    </section>

    <!-- ADVANCED PATTERNS -->
    <section class="mb-16">
      <SectionHeader :level="2"> Advanced Patterns </SectionHeader>

      <div class="mb-8">
        <SectionHeader :level="3"> Deduplicate Core Instantiations </SectionHeader>
        <Text size="sm">
          Avoid mounting multiple identical visual plugins. Let one coordinator manage multiple
          variants to keep DOM trees light.
        </Text>
        <CodeBlock lang="typescript" :code="multiInstanceCode" :clean="true" />
      </div>

      <div class="mb-8">
        <SectionHeader :level="3"> Stateful Toggling </SectionHeader>
        <Text size="sm">
          Implement state cleanups in `onEnable` and `onDisable` hooks to prevent garbage
          coordinates carrying over on toggle events.
        </Text>
        <CodeBlock lang="typescript" :code="statefulEnableCode" :clean="true" />
      </div>

      <div class="mb-8">
        <SectionHeader :level="3"> Responsive Damping shifts </SectionHeader>
        <Text size="sm">
          Scale cursor footprint sizes or turn off visual tracking altogether on narrow viewports to
          avoid blocking click actions.
        </Text>
        <CodeBlock lang="typescript" :code="responsiveCode" :clean="true" />
      </div>
    </section>

    <!-- PUBLISHING & COMMUNITY -->
    <section class="mb-16">
      <SectionHeader :level="2"> Publishing & Community </SectionHeader>

      <div class="mb-8">
        <SectionHeader :level="3"> Naming Convention </SectionHeader>
        <Text size="sm">
          Keep scope clear: name scopes as <code>supermouse-plugin-xyz</code> or
          <code>@scope/supermouse-xyz</code>. Organise namespace organization under
          <code>@supermousejs/*</code> organization naming.
        </Text>
      </div>

      <div class="mb-8">
        <SectionHeader :level="3"> Package Meta definition </SectionHeader>
        <Text size="sm"> Define a <code>meta.json</code> package wrapper configuration: </Text>
        <CodeBlock lang="json" :code="metaJsonCode" :clean="true" />
      </div>
    </section>

    <!-- PERFORMANCE CHECKLIST -->
    <section class="mb-16">
      <SectionHeader :level="2"> Performance Checklist </SectionHeader>
      <div class="border border-zinc-200 bg-white p-6 rounded-sm">
        <ul class="text-sm text-zinc-600 space-y-2 font-mono">
          <li>
            <input type="checkbox" class="mr-2" checked disabled /> Logic plugins run on negative
            priority (<code>-10</code> or lower)
          </li>
          <li>
            <input type="checkbox" class="mr-2" checked disabled /> No direct DOM layout queries
            inside the update loop
          </li>
          <li>
            <input type="checkbox" class="mr-2" checked disabled /> Style updates go through
            <ApiLink to="setstyle"><code>dom.setStyle</code></ApiLink>
          </li>
          <li>
            <input type="checkbox" class="mr-2" checked disabled /> Render alignment uses GPU
            transform translation vectors
          </li>
          <li>
            <input type="checkbox" class="mr-2" checked disabled /> Movements are multiplied against
            delta timers or damp coefficients
          </li>
          <li>
            <input type="checkbox" class="mr-2" checked disabled /> No object array instantiations
            inside frame updates
          </li>
          <li>
            <input type="checkbox" class="mr-2" checked disabled /> Targets boundaries calculations
            are cached on target changes
          </li>
          <li>
            <input type="checkbox" class="mr-2" checked disabled /> Interaction reads fetch from
            pre-scraped
            <ApiLink to="state.interaction"><code>state.interaction</code></ApiLink> caches
          </li>
          <li>
            <input type="checkbox" class="mr-2" checked disabled /> Elements fade out smoothly when
            deactivated
          </li>
          <li>
            <input type="checkbox" class="mr-2" checked disabled /> Plugins use factory scopes to
            prevent memory leaks
          </li>
        </ul>
      </div>
    </section>

    <!-- QUICK REFERENCE -->
    <section class="mb-16">
      <SectionHeader :level="2"> Quick Reference: Common Compositions </SectionHeader>

      <div class="grid gap-12 lg:grid-cols-2">
        <div class="border border-zinc-200 bg-white p-6 rounded-sm">
          <h3 class="font-mono text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">
            Magnetic Snap Combos
          </h3>
          <p class="text-sm text-zinc-600 leading-relaxed mb-4">
            Combine Magnetic snappers with circular visual elements to pull attention to clickable
            targets cleanly.
          </p>
          <CodeBlock lang="typescript" :code="magneticCode" :clean="true" />
        </div>

        <div class="border border-zinc-200 bg-white p-6 rounded-sm">
          <h3 class="font-mono text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">
            Momentum Trails
          </h3>
          <p class="text-sm text-zinc-600 leading-relaxed mb-4">
            Pair Trail plugins with physics damping variables to create organic movements that draw
            visual interest.
          </p>
          <CodeBlock lang="typescript" :code="trailCode" :clean="true" />
        </div>
      </div>
    </section>
  </DocsSection>
</template>
