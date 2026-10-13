import type { SupermouseInstance, SupermousePlugin, ValueOrGetter } from "@supermousejs/core";
import { definePlugin, normalizeAll, css, setTransform, damp, Layers } from "@supermousejs/utils";

export interface PixelOptions {
  name?: string;
  isEnabled?: boolean;
  /** Which sprite from the built-in set to draw. */
  sprite?: ValueOrGetter<string>;
  /** Pixels per sprite pixel. The sprite is scaled by whole numbers only. */
  cell?: ValueOrGetter<number>;
  /** Grid pitch the position snaps to. `0` leaves the cursor free. */
  snap?: ValueOrGetter<number>;
  primary?: ValueOrGetter<string>;
  /** Second palette slot. Unused sprite pixels are drawn with it. */
  secondary?: ValueOrGetter<string>;
  /** Turn to face the direction of travel. */
  flip?: boolean;
  blend?: string;
  zIndex?: string;
}

/**
 * The sprites are 8×8 bitmaps written as rows of characters: `.` is empty, `1`
 * is the primary colour, `2` the secondary. Keeping them as strings means the
 * art is editable in place, and the character map doubles as the palette.
 */
const SPRITES: Record<string, string[]> = {
  arrow: [
    "1.......",
    "11......",
    "111.....",
    "1111....",
    "11111...",
    "111.....",
    "11.11...",
    "1...11.."
  ],
  heart: [
    ".11..11.",
    "11111111",
    "11111111",
    "11111111",
    ".111111.",
    "..1111..",
    "...11...",
    "........"
  ],
  star: [
    "...11...",
    "...11...",
    "11111111",
    ".111111.",
    "..1111..",
    "..1111..",
    ".11..11.",
    ".1....1."
  ],
  ghost: [
    "..1111..",
    ".111111.",
    "11211211",
    "11211211",
    "11111111",
    "11111111",
    "11111111",
    "1.1..1.1"
  ]
};

const SPRITE_NAMES = Object.keys(SPRITES);
const GRID = 8;

/**
 * A bitmap cursor: an 8×8 sprite drawn into a canvas that is scaled up with
 * `image-rendering: pixelated`, so it stays hard-edged at any cell size, and
 * snapped to a grid so the whole thing lands on whole pixels.
 *
 * The canvas backing store never changes size — only the CSS box does — which
 * is why `cell` is a live option: scaling a sprite is a style change, and
 * redrawing is only needed when the sprite or a palette slot actually changes.
 */
export const Pixel = (options: PixelOptions = {}): SupermousePlugin => {
  const cfg = normalizeAll(options, {
    sprite: "arrow",
    cell: 8,
    snap: 0,
    primary: "#f59e0b",
    secondary: "#08080a"
  });

  let ctx: CanvasRenderingContext2D | null = null;
  /** `sprite|primary|secondary` — cheap guard against redrawing every frame. */
  let painted = "";
  let facing = 1;
  let pressScale = 1;

  const paint = (sprite: string, primary: string, secondary: string): void => {
    const rows = SPRITES[sprite] ?? SPRITES[SPRITE_NAMES[0]];
    const signature = `${sprite}|${primary}|${secondary}`;
    if (!ctx || signature === painted) return;

    ctx.clearRect(0, 0, GRID, GRID);
    for (let y = 0; y < GRID; y++) {
      const row = rows[y] ?? "";
      for (let x = 0; x < GRID; x++) {
        const slot = row[x];
        if (slot !== "1" && slot !== "2") continue;
        ctx.fillStyle = slot === "1" ? primary : secondary;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    painted = signature;
  };

  return definePlugin<HTMLCanvasElement>(
    {
      name: options.name ?? "pixel",

      create: () => {
        const el = document.createElement("canvas");
        el.width = GRID;
        el.height = GRID;
        ctx = el.getContext("2d");
        css(el, {
          position: "absolute",
          top: "0",
          left: "0",
          display: "block",
          pointerEvents: "none",
          imageRendering: "pixelated",
          willChange: "transform",
          mixBlendMode: options.blend ?? "normal",
          zIndex: options.zIndex ?? Layers.CURSOR
        });
        return el;
      },

      onEnable: () => {
        painted = "";
        facing = 1;
        pressScale = 1;
      },

      update: (app: SupermouseInstance, el: HTMLCanvasElement, dtMs: number) => {
        const state = app.state;

        if (!state.hasReceivedInput) {
          css(el, { opacity: "0" });
          return;
        }
        css(el, { opacity: "1" });

        // Whole pixels only: a fractional cell puts the sprite's own grid on
        // half pixels, which is the one thing `pixelated` cannot rescue.
        const cell = Math.max(1, Math.round(cfg.cell(state)));
        const size = GRID * cell;

        paint(cfg.sprite(state), cfg.primary(state), cfg.secondary(state));
        css(el, { width: `${size}px`, height: `${size}px` });

        // Snap in the *centre* of the sprite's own grid: snapping the top-left
        // corner would drift the sprite half a cell off the pointer.
        const snap = cfg.snap(state);
        const half = size / 2;
        const snapTo = (value: number): number =>
          snap > 0 ? Math.round((value - half) / snap) * snap + half : value;

        // Velocity is pixels per second, so this is a deliberate change of
        // direction rather than any tremor on the way across the screen.
        if (options.flip !== false) {
          if (state.velocity.x > 120) facing = 1;
          else if (state.velocity.x < -120) facing = -1;
        }

        const target = state.isDown ? 0.85 : 1;
        pressScale = damp(pressScale, target, 24, dtMs / 1000);

        // A canvas is an ordinary CSS box, so `setTransform`'s `translate(-50%,
        // -50%)` plus the default `transform-origin: 50% 50%` cancel out and the
        // negated scale flips the sprite about its own centre. Reordering those
        // functions to "look" more centred is the bug, not the fix.
        setTransform(
          el,
          snapTo(state.smooth.x),
          snapTo(state.smooth.y),
          0,
          facing * pressScale,
          pressScale
        );
      },

      destroy: () => {
        ctx = null;
        painted = "";
      }
    },
    options
  );
};
