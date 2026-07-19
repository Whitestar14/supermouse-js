# @supermousejs/states

Logic controller that enables/disables other plugins based on hover attributes. The plugin names listed in `default` and `states` must match the registered `plugin.name` values you use in your app.

## Installation

```bash
pnpm add @supermousejs/states
```

## States

Logic controller that enables/disables other plugins based on hover attributes. The plugin names listed in `default` and `states` must match the registered `plugin.name` values you use in your app.

### Usage

```ts
import { Supermouse } from "@supermousejs/core";
import { States } from "@supermousejs/states";
const app = new Supermouse();
app.use(States({ default: ['dot'], states: { 'hover': ['ring'] } }));
```

### HTML Example

```html
<div data-supermouse-state="hover">
  <span class="dot"></span>
  <span class="ring"></span>
</div>
```

### Options

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| default | string[] | [] | List of plugin names active by default. |
| states | Record<string, string[]> | {} | Map of state names to lists of active plugins. |
| attribute | string | 'data-supermouse-state' | DOM attribute to trigger state changes. |

## Documentation

Full documentation and interactive playground available at [supermouse](https://supermouse.js.org) or [check out the repo](https://github.com/Whitestar14/supermouse-js).
