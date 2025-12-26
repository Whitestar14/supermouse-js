
# @supermousejs/labs

Experimental and advanced plugins for Supermouse.

## Included Plugins

### SmartIcon
Morphs SVG icons based on semantic tags (links, inputs) or context.

```ts
import { SmartIcon } from '@supermousejs/labs';
app.use(SmartIcon({ icons: { default: '...', pointer: '...' } }));
```

### SmartRing
A reactive ring that distorts with velocity and adapts to stuck elements.

```ts
import { SmartRing } from '@supermousejs/labs';
app.use(SmartRing({ enableSkew: true }));
```

### Sparkles
Emits particle trails based on movement velocity.

```ts
import { Sparkles } from '@supermousejs/labs';
app.use(Sparkles({ color: 'gold' }));
```

### TextRing
Rotates text around the cursor position.

```ts
import { TextRing } from '@supermousejs/labs';
app.use(TextRing({ text: 'LOADING • ' }));
```

## Documentation

Full documentation and interactive playground available at [supermouse](https://supermouse.vercel.app) or [check out the repo](https://github.com/Whitestar14/supermouse-js).
