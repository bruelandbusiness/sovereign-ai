/**
 * Typed JSON-LD structured data components for SEO.
 *
 * These helpers produce valid Schema.org markup rendered as
 * <script type="application/ld+json"> tags. Each component accepts a
 * strongly-typed props object so callers get autocomplete and compile-time
 * checks instead of hand-rolling raw JSON.
 *
 * Usage:
 *   <OrganizationJsonLd name="Acme" url="https://acme.com" ... />
 *   <ProductJsonLd name="Widget" offers={[...]} />
 */

/* ------------------------------------------------------------------ */
/*  Base renderer                                                      */
/* ------------------------------------------------------------------ */

function JsonLdScript({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Organization                                                       */
/* ------------------------------------------------------------------ */

interface OrganizationJsonLdProps {
  name: string;
  url: string;
  logo: string;
  description: string;
  founder?: string;
  sameAs?: string[];
}

export function OrganizationJsonLd({
  name,
  url,
  logo,
  description,
  founder,
  sameAs,
}: OrganizationJsonLdProps) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${url}/#organization`,
    name,
    url,
    logo: { "@type": "ImageObject", url: logo },
    description,
  };

  if (founder) {
    data.founder = { "@type": "Person", name: founder };
  }
  if (sameAs && sameAs.length > 0) {
    data.sameAs = sameAs;
  }

  return <JsonLdScript data={data} />;
}

/* ------------------------------------------------------------------ */
/*  SoftwareApplication                                                */
/* ------------------------------------------------------------------ */

interface SoftwareAppJsonLdProps {
  name: string;
  description: string;
  applicationCategory?: string;
  operatingSystem?: string;
  lowPrice: string;
  highPrice: string;
  priceCurrency?: string;
  offerCount?: string;
  ratingValue?: string;
  ratingCount?: string;
}

export function SoftwareAppJsonLd({
  name,
  description,
  applicationCategory = "BusinessApplication",
  operatingSystem = "Web",
  lowPrice,
  highPrice,
  priceCurrency = "USD",
  offerCount = "4",
  ratingValue,
  ratingCount,
}: SoftwareAppJsonLdProps) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    description,
    applicationCategory,
    operatingSystem,
    offers: {
      "@type": "AggregateOffer",
      lowPrice,
      highPrice,
      priceCurrency,
      offerCount,
    },
  };

  if (ratingValue && ratingCount) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue,
      ratingCount,
      bestRating: "5",
    };
  }

  return <JsonLdScript data={data} />;
}

/* ------------------------------------------------------------------ */
/*  Product (with individual Offer items)                              */
/* ------------------------------------------------------------------ */

/** Price validity date — one year from build/module-load time. */
const PRICE_VALID_UNTIL = new Date(
  Date.now() + 365 * 24 * 60 * 60 * 1000
).toISOString().split("T")[0];

interface ProductOffer {
  name: string;
  price: string;
  priceCurrency?: string;
  description?: string;
  url?: string;
}

interface ProductJsonLdProps {
  name: string;
  description: string;
  url: string;
  brand?: string;
  offers: ProductOffer[];
  ratingValue?: string;
  ratingCount?: string;
}

export function ProductJsonLd({
  name,
  description,
  url,
  brand,
  offers,
  ratingValue,
  ratingCount,
}: ProductJsonLdProps) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    url,
    offers: offers.map((o) => ({
      "@type": "Offer",
      name: o.name,
      price: o.price,
      priceCurrency: o.priceCurrency ?? "USD",
      priceValidUntil: PRICE_VALID_UNTIL,
      availability: "https://schema.org/InStock",
      ...(o.description ? { description: o.description } : {}),
      ...(o.url ? { url: o.url } : {}),
    })),
  };

  if (brand) {
    data.brand = { "@type": "Brand", name: brand };
  }
  if (ratingValue && ratingCount) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue,
      ratingCount,
      bestRating: "5",
    };
  }

  return <JsonLdScript data={data} />;
}

/* ------------------------------------------------------------------ */
/*  Article / BlogPosting                                              */
/* ------------------------------------------------------------------ */

interface ArticleJsonLdProps {
  headline: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified?: string;
  authorName?: string;
  publisherName?: string;
  publisherLogo?: string;
  image?: string;
}

export function ArticleJsonLd({
  headline,
  description,
  url,
  datePublished,
  dateModified,
  authorName = "Sovereign AI",
  publisherName = "Sovereign AI",
  publisherLogo = "https://www.trysovereignai.com/icon-512.png",
  image,
}: ArticleJsonLdProps) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline,
    description,
    url,
    datePublished,
    dateModified: dateModified ?? datePublished,
    author: { "@type": "Organization", name: authorName },
    publisher: {
      "@type": "Organization",
      name: publisherName,
      logo: { "@type": "ImageObject", url: publisherLogo },
    },
  };

  if (image) {
    data.image = image;
  }

  return <JsonLdScript data={data} />;
}

/* ------------------------------------------------------------------ */
/*  FAQPage                                                            */
/* ------------------------------------------------------------------ */

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqJsonLdProps {
  items: FaqItem[];
}

export function FaqJsonLd({ items }: FaqJsonLdProps) {
  return (
    <JsonLdScript
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  BreadcrumbList                                                     */
/* ------------------------------------------------------------------ */

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbJsonLdProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const baseUrl = "https://www.trysovereignai.com";

  return (
    <JsonLdScript
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: item.url.startsWith("http") ? item.url : `${baseUrl}${item.url}`,
        })),
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  LocalBusiness (useful for "Find a Pro" / directory pages)          */
/* ------------------------------------------------------------------ */

interface LocalBusinessJsonLdProps {
  name: string;
  description: string;
  url: string;
  telephone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
}

export function LocalBusinessJsonLd({
  name,
  description,
  url,
  telephone,
  address,
}: LocalBusinessJsonLdProps) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name,
    description,
    url,
  };

  if (telephone) {
    data.telephone = telephone;
  }
  if (address) {
    data.address = {
      "@type": "PostalAddress",
      ...(address.street ? { streetAddress: address.street } : {}),
      ...(address.city ? { addressLocality: address.city } : {}),
      ...(address.state ? { addressRegion: address.state } : {}),
      ...(address.postalCode ? { postalCode: address.postalCode } : {}),
      ...(address.country ? { addressCountry: address.country ?? "US" } : {}),
    };
  }

  return <JsonLdScript data={data} />;
}

/* ------------------------------------------------------------------ */
/*  WebPage (generic fallback)                                         */
/* ------------------------------------------------------------------ */

interface WebPageJsonLdProps {
  name: string;
  description: string;
  url: string;
}

export function WebPageJsonLd({ name, description, url }: WebPageJsonLdProps) {
  return (
    <JsonLdScript
      data={{
        "@context": "https://schema.org",
        "@type": "WebPage",
        name,
        description,
        url,
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  WebSite (with SearchAction for sitelinks search box)               */
/* ------------------------------------------------------------------ */

interface WebSiteJsonLdProps {
  name: string;
  url: string;
  description?: string;
  searchUrl?: string;
}

export function WebSiteJsonLd({
  name,
  url,
  description,
  searchUrl,
}: WebSiteJsonLdProps) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${url}/#website`,
    name,
    url,
  };

  if (description) {
    data.description = description;
  }
  if (searchUrl) {
    data.potentialAction = {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: searchUrl,
      },
      "query-input": "required name=search_term_string",
    };
  }

  return <JsonLdScript data={data} />;
}

/* ------------------------------------------------------------------ */
/*  Service                                                            */
/* ------------------------------------------------------------------ */

interface ServiceOffer {
  name?: string;
  price?: string;
  priceCurrency?: string;
  description?: string;
}

interface ServiceJsonLdProps {
  name: string;
  description: string;
  url?: string;
  providerName?: string;
  providerUrl?: string;
  areaServed?: string;
  offers?: ServiceOffer[];
  aggregateOffer?: {
    lowPrice: string;
    highPrice: string;
    priceCurrency?: string;
  };
}

export function ServiceJsonLd({
  name,
  description,
  url,
  providerName = "Sovereign AI",
  providerUrl = "https://www.trysovereignai.com",
  areaServed = "US",
  offers,
  aggregateOffer,
}: ServiceJsonLdProps) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    provider: {
      "@type": "Organization",
      name: providerName,
      url: providerUrl,
    },
    areaServed: {
      "@type": "Country",
      name: areaServed,
    },
  };

  if (url) {
    data.url = url;
  }
  if (offers && offers.length > 0) {
    data.hasOfferCatalog = {
      "@type": "OfferCatalog",
      name: `${name} Offerings`,
      itemListElement: offers.map((o) => ({
        "@type": "Offer",
        ...(o.name ? { name: o.name } : {}),
        ...(o.price ? { price: o.price } : {}),
        priceCurrency: o.priceCurrency ?? "USD",
        ...(o.description ? { description: o.description } : {}),
      })),
    };
  }
  if (aggregateOffer) {
    data.offers = {
      "@type": "AggregateOffer",
      lowPrice: aggregateOffer.lowPrice,
      highPrice: aggregateOffer.highPrice,
      priceCurrency: aggregateOffer.priceCurrency ?? "USD",
    };
  }

  return <JsonLdScript data={data} />;
}

/* ------------------------------------------------------------------ */
/*  CaseStudy / Article (for case study detail pages)                  */
/* ------------------------------------------------------------------ */

interface CaseStudyJsonLdProps {
  headline: string;
  description: string;
  url: string;
  datePublished?: string;
  dateModified?: string;
  authorName?: string;
  publisherName?: string;
  publisherLogo?: string;
  about?: {
    name: string;
    location?: string;
  };
}

export function CaseStudyJsonLd({
  headline,
  description,
  url,
  datePublished,
  dateModified,
  authorName = "Sovereign AI",
  publisherName = "Sovereign AI",
  publisherLogo = "https://www.trysovereignai.com/icon-512.png",
  about,
}: CaseStudyJsonLdProps) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    url,
    author: { "@type": "Organization", name: authorName },
    publisher: {
      "@type": "Organization",
      name: publisherName,
      logo: { "@type": "ImageObject", url: publisherLogo },
    },
  };

  if (datePublished) {
    data.datePublished = datePublished;
    data.dateModified = dateModified ?? datePublished;
  }
  if (about) {
    data.about = {
      "@type": "Organization",
      name: about.name,
      ...(about.location
        ? {
            address: {
              "@type": "PostalAddress",
              addressLocality: about.location,
            },
          }
        : {}),
    };
  }

  return <JsonLdScript data={data} />;
}
