import { ref } from "vue";

export interface RightSidebarConfig {
  component: any;
  props: any;
  on: any;
}

const rightSidebarConfig = ref<RightSidebarConfig | null>(null);

export function useDocsSidebar() {
  return {
    rightSidebarConfig,
    setRightSidebar(config: RightSidebarConfig | null) {
      rightSidebarConfig.value = config;
    },
    clearRightSidebar() {
      rightSidebarConfig.value = null;
    }
  };
}
