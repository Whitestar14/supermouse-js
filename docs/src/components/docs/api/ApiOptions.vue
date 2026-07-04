<script setup lang="ts">
import ApiEntry from "@components/docs/ApiEntry.vue";
import CodeBlock from "@components/shared/CodeBlock.vue";

const rulesCode = `const app = new Supermouse({
  rules: {
    'a, button, [role="button"]': { pointer: true },
    '.card': { magnetic: { strength: 0.4 } },
    'input, textarea': { text: true }
  }
});`;

const overridesCode = `<!-- Magnetic pull on this card only -->
<div data-supermouse-magnetic data-supermouse-strength="0.6">Hover me</div>

<!-- Force pointer/text affordance -->
<button class="btn-danger" data-supermouse-color="orange">Hover</button>
<textarea data-supermouse-text></textarea>`;

const defaultHoverSelectors = "['a', 'button', 'input', 'select', 'textarea', '[role=\"button\"]']";
</script>

<template>
  <div id="options" class="mb-20 scroll-mt-32">
    <h3
      class="font-mono text-xs font-bold uppercase tracking-widest text-zinc-900 mb-2 pb-2 border-b border-zinc-200"
    >
      SupermouseOptions
    </h3>
    <p class="text-sm text-zinc-500 mb-8">
      Passed to the constructor. Each option is documented below.
    </p>

    <ApiEntry id="smoothness" name="smoothness" type="number" default-value="0.15">
      <p>
        Physics damping factor between 0 and 1. Lower values feel floatier; higher values snap
        faster to the target position.
      </p>
      <CodeBlock
        code="const app = new Supermouse({ smoothness: 0.05 }); // very floaty&#10;const snappy = new Supermouse({ smoothness: 0.35 }); // tight follow"
        lang="typescript"
        :clean="true"
        title="Example"
        class="border border-zinc-200 mt-5"
      />
    </ApiEntry>

    <ApiEntry id="hidecursor" name="hideCursor" type="boolean" default-value="true">
      <p>
        Injects a scoped, high-specificity stylesheet that suppresses the native cursor on the body
        and registered interactive targets.
      </p>
      <CodeBlock
        code="const app = new Supermouse({ hideCursor: true });&#10;&#10;// Disable if you need the native cursor visible globally&#10;const native = new Supermouse({ hideCursor: false });"
        lang="typescript"
        :clean="true"
        title="Example"
        class="border border-zinc-200 mt-5"
      />
    </ApiEntry>

    <ApiEntry id="enabletouch" name="enableTouch" type="boolean" default-value="false">
      <p>
        When set to true, touch events (e.g., on tablets) are processed instead of being ignored.
        This enables custom cursor effects on touch devices. Marked as experimental as performance
        and UX may vary across devices.
      </p>
      <CodeBlock
        code="// Only enable if you explicitly need touch support&#10;const app = new Supermouse({ enableTouch: true });"
        lang="typescript"
        :clean="true"
        title="Example"
        class="border border-zinc-200 mt-5"
      />
    </ApiEntry>

    <ApiEntry
      id="ignoreonnative"
      name="ignoreOnNative"
      type="'auto' | 'tag' | 'css' | null"
      default-value="'auto'"
    >
      <p>
        Controls when the native cursor is restored over elements that expect it (inputs, text
        areas, etc.). 'tag' is fastest; 'css' inspects computed cursor styles.
      </p>
      <CodeBlock
        code="const app = new Supermouse({&#10;  hideCursor: true,&#10;  ignoreOnNative: 'tag' // restore native cursor on inputs & textareas&#10;});"
        lang="typescript"
        :clean="true"
        title="Example"
        class="border border-zinc-200 mt-5"
      />
    </ApiEntry>

    <ApiEntry
      id="autodisableonmobile"
      name="autoDisableOnMobile"
      type="boolean"
      default-value="true"
    >
      <p>
        Disables the entire system when (pointer: coarse) is detected — phones, tablets, and
        touch-first devices.
      </p>
      <CodeBlock
        code="const app = new Supermouse({ autoDisableOnMobile: true });"
        lang="typescript"
        :clean="true"
        title="Example"
        class="border border-zinc-200 mt-5"
      />
    </ApiEntry>

    <ApiEntry id="rules" name="rules" type="Record<string, object>" default-value="{}">
      <p>
        Maps CSS selectors to interaction state objects. The input layer scrapes matched elements
        and exposes metadata on state.interaction for plugins to consume.
      </p>
      <CodeBlock
        :code="rulesCode"
        lang="typescript"
        :clean="true"
        title="Example"
        class="border border-zinc-200 mt-5"
      />
    </ApiEntry>

    <ApiEntry id="data-attributes" name="data-[prefix]-*" type="HTML attributes">
      <p>
        Per-element overrides that take precedence over rules. Useful for one-off interactions
        without polluting global configuration. The prefix is configured via
        <code>dataPrefix</code> (default: 'supermouse').
      </p>
      <CodeBlock
        :code="overridesCode"
        lang="html"
        :clean="true"
        title="HTML"
        class="border border-zinc-200 mt-5"
      />
    </ApiEntry>

    <ApiEntry id="dataprefix" name="dataPrefix" type="string" default-value="'supermouse'">
      <p>
        The prefix used for data attributes to store hover metadata and system rules like ignoring
        cursor injection (<code>data-[prefix]-ignore</code>). Allows multiple instances to coexist
        without attribute conflicts.
      </p>
      <CodeBlock
        code="const app = new Supermouse({ dataPrefix: 'my-cursor' });&#10;&#10;// HTML becomes:&#10;// <div data-my-cursor-magnetic></div>"
        lang="typescript"
        :clean="true"
        title="Example"
        class="border border-zinc-200 mt-5"
      />
    </ApiEntry>

    <ApiEntry id="container" name="container" type="HTMLElement" default-value="document.body">
      <p>
        Root element where cursor layers are mounted. Scope the cursor to modals, canvases, or
        embedded previews.
      </p>
      <CodeBlock
        code="const wrapper = document.querySelector('#canvas-stage') as HTMLElement;&#10;&#10;const app = new Supermouse({&#10;  container: wrapper,&#10;  hideCursor: true&#10;});"
        lang="typescript"
        :clean="true"
        title="Example"
        class="border border-zinc-200 mt-5"
      />
    </ApiEntry>

    <ApiEntry id="plugins-option" name="plugins" type="SupermousePlugin[]" default-value="[]">
      <p>A list of plugins to load and initialize automatically when the runtime starts.</p>
      <CodeBlock
        code="const app = new Supermouse({&#10;  plugins: [Dot(), Ring()]&#10;});"
        lang="typescript"
        :clean="true"
        title="Example"
        class="border border-zinc-200 mt-5"
      />
    </ApiEntry>

    <ApiEntry
      id="hoverselectors"
      name="hoverSelectors"
      type="string[]"
      :default-value="defaultHoverSelectors"
    >
      <p>
        List of selectors that trigger the custom hover visual and register attributes on
        state.isHover.
      </p>
      <CodeBlock
        code="const app = new Supermouse({&#10;  hoverSelectors: ['.custom-link', '[data-hoverable]']&#10;});"
        lang="typescript"
        :clean="true"
        title="Example"
        class="border border-zinc-200 mt-5"
      />
    </ApiEntry>

    <ApiEntry id="hideonleave" name="hideOnLeave" type="boolean" default-value="true">
      <p>Hides the custom cursor DOM layers when the native pointer leaves the browser viewport.</p>
      <CodeBlock
        code="const app = new Supermouse({ hideOnLeave: false });"
        lang="typescript"
        :clean="true"
        title="Example"
        class="border border-zinc-200 mt-5"
      />
    </ApiEntry>

    <ApiEntry id="autostart" name="autoStart" type="boolean" default-value="true">
      <p>
        Automatically starts the requestAnimationFrame frame loop. If set to false, you must
        explicitly invoke app.enable() to start.
      </p>
      <CodeBlock
        code="const app = new Supermouse({ autoStart: false });&#10;// Load assets/do setup...&#10;app.enable();"
        lang="typescript"
        :clean="true"
        title="Example"
        class="border border-zinc-200 mt-5"
      />
    </ApiEntry>

    <ApiEntry
      id="resolveinteraction"
      name="resolveInteraction"
      type="(el: HTMLElement) => InteractionState"
    >
      <p>
        Custom handler to compute interaction states from a hovered element. Bypasses the default
        data-attribute scraper entirely.
      </p>
      <CodeBlock
        code="const app = new Supermouse({&#10;  resolveInteraction: (el) => {&#10;    return {&#10;      magnetic: el.classList.contains('magnetic-btn'),&#10;      color: el.getAttribute('data-btn-color')&#10;    };&#10;  }&#10;});"
        lang="typescript"
        :clean="true"
        title="Example"
        class="border border-zinc-200 mt-5"
      />
    </ApiEntry>
  </div>
</template>
