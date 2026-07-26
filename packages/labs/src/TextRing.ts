import type { ValueOrGetter, Supermouse } from "@supermousejs/core";
import { definePlugin, normalize, dom, Layers } from "@supermousejs/utils";
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

export const TextRing = (options: TextRingOptions = {}) => {
  let svg: SVGSVGElement;
  let pathEl: SVGPathElement;
  let textPathEl: SVGTextPathElement;
  let textEl: SVGTextElement;
  let textNode: Text;

  const pathId = `supermouse-text-ring-path-${instanceCount++}`;

  const getText = normalize(options.text, "SUPERMOUSE • SUPERMOUSE • ");
  const getRadius = normalize(options.radius, 60);
  const getFontSize = normalize(options.fontSize, 12);
  const getSpeed = normalize(options.speed, 0.5);
  const getOpacity = normalize(options.opacity, 1);
  const getColor = normalize(options.color, "currentColor");

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

      create: (app) => {
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

        const fs = getFontSize(app.state);
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

      update: (app, container) => {
        let text = getText(app.state);
        const radius = getRadius(app.state);
        const fontSize = getFontSize(app.state);
        const speed = getSpeed(app.state);
        const opacity = getOpacity(app.state);

        dom.css(container, {
          opacity: String(opacity),
          color: getColor(app.state)
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
