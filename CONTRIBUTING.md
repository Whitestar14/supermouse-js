# Contributing

**We accept PRs for:**

- Core runtime fixes
- Performance improvements
- Bug fixes
- Documentation
- _Reference-quality_ plugins that demonstrate an essential pattern

**We usually do not accept PRs for:**

- Niche visual effects
- Framework-specific wrappers
- Stylistic variants of existing plugins
- Experimental or opinionated behavior

Those should live as external plugins. see [`Writing Plugins`](./PLUGINS.md)

> If you’re unsure, open a discussion first.

## Contributing code

- Use pnpm
- Keep changes scoped
- Avoid introducing new abstractions without a clear perf or ergonomics win
- Cursor logic is hot-path code. allocations and layout reads are scrutinized.

```bash
pnpm install
pnpm dev
```
