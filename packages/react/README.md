# @supermousejs/react

React integration for Supermouse.

## Installation

```bash
pnpm add @supermousejs/react @supermousejs/core
```

## Usage

In `App.tsx`/root file:

```tsx
import { SupermouseProvider } from "@supermousejs/react";
import { Dot } from "@supermousejs/dot";

export default function App() {
  return (
    <SupermouseProvider options={{ smoothness: 0.15 }} plugins={[Dot({ size: 8 })]}>
      <YourApp />
    </SupermouseProvider>
  );
}
```

In your components:

```tsx
import { useSupermouse } from "@supermousejs/react";

const MyComponent = () => {
  const { instance, isEnabled } = useSupermouse();

  return (
    <div>
      <p>Cursor enabled: {isEnabled ? "Yes" : "No"}</p>
      <button onClick={() => instance?.disable()}>Disable</button>
    </div>
  );
};
```

`useSupermouse()` returns:

- `instance`: The `Supermouse` instance, or `null` before initialization.
- `isEnabled`: A React state boolean that stays in sync with `enable()` / `disable()`.

## Documentation

Full documentation and interactive playground: [supermouse.js.org](https://supermouse.js.org)
Repository: [github.com/Whitestar14/supermouse-js](https://github.com/Whitestar14/supermouse-js)
