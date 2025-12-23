# contributing to supermouse

supermouse is a modular cursor engine with a plugin-first architecture.
contributions are welcome, but not required to participate in the ecosystem.

this document explains **how to contribute**, **what belongs in this repo**, and **what does not**.

## what belongs in this repo

this monorepo is intentionally conservative.

**we accept PRs for:**

* core runtime fixes
* performance improvements
* bug fixes
* documentation
* *reference-quality* plugins that demonstrate an essential pattern

**we usually do NOT accept PRs for:**

* niche visual effects
* framework-specific wrappers
* stylistic variants of existing plugins
* experimental or opinionated behavior

those should live as **external plugins** (see [`PLUGINS.md`](./PLUGINS.md)).

> if you’re unsure, open a discussion first. no pressure.

## contributing code

* use pnpm
* keep changes scoped
* avoid introducing new abstractions without a clear perf or ergonomics win
* cursor logic is hot-path code. allocations and layout reads are scrutinized.

```bash
pnpm install
pnpm dev
```

## philosophy

supermouse optimizes for:

* predictable behavior
* explicit data flow
* minimal magic
* userland extensibility over core bloat

if a feature can be a plugin, it probably should be.