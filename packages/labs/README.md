# @supermousejs/labs

Advanced state machine that morphs SVGs based on semantic context.

## Installation

```bash
pnpm add @supermousejs/labs
```

## SmartIcon

Advanced state machine that morphs SVGs based on semantic context.

### Usage

```ts
import { Supermouse } from "@supermousejs/core";
import { SmartIcon } from '@supermousejs/labs';
const app = new Supermouse();
app.use(SmartIcon({ icons: { ... } }));
```

### Options

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| icons | Record<string, string> | {} | Map of state names to SVG strings. |
| defaultState | string | 'default' | Initial semantic state used before any hover interaction resolves. |
| useSemanticTags | boolean | true | Resolve smart states from semantic HTML tags such as links and buttons. |
| transitionDuration | number | 200 | Morph transition time in ms. |
| switchDelay | number | 80 | Minimum ms a state must be requested before committing to the next icon. |
| size | number | 24 | Size of the icon container. |
| color | string | 'black' | Icon fill color (currentColor). |
| offset | [number, number] | [0, 0] | Fixed offset. |
| anchor | string | 'center' | Alignment (center, top-left, etc). |
| followStrategy | 'smooth' | 'raw' | 'smooth' | Whether the icon should smoothly follow the pointer or snap to it. |
| rotateWithVelocity | boolean | false | Rotate the icon based on movement velocity. |

## SmartRing

A reactive ring that distorts with velocity and adapts to stuck elements.

### Usage

```ts
import { Supermouse } from "@supermousejs/core";
import { SmartRing } from '@supermousejs/labs';
const app = new Supermouse();
app.use(SmartRing({ size: 24, color: '#f59e0b', enableSkew: true }));
```

### Options

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| size | number | 20 | Base diameter. |
| hoverSize | number | 40 | Diameter on hover. |
| color | string | '#ffffff' | Border color used for the ring. |
| fill | string | 'transparent' | Background fill color applied to the ring. |
| borderWidth | number | 2 | Border thickness in pixels. |
| mixBlendMode | string | 'difference' | CSS mix-blend-mode applied to the ring element. |
| enableSkew | boolean | false | Distort shape based on velocity. |

## Sparkles

Emits particle trails based on movement velocity.

### Usage

```ts
import { Supermouse } from "@supermousejs/core";
import { Sparkles } from '@supermousejs/labs';
const app = new Supermouse();
app.use(Sparkles({ color: '#f59e0b', frequency: 10 }));
```

### Options

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| color | string | '#ff00ff' | Particle color. |
| count | number | 30 | Number of particles to keep in the pool. |
| frequency | number | 10 | Pixels per spawn. |
| decay | number | 0.05 | Fade rate. |
| scatter | number | 5 | Random position offset for particle spawning. |

## TextRing

Rotates text around the cursor position.

### Usage

```ts
import { Supermouse } from "@supermousejs/core";
import { TextRing } from '@supermousejs/labs';
const app = new Supermouse();
app.use(TextRing({ text: 'LOADING • ', radius: 40 }));
```

### Options

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| text | string | 'SUPERMOUSE • SUPERMOUSE • ' | Text content. |
| radius | number | 60 | Ring radius. |
| fontSize | number | 12 | Text size in pixels. |
| speed | number | 0.5 | Rotation speed deg/frame. |
| color | string | 'currentColor' | Text color used by the SVG ring. |
| opacity | number | 1 | Opacity of the rendered ring container. |
| className | string | '' | Optional CSS class added to the container. |
| spread | boolean | false | Stretch the text to fit around the full loop. |

## Documentation

Full documentation and interactive playground available at [supermouse](https://supermouse.js.org) or [check out the repo](https://github.com/Whitestar14/supermouse-js).
