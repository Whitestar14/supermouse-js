import type { ValueOrGetter, SupermouseInstance, SupermousePlugin } from "@supermousejs/core";
import { definePlugin, normalizeAll, dom, Layers } from "@supermousejs/utils";
import { getCirclePath, getCircumference, formatLoopText } from "@supermousejs/zoetrope";

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

let instanceCount = 0;

export const TextRing = (options: TextRingOptions = {}): SupermousePlugin => {
  let svg: SVGSVGElement;
  let pathEl: SVGPathElement;
  let textPathEl: SVGTextPathElement;
  let textEl: SVGTextElement;
  let textNode: Text;

  const pathId = `supermouse-text-ring-path-${instanceCount++}`;

  const cfg = normalizeAll(options, {
    text: "SUPERMOUSE • SUPERMOUSE • ",
    radius: 60,
    fontSize: 12,
    speed: 0.5,
    opacity: 1,
    color: "currentColor"
  });

  const className = options.className ?? "";
  const spread = options.spread ?? false;

  let currentRotation = 0;
  let lastText = "";
  let lastRadius = 0;
  let lastFontSize = 0;

  return definePlugin<HTMLDivElement>(
    {
      name: options.name ?? "text-ring",
      selector: "[data-supermouse-text-ring]",

      create: (app: SupermouseInstance) => {
        const container = dom.createActor("div") as HTMLDivElement;
        dom.css(container, {
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

        if (className) {
          container.classList.add(...className.split(" ").filter(Boolean));
        }

        svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        // dom.css expects an HTMLElement; cast the SVG element to satisfy TypeScript
        dom.css(svg, {
          overflow: "visible",
          position: "absolute",
          left: "0",
          top: "0"
        });

        pathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
        pathEl.setAttribute("id", pathId);
        pathEl.setAttribute("fill", "none");

        textEl = document.createElementNS("http://www.w3.org/2000/svg", "text");

        const fs = cfg.fontSize(app.state);
        textEl.setAttribute("font-size", `${fs}px`);
        lastFontSize = fs;

        textEl.setAttribute("fill", "currentColor");
        textEl.style.textTransform = "uppercase";
        textEl.style.letterSpacing = "2px";

        textPathEl = document.createElementNS("http://www.w3.org/2000/svg", "textPath");
        textPathEl.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", `#${pathId}`);
        textPathEl.setAttribute("href", `#${pathId}`);
        textPathEl.setAttribute("startOffset", "0%");

        textNode = document.createTextNode("");

        textPathEl.appendChild(textNode);
        textEl.appendChild(textPathEl);
        svg.appendChild(pathEl);
        svg.appendChild(textEl);
        container.appendChild(svg);

        return container;
      },

      update: (app: SupermouseInstance, container: HTMLDivElement) => {
        let text = cfg.text(app.state);
        const radius = cfg.radius(app.state);
        const fontSize = cfg.fontSize(app.state);
        const speed = cfg.speed(app.state);
        const opacity = cfg.opacity(app.state);
        const color = cfg.color(app.state);

        dom.css(container, {
          color,
          opacity: String(opacity)
        });

        const ia = app.state.interaction;
        if (ia.textRing && typeof ia.textRing === "string") {
          text = ia.textRing;
        } else if (ia.text && typeof ia.text === "string") {
          text = ia.text;
        }

        if (radius !== lastRadius) {
          pathEl.setAttribute("d", getCirclePath(radius));
          lastRadius = radius;
        }

        if (spread) {
          const circum = getCircumference(radius);
          textPathEl.setAttribute("textLength", String(circum));
          textPathEl.setAttribute("lengthAdjust", "spacing");
          text = formatLoopText(text, true);
        } else {
          textPathEl.removeAttribute("textLength");
          textPathEl.removeAttribute("lengthAdjust");
        }

        if (fontSize !== lastFontSize) {
          textEl.setAttribute("font-size", `${fontSize}px`);
          lastFontSize = fontSize;
        }

        if (text !== lastText) {
          textNode.textContent = text;
          lastText = text;
        }

        currentRotation += speed;
        const { x, y } = app.state.smooth;
        dom.setTransform(container, x, y, currentRotation);
      }
    },
    options
  );
};
