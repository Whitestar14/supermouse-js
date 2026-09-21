---
title: React
description: useSupermouse and SupermouseProvider for React and Next.js.
section: Integrations
order: 2
package: @supermousejs/react
dependency: react >= 16.8
license: MIT
---

The React adapter exposes a context provider and a hook. The instance is created in an effect and destroyed on cleanup, which is what makes it safe under Strict Mode's double mount.

## Install

```bash
pnpm add @supermousejs/react @supermousejs/core @supermousejs/dot
```

## Root provider

`options` matches [SupermouseOptions](/docs/reference/options) and `plugins` is installed right after construction.

```tsx
import { SupermouseProvider } from "@supermousejs/react";
import { Dot } from "@supermousejs/dot";

export default function App() {
  return (
    <SupermouseProvider
      options={{ smoothness: 0.15, cursor: "custom" }}
      plugins={[Dot({ size: 8, color: "black" })]}
    >
      <YourAppContent />
    </SupermouseProvider>
  );
}
```

The effect runs once, so `options` and `plugins` are read on mount only. Changing them later does nothing; the engine was configured once.

## Reading the instance

`useSupermouse()` returns `{ instance, isEnabled }`. `instance` is `null` until the effect has run.

```tsx
import { useSupermouse } from "@supermousejs/react";

export const CustomButton = () => {
  const { instance } = useSupermouse();

  const log = () => {
    if (!instance) return;
    console.log("Cursor at:", instance.state.pointer);
  };

  return <button onClick={log}>Log position</button>;
};
```

Outside a provider the hook returns `{ instance: null, isEnabled: true }` rather than throwing, so a component can render before the provider mounts.

`isEnabled` tracks explicit `enable()` / `disable()` calls, because the adapter patches those methods. It does not reflect the engine's own hibernation on a coarse pointer — `instance.isEnabled` does.

## Next.js (App Router)

The engine touches `window`, so it has to be created on the client. The provider already does that from an effect; add the directive on the component that renders it:

```tsx
"use client";

import { SupermouseProvider } from "@supermousejs/react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SupermouseProvider options={{ smoothness: 0.15 }}>{children}</SupermouseProvider>
      </body>
    </html>
  );
}
```

## Strict Mode

React 18 runs effects twice in development: the provider constructs an engine, destroys it, and constructs another. Because the cleanup calls `destroy()`, you end up with one live instance and no duplicated stage elements.
