<script setup lang="ts">
import DocsSection from "@/components/docs/DocsSection.vue";
import CodeBlock from "@/components/shared/CodeBlock.vue";
import Text from "@/components/shared/Text.vue";

const createPluginCode = "pnpm run create:plugin <name>";
const removePluginCode = "pnpm run remove:plugin <name>";
</script>

<template>
  <DocsSection label="Guide" title="Toolchain">
    <Text size="lg" class="mb-8">
      This repository utilizes a custom Command Line Interface (CLI) toolchain to manage the
      monorepo architecture, facilitating efficient plugin scaffolding and workspace management.
    </Text>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
      <div class="p-6 border border-zinc-200">
        <h4 class="font-bold text-zinc-900 mb-2">Workspace</h4>
        <p class="text-sm text-zinc-600 leading-relaxed">
          Managed via <code>pnpm</code>. Internal dependencies are linked using the
          <code>workspace:*</code> protocol to ensure instant updates across packages.
        </p>
      </div>
      <div class="p-6 border border-zinc-200">
        <h4 class="font-bold text-zinc-900 mb-2">Bundler</h4>
        <p class="text-sm text-zinc-600 leading-relaxed">
          <code>vite</code> configured in library mode. Emits dual ESM and UMD builds for optimal
          compatibility in both browser and Node.js environments.
        </p>
      </div>
      <div class="p-6 border border-zinc-200">
        <h4 class="font-bold text-zinc-900 mb-2">Versioning</h4>
        <p class="text-sm text-zinc-600 leading-relaxed">
          <code>@changesets/cli</code> automates semantic versioning bumps and changelog generation
          based on merged pull requests.
        </p>
      </div>
    </div>

    <h3 class="text-xl font-bold text-zinc-900 mb-6 tracking-tight">Command Line Interface</h3>
    <div class="space-y-8">
      <div class="flex flex-col md:flex-row gap-8 items-start">
        <div class="w-full md:w-1/3 shrink-0">
          <Text weight="bold" size="sm" class="mb-1"> Scaffold Plugin </Text>
          <Text size="xs" color="subtle" class="mb-4">
            Generates the package directory, TypeScript configuration, and Vite configuration, and
            automatically links it to the playground workspace.
          </Text>
        </div>
        <div class="w-full md:w-2/3">
          <CodeBlock :code="createPluginCode" title="Terminal" lang="text" />
        </div>
      </div>

      <div class="flex flex-col md:flex-row gap-8 items-start">
        <div class="w-full md:w-1/3 shrink-0">
          <Text weight="bold" size="sm" class="mb-1"> Remove Plugin </Text>
          <Text size="xs" color="subtle" class="mb-4">
            Safely unlinks the plugin from the workspace and playground, subsequently removing the
            package directory.
          </Text>
        </div>
        <div class="w-full md:w-2/3">
          <CodeBlock :code="removePluginCode" title="Terminal" lang="text" />
        </div>
      </div>
    </div>
  </DocsSection>
</template>
