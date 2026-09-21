import { defineAsyncComponent, type Component } from "vue";

export interface Lab {
  id: string;
  label: string;
  /** The one or two things this page exists to test. */
  question: string;
  bg: string;
  ink: string;
  accent: string;
  component: Component;
}

/** Each lab is its own chunk — the fragmentation is real, not cosmetic. */
const chunk = (load: () => Promise<Component>): Component => defineAsyncComponent(load);

export const LABS: Lab[] = [
  {
    id: "scopes",
    label: "Scopes",
    question: "One instance, four regions. Does the innermost scope win, every time?",
    bg: "#101014",
    ink: "#f4f4f5",
    accent: "#f59e0b",
    component: chunk(() => import("../labs/LabScopes.vue"))
  },
  {
    id: "speed",
    label: "Speed",
    question: "smoothness is inverse response. Where does the cursor actually sit?",
    bg: "#0f1412",
    ink: "#e7f5ee",
    accent: "#34d399",
    component: chunk(() => import("../labs/LabSpeed.vue"))
  },
  {
    id: "frames",
    label: "Frames",
    question: "What does a frame cost, and is the damping deterministic when you drive it by hand?",
    bg: "#0d1017",
    ink: "#e6edf7",
    accent: "#60a5fa",
    component: chunk(() => import("../labs/LabFrames.vue"))
  },
  {
    id: "modes",
    label: "Modes",
    question: "Four cursor modes against inputs, editors and opt-outs.",
    bg: "#141014",
    ink: "#f6e9f6",
    accent: "#e879f9",
    component: chunk(() => import("../labs/LabModes.vue"))
  },
  {
    id: "interaction",
    label: "Interaction",
    question: "rules, data-* attributes, inheritance, and who wins on the same element.",
    bg: "#141310",
    ink: "#f7f0e2",
    accent: "#fbbf24",
    component: chunk(() => import("../labs/LabInteraction.vue"))
  },
  {
    id: "plugins",
    label: "Plugins",
    question: "The live plugin list, in the order the core runs it.",
    bg: "#101414",
    ink: "#e6f4f4",
    accent: "#22d3ee",
    component: chunk(() => import("../labs/LabPlugins.vue"))
  },
  {
    id: "shape",
    label: "Shape",
    question: "Stick measures once and publishes; SmartRing morphs. Does Dot stand down?",
    bg: "#141012",
    ink: "#f7e8ed",
    accent: "#fb7185",
    component: chunk(() => import("../labs/LabShape.vue"))
  },
  {
    id: "teardown",
    label: "Teardown",
    question: "Mount, destroy, repeat. What leaks: stage elements, stylesheet, listeners?",
    bg: "#111110",
    ink: "#f2f1ec",
    accent: "#a3a3a3",
    component: chunk(() => import("../labs/LabTeardown.vue"))
  }
];
