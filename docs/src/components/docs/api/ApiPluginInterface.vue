<script setup lang="ts">
import ApiEntry from "@components/docs/ApiEntry.vue";
import CodeBlock from "@components/shared/CodeBlock.vue";
</script>

<template>
  <div id="plugin-interface" class="mb-20 scroll-mt-32">
    <h3
      class="font-mono text-xs font-bold uppercase tracking-widest text-zinc-900 mb-2 pb-2 border-b border-zinc-200"
    >
      SupermousePlugin
    </h3>
    <p class="text-sm text-zinc-500 mb-8">
      The contract that all plugins must fulfill. The core runtime calls these hooks.
    </p>

    <ApiEntry id="install" name="install(app)" signature="install(app: Supermouse): void">
      <p>Called once when the plugin is registered. Create and mount DOM elements here.</p>
      <CodeBlock
        code="install(app) {&#10;  const el = dom.createCircle(8, 'white');&#10;  app.container.appendChild(el);&#10;  this.el = el;&#10;}"
        lang="typescript"
        :clean="true"
        title="Example"
        class="border border-zinc-200 mt-5"
      />
    </ApiEntry>

    <ApiEntry
      id="update"
      name="update(app, dt)"
      signature="update(app: Supermouse, dt: number): void"
    >
      <p>
        Called every frame. Apply transforms and read state here. <code>dt</code> is the frame delta
        time in milliseconds, matching the runtime loop’s <code>requestAnimationFrame</code>
        bookkeeping.
      </p>
      <CodeBlock
        code="update(app, dt) {&#10;  const { x, y } = app.state.smooth;&#10;  dom.setTransform(this.el, x, y);&#10;}"
        lang="typescript"
        :clean="true"
        title="Example"
        class="border border-zinc-200 mt-5"
      />
    </ApiEntry>

    <ApiEntry id="plugin-destroy" name="destroy(app)" signature="destroy(app: Supermouse): void">
      <p>Called when the app is destroyed. Remove DOM nodes and release references.</p>
      <CodeBlock
        code="destroy() {&#10;  this.el?.remove();&#10;  this.el = null;&#10;}"
        lang="typescript"
        :clean="true"
        title="Example"
        class="border border-zinc-200 mt-5"
      />
    </ApiEntry>

    <ApiEntry id="onenable" name="onEnable(app)" signature="onEnable(app: Supermouse): void">
      <p>Called when a disabled plugin is re-enabled. Restore visibility and reset state.</p>
      <CodeBlock
        code="onEnable() {&#10;  dom.setStyle(this.el, 'opacity', '1');&#10;}"
        lang="typescript"
        :clean="true"
        title="Example"
        class="border border-zinc-200 mt-5"
      />
    </ApiEntry>

    <ApiEntry id="ondisable" name="onDisable(app)" signature="onDisable(app: Supermouse): void">
      <p>
        Called when a plugin is disabled. Hide elements but keep them in the DOM for fast re-enable.
      </p>
      <CodeBlock
        code="onDisable() {&#10;  dom.setStyle(this.el, 'opacity', '0');&#10;}"
        lang="typescript"
        :clean="true"
        title="Example"
        class="border border-zinc-200 mt-5"
      />
    </ApiEntry>
  </div>
</template>
