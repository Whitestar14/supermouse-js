import type { ValueOrGetter, SupermousePlugin } from "@supermousejs/core";
import {
  definePlugin,
  normalizeAll,
  css,
  createActor,
  setTransform,
  path,
  text,
  textPath,
  circlePath,
  createSVGElement,
  Layers,
  circumference
} from "@supermousejs/utils";

export interface TextRingOptions {
  name?: string;
  isEnabled?: boolean;
  text?: ValueOrGetter<string>;
  radius?: ValueOrGetter<number>;
  fontSize?: ValueOrGetter<number>;
  speed?: ValueOrGetter<number>;
  color?: ValueOrGetter<string>;
  opacity?: ValueOrGetter<number>;
  className?: string;
  spread?: boolean;
}

function formatLoopText(text: string, spread: boolean): string {
  if (!spread) return text;
  return text + "\u00A0";
}

let instanceCount = 0;

/**
 * The SVG `textlength`/`lengthAdjust` attributes don't work/work reliably on Firefox-based browsers.
 *  So this implementation uses a workaround. Report: https://bugzilla.mozilla.org/show_bug.cgi?id=569722
 */
export const TextRing = (options: TextRingOptions = {}): SupermousePlugin => {
  let svgEl: SVGSVGElement;
  let pathEl: SVGPathElement;
  let textPathEl: SVGTextPathElement;
  let textEl: SVGTextElement;
  let textNode: Text;
  let measurer: SVGTextElement;

  const pathId = `supermouse-text-ring-path-${instanceCount++}`;

  const cfg = normalizeAll(options, {
    text: "SUPERMOUSE • SUPERMOUSE • ",
    radius: 60,
    fontSize: 12,
    speed: 30,
    opacity: 1,
    color: "currentColor"
  });

  const className = options.className ?? "";
  const spread = options.spread ?? true;

  let currentRotation = 0;
  let lastText = "";
  let lastRadius = 0;
  let lastFontSize = 0;

  return definePlugin<HTMLDivElement>(
    {
      name: options.name ?? "text-ring",
      selector: "[data-supermouse-text-ring]",

      create: (app) => {
        const container = createActor("div") as HTMLDivElement;
        css(container, {
          zIndex: Layers.FOLLOWER,
          transition: "opacity 0.2s ease",
          opacity: "1",
          width: "0px",
          height: "0px",
          overflow: "visible",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        });

        if (className) container.classList.add(...className.split(" ").filter(Boolean));

        svgEl = createSVGElement("svg");
        css(svgEl, {
          overflow: "visible",
          position: "absolute",
          left: "0",
          top: "0"
        });

        pathEl = path(undefined, { id: pathId, fill: "none" });

        const fontSize = cfg.fontSize(app.state);
        lastFontSize = fontSize;
        textEl = text({ "font-size": `${fontSize}px`, fill: "currentColor" });

        css(textEl, {
          textTransform: "uppercase",
          letterSpacing: "2px"
        });

        textPathEl = textPath(`#${pathId}`, { startOffset: "0%" });

        textNode = document.createTextNode("");
        textPathEl.appendChild(textNode);

        textEl.appendChild(textPathEl);
        svgEl.appendChild(pathEl);
        svgEl.appendChild(textEl);

        measurer = createSVGElement("text");
        css(measurer, {
          visibility: "hidden",
          position: "absolute",
          pointerEvents: "none",
          whiteSpace: "nowrap"
        });
        measurer.setAttribute("font-size", `${fontSize}px`);
        measurer.setAttribute("font-family", getComputedStyle(textEl).fontFamily || "sans-serif");
        measurer.setAttribute("font-weight", getComputedStyle(textEl).fontWeight || "normal");
        measurer.setAttribute("font-style", getComputedStyle(textEl).fontStyle || "normal");
        svgEl.appendChild(measurer);

        container.appendChild(svgEl);
        return container;
      },

      update: (app, container, dtMs) => {
        const dt = dtMs / 1000;
        let text = cfg.text(app.state);
        const radius = cfg.radius(app.state);
        const fontSize = cfg.fontSize(app.state);
        const speed = cfg.speed(app.state);
        const opacity = cfg.opacity(app.state);
        const color = cfg.color(app.state);

        css(container, { color, opacity: String(opacity) });

        const ia = app.state.interaction;
        if (ia.textRing && typeof ia.textRing === "string") text = ia.textRing;
        else if (ia.text && typeof ia.text === "string") text = ia.text;

        if (radius !== lastRadius) {
          pathEl.setAttribute("d", circlePath(radius));
          const diameter = radius * 2;
          css(svgEl, {
            width: `${diameter}px`,
            height: `${diameter}px`
          });
          lastRadius = radius;
        }

        const displayText = formatLoopText(text, spread);

        if (fontSize !== lastFontSize) {
          textEl.setAttribute("font-size", `${fontSize}px`);
          measurer.setAttribute("font-size", `${fontSize}px`);
          lastFontSize = fontSize;
        }

        if (displayText !== lastText) {
          textNode.textContent = displayText;
          lastText = displayText;
        }

        if (spread) {
          const circum = circumference(radius);

          measurer.textContent = displayText;
          const naturalWidth = measurer.getComputedTextLength();

          const charCount = displayText.length;
          if (charCount > 1) {
            const extraSpace = circum - naturalWidth;
            const spacingPerGap = extraSpace / (charCount - 1);
            css(textEl, { letterSpacing: `${spacingPerGap}px` });
          } else {
            css(textEl, { letterSpacing: "0px" });
          }

          textEl.removeAttribute("textLength");
          textPathEl.removeAttribute("textLength");
          textPathEl.removeAttribute("lengthAdjust");
        } else {
          css(textEl, { letterSpacing: "2px" });
          textEl.removeAttribute("textLength");
          textPathEl.removeAttribute("textLength");
          textPathEl.removeAttribute("lengthAdjust");
        }

        currentRotation += speed * dt;
        const { x, y } = app.state.smooth;
        setTransform(container, x, y, currentRotation);
      }
    },
    options
  );
};
