<script setup lang="ts">
import DocsSection from "@/components/docs/DocsSection.vue";
import CodeBlock from "@/components/shared/CodeBlock.vue";
import Callout from "@/components/shared/Callout.vue";
import SectionHeader from "@/components/shared/SectionHeader.vue";
import Text from "@/components/shared/Text.vue";
import ApiLink from "@/components/shared/ApiLink.vue";
import { GITHUB_URL } from "@config/constants";

const setupCode = `pnpm install
pnpm dev`;

const createPluginCode = "pnpm run create:plugin <name>";
const removePluginCode = "pnpm run remove:plugin <name>";
</script>

<template>
  <DocsSection label="Advanced" title="Contributing">
    <Text size="lg" class="mb-12">
      Supermouse is a plugin-first cursor runtime. Contributions are welcome — this page covers
      <span class="text-black font-bold border-b-2 border-black/10">what belongs in this repo</span
      >,
      <span class="text-black font-bold border-b-2 border-black/10">how to contribute code</span>,
      and
      <span class="text-black font-bold border-b-2 border-black/10">how the toolchain works</span>.
    </Text>

    <div class="mb-12">
      <a
        :href="GITHUB_URL"
        target="_blank"
        class="inline-flex h-12 items-center px-8 bg-black text-white font-bold text-sm hover:bg-zinc-800 transition-colors gap-3"
      >
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
          <path
            d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
          />
        </svg>
        View Repository on GitHub
      </a>
    </div>

    <!-- Scope Grid -->
    <SectionHeader :level="2"> What belongs in this repo </SectionHeader>
    <Text size="base" class="mb-8">
      This monorepo is intentionally conservative. It contains the core runtime and
      reference-quality plugin implementations only.
    </Text>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-px bg-zinc-200 border border-zinc-200 mb-12">
      <!-- Accepted -->
      <div class="bg-white p-8">
        <strong
          class="block text-zinc-900 font-bold uppercase tracking-widest text-xs mb-6 border-b border-zinc-100 pb-2"
          >We Accept PRs For</strong
        >
        <ul class="space-y-3 text-sm text-zinc-700">
          <li class="flex gap-3">
            <span class="text-zinc-900 font-bold">✓</span>
            <span>Core runtime fixes</span>
          </li>
          <li class="flex gap-3">
            <span class="text-zinc-900 font-bold">✓</span>
            <span>Performance improvements</span>
          </li>
          <li class="flex gap-3">
            <span class="text-zinc-900 font-bold">✓</span>
            <span>Bug fixes</span>
          </li>
          <li class="flex gap-3">
            <span class="text-zinc-900 font-bold">✓</span>
            <span>Documentation</span>
          </li>
          <li class="flex gap-3">
            <span class="text-zinc-900 font-bold">✓</span>
            <span
              ><strong>Reference-quality</strong> plugins that demonstrate an essential
              pattern</span
            >
          </li>
        </ul>
      </div>

      <!-- Rejected -->
      <div class="bg-zinc-50 p-8">
        <strong
          class="block text-zinc-400 font-bold uppercase tracking-widest text-xs mb-6 border-b border-zinc-200 pb-2"
          >We Do NOT Accept</strong
        >
        <ul class="space-y-3 text-sm text-zinc-700">
          <li class="flex gap-3">
            <span class="text-zinc-400 font-bold">×</span>
            <span>Niche visual effects</span>
          </li>
          <li class="flex gap-3">
            <span class="text-zinc-400 font-bold">×</span>
            <span>Framework-specific wrappers</span>
          </li>
          <li class="flex gap-3">
            <span class="text-zinc-400 font-bold">×</span>
            <span>Stylistic variants of existing plugins</span>
          </li>
          <li class="flex gap-3">
            <span class="text-zinc-400 font-bold">×</span>
            <span>Experimental or opinionated behavior</span>
          </li>
        </ul>
        <div class="mt-8 pt-6 border-t border-zinc-200 text-xs text-zinc-500">
          These belong as
          <router-link to="/docs/advanced/authoring" class="underline hover:text-black font-bold">
            external plugins </router-link
          >.
        </div>
      </div>
    </div>

    <Callout title="Not sure?"> Open a GitHub discussion before investing time in a PR. </Callout>

    <!-- Contributing Code -->
    <SectionHeader :level="2"> Contributing Code </SectionHeader>
    <ul class="space-y-4 text-zinc-600 mb-8 list-none pl-0 text-sm">
      <li class="flex gap-3">
        <span class="w-1.5 h-1.5 bg-black rounded-full mt-2 shrink-0" />
        <Text size="sm"> Use <strong>pnpm</strong>. </Text>
      </li>
      <li class="flex gap-3">
        <span class="w-1.5 h-1.5 bg-black rounded-full mt-2 shrink-0" />
        <Text size="sm"> Keep changes scoped to a single concern per PR. </Text>
      </li>
      <li class="flex gap-3">
        <span class="w-1.5 h-1.5 bg-black rounded-full mt-2 shrink-0" />
        <Text size="sm">
          Avoid introducing new abstractions without a clear performance or ergonomics
          justification.
        </Text>
      </li>
      <li class="flex gap-3">
        <span class="w-1.5 h-1.5 bg-black rounded-full mt-2 shrink-0" />
        <Text size="sm">
          The render loop is hot-path code — allocations and DOM reads inside
          <code>update()</code> are scrutinized. See
          <router-link to="/docs/advanced/architecture" class="underline font-bold hover:text-black"
            >Core Architecture</router-link
          >
          for the DOM Firewall contract.
        </Text>
      </li>
      <li class="flex gap-3">
        <span class="w-1.5 h-1.5 bg-black rounded-full mt-2 shrink-0" />
        <Text size="sm">
          Logic plugins must declare <ApiLink name="priority" to="priority" /> <code>&lt; 0</code>.
          Positive or zero priority causes visual tearing.
        </Text>
      </li>
    </ul>

    <div class="mb-16">
      <CodeBlock :code="setupCode" lang="bash" title="Setup" />
    </div>

    <!-- Toolchain Section -->
    <div class="border-t border-zinc-200 pt-12 mb-16">
      <SectionHeader :level="2"> Toolchain </SectionHeader>
      <Text size="base" class="mb-8">
        The monorepo includes a custom CLI to scaffold and remove plugin packages, keeping the
        workspace consistent.
      </Text>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div class="p-6 border border-zinc-200">
          <h4 class="font-bold text-zinc-900 mb-2">Workspace</h4>
          <p class="text-sm text-zinc-600 leading-relaxed">
            Managed with <code>pnpm</code>. Internal packages are linked via
            <code>workspace:*</code> for instant cross-package updates.
          </p>
        </div>
        <div class="p-6 border border-zinc-200">
          <h4 class="font-bold text-zinc-900 mb-2">Bundler</h4>
          <p class="text-sm text-zinc-600 leading-relaxed">
            <code>vite</code> in library mode. Emits dual ESM/UMD builds for browser and Node
            compatibility.
          </p>
        </div>
        <div class="p-6 border border-zinc-200">
          <h4 class="font-bold text-zinc-900 mb-2">Versioning</h4>
          <p class="text-sm text-zinc-600 leading-relaxed">
            <code>@changesets/cli</code> manages semver bumping and changelog generation from PRs.
          </p>
        </div>
      </div>

      <h3 class="text-xl font-bold text-zinc-900 mb-6 tracking-tight">CLI Scripts</h3>
      <div class="space-y-8">
        <div class="flex flex-col md:flex-row gap-8 items-start">
          <div class="w-full md:w-1/3 shrink-0">
            <Text weight="bold" size="sm" class="mb-1"> Scaffold Plugin </Text>
            <Text size="xs" color="subtle" class="mb-4">
              Creates the package folder, tsconfig, vite config, and links it to the playground.
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
              Unlinks from workspace and playground, then deletes the package directory.
            </Text>
          </div>
          <div class="w-full md:w-2/3">
            <CodeBlock :code="removePluginCode" title="Terminal" lang="text" />
          </div>
        </div>
      </div>
    </div>

    <!-- Philosophy Grid -->
    <div class="border-t border-zinc-200 pt-12">
      <SectionHeader :level="2"> Philosophy </SectionHeader>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-px bg-zinc-200 border border-zinc-200 mb-12">
        <div class="bg-white p-8">
          <span class="mono text-xs font-bold text-zinc-400 mb-2 block">01</span>
          <strong class="block text-zinc-900 font-bold text-sm mb-2">Predictable Behavior</strong>
          <p class="text-sm text-zinc-600 leading-relaxed">
            No hidden state. No side effects outside the plugin container. Input → Output.
          </p>
        </div>
        <div class="bg-white p-8">
          <span class="mono text-xs font-bold text-zinc-400 mb-2 block">02</span>
          <strong class="block text-zinc-900 font-bold text-sm mb-2">Explicit Data Flow</strong>
          <p class="text-sm text-zinc-600 leading-relaxed">
            Input → Logic → Physics → Render. One direction, every frame.
          </p>
        </div>
        <div class="bg-white p-8">
          <span class="mono text-xs font-bold text-zinc-400 mb-2 block">03</span>
          <strong class="block text-zinc-900 font-bold text-sm mb-2">Minimal Magic</strong>
          <p class="text-sm text-zinc-600 leading-relaxed">
            Explicit configuration over auto-guessing.
          </p>
        </div>
        <div class="bg-white p-8">
          <span class="mono text-xs font-bold text-zinc-400 mb-2 block">04</span>
          <strong class="block text-zinc-900 font-bold text-sm mb-2">Userland Extensibility</strong>
          <p class="text-sm text-zinc-600 leading-relaxed">
            The core is small. The ecosystem is not.
          </p>
        </div>
      </div>
    </div>
  </DocsSection>
</template>
