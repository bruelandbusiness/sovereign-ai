import { JsonLd } from "@/components/shared/JsonLd";

interface BreadcrumbItem {
  name: string;
  url: string;
}

/**
 * Renders BreadcrumbList JSON-LD structured data for SEO.
 * The last item in the list is treated as the current page.
 */
export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  const baseUrl = "https://www.trysovereignai.com";

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: item.url.startsWith("http")
            ? item.url
            : `${baseUrl}${item.url}`,
        })),
      }}
    />
  );
}
