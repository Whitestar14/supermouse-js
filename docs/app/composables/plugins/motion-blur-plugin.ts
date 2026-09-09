import { definePlugin, dom, svg, Layers } from "@supermousejs/utils";

export interface MotionBlurOptions {
  name?: string;
  isEnabled?: boolean;
  cursorSize?: number;
  cursorColor?: string;
  intensity?: number;
  maxSpread?: number;
}

export const MotionBlur = (options: MotionBlurOptions = {}) => {
  const cursorSize = options.cursorSize ?? 8;
  const cursorColor = options.cursorColor ?? "#ffffff";
  const intensity = options.intensity ?? 0.5;
  const maxSpread = options.maxSpread ?? 40;

  let svgEl: SVGSVGElement;
  let groupEl: SVGGElement;
  let blurEl: SVGFEGaussianBlurElement;

  return definePlugin<SVGSVGElement>(
    {
      name: options.name || "motion-blur",

      create: () => {
        svgEl = svg.createSVGElement("svg", {
          width: cursorSize * 4,
          height: cursorSize * 4,
          viewBox: `0 0 ${cursorSize * 4} ${cursorSize * 4}`
        });

        dom.css(svgEl, {
          position: "absolute",
          top: "0",
          left: "0",
          width: `${cursorSize * 4}px`,
          height: `${cursorSize * 4}px`,
          pointerEvents: "none",
          overflow: "visible",
          zIndex: String(Layers.CURSOR)
        });

        const filterId = `supermouse-motion-blur-${Math.random().toString(36).slice(2)}`;
        blurEl = svg.gaussianBlur("0 0");
        const filterEl = svg.filter(
          filterId,
          {
            x: "-100%",
            y: "-100%",
            width: "400%",
            height: "400%"
          },
          [blurEl]
        );

        svgEl.appendChild(filterEl);

        groupEl = svg.group();
        svgEl.appendChild(groupEl);

        const center = cursorSize * 2;
        const circleEl = svg.circle({
          cx: center,
          cy: center,
          r: cursorSize / 2,
          fill: cursorColor,
          filter: `url(#${filterId})`
        });
        groupEl.appendChild(circleEl);

        return svgEl;
      },

      update: (app) => {
        const { velocity, displacement, smooth, isDown } = app.state;

        if (!app.state.hasReceivedInput) {
          svgEl.style.opacity = "0";
          return;
        }

        svgEl.style.opacity = "1";

        const speed = Math.hypot(velocity.x, velocity.y);
        const distance = Math.hypot(displacement.x, displacement.y);
        const center = cursorSize * 2;
        const scale = isDown ? 0.75 : 1;

        if (speed > 0.1) {
          const angle = (Math.atan2(velocity.y, velocity.x) * 180) / Math.PI;
          const spread = Math.min(distance * intensity, maxSpread);

          blurEl.setAttribute("stdDeviation", `${spread} 0`);
          groupEl.setAttribute("transform", `rotate(${angle} ${center} ${center})`);
        } else {
          blurEl.setAttribute("stdDeviation", "0 0");
          groupEl.setAttribute("transform", "");
        }

        dom.setTransform(svgEl, smooth.x, smooth.y, 0, scale, scale);
      },

      cleanup: () => {
        svgEl?.remove();
      }
    },
    options
  );
};
