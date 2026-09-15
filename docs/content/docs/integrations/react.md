---
title: React Integration
description: useSupermouse hook and SupermouseProvider for React and Next.js.
section: Integrations
order: 2
package: @supermousejs/react
dependency: react >= 16.8
license: MIT
---

The React adapter exposes a `SupermouseProvider` context and a `useSupermouse`
hook. The engine is created in an effect and destroyed on cleanup, which makes
it safe under React 18 Strict Mode's double mount.

## Installation

```bash
pnpm add @supermousejs/react @supermousejs/core @supermousejs/dot
```

## Root provider

Wrap your app in `SupermouseProvider`. `options` matches
[SupermouseOptions](/docs/reference/options) and `plugins` is installed
immediately after construction.

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

## Reading the instance

`useSupermouse()` returns `{ instance, isEnabled }`. `instance` is `null` until
the effect runs, and `isEnabled` stays in sync when you call `enable()` /
`disable()`.

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

Outside the provider the hook falls back to `{ instance: null, isEnabled: true }`
rather than throwing, so components can render before the provider mounts.

## Next.js (App Router)

Supermouse touches `window`, so the engine must be created on the client. The
provider already does this from an effect — add the `"use client"` directive to
the component that renders it:

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

React 18 runs effects twice in development: the provider constructs an engine,
destroys it, then constructs another. Because the cleanup calls `destroy()`,
you end up with exactly one live instance and no duplicated stage elements.
