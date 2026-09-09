import { provideSupermouse, type SupermouseContext } from "@supermousejs/vue";
import { SmartIcon, SmartRing } from "@supermousejs/labs";
import { Icon } from "@supermousejs/icon";
import { Text } from "@supermousejs/text";
import { States } from "@supermousejs/states";
import { SpotlightReveal } from "./plugins/spotlight-reveal-plugin";
// import { GlitchCursor } from "./plugins/glitch-plugin";
// import { MotionBlur } from "./plugins/motion-blur-plugin";

const LOGO_CURSOR = `
<svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g transform="rotate(-45 16 16)">
    <path d="M25,30a5.82,5.82,0,0,1-1.09-.17l-.2-.07-7.36-3.48a.72.72,0,0,0-.35-.08.78.78,0,0,0-.33.07L8.24,29.54a.66.66,0,0,1-.2.06,5.17,5.17,0,0,1-1,.15,3.6,3.6,0,0,1-3.29-5L12.68,4.2a3.59,3.59,0,0,1,6.58,0l9,20.74A3.6,3.6,0,0,1,25,30Z" fill="#F2F5F8" />
    <path d="M16,3A2.59,2.59,0,0,1,18.34,4.6l9,20.74A2.59,2.59,0,0,1,25,29a5.42,5.42,0,0,1-.86-.15l-7.37-3.48a1.84,1.84,0,0,0-.77-.17,1.69,1.69,0,0,0-.73.16l-7.4,3.31a5.89,5.89,0,0,1-.79.12,2.59,2.59,0,0,1-2.37-3.62L13.6,4.6A2.58,2.58,0,0,1,16,3m0-2h0A4.58,4.58,0,0,0,11.76,3.8L2.84,24.33A4.58,4.58,0,0,0,7,30.75a6.08,6.08,0,0,0,1.21-.17,1.87,1.87,0,0,0,.4-.13L16,27.18l7.29,3.44a1.64,1.64,0,0,0,.39.14A6.37,6.37,0,0,0,25,31a4.59,4.59,0,0,0,4.21-6.41l-9-20.75A4.62,4.62,0,0,0,16,1Z" fill="#111920" />
  </g>
</svg>`;

const HAND_CURSOR = `
<svg
   viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" xmlns:svg="http://www.w3.org/2000/svg">
  <path
     style="font-variation-settings:'wght' 531;fill:#f2f5f8;fill-opacity:1;stroke:#f2f5f8;stroke-width:0.250576;stroke-linecap:round;stroke-linejoin:round;stroke-opacity:1"
     d="m 7.9792347,14.441989 c 0.5167628,-0.931123 1.4431588,-1.614802 2.1367133,-2.435337 0.362833,-0.913694 1.778049,0.178134 1.794927,-1.122673 0.346767,-0.545683 1.786757,-0.262055 2.475945,-0.258027 0.296205,1.204856 1.90961,0.447832 1.546505,-0.594042 0.503967,-0.06601 1.265389,0.159486 1.871945,0.208107 0.945622,-0.07066 0.457869,0.709233 -0.253122,0.739927 -3.178673,1.223257 -6.35553,2.451709 -9.543735,3.649874 L 7.979231,14.441973 Z"
     id="path5" />
  <path
     d="m 19.19337,10.422652 c -0.09711,-1.0782577 0.206552,-2.3349767 -0.640306,-3.1875657 -1.024167,-1.1381718 -3.128993,-0.4961632 -3.36326,1.011015 -0.07489,0.530775 -0.0271,1.072499 -0.04063,1.60749"
     fill="#f2f5f8"
     id="path1" />
  <path
     d="M 15.149171,10.494475 C 15.080361,9.5035383 15.360143,8.4215383 14.807602,7.5309523 14.033511,6.2511817 11.863737,6.4093438 11.343634,7.8333883 11.07352,8.7223793 11.239345,9.6851463 11.19337,10.604972"
     fill="#f2f5f8"
     id="path2" />
  <path
     d="M 11.149171,10.903315 C 11.142349,8.5838563 11.162857,6.2637079 11.138845,3.9446829 11.055926,2.4107194 9.0121807,1.5729656 7.8755412,2.605877 6.8845424,3.3763725 7.2037304,4.6889159 7.1557429,5.7723516 c 0.012543,3.0979827 0.025085,6.1959644 0.037627,9.2939464"
     fill="#f2f5f8"
     id="path3" />
  <path
     d="m 19.149171,10.38674 c -0.0061,-1.2031467 -0.173056,-3.0462617 1.308017,-3.4446442 1.253527,-0.389575 2.716393,0.6754235 2.564525,2.0147555 0.02501,2.3365727 0.145852,4.6745337 0.101138,7.0101187 -0.260813,3.772461 -3.610753,6.942784 -7.357586,7.158868 -2.286047,0.01887 -4.726008,0.252391 -6.7943164,-0.925886 -1.5932398,-0.920377 -2.7378182,-2.397557 -4.0631747,-3.642178 -0.6749977,-0.777503 -1.6982609,-1.3672 -1.880125,-2.454872 -0.2296297,-1.529714 1.6747678,-2.872134 3.001541,-1.984219 0.3851937,0.295455 0.7901229,0.5636 1.1918046,0.837118"
     fill="#f2f5f8"
     id="path4" />
</svg>`;

const GRAB_CURSOR = `<svg fill="none" stroke="black" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" version="1.1" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
 <g fill="#f2f5f8">
  <path d="m7.9792 14.442c0.51676-0.93112 1.4432-1.6148 2.1367-2.4353 0.36283-0.91369 1.778 0.17813 1.7949-1.1227 0.34677-0.54568 1.7868-0.26206 2.4759-0.25803 0.2962 1.2049 1.9096 0.44783 1.5465-0.59404 0.50397-0.06601 1.2654 0.15949 1.8719 0.20811 0.94562-0.07066 0.45787 0.70923-0.25312 0.73993-3.1787 1.2233-6.3555 2.4517-9.5437 3.6499l-0.029182-0.18784z" stroke="#f2f5f8" stroke-linecap="round" stroke-linejoin="round" stroke-width=".25058" style="font-variation-settings:'wght' 531"/>
  <path d="m19.193 10.423c-0.22454-6.303 0.16407-6.6677-0.68278-7.5203-1.0242-1.1382-3.129-0.49616-3.3633 1.011-0.07489 0.53078 0.01538 5.4052 0.0018 5.9402"/>
  <path d="m15.149 10.494c-0.026332-6.3007 0.21097-6.5331-0.34157-7.4237-0.77409-1.2798-2.9439-1.1216-3.464 0.30244-0.39755 1.0589-0.18924 1.7668-0.15026 7.2318"/>
  <path d="m11.149 10.903c-0.006822-2.3195 0.013686-4.6396-0.010326-6.9586-0.082919-1.534-2.1267-2.3717-3.2633-1.3388-0.991 0.7705-0.67181 2.083-0.7198 3.1665 0.012543 3.098 0.025085 6.196 0.037627 9.2939"/>
  <path d="m19.149 10.387c-0.17601-5.8332-0.25801-7.0817 1.2231-7.48 1.2535-0.38958 2.7164 0.67542 2.5645 2.0148 0.02501 2.3366 0.23081 8.7099 0.18609 11.046-0.26081 3.7725-3.6108 6.9428-7.3576 7.1589-2.286 0.01887-4.726 0.25239-6.7943-0.92589-1.5932-0.92038-2.7378-2.3976-4.0632-3.6422-0.675-0.7775-1.6983-1.3672-1.8801-2.4549-0.22963-1.5297 1.6748-2.8721 3.0015-1.9842 0.38519 0.29546 0.79012 0.5636 1.1918 0.83712"/>
 </g>
</svg>
`;

const TEXT_CURSOR = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 4V20" stroke="#F2F5F8" stroke-width="4" stroke-linecap="square"/>
<path d="M12 4V20" stroke="black" stroke-width="2" stroke-linecap="square"/>
<path d="M8 4H16" stroke="#F2F5F8" stroke-width="4" stroke-linecap="square"/>
<path d="M8 4H16" stroke="black" stroke-width="2" stroke-linecap="square"/>
<path d="M8 20H16" stroke="#F2F5F8" stroke-width="4" stroke-linecap="square"/>
<path d="M8 20H16" stroke="black" stroke-width="2" stroke-linecap="square"/>
</svg>`;

const ARROW_CURSOR =
  '<svg viewBox="0 0 24 24" fill="none" stroke="#F2F5F8" stroke-width="2"><path stroke-linecap="square" stroke-linejoin="miter" d="M5 12h14M12 5l7 7-7 7"/></svg>';

export function useAppCursor(): SupermouseContext {
  return provideSupermouse(
    {
      smoothness: 0.05,
      enableTouch: false
    },
    [
      SmartIcon({
        name: "default-icon",
        icons: {
          default: LOGO_CURSOR,
          pointer: HAND_CURSOR,
          text: TEXT_CURSOR,
          grab: GRAB_CURSOR
        },
        size: 32,
        color: "black",
        anchor: "center",
        rotateWithVelocity: false
      }),
      SpotlightReveal({
        selector: ".spotlight-container",
        maxRadius: 250,
        expandSpeed: 0.08
      }),
      SmartRing({
        name: "playground-card-bg",
        size: 64,
        hoverSize: 64,
        fill: "black",
        color: "black",
        borderWidth: 0,
        mixBlendMode: "normal"
      }),
      Icon({
        name: "playground-card-arrow",
        svg: ARROW_CURSOR,
        size: 24,
        color: "white"
      }),
      Text({
        offset: [30, 30],
        duration: 150,
        className: "supermouse-tooltip-cursor"
      }),
      States({
        default: ["default-icon", "text", "glitch", "motion-blur"],
        states: {
          "playground-card": ["playground-card-bg", "playground-card-arrow"]
        }
      })
      // GlitchCursor({
      //   name: "glitch",
      //   cursorSize: 15,
      //   glitchColorB: "#00feff",
      //   glitchColorR: "#ff4f71"
      // })
      // MotionBlur({
      //   name: "motion-blur",
      //   cursorSize: 16,
      //   cursorColor: "#000000",
      //   intensity: 0.4,
      //   maxSpread: 60
      // })
    ]
  );
}
