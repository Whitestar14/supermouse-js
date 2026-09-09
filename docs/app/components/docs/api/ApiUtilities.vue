<script setup lang="ts">
import ApiEntry from "@components/docs/ApiEntry.vue";
import CodeBlock from "@components/shared/CodeBlock.vue";
</script>

<template>
  <div id="utilities" class="mb-20 scroll-mt-32">
    <h3
      class="font-mono text-xs font-bold uppercase tracking-widest text-zinc-900 mb-8 pb-2 border-b border-zinc-200"
    >
      @supermousejs/utils
    </h3>

    <!-- Math -->
    <div class="mb-12">
      <h4 class="text-sm font-bold text-zinc-900 mb-4 tracking-tight">Math & Physics</h4>
      <ApiEntry
        id="lerp"
        name="math.lerp"
        signature="lerp(start, end, factor): number"
        type="number"
      >
        <p>Linear interpolation. factor 0 returns start, 1 returns end.</p>
        <CodeBlock
          code="import { math } from '@supermousejs/utils';&#10;const value = math.lerp(0, 100, 0.25); // 25"
          lang="typescript"
          :clean="true"
          title="Example"
          class="border border-zinc-200 mt-5"
        />
      </ApiEntry>
      <ApiEntry id="damp" name="math.damp" signature="damp(a, b, lambda, dt): number" type="number">
        <p>Frame-rate independent damping. Higher lambda converges faster.</p>
        <CodeBlock
          code="let pos = 0;&#10;function update(dt) {&#10;  pos = math.damp(pos, target, 12, dt);&#10;}"
          lang="typescript"
          :clean="true"
          title="Example"
          class="border border-zinc-200 mt-5"
        />
      </ApiEntry>
      <ApiEntry
        id="lerpangle"
        name="math.lerpAngle"
        signature="lerpAngle(start, end, factor): number"
        type="number"
      >
        <p>Interpolates angles along the shortest path, handling 360° wrap-around.</p>
        <CodeBlock
          code="rotation = math.lerpAngle(rotation, targetAngle, 0.15);"
          lang="typescript"
          :clean="true"
          title="Example"
          class="border border-zinc-200 mt-5"
        />
      </ApiEntry>
      <ApiEntry id="dist" name="math.dist" signature="dist(x1, y1, x2?, y2?): number" type="number">
        <p>Distance between two points, or vector magnitude when x2/y2 are omitted.</p>
        <CodeBlock
          code="const speed = math.dist(vx, vy);"
          lang="typescript"
          :clean="true"
          title="Example"
          class="border border-zinc-200 mt-5"
        />
      </ApiEntry>
      <ApiEntry id="angle" name="math.angle" signature="angle(x, y): number" type="number">
        <p>Angle in degrees from the origin to a point.</p>
        <CodeBlock
          code="const direction = math.angle(vx, vy);"
          lang="typescript"
          :clean="true"
          title="Example"
          class="border border-zinc-200 mt-5"
        />
      </ApiEntry>
      <ApiEntry
        id="clamp"
        name="math.clamp"
        signature="clamp(value, min, max): number"
        type="number"
      >
        <p>Constrains a value between bounds.</p>
        <CodeBlock
          code="const alpha = math.clamp(raw, 0, 1);"
          lang="typescript"
          :clean="true"
          title="Example"
          class="border border-zinc-200 mt-5"
        />
      </ApiEntry>
      <ApiEntry id="random" name="math.random" signature="random(min, max): number" type="number">
        <p>Random number between min and max (inclusive).</p>
        <CodeBlock
          code="const jitter = math.random(-4, 4);"
          lang="typescript"
          :clean="true"
          title="Example"
          class="border border-zinc-200 mt-5"
        />
      </ApiEntry>
    </div>

    <!-- DOM -->
    <div class="mb-12">
      <h4 class="text-sm font-bold text-zinc-900 mb-4 tracking-tight">DOM Manipulation</h4>
      <ApiEntry
        id="createactor"
        name="dom.createActor"
        signature="createActor(tag?): HTMLElement"
        returns="HTMLElement"
      >
        <p>Creates a fixed-position element optimized for cursor rendering.</p>
        <CodeBlock
          code="const layer = dom.createActor('div');"
          lang="typescript"
          :clean="true"
          title="Example"
          class="border border-zinc-200 mt-5"
        />
      </ApiEntry>
      <ApiEntry
        id="createcircle"
        name="dom.createCircle"
        signature="createCircle(size, color): HTMLElement"
        returns="HTMLElement"
      >
        <p>Pre-styled circular element — ideal for dots and rings.</p>
        <CodeBlock
          code="const dot = dom.createCircle(8, '#f59e0b');"
          lang="typescript"
          :clean="true"
          title="Example"
          class="border border-zinc-200 mt-5"
        />
      </ApiEntry>
      <ApiEntry
        id="settransform"
        name="dom.setTransform"
        signature="setTransform(el, x, y, rotation?, scaleX?, scaleY?, skewX?, skewY?): void"
        returns="void"
      >
        <p>Updates transform with automatic center anchoring (translate -50%, -50%).</p>
        <CodeBlock
          code="dom.setTransform(el, x, y, rotation, scaleX, scaleY);"
          lang="typescript"
          :clean="true"
          title="Example"
          class="border border-zinc-200 mt-5"
        />
      </ApiEntry>
      <ApiEntry
        id="setstyle"
        name="dom.setStyle"
        signature="setStyle(el, property, value): void"
        returns="void"
      >
        <p>Writes a style only when the value changes to avoid layout thrashing.</p>
        <CodeBlock
          code="dom.setStyle(el, 'opacity', isVisible ? 1 : 0);"
          lang="typescript"
          :clean="true"
          title="Example"
          class="border border-zinc-200 mt-5"
        />
      </ApiEntry>
      <ApiEntry
        id="applystyles"
        name="dom.applyStyles"
        signature="applyStyles(el, styles): void"
        returns="void"
      >
        <p>Bulk-apply multiple styles during initialization.</p>
        <CodeBlock
          code="dom.applyStyles(el, {&#10;  position: 'fixed',&#10;  pointerEvents: 'none',&#10;  zIndex: Layers.CURSOR&#10;});"
          lang="typescript"
          :clean="true"
          title="Example"
          class="border border-zinc-200 mt-5"
        />
      </ApiEntry>
      <ApiEntry
        id="projectrect"
        name="dom.projectRect"
        signature="projectRect(element, container?): DOMRect"
        returns="DOMRect"
      >
        <p>Bounding rect relative to a container — useful for scoped cursors.</p>
        <CodeBlock
          code="const rect = dom.projectRect(target, app.container);"
          lang="typescript"
          :clean="true"
          title="Example"
          class="border border-zinc-200 mt-5"
        />
      </ApiEntry>
    </div>

    <!-- Effects -->
    <div class="mb-12">
      <h4 class="text-sm font-bold text-zinc-900 mb-4 tracking-tight">Effects</h4>
      <ApiEntry
        id="getvelocitydistortion"
        name="effects.getVelocityDistortion"
        signature="getVelocityDistortion(vx, vy, intensity?, maxStretch?)"
        returns="{ rotation, scaleX, scaleY }"
      >
        <p>Squash-and-stretch values derived from velocity — great for motion-reactive cursors.</p>
        <CodeBlock
          code="const { rotation, scaleX, scaleY } = effects.getVelocityDistortion(vx, vy);&#10;dom.setTransform(el, x, y, rotation, scaleX, scaleY);"
          lang="typescript"
          :clean="true"
          title="Example"
          class="border border-zinc-200 mt-5"
        />
      </ApiEntry>
    </div>

    <!-- Constants -->
    <div class="mb-12">
      <h4 class="text-sm font-bold text-zinc-900 mb-4 tracking-tight">Constants</h4>
      <ApiEntry id="layers-overlay" name="Layers.OVERLAY" type="400">
        <p>Top-most layer for text, tooltips, and critical UI.</p>
        <CodeBlock
          code="el.style.zIndex = Layers.OVERLAY;"
          lang="typescript"
          :clean="true"
          title="Example"
          class="border border-zinc-200 mt-5"
        />
      </ApiEntry>
      <ApiEntry id="layers-cursor" name="Layers.CURSOR" type="300">
        <p>Primary cursor layer (dot, pointer).</p>
        <CodeBlock
          code="dot.style.zIndex = Layers.CURSOR;"
          lang="typescript"
          :clean="true"
          title="Example"
          class="border border-zinc-200 mt-5"
        />
      </ApiEntry>
      <ApiEntry id="layers-follower" name="Layers.FOLLOWER" type="200">
        <p>Secondary followers like rings and brackets.</p>
        <CodeBlock
          code="ring.style.zIndex = Layers.FOLLOWER;"
          lang="typescript"
          :clean="true"
          title="Example"
          class="border border-zinc-200 mt-5"
        />
      </ApiEntry>
      <ApiEntry id="layers-trace" name="Layers.TRACE" type="100">
        <p>Background effects — trails, particles, sparkles.</p>
        <CodeBlock
          code="trail.style.zIndex = Layers.TRACE;"
          lang="typescript"
          :clean="true"
          title="Example"
          class="border border-zinc-200 mt-5"
        />
      </ApiEntry>
      <ApiEntry id="easings-ease-out-expo" name="Easings.EASE_OUT_EXPO" type="cubic-bezier">
        <p>Fast entrance easing that settles smoothly.</p>
        <CodeBlock
          code="el.style.transition = \`transform 0.4s \${Easings.EASE_OUT_EXPO}\`;"
          lang="typescript"
          :clean="true"
          title="Example"
          class="border border-zinc-200 mt-5"
        />
      </ApiEntry>
      <ApiEntry id="easings-elastic-out" name="Easings.ELASTIC_OUT" type="cubic-bezier">
        <p>Playful elastic overshoot.</p>
        <CodeBlock
          code="el.style.transition = \`transform 0.6s \${Easings.ELASTIC_OUT}\`;"
          lang="typescript"
          :clean="true"
          title="Example"
          class="border border-zinc-200 mt-5"
        />
      </ApiEntry>
      <ApiEntry id="easings-smooth" name="Easings.SMOOTH" type="ease-out">
        <p>General-purpose smooth easing.</p>
        <CodeBlock
          code="el.style.transition = \`opacity 0.2s \${Easings.SMOOTH}\`;"
          lang="typescript"
          :clean="true"
          title="Example"
          class="border border-zinc-200 mt-5"
        />
      </ApiEntry>
    </div>

    <!-- Other -->
    <div>
      <h4 class="text-sm font-bold text-zinc-900 mb-4 tracking-tight">Helpers</h4>
      <ApiEntry
        id="normalize"
        name="normalize"
        signature="normalize(option, defaultValue): (state) => T"
        returns="(state: MouseState) => T"
      >
        <p>
          Converts static values, functions, or undefined into a unified getter — removes branching
          inside update loops.
        </p>
        <CodeBlock
          code="const getSize = normalize(options.size, 20);&#10;const size = getSize(app.state);"
          lang="typescript"
          :clean="true"
          title="Example"
          class="border border-zinc-200 mt-5"
        />
      </ApiEntry>
      <ApiEntry
        id="defineplugin"
        name="definePlugin"
        signature="definePlugin(config, userOptions): SupermousePlugin"
        returns="SupermousePlugin"
      >
        <p>Type-safe helper for authoring plugins with automatic lifecycle wiring.</p>
        <CodeBlock
          code="export const MyRing = (options) =>&#10;  definePlugin({&#10;    name: 'my-ring',&#10;    create: () => dom.createCircle(24, 'white'),&#10;    update: (app, el) => dom.setTransform(el, app.state.smooth.x, app.state.smooth.y)&#10;  }, options);"
          lang="typescript"
          :clean="true"
          title="Example"
          class="border border-zinc-200 mt-5"
        />
      </ApiEntry>
      <ApiEntry id="doctor" name="doctor" signature="doctor(): void" returns="void">
        <p>Debug helper that reports common misconfigurations. Run from the browser console.</p>
        <CodeBlock
          code="import { doctor } from '@supermousejs/utils';&#10;doctor();"
          lang="typescript"
          :clean="true"
          title="Example"
          class="border border-zinc-200 mt-5"
        />
      </ApiEntry>
    </div>
  </div>
</template>
