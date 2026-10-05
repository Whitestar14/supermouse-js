import { PLUGINS } from "@data/plugin-data";

export interface NavItem {
  label: string;
  path: string;
  /** ISO `YYYY-MM-DD` — only written pages have one; plugin pages are generated. */
  updated?: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

/** Plugins shipped from the labs package are surfaced separately as experimental. */
const LABS_PACKAGE = "@supermousejs/labs";

function toNavItems(plugins: typeof PLUGINS): NavItem[] {
  return plugins.map((plugin) => ({
    label: plugin.name,
    path: `/docs/plugins/${plugin.id}`
  }));
}

/**
 * Sidebar, prev/next pager and search index all read from this: content
 * frontmatter plus generated plugin metadata, with no hand-written route list.
 */
export function useDocsNavigation(): NavGroup[] {
  const { docsNavigation } = useRuntimeConfig().public;

  return [
    ...(docsNavigation as NavGroup[]),
    {
      title: "Standard Plugins",
      items: toNavItems(PLUGINS.filter((plugin) => plugin.package !== LABS_PACKAGE))
    },
    {
      title: "Experimental",
      items: toNavItems(PLUGINS.filter((plugin) => plugin.package === LABS_PACKAGE))
    }
  ];
}

/** Flattened nav items, in sidebar order — used for the prev/next pager. */
export function useDocsFlatNavigation(): Array<NavItem & { group: string }> {
  return useDocsNavigation().flatMap((group) =>
    group.items.map((item) => ({ ...item, group: group.title }))
  );
}
