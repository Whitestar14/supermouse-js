<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from "vue";
import DocsSection from "@/components/docs/DocsSection.vue";
import CodeBlock from "@/components/CodeBlock.vue";
import Table from "@/components/Table.vue";
import TableOfContents from "@/components/docs/TableOfContents.vue";
import { useDocsSidebar } from "@/composables/useDocsSidebar";
import {
  API_SECTIONS,
  coreClassDef,
  optionsData,
  stateData,
  methodsData,
  pluginHooks,
  mathUtilities,
  domUtilities,
  effectsUtilities,
  constantUtilities,
  otherUtilities,
} from "@/composables/useApiReference";

const activeSection = ref<string>("core-class");
const { setRightSidebar, clearRightSidebar } = useDocsSidebar();

const scrollTo = (id: string) => {
  const el = document.getElementById(id);
  if (!el) return;

  const offset = 120;
  const top = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior: "smooth" });
  activeSection.value = id;
};

const updateActiveSection = () => {
  const offset = 120;
  const fromTop = window.scrollY + offset;
  let current = API_SECTIONS[0]?.id ?? "";

  for (const section of API_SECTIONS) {
    const el = document.getElementById(section.id);
    if (!el) continue;

    if (el.offsetTop <= fromTop) {
      current = section.id;
    }
  }

  activeSection.value = current;
};

onMounted(() => {
  updateActiveSection();
  window.addEventListener("scroll", updateActiveSection, { passive: true });
  window.addEventListener("resize", updateActiveSection, { passive: true });

  // Set up right sidebar TOC
  setRightSidebar({
    component: TableOfContents,
    props: {
      sections: API_SECTIONS,
      activeSection,
    },
    on: {
      navigate: scrollTo,
    },
  });
});

onUnmounted(() => {
  window.removeEventListener("scroll", updateActiveSection);
  window.removeEventListener("resize", updateActiveSection);
  clearRightSidebar();
});
</script>

<template>
  <DocsSection label="Reference" title="API">
    <!-- Core Class -->
    <div class="mb-16" id="core-class">
      <h3
        class="font-mono text-xs font-bold uppercase tracking-widest text-zinc-900 mb-4 pb-2 border-b border-zinc-200"
      >
        Core Class
      </h3>
      <CodeBlock
        :code="coreClassDef"
        lang="typescript"
        :clean="false"
        title="Signature"
      />
    </div>

    <!-- Options -->
    <div class="mb-16" id="options">
      <h3
        class="font-mono text-xs font-bold uppercase tracking-widest text-zinc-900 mb-6 pb-2 border-b border-zinc-200 flex items-center justify-between"
      >
        <span>SupermouseOptions</span>
        <span class="text-zinc-400 font-normal">Passed to constructor</span>
      </h3>

      <Table
        :columns="[
          { key: 'name', label: 'Option', class: 'w-1/4' },
          { key: 'type', label: 'Type', class: 'w-1/6' },
          { key: 'default', label: 'Default', class: 'w-1/6' },
          { key: 'desc', label: 'Description' },
        ]"
        :rows="optionsData"
        wrapperClass="border border-zinc-200 bg-white overflow-x-auto"
      >
        <template #cell-name="{ row }">
          <span class="font-mono text-zinc-900 font-bold">{{ row.name }}</span>
        </template>
        <template #cell-type="{ row }">
          <span class="font-mono text-zinc-500 text-xs">{{ row.type }}</span>
        </template>
        <template #cell-default="{ row }">
          <span class="font-mono text-zinc-400 text-xs">{{ row.default }}</span>
        </template>
        <template #cell-desc="{ row }">
          <span class="text-zinc-600 leading-snug">{{ row.desc }}</span>
        </template>
      </Table>
    </div>

    <!-- State -->
    <div class="mb-16" id="state">
      <h3
        class="font-mono text-xs font-bold uppercase tracking-widest text-zinc-900 mb-6 pb-2 border-b border-zinc-200 flex items-center justify-between"
      >
        <span>MouseState</span>
        <span class="text-zinc-400 font-normal">Read/Write via app.state</span>
      </h3>

      <Table
        :columns="[
          { key: 'name', label: 'Property', class: 'w-1/4' },
          { key: 'type', label: 'Type', class: 'w-1/4' },
          { key: 'desc', label: 'Description' },
        ]"
        :rows="stateData"
        wrapperClass="border border-zinc-200 bg-white overflow-x-auto"
      >
        <template #cell-name="{ row }">
          <span class="font-mono text-zinc-900 font-bold">{{ row.name }}</span>
        </template>

        <template #cell-type="{ row }">
          <span class="font-mono text-zinc-500 text-xs">{{ row.type }}</span>
        </template>

        <template #cell-desc="{ row }">
          <span class="text-zinc-600 leading-snug">{{ row.desc }}</span>
        </template>
      </Table>
    </div>

    <!-- Methods Table -->
    <div class="mb-16" id="methods">
      <h3
        class="font-mono text-xs font-bold uppercase tracking-widest text-zinc-900 mb-6 pb-2 border-b border-zinc-200 flex items-center justify-between"
      >
        <span>Instance Methods</span>
        <span class="text-zinc-400 font-normal">Public API</span>
      </h3>

      <Table
        :columns="[
          { key: 'name', label: 'Method', class: 'w-1/6' },
          { key: 'params', label: 'Parameters', class: 'w-1/4' },
          { key: 'return', label: 'Return', class: 'w-1/6' },
          { key: 'desc', label: 'Description' },
        ]"
        :rows="methodsData"
        wrapperClass="border border-zinc-200 bg-white overflow-x-auto"
      >
        <template #cell-name="{ row }">
          <span class="font-mono text-zinc-900 font-bold">{{ row.name }}</span>
        </template>

        <template #cell-params="{ row }">
          <span class="font-mono text-zinc-500 text-xs">{{ row.params }}</span>
        </template>

        <template #cell-return="{ row }">
          <span class="font-mono text-amber-600 text-xs">{{ row.return }}</span>
        </template>

        <template #cell-desc="{ row }">
          <span class="text-zinc-600 leading-snug">{{ row.desc }}</span>
        </template>
      </Table>
    </div>

    <!-- Plugin Interface -->
    <div class="mb-16" id="plugin-interface">
      <h3
        class="font-mono text-xs font-bold uppercase tracking-widest text-zinc-900 mb-6 pb-2 border-b border-zinc-200 flex items-center justify-between"
      >
        <span>SupermousePlugin</span>
        <span class="text-zinc-400 font-normal">Lifecycle Hooks</span>
      </h3>

      <Table
        :columns="[
          { key: 'name', label: 'Hook', class: 'w-1/4' },
          { key: 'desc', label: 'Description' },
        ]"
        :rows="pluginHooks"
        wrapperClass="border border-zinc-200 bg-white overflow-x-auto"
      >
        <template #cell-name="{ row }">
          <span class="font-mono text-zinc-900 font-bold">{{ row.name }}</span>
        </template>

        <template #cell-desc="{ row }">
          <span class="text-zinc-600 leading-snug">{{ row.desc }}</span>
        </template>
      </Table>
    </div>

    <!-- Utilities -->
    <div class="mb-16" id="utilities">
      <h3
        class="font-mono text-xs font-bold uppercase tracking-widest text-zinc-900 mb-6 pb-2 border-b border-zinc-200 flex items-center justify-between"
      >
        <span>Utilities</span>
        <span class="text-zinc-400 font-normal">@supermousejs/utils</span>
      </h3>

      <p class="text-zinc-600 mb-8 leading-relaxed">
        The <code>@supermousejs/utils</code> package provides
        performance-optimized helpers for plugin development. All functions are
        designed to minimize allocations and layout thrashing during the render
        loop.
      </p>

      <!-- Math Utilities -->
      <div class="mb-12">
        <h4
          class="font-mono text-xs font-bold uppercase tracking-widest text-zinc-700 mb-4 pb-2 border-b border-zinc-100"
        >
          Math Utilities
        </h4>
        <p class="text-sm text-zinc-600 mb-4">
          Frame-independent motion, interpolation, and vector operations.
        </p>
        <Table
          :columns="[
            { key: 'name', label: 'Function', class: 'w-1/6' },
            { key: 'signature', label: 'Signature', class: 'w-1/4' },
            { key: 'params', label: 'Parameters' },
          ]"
          :rows="mathUtilities"
          wrapperClass="border border-zinc-200 bg-white overflow-x-auto mb-4"
        >
          <template #cell-name="{ row }">
            <span class="font-mono text-zinc-900 font-bold">{{
              row.name
            }}</span>
          </template>
          <template #cell-signature="{ row }">
            <span class="font-mono text-xs text-zinc-500">{{
              row.signature
            }}</span>
          </template>
          <template #cell-params="{ row }">
            <div class="text-xs">
              <div class="font-mono text-zinc-700 mb-1">
                {{ row.params }}
              </div>
              <div class="text-zinc-600">{{ row.desc }}</div>
            </div>
          </template>
        </Table>

        <CodeBlock
          lang="typescript"
          :code="`import { math } from '@supermousejs/utils';

// Frame-rate independent damping
let pos = 0;
pos = math.damp(pos, target, 10, deltaTime);

// Rotation on shortest path
rotation = math.lerpAngle(rotation, newAngle, 0.15);

// Vector math
const speed = math.dist(vx, vy);
const direction = math.angle(vx, vy);
`"
          :clean="true"
          title="Usage Example"
        />
      </div>

      <!-- DOM Utilities -->
      <div class="mb-12">
        <h4
          class="font-mono text-xs font-bold uppercase tracking-widest text-zinc-700 mb-4 pb-2 border-b border-zinc-100"
        >
          DOM Utilities
        </h4>
        <p class="text-sm text-zinc-600 mb-4">
          Create and update DOM efficiently. Built-in caching prevents layout
          thrashing.
        </p>
        <Table
          :columns="[
            { key: 'name', label: 'Function', class: 'w-1/6' },
            { key: 'signature', label: 'Signature', class: 'w-1/4' },
            { key: 'params', label: 'Parameters' },
          ]"
          :rows="domUtilities"
          wrapperClass="border border-zinc-200 bg-white overflow-x-auto mb-4"
        >
          <template #cell-name="{ row }">
            <span class="font-mono text-zinc-900 font-bold">{{
              row.name
            }}</span>
          </template>
          <template #cell-signature="{ row }">
            <span class="font-mono text-xs text-zinc-500">{{
              row.signature
            }}</span>
          </template>
          <template #cell-params="{ row }">
            <div class="text-xs">
              <div class="font-mono text-zinc-700 mb-1">
                {{ row.params }}
              </div>
              <div class="text-zinc-600">{{ row.desc }}</div>
            </div>
          </template>
        </Table>

        <CodeBlock
          lang="typescript"
          :code="`import { dom, Layers } from '@supermousejs/utils';

// Create optimized cursor element
const dot = dom.createCircle(8, 'black');
dom.applyStyles(dot, {
  zIndex: Layers.CURSOR,
  pointerEvents: 'none',
  position: 'fixed',
});
document.body.appendChild(dot);

// Update position every frame (with caching)
const { x, y } = app.state.smooth;
dom.setTransform(dot, x, y);

// Smart style setter only writes if changed
dom.setStyle(dot, 'opacity', '0.8');
`"
          :clean="true"
          title="Usage Example"
        />
      </div>

      <!-- Effects Utilities -->
      <div class="mb-12">
        <h4
          class="font-mono text-xs font-bold uppercase tracking-widest text-zinc-700 mb-4 pb-2 border-b border-zinc-100"
        >
          Effects Utilities
        </h4>
        <p class="text-sm text-zinc-600 mb-4">
          Create special effects based on cursor movement and velocity.
        </p>
        <Table
          :columns="[
            { key: 'name', label: 'Function', class: 'w-1/4' },
            { key: 'signature', label: 'Signature', class: 'w-1/3' },
            { key: 'params', label: 'Parameters' },
          ]"
          :rows="effectsUtilities"
          wrapperClass="border border-zinc-200 bg-white overflow-x-auto mb-4"
        >
          <template #cell-name="{ row }">
            <span class="font-mono text-zinc-900 font-bold">{{
              row.name
            }}</span>
          </template>
          <template #cell-signature="{ row }">
            <span class="font-mono text-xs text-zinc-500">{{
              row.signature
            }}</span>
          </template>
          <template #cell-params="{ row }">
            <div class="text-xs">
              <div class="font-mono text-zinc-700 mb-1">
                {{ row.params }}
              </div>
              <div class="text-zinc-600 mb-2">{{ row.desc }}</div>
              <div class="font-mono text-amber-700 bg-amber-50 p-2 rounded">
                Returns: {{ row.return }}
              </div>
            </div>
          </template>
        </Table>

        <CodeBlock
          lang="typescript"
          :code="`import { effects } from '@supermousejs/utils';

update(app, el) {
  const { vx, vy } = app.state.velocity;

  // Get squash & stretch from velocity
  const { rotation, scaleX, scaleY } = effects.getVelocityDistortion(vx, vy);

  const { x, y } = app.state.smooth;
  dom.setTransform(el, x, y, rotation, scaleX, scaleY);
}
`"
          :clean="true"
          title="Usage Example"
        />
      </div>

      <!-- Constants & Enums -->
      <div class="mb-12">
        <h4
          class="font-mono text-xs font-bold uppercase tracking-widest text-zinc-700 mb-4 pb-2 border-b border-zinc-100"
        >
          Constants & Enums
        </h4>
        <p class="text-sm text-zinc-600 mb-4">
          Pre-defined values for z-index layering and CSS easings.
        </p>
        <Table
          :columns="[
            { key: 'name', label: 'Constant', class: 'w-1/4' },
            { key: 'value', label: 'Value', class: 'w-1/4' },
            { key: 'desc', label: 'Description' },
          ]"
          :rows="constantUtilities"
          wrapperClass="border border-zinc-200 bg-white overflow-x-auto mb-4"
        >
          <template #cell-name="{ row }">
            <span class="font-mono text-zinc-900 font-bold">{{
              row.name
            }}</span>
          </template>
          <template #cell-value="{ row }">
            <span
              class="font-mono text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded"
              >{{ row.value }}</span
            >
          </template>
          <template #cell-desc="{ row }">
            <span class="text-zinc-600">{{ row.desc }}</span>
          </template>
        </Table>

        <CodeBlock
          lang="typescript"
          :code="`import { Layers, Easings } from '@supermousejs/utils';

// Z-Index layering
const dot = dom.createCircle(8, 'black');
dot.style.zIndex = Layers.CURSOR;      // 300

const ring = dom.createCircle(30, 'white');
ring.style.zIndex = Layers.FOLLOWER;   // 200

const trail = document.createElement('div');
trail.style.zIndex = Layers.TRACE;     // 100

// CSS easing functions
tooltip.style.transition = \`opacity 0.3s \${Easings.SMOOTH}\`;
particles.style.transition = \`transform 0.6s \${Easings.ELASTIC_OUT}\`;
`"
          :clean="true"
          title="Usage Example"
        />
      </div>

      <!-- Other Utilities -->
      <div class="mb-12">
        <h4
          class="font-mono text-xs font-bold uppercase tracking-widest text-zinc-700 mb-4 pb-2 border-b border-zinc-100"
        >
          Plugin & Option Helpers
        </h4>
        <p class="text-sm text-zinc-600 mb-4">
          Tools for plugin definition, configuration normalization, and
          debugging.
        </p>
        <Table
          :columns="[
            { key: 'name', label: 'Function', class: 'w-1/6' },
            { key: 'signature', label: 'Signature', class: 'w-1/3' },
            { key: 'params', label: 'Details' },
          ]"
          :rows="otherUtilities"
          wrapperClass="border border-zinc-200 bg-white overflow-x-auto mb-4"
        >
          <template #cell-name="{ row }">
            <span class="font-mono text-zinc-900 font-bold">{{
              row.name
            }}</span>
          </template>
          <template #cell-signature="{ row }">
            <span class="font-mono text-xs text-zinc-500">{{
              row.signature
            }}</span>
          </template>
          <template #cell-params="{ row }">
            <div class="text-xs">
              <div class="font-mono text-zinc-700 mb-1">
                {{ row.params }}
              </div>
              <div class="text-zinc-600">{{ row.desc }}</div>
            </div>
          </template>
        </Table>

        <CodeBlock
          lang="typescript"
          :code="`import { normalize, definePlugin, doctor } from '@supermousejs/utils';

// normalize: Accept static or dynamic values
const getSize = normalize(options.size, 20);
const getColor = normalize(options.color, '#fff');
const size = getSize(app.state);        // Evaluate

// definePlugin: Type-safe plugin helper
export const MyPlugin = (options) =>
  definePlugin({
    name: 'my-plugin',
    create: (app) => dom.createCircle(20, 'white'),
    update: (app, el) => dom.setTransform(el, x, y)
  }, options);

// doctor: Debug in browser console
doctor(); // Reports cursor conflicts & issues
`"
          :clean="true"
          title="Usage Example"
        />
      </div>

      <div class="border-l-4 border-blue-500 bg-blue-50 p-4 rounded mt-8">
        <p class="text-sm text-blue-900 leading-relaxed">
          For more advanced patterns and real-world examples using these
          utilities, see the
          <router-link
            to="/docs/advanced/tips-and-tricks"
            class="font-bold hover:underline"
          >
            Tips &amp; Tricks
          </router-link>
          page.
        </p>
      </div>
    </div>
  </DocsSection>
</template>
