<script setup lang="ts">
import ApiEntry from "@components/docs/ApiEntry.vue";
import CodeBlock from "@components/shared/CodeBlock.vue";

const interactionCode = `// 1. Define interactive rules at initialization:
const app = new Supermouse({
  rules: {
    '.btn-magnetic': { magnetic: { strength: 0.5 } }
  }
});

// 2. Or define them in HTML directly:
// <button data-supermouse-magnetic data-supermouse-strength="0.8">Hover</button>

// 3. Inside a plugin's update() hook, read from state.interaction:
update(app) {
  const { magnetic, strength } = app.state.interaction;
  if (magnetic) {
    const pull = strength ?? 0.5;
    // Apply pull offset to app.state.target...
  }
}`;

const shapeCode = `// 1. In a logic plugin, write target shape coordinates:
app.state.shape = {
  width: hoveredRect.width,
  height: hoveredRect.height,
  borderRadius: 4
};

// 2. In a visual plugin, read and apply the shape:
const shape = app.state.shape;
if (shape) {
  dom.setStyle(el, 'width', \`\${shape.width}px\`);
  dom.setStyle(el, 'height', \`\${shape.height}px\`);
  dom.setStyle(el, 'borderRadius', \`\${shape.borderRadius}px\`);
}`;
</script>

<template>
  <div id="state" class="mb-20 scroll-mt-32">
    <h3
      class="font-mono text-xs font-bold uppercase tracking-widest text-zinc-900 mb-2 pb-2 border-b border-zinc-200 flex items-center justify-between"
    >
      <span>MouseState</span>
      <span class="text-zinc-400 font-normal">app.state</span>
    </h3>
    <p class="text-sm text-zinc-500 mb-8">
      Mutable state object updated every frame. Logic plugins write to
      <code>target</code>; visual plugins read <code>smooth</code> for rendering.
    </p>

    <ApiEntry id="pointer" name="pointer" type="{ x: number, y: number }">
      <p>Raw coordinates from the latest pointer event before physics smoothing is applied.</p>
      <CodeBlock
        code="const { x, y } = app.state.pointer;"
        lang="typescript"
        :clean="true"
        title="Example"
        class="border border-zinc-200 mt-5"
      />
    </ApiEntry>

    <ApiEntry id="smooth" name="smooth" type="{ x: number, y: number }">
      <p>
        Interpolated coordinates used for rendering. Read this in visual plugins when positioning
        DOM elements.
      </p>
      <CodeBlock
        code="const { x, y } = app.state.smooth;&#10;dom.setTransform(el, x, y);"
        lang="typescript"
        :clean="true"
        title="Example"
        class="border border-zinc-200 mt-5"
      />
    </ApiEntry>

    <ApiEntry id="target" name="target" type="{ x: number, y: number }">
      <p>
        Goal position for the cursor. Logic plugins (e.g. Magnetic) may mutate this before physics
        runs.
      </p>
      <CodeBlock
        code="// Magnetic plugin writes here during update()&#10;app.state.target.x = snappedX;&#10;app.state.target.y = snappedY;"
        lang="typescript"
        :clean="true"
        title="Example"
        class="border border-zinc-200 mt-5"
      />
    </ApiEntry>

    <ApiEntry id="velocity" name="velocity" type="{ x: number, y: number }">
      <p>
        Current movement vector derived from smooth position changes. Useful for squash-and-stretch
        effects.
      </p>
      <CodeBlock
        code="import { effects } from '@supermousejs/utils';&#10;&#10;const { x: vx, y: vy } = app.state.velocity;&#10;const distortion = effects.getVelocityDistortion(vx, vy);"
        lang="typescript"
        :clean="true"
        title="Example"
        class="border border-zinc-200 mt-5"
      />
    </ApiEntry>

    <ApiEntry id="interaction" name="interaction" type="Record<string, any>">
      <p>
        A reactive dictionary containing metadata scraped from the currently hovered element using
        rules or data attributes.
      </p>
      <p>
        To prevent "Layout Thrashing" (violating the DOM Firewall), plugins must NEVER query the DOM
        directly during the high-frequency update loop. Instead, the input layer scrapes this data
        once on pointer hover and populates <code>state.interaction</code> for plugins to read
        safely at 60-240fps.
      </p>
      <p class="mt-2">
        <strong
          >See the
          <router-link
            to="/docs/advanced/authoring#state-interaction"
            class="underline font-bold hover:text-black"
            >Plugin Authoring Guide</router-link
          >
          for a deep-dive on how to use `state.interaction` effectively.</strong
        >
      </p>
      <CodeBlock
        :code="interactionCode"
        lang="typescript"
        :clean="true"
        title="Example"
        class="border border-zinc-200 mt-5"
      />
    </ApiEntry>

    <ApiEntry id="hovertarget" name="hoverTarget" type="HTMLElement | null">
      <p>The DOM node currently driving the hover interaction, if any.</p>
      <CodeBlock
        code="const el = app.state.hoverTarget;&#10;if (el?.matches('.tooltip-trigger')) {&#10;  // show tooltip plugin&#10;}"
        lang="typescript"
        :clean="true"
        title="Example"
        class="border border-zinc-200 mt-5"
      />
    </ApiEntry>

    <ApiEntry id="isdown" name="isDown" type="boolean">
      <p>True while the primary pointer button is pressed.</p>
      <CodeBlock
        code="if (app.state.isDown) {&#10;  scale = 0.9;&#10;}"
        lang="typescript"
        :clean="true"
        title="Example"
        class="border border-zinc-200 mt-5"
      />
    </ApiEntry>

    <ApiEntry id="ishover" name="isHover" type="boolean">
      <p>
        True when the pointer is over a registered selector from rules or registerHoverTarget().
      </p>
      <CodeBlock
        code="const hovering = app.state.isHover;"
        lang="typescript"
        :clean="true"
        title="Example"
        class="border border-zinc-200 mt-5"
      />
    </ApiEntry>

    <ApiEntry id="forcedcursor" name="forcedCursor" type="'auto' | 'none' | null">
      <p>
        Internal override for native cursor visibility. Usually managed through setNativeCursor().
      </p>
      <CodeBlock
        code="app.setNativeCursor('show'); // forcedCursor becomes 'auto'&#10;app.setNativeCursor('hide'); // forcedCursor becomes 'none'"
        lang="typescript"
        :clean="true"
        title="Example"
        class="border border-zinc-200 mt-5"
      />
    </ApiEntry>

    <ApiEntry id="shape" name="shape" type="ShapeState | null">
      <p>
        Defines a specific geometric shape the cursor should morph or conform to (e.g.
        snapping/sticking to a button container). Storing geometry on the state allows logic plugins
        (e.g. Stick) to communicate shapes to visual plugins (e.g. Ring) without coupling them.
      </p>
      <CodeBlock
        :code="shapeCode"
        lang="typescript"
        :clean="true"
        title="Example"
        class="border border-zinc-200 mt-5"
      />
    </ApiEntry>

    <ApiEntry id="reducedmotion" name="reducedMotion" type="boolean">
      <p>
        True if the user's OS has preferred reduced motion enabled. Plugins should inspect this flag
        and disable elaborate transitions, large movements, or particle trails to adhere to
        accessibility guidelines.
      </p>
      <CodeBlock
        code="update(app, el) {&#10;  if (app.state.reducedMotion) {&#10;    // Disable floaty spring dynamics, snap instantly&#10;    dom.setTransform(el, app.state.target.x, app.state.target.y);&#10;    return;&#10;  }&#10;  // Standard floaty update...&#10;}"
        lang="typescript"
        :clean="true"
        title="Example"
        class="border border-zinc-200 mt-5"
      />
    </ApiEntry>
  </div>
</template>
