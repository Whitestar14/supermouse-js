
# @supermousejs/react

React integration for Supermouse. Handles strict mode and cleanup automatically.

## Installation

```bash
pnpm add @supermousejs/react @supermousejs/core
```

## Usage

**In `App.tsx`:**

```tsx
import { SupermouseProvider } from '@supermousejs/react';
import { Dot } from '@supermousejs/dot';

export default function App() {
  return (
    <SupermouseProvider
      options={{ smoothness: 0.15 }}
      plugins={[ Dot({ size: 8 }) ]}
    >
      <YourApp />
    </SupermouseProvider>
  );
}
```

**In Components:**

```tsx
import { useSupermouse } from '@supermousejs/react';

const MyComponent = () => {
  const mouse = useSupermouse(); // Returns Supermouse instance or null
  return <div />;
};
```
