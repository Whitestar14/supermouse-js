<script setup lang="ts">
import DocsSection from "@/components/docs/DocsSection.vue";
import CodeBlock from "@/components/CodeBlock.vue";
import Callout from "@/components/ui/Callout.vue";
import SectionHeader from "@/components/ui/SectionHeader.vue";
import Text from "@/components/ui/Text.vue";

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
const tearingFixCode = `// ❌ WRONG
priority: 0,
update(app) { app.state.target.x += 5; }

// ✅ CORRECT
priority: -10,
update(app) { app.state.target.x += 5; }`;

const thrashingFixCode = `// ❌ WRONG
update(app) {
  const rect = el.getBoundingClientRect();
}

// ✅ CORRECT
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
  <DocsSection
    label="Advanced"
    title="Tips & Tricks"
  >
    <!-- Intro -->
    <Callout
      title="Pro Tip"
      class="mb-12"
    >
      Supermouse is designed to be composable. Use small plugins together to build surprising cursor
      experiences without sacrificing performance. These tips will help you build efficient,
      maintainable plugins and avoid common pitfalls.
    </Callout>

    <!-- PLUGIN ARCHITECTURE & DESIGN -->
    <section class="mb-16">
      <SectionHeader :level="2">
        Plugin Architecture & Design
      </SectionHeader>

      <div class="mb-8">
        <SectionHeader :level="3">
          Choose the Right Plugin Type
        </SectionHeader>
        <Text size="sm">
          <strong>Use <code>definePlugin</code> helper</strong> for packaged/published plugins:
          cleaner syntax, less boilerplate, handles lifecycle automatically, type-safe element
          binding, and good for visual plugins with a single primary element.
        </Text>
        <CodeBlock
          lang="typescript"
          :code="definePluginCode"
          :clean="true"
        />

        <Text
          size="sm"
          class="mt-6"
        >
          <strong>Use plain objects</strong> for quick experiments, complex multi-element layouts,
          conditional rendering, logic-only plugins, learning, or when you need maximum control over
          lifecycle.
        </Text>
        <CodeBlock
          lang="typescript"
          :code="plainObjectCode"
          :clean="true"
        />
      </div>

      <div class="mb-8">
        <SectionHeader :level="3">
          Priority is Non-Negotiable
        </SectionHeader>
        <Text size="sm">
          <strong>Logic plugins must use negative priority</strong> (<code>-10</code> or lower).
          These modify <code>state.target</code> (where the cursor should go) and must run
          <em>before</em> physics interpolation. Running at default priority (<code>0</code>) causes
          "tearing" where some visuals render old position while others render new position.
        </Text>
        <CodeBlock
          lang="typescript"
          :code="priorityLogicCode"
          :clean="true"
        />

        <Text
          size="sm"
          class="mt-6"
        >
          <strong>Visual plugins use zero or positive priority.</strong> These read
          <code>state.smooth</code> (interpolated position) or modify visuals and run
          <em>after</em> physics and target modifications.
        </Text>
        <CodeBlock
          lang="typescript"
          :code="priorityVisualCode"
          :clean="true"
        />
      </div>
    </section>

    <!-- STATE MANAGEMENT & INTER-PLUGIN COMMUNICATION -->
    <section class="mb-16">
      <SectionHeader :level="2">
        State Management & Inter-Plugin Communication
      </SectionHeader>

      <div class="mb-8">
        <SectionHeader :level="3">
          Leverage <code>state.shape</code> for Morphing
        </SectionHeader>
        <Text size="sm">
          Don't duplicate geometry calculations. Use <code>state.shape</code> to bridge logic and
          visual plugins. This decouples geometry logic from visuals—swap the visual plugin without
          rewriting logic.
        </Text>
        <Text
          size="sm"
          weight="medium"
        >
          Logic Plugin (Stick):
        </Text>
        <CodeBlock
          lang="typescript"
          :code="stateShapeLogicCode"
          :clean="true"
        />

        <Text
          size="sm"
          weight="medium"
          class="mt-4"
        >
          Visual Plugin (Ring):
        </Text>
        <CodeBlock
          lang="typescript"
          :code="stateShapeVisualCode"
          :clean="true"
        />
      </div>

      <div class="mb-8">
        <SectionHeader :level="3">
          Use <code>state.interaction</code> to React to Attributes
        </SectionHeader>
        <Text size="sm">
          Don't read DOM attributes in <code>update()</code> (causes layout thrashing). The input
          system pre-scrapes data attributes into <code>state.interaction</code>.
        </Text>
        <CodeBlock
          lang="typescript"
          :code="interactionWrongCode"
          :clean="true"
        />

        <CodeBlock
          lang="typescript"
          :code="interactionCorrectCode"
          :clean="true"
        />

        <Text
          size="sm"
          class="mt-6"
        >
          Control behavior through HTML by registering hover targets and reading normalized
          interaction keys:
        </Text>
        <CodeBlock
          lang="typescript"
          :code="interactionPluginCode"
          :clean="true"
        />
      </div>
    </section>

    <!-- PERFORMANCE OPTIMIZATION -->
    <section class="mb-16">
      <SectionHeader :level="2">
        Performance Optimization
      </SectionHeader>

      <div class="mb-8">
        <SectionHeader :level="3">
          1. Avoid Layout Thrashing (The DOM Firewall)
        </SectionHeader>
        <Text size="sm">
          Every <code>getBoundingClientRect()</code>, <code>getComputedStyle()</code>, or
          <code>getAttribute()</code> in the update loop forces the browser to synchronously
          recalculate layout.
        </Text>
        <CodeBlock
          lang="typescript"
          :code="thrashingWrongCode"
          :clean="true"
        />
        <Text
          size="sm"
          weight="medium"
          class="mt-4"
        >
          ✅ Correct - Cache on hover:
        </Text>
        <CodeBlock
          lang="typescript"
          :code="thrashingCorrectCode"
          :clean="true"
        />
      </div>

      <div class="mb-8">
        <SectionHeader :level="3">
          2. Use Frame-Rate Independent Motion
        </SectionHeader>
        <Text size="sm">
          Velocities and timings must account for variable refresh rates (60hz vs 144hz). Motion
          calculated per-frame without delta time moves 2.4x faster on 144hz.
        </Text>
        <CodeBlock
          lang="typescript"
          :code="frameRateWrongCode"
          :clean="true"
        />
        <Text
          size="sm"
          weight="medium"
          class="mt-4"
        >
          ✅ Correct - Use <code>damp</code> helper:
        </Text>
        <CodeBlock
          lang="typescript"
          :code="frameRateCorrectCode"
          :clean="true"
        />
      </div>

      <div class="mb-8">
        <SectionHeader :level="3">
          3. Minimize Allocations
        </SectionHeader>
        <Text size="sm">
          Creating objects or arrays every frame triggers garbage collection pauses.
        </Text>
        <CodeBlock
          lang="typescript"
          :code="allocationWrongCode"
          :clean="true"
        />
        <Text
          size="sm"
          weight="medium"
          class="mt-4"
        >
          ✅ Correct - Reuse or calc inline:
        </Text>
        <CodeBlock
          lang="typescript"
          :code="allocationCorrectCode"
          :clean="true"
        />
      </div>

      <div class="mb-8">
        <SectionHeader :level="3">
          4. Smart Style Writes
        </SectionHeader>
        <Text size="sm">
          The <code>dom.setStyle()</code> utility caches previous values and skips DOM writes if
          unchanged. Use <code>dom.applyStyles()</code> for bulk initialization.
        </Text>
        <CodeBlock
          lang="typescript"
          :code="styleWriteCode"
          :clean="true"
        />
      </div>

      <div class="mb-8">
        <SectionHeader :level="3">
          5. Prefer CSS Transforms Over Position
        </SectionHeader>
        <Text size="sm">
          Transforms are GPU-accelerated. Position properties trigger CPU layout recalculation.
        </Text>
        <CodeBlock
          lang="typescript"
          :code="transformCode"
          :clean="true"
        />
      </div>
    </section>

    <!-- PLUGIN COMPOSITION PATTERNS -->
    <section class="mb-16">
      <SectionHeader :level="2">
        Plugin Composition Patterns
      </SectionHeader>

      <div class="mb-8">
        <SectionHeader :level="3">
          Chaining Multiple Effects
        </SectionHeader>
        <Text size="sm">
          Stack logic and visual plugins to build complex effects. Order matters: logic plugins run
          first (negative priority), then physics, then visual plugins.
        </Text>
        <CodeBlock
          lang="typescript"
          :code="compositionCode"
          :clean="true"
        />
      </div>

      <div class="mb-8">
        <SectionHeader :level="3">
          Conditional Plugins
        </SectionHeader>
        <Text size="sm">
          Enable/disable plugins at runtime based on user actions or page state.
        </Text>
        <CodeBlock
          lang="typescript"
          :code="conditionalPluginCode"
          :clean="true"
        />

        <Text
          size="sm"
          class="mt-6"
        >
          Use <code>onEnable()</code> and <code>onDisable()</code> lifecycle hooks for state reset.
        </Text>
        <CodeBlock
          lang="typescript"
          :code="enableDisableCode"
          :clean="true"
        />
      </div>
    </section>

    <!-- CONFIGURATION BEST PRACTICES -->
    <section class="mb-16">
      <SectionHeader :level="2">
        Configuration Best Practices
      </SectionHeader>

      <div class="mb-8">
        <SectionHeader :level="3">
          Use <code>normalize()</code> for Dynamic Values
        </SectionHeader>
        <Text size="sm">
          Options can be static values, functions, or reactive getters. The
          <code>normalize()</code> helper handles all cases.
        </Text>
        <CodeBlock
          lang="typescript"
          :code="normalizeCode"
          :clean="true"
        />

        <Text
          size="sm"
          class="mt-6"
        >
          Usage examples:
        </Text>
        <CodeBlock
          lang="typescript"
          :code="normalizeUsageCode"
          :clean="true"
        />
      </div>

      <div class="mb-8">
        <SectionHeader :level="3">
          Document Static Options
        </SectionHeader>
        <Text size="sm">
          Options are read at construction time, not reactively. Document this clearly and provide
          methods if users need to change options at runtime.
        </Text>
        <CodeBlock
          lang="typescript"
          :code="staticOptionsCode"
          :clean="true"
        />
      </div>
    </section>

    <!-- COMMON PLUGIN PATTERNS -->
    <section class="mb-16">
      <SectionHeader :level="2">
        Common Plugin Patterns
      </SectionHeader>

      <div class="mb-8">
        <SectionHeader :level="3">
          Rotation Based on Movement
        </SectionHeader>
        <Text size="sm">
          Use <code>app.state.angle</code> to rotate elements based on cursor velocity with smooth
          interpolation.
        </Text>
        <CodeBlock
          lang="typescript"
          :code="rotationCode"
          :clean="true"
        />
      </div>

      <div class="mb-8">
        <SectionHeader :level="3">
          Timeout-Based State Reset
        </SectionHeader>
        <Text size="sm">
          Reset cursor state after inactivity using
          <code>performance.now()</code> for frame-independent timing.
        </Text>
        <CodeBlock
          lang="typescript"
          :code="timeoutCode"
          :clean="true"
        />
      </div>

      <div class="mb-8">
        <SectionHeader :level="3">
          Single-Element to Center-Mounted
        </SectionHeader>
        <Text size="sm">
          Position element centered at cursor location using
          <code>dom.setTransform()</code> which automatically centers with
          <code>translate(-50%, -50%)</code>.
        </Text>
        <CodeBlock
          lang="typescript"
          :code="centeredElementCode"
          :clean="true"
        />
      </div>
    </section>

    <!-- DEBUGGING & TROUBLESHOOTING -->
    <section class="mb-16">
      <h2 class="text-2xl font-bold mb-6 text-zinc-900">
        Debugging & Troubleshooting
      </h2>

      <div class="mb-8">
        <SectionHeader :level="3">
          Visual Jitter or Tearing
        </SectionHeader>
        <Text size="sm">
          <strong>Symptom:</strong> Cursor dot snaps correctly but ring lags one frame behind.
        </Text>
        <Text
          size="sm"
          class="mt-4"
        >
          <strong>Cause:</strong> Logic plugin has positive priority and runs mixed with visual
          plugins.
        </Text>
        <CodeBlock
          lang="typescript"
          :code="tearingFixCode"
          :clean="true"
        />
      </div>

      <div class="mb-8">
        <SectionHeader :level="3">
          Layout Thrashing
        </SectionHeader>
        <Text size="sm">
          <strong>Symptom:</strong> Cursor stutters, especially over interactive elements.
        </Text>
        <Text
          size="sm"
          class="mt-4"
        >
          <strong>Cause:</strong> Reading DOM attributes or layout inside <code>update()</code>.
        </Text>
        <CodeBlock
          lang="typescript"
          :code="thrashingFixCode"
          :clean="true"
        />
      </div>

      <div class="mb-8">
        <SectionHeader :level="3">
          Use the Doctor
        </SectionHeader>
        <Text size="sm">
          Built-in debugging utility identifies common issues:
        </Text>
        <CodeBlock
          lang="typescript"
          :code="doctorCode"
          :clean="true"
        />
      </div>
    </section>

    <!-- ADVANCED PATTERNS -->
    <section class="mb-16">
      <SectionHeader :level="2">
        Advanced Patterns
      </SectionHeader>

      <div class="mb-8">
        <SectionHeader :level="3">
          Multi-Instance Patterns (Avoid)
        </SectionHeader>
        <Text size="sm">
          Don't create multiple instances of the same element unnecessarily. Better approach: use
          <code>state.shape</code> or <code>state.interaction</code> to control variants.
        </Text>
        <CodeBlock
          lang="typescript"
          :code="multiInstanceCode"
          :clean="true"
        />
      </div>

      <div class="mb-8">
        <SectionHeader :level="3">
          Stateful Enable/Disable
        </SectionHeader>
        <Text size="sm">
          Reset state when plugin is toggled. Use lifecycle hooks to ensure clean entry and exit.
        </Text>
        <CodeBlock
          lang="typescript"
          :code="statefulEnableCode"
          :clean="true"
        />
      </div>

      <div class="mb-8">
        <SectionHeader :level="3">
          Responsive Sizing
        </SectionHeader>
        <Text size="sm">
          Use media queries or window resize events to adjust plugin behavior across different
          screen sizes.
        </Text>
        <CodeBlock
          lang="typescript"
          :code="responsiveCode"
          :clean="true"
        />
      </div>
    </section>

    <!-- PUBLISHING & COMMUNITY -->
    <section class="mb-16">
      <SectionHeader :level="2">
        Publishing & Community
      </SectionHeader>

      <div class="mb-8">
        <SectionHeader :level="3">
          Plugin Naming
        </SectionHeader>
        <Text size="sm">
          <strong>Community plugins:</strong>
          <code>supermouse-plugin-xyz</code> or
          <code>@yourscope/supermouse-xyz</code>
          <br>
          <strong>Core plugins:</strong> Reserved for <code>@supermousejs/*</code> org
          <br>
          Be descriptive: <code>supermouse-plugin-glass-morphism</code> not
          <code>cursor-effect</code>
        </Text>
      </div>

      <div class="mb-8">
        <SectionHeader :level="3">
          Plugin Metadata
        </SectionHeader>
        <Text size="sm">
          Include a <code>meta.json</code> for discovery and documentation:
        </Text>
        <CodeBlock
          lang="json"
          :code="metaJsonCode"
          :clean="true"
        />
      </div>

      <div class="mb-8">
        <SectionHeader :level="3">
          Common Pitfalls to Avoid
        </SectionHeader>
        <ul class="text-sm text-zinc-600 space-y-2">
          <li>
            <strong>Singleton state leakage</strong> - Always use factory functions to create new
            instances per app
          </li>
          <li>
            <strong>Changing options at runtime</strong> - Document that options are static at
            construction
          </li>
          <li>
            <strong>Incorrect priority</strong> - Logic must be <code>-10</code>, visuals must be
            <code>&gt;= 0</code>
          </li>
          <li>
            <strong>DOM thrashing</strong> - Always cache layout reads and use
            <code>state.interaction</code>
          </li>
          <li>
            <strong>Allocations in loop</strong> - Reuse or calculate values inline every frame
          </li>
        </ul>
      </div>
    </section>

    <!-- PERFORMANCE CHECKLIST -->
    <section class="mb-16">
      <SectionHeader :level="2">
        Performance Checklist
      </SectionHeader>
      <div class="border border-zinc-200 bg-white p-6 rounded">
        <ul class="text-sm text-zinc-600 space-y-2">
          <li>
            <input
              type="checkbox"
              class="mr-2"
            > Logic plugins have <code>priority: -10</code> or
            lower
          </li>
          <li>
            <input
              type="checkbox"
              class="mr-2"
            > No <code>getBoundingClientRect()</code> or
            <code>getComputedStyle()</code> in update loop
          </li>
          <li>
            <input
              type="checkbox"
              class="mr-2"
            > Use <code>dom.setStyle()</code> instead of direct
            style writes
          </li>
          <li>
            <input
              type="checkbox"
              class="mr-2"
            > Use <code>dom.setTransform()</code> for
            positioning
          </li>
          <li>
            <input
              type="checkbox"
              class="mr-2"
            > Motion uses <code>damp()</code> or
            frame-rate-adjusted <code>lerp()</code>
          </li>
          <li>
            <input
              type="checkbox"
              class="mr-2"
            > No object allocations in update loop
          </li>
          <li>
            <input
              type="checkbox"
              class="mr-2"
            > Hover target geometry cached on target change
          </li>
          <li>
            <input
              type="checkbox"
              class="mr-2"
            > Use <code>state.interaction</code> instead of
            reading DOM attributes
          </li>
          <li>
            <input
              type="checkbox"
              class="mr-2"
            > Visual plugins fade out on disable, don't
            abruptly remove
          </li>
          <li>
            <input
              type="checkbox"
              class="mr-2"
            > Plugin instances are factories to avoid state
            leakage
          </li>
        </ul>
      </div>
    </section>

    <!-- QUICK REFERENCE -->
    <section class="mb-16">
      <SectionHeader :level="2">
        Quick Reference: Common Compositions
      </SectionHeader>

      <div class="grid gap-12 lg:grid-cols-2">
        <div class="border border-zinc-200 bg-white p-6">
          <h3 class="font-mono text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">
            Magnetic Hover Effects
          </h3>
          <p class="text-sm text-zinc-600 leading-relaxed mb-4">
            Combine <code>Magnetic</code> with a visible cursor plugin (Dot, Ring) to create a slick
            interactive hover state. Works great on buttons and cards.
          </p>
          <CodeBlock
            lang="typescript"
            :code="magneticCode"
            :clean="true"
          />
        </div>

        <div class="border border-zinc-200 bg-white p-6">
          <h3 class="font-mono text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">
            Trail + Momentum
          </h3>
          <p class="text-sm text-zinc-600 leading-relaxed mb-4">
            Use <code>Trail</code> to leave a fading motion line behind the cursor. Pair it with
            <code>smoothness</code> to tune how tight the trail feels.
          </p>
          <CodeBlock
            lang="typescript"
            :code="trailCode"
            :clean="true"
          />
        </div>
      </div>
    </section>
  </DocsSection>
</template>
