import { computed, type MaybeRefOrGetter, toValue } from "vue";
import { useRoute } from "vue-router";
import { useHead } from "@unhead/vue";
import { APP_NAME, SITE_URL } from "@config/constants";

interface PageHeadOptions {
  title: MaybeRefOrGetter<string>;
  description?: MaybeRefOrGetter<string>;
}

export function usePageHead(options: PageHeadOptions) {
  const route = useRoute();

  const pageUrl = computed(() => `${SITE_URL}${route.path}`);
  const pageTitle = computed(() => `${toValue(options.title)} | ${APP_NAME}`);
  const pageDescription = computed(
    () => toValue(options.description) ?? `${toValue(options.title)} — ${APP_NAME} documentation.`
  );

  useHead({
    title: pageTitle,
    link: [{ rel: "canonical", href: pageUrl }],
    meta: [
      { name: "description", content: pageDescription },
      { property: "og:title", content: pageTitle },
      { property: "og:description", content: pageDescription },
      { property: "og:url", content: pageUrl },
      { property: "og:type", content: "article" },
      { property: "og:image", content: `${SITE_URL}/social-banner.png` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: pageTitle },
      { name: "twitter:description", content: pageDescription },
      { name: "twitter:image", content: `${SITE_URL}/social-banner.png` }
    ]
  });
}
