<script setup lang="ts">
import ApiEntry from "@components/docs/ApiEntry.vue";
import CodeBlock from "@components/shared/CodeBlock.vue";

const hoverTargetCode = `app.registerHoverTarget('[data-cursor="card"]');`;
</script>

<template>
  <div id="methods" class="mb-20 scroll-mt-32">
    <h3
      class="font-mono text-xs font-bold uppercase tracking-widest text-zinc-900 mb-2 pb-2 border-b border-zinc-200"
    >
      Methods
    </h3>
    <p class="text-sm text-zinc-500 mb-8">Public methods on the Supermouse instance.</p>

    <ApiEntry
      id="use"
      name="use(plugin)"
      signature="use(plugin: SupermousePlugin): this"
      returns="this"
    >
      <p>Registers a plugin instance. Chainable — call multiple times to layer effects.</p>
      <CodeBlock
        code="import { Dot } from '@supermousejs/dot';&#10;import { Ring } from '@supermousejs/ring';&#10;&#10;app.use(Dot({ size: 8 })).use(Ring({ size: 40 }));"
        lang="typescript"
        :clean="true"
        title="Example"
        class="border border-zinc-200 mt-5"
      />
    </ApiEntry>

    <ApiEntry id="enable" name="enable()" signature="enable(): void" returns="void">
      <p>
        Resumes input processing and restores the custom-cursor hide behavior. This does not start
        the loop by itself if the runtime was created with <code>autoStart: false</code>; use
        <code>start()</code> for that case.
      </p>
      <CodeBlock
        code="const app = new Supermouse({ autoStart: false });&#10;app.use(Dot());&#10;app.start(); // manually begin the animation loop&#10;app.enable(); // resume input processing"
        lang="typescript"
        :clean="true"
        title="Example"
        class="border border-zinc-200 mt-5"
      />
    </ApiEntry>

    <ApiEntry id="start" name="start()" signature="start(): void" returns="void">
      <p>
        Starts the internal animation loop manually. Useful for plugins that need to resume the loop
        if it was suspended, or if `autoStart` is false but you only want to start the loop without
        attaching new DOM events (unlike `enable()`).
      </p>
      <CodeBlock
        code="app.start();"
        lang="typescript"
        :clean="true"
        title="Example"
        class="border border-zinc-200 mt-5"
      />
    </ApiEntry>

    <ApiEntry id="disable" name="disable()" signature="disable(): void" returns="void">
      <p>
        Pauses input processing, restores the native cursor behavior, and clears the runtime state
        back to an off-screen position. Plugins remain registered and can be re-enabled later.
      </p>
      <CodeBlock
        code="app.disable(); // pause input while keeping configuration intact"
        lang="typescript"
        :clean="true"
        title="Example"
        class="border border-zinc-200 mt-5"
      />
    </ApiEntry>

    <ApiEntry id="destroy" name="destroy()" signature="destroy(): void" returns="void">
      <p>
        Full teardown — removes listeners, destroys plugins, and cleans injected styles. Required
        before re-initializing on the same page (e.g. route changes in SPAs).
      </p>
      <CodeBlock
        code="onUnmounted(() => {&#10;  app.destroy();&#10;});"
        lang="typescript"
        :clean="true"
        title="Example"
        class="border border-zinc-200 mt-5"
      />
    </ApiEntry>

    <ApiEntry
      id="setnativecursor"
      name="setNativeCursor(type)"
      signature="setNativeCursor(type: 'show' | 'hide' | 'auto'): void"
      returns="void"
    >
      <p>
        Force native cursor visibility for edge cases like text selection or drag-and-drop
        affordances.
      </p>
      <CodeBlock
        code="textarea.addEventListener('focus', () => app.setNativeCursor('show'));&#10;textarea.addEventListener('blur', () => app.setNativeCursor('auto'));"
        lang="typescript"
        :clean="true"
        title="Example"
        class="border border-zinc-200 mt-5"
      />
    </ApiEntry>

    <ApiEntry
      id="getplugin"
      name="getPlugin(name)"
      signature="getPlugin(name: string): SupermousePlugin | undefined"
      returns="SupermousePlugin | undefined"
    >
      <p>Retrieves a registered plugin by its name key.</p>
      <CodeBlock
        code="const dot = app.getPlugin('dot');&#10;dot?.setOption?.('size', 12);"
        lang="typescript"
        :clean="true"
        title="Example"
        class="border border-zinc-200 mt-5"
      />
    </ApiEntry>

    <ApiEntry
      id="enableplugin"
      name="enablePlugin(name)"
      signature="enablePlugin(name: string): void"
      returns="void"
    >
      <p>Re-enables a previously disabled plugin and calls its onEnable hook.</p>
      <CodeBlock
        code="app.enablePlugin('ring');"
        lang="typescript"
        :clean="true"
        title="Example"
        class="border border-zinc-200 mt-5"
      />
    </ApiEntry>

    <ApiEntry
      id="disableplugin"
      name="disablePlugin(name)"
      signature="disablePlugin(name: string): void"
      returns="void"
    >
      <p>Disables a single plugin without removing it from the pipeline.</p>
      <CodeBlock
        code="app.disablePlugin('trail');"
        lang="typescript"
        :clean="true"
        title="Example"
        class="border border-zinc-200 mt-5"
      />
    </ApiEntry>

    <ApiEntry
      id="toggleplugin"
      name="togglePlugin(name)"
      signature="togglePlugin(name: string): void"
      returns="void"
    >
      <p>Toggles a plugin between enabled and disabled states.</p>
      <CodeBlock
        code="button.addEventListener('click', () => app.togglePlugin('sparkles'));"
        lang="typescript"
        :clean="true"
        title="Example"
        class="border border-zinc-200 mt-5"
      />
    </ApiEntry>

    <ApiEntry
      id="registerhovertarget"
      name="registerHoverTarget(selector)"
      signature="registerHoverTarget(selector: string): void"
      returns="void"
    >
      <p>Adds a CSS selector to hover detection at runtime.</p>
      <CodeBlock
        :code="hoverTargetCode"
        lang="typescript"
        :clean="true"
        title="Example"
        class="border border-zinc-200 mt-5"
      />
    </ApiEntry>

    <ApiEntry id="step" name="step(time)" signature="step(time: number): void" returns="void">
      <p>
        Manual frame tick when you control the loop yourself instead of the internal
        requestAnimationFrame driver.
      </p>
      <CodeBlock
        code="function frame(now: number) {&#10;  app.step(now);&#10;  requestAnimationFrame(frame);&#10;}&#10;requestAnimationFrame(frame);"
        lang="typescript"
        :clean="true"
        title="Example"
        class="border border-zinc-200 mt-5"
      />
    </ApiEntry>
  </div>
</template>
