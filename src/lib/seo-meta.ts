// SEO Meta Tag Generation Utility
// Generates structured meta tags, Open Graph, Twitter Cards,
// and JSON-LD schema.org data for Sovereign AI platform pages.

// ─── Constants ──────────────────────────────────────────────

const SITE_NAME = "Sovereign AI";
const TITLE_TEMPLATE = (page: string): string => `${page} | ${SITE_NAME}`;
const BASE_URL = "https://www.sovereignai.com";
const MAX_TITLE_LENGTH = 60;
const MAX_DESCRIPTION_LENGTH = 160;
const DEFAULT_LOCALE = "en_US";
const DEFAULT_TWITTER_CARD: TwitterCardType = "summary_large_image";

// ─── Types ──────────────────────────────────────────────────

export interface SEOMeta {
  readonly title: string;
  readonly description: string;
  readonly canonicalUrl: string;
  readonly robots: string;
  readonly keywords?: readonly string[];
  readonly author?: string;
  readonly language?: string;
}

export interface OpenGraphData {
  readonly ogTitle: string;
  readonly ogDescription: string;
  readonly ogUrl: string;
  readonly ogImage: string;
  readonly ogImageAlt?: string;
  readonly ogImageWidth?: number;
  readonly ogImageHeight?: number;
  readonly ogType: OGType;
  readonly ogSiteName: string;
  readonly ogLocale: string;
}

export type OGType =
  | "website"
  | "article"
  | "product"
  | "profile";

export type TwitterCardType =
  | "summary"
  | "summary_large_image"
  | "app"
  | "player";

export interface TwitterCardData {
  readonly cardType: TwitterCardType;
  readonly site?: string;
  readonly creator?: string;
  readonly title: string;
  readonly description: string;
  readonly image?: string;
  readonly imageAlt?: string;
}

export interface SchemaOrgData {
  readonly "@context": "https://schema.org";
  readonly "@type": string;
  readonly [key: string]: unknown;
}

export interface BreadcrumbItem {
  readonly name: string;
  readonly url: string;
  readonly position: number;
}

export interface MetaValidationResult {
  readonly valid: boolean;
  readonly titleLength: number;
  readonly titleValid: boolean;
  readonly descriptionLength: number;
  readonly descriptionValid: boolean;
  readonly warnings: readonly string[];
}

export interface SitemapEntry {
  readonly loc: string;
  readonly lastmod: string;
  readonly changefreq: ChangeFrequency;
  readonly priority: number;
}

export type ChangeFrequency =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

export type RobotsDirective =
  | "index"
  | "noindex"
  | "follow"
  | "nofollow"
  | "noarchive"
  | "nosnippet"
  | "noimageindex";

// ─── Input Option Types ─────────────────────────────────────

export interface PageMetaOptions {
  readonly title: string;
  readonly description: string;
  readonly path: string;
  readonly robots?: readonly RobotsDirective[];
  readonly keywords?: readonly string[];
  readonly author?: string;
  readonly language?: string;
  readonly baseUrl?: string;
}

export interface OpenGraphOptions {
  readonly title: string;
  readonly description: string;
  readonly path: string;
  readonly image: string;
  readonly imageAlt?: string;
  readonly imageWidth?: number;
  readonly imageHeight?: number;
  readonly type?: OGType;
  readonly locale?: string;
  readonly baseUrl?: string;
}

export interface TwitterCardOptions {
  readonly title: string;
  readonly description: string;
  readonly cardType?: TwitterCardType;
  readonly site?: string;
  readonly creator?: string;
  readonly image?: string;
  readonly imageAlt?: string;
}

export interface OrganizationSchemaOptions {
  readonly name: string;
  readonly url: string;
  readonly logo: string;
  readonly description?: string;
  readonly email?: string;
  readonly phone?: string;
  readonly sameAs?: readonly string[];
  readonly address?: {
    readonly street: string;
    readonly city: string;
    readonly state: string;
    readonly postalCode: string;
    readonly country: string;
  };
}

export interface SoftwareApplicationSchemaOptions {
  readonly name: string;
  readonly description: string;
  readonly url: string;
  readonly applicationCategory: string;
  readonly operatingSystem?: string;
  readonly offers?: {
    readonly price: string;
    readonly priceCurrency: string;
  };
  readonly aggregateRating?: {
    readonly ratingValue: number;
    readonly ratingCount: number;
  };
}

export interface FAQItem {
  readonly question: string;
  readonly answer: string;
}

export interface ArticleSchemaOptions {
  readonly headline: string;
  readonly description: string;
  readonly url: string;
  readonly image: string;
  readonly datePublished: string;
  readonly dateModified?: string;
  readonly authorName: string;
  readonly authorUrl?: string;
  readonly publisherName: string;
  readonly publisherLogo: string;
  readonly keywords?: readonly string[];
}

export interface ServiceSchemaOptions {
  readonly name: string;
  readonly description: string;
  readonly provider: string;
  readonly providerUrl: string;
  readonly serviceType?: string;
  readonly areaServed?: string;
  readonly url?: string;
}

export interface SitemapEntryOptions {
  readonly path: string;
  readonly lastmod?: string;
  readonly changefreq?: ChangeFrequency;
  readonly priority?: number;
  readonly baseUrl?: string;
}

// ─── Helpers ────────────────────────────────────────────────

function truncate(text: string, max: number): string {
  if (text.length <= max) {
    return text;
  }
  const truncated = text.slice(0, max - 3);
  const lastSpace = truncated.lastIndexOf(" ");
  const cutPoint = lastSpace > max * 0.6 ? lastSpace : max - 3;
  return `${text.slice(0, cutPoint)}...`;
}

function buildCanonicalUrl(
  path: string,
  baseUrl: string
): string {
  const cleanBase = baseUrl.replace(/\/+$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}

function formatPathSegment(segment: string): string {
  return segment
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

// ─── Page Meta Generation ───────────────────────────────────

/**
 * Generate complete meta tag data for any page type.
 * Title uses template: "Page Title | Sovereign AI".
 * Description is capped at 160 characters.
 */
export function generatePageMeta(
  options: PageMetaOptions
): SEOMeta {
  const {
    title,
    description,
    path,
    robots = ["index", "follow"],
    keywords,
    author,
    language,
    baseUrl = BASE_URL,
  } = options;

  const fullTitle = TITLE_TEMPLATE(title);
  const safeDescription = truncate(description, MAX_DESCRIPTION_LENGTH);
  const canonicalUrl = buildCanonicalUrl(path, baseUrl);
  const robotsDirective = robots.join(", ");

  return {
    title: fullTitle,
    description: safeDescription,
    canonicalUrl,
    robots: robotsDirective,
    ...(keywords ? { keywords } : {}),
    ...(author ? { author } : {}),
    ...(language ? { language } : {}),
  };
}

// ─── Open Graph Generation ──────────────────────────────────

/**
 * Generate Open Graph meta tags for social sharing.
 */
export function generateOpenGraph(
  options: OpenGraphOptions
): OpenGraphData {
  const {
    title,
    description,
    path,
    image,
    imageAlt,
    imageWidth,
    imageHeight,
    type = "website",
    locale = DEFAULT_LOCALE,
    baseUrl = BASE_URL,
  } = options;

  const ogUrl = buildCanonicalUrl(path, baseUrl);

  return {
    ogTitle: truncate(title, MAX_TITLE_LENGTH),
    ogDescription: truncate(description, MAX_DESCRIPTION_LENGTH),
    ogUrl,
    ogImage: image,
    ...(imageAlt ? { ogImageAlt: imageAlt } : {}),
    ...(imageWidth ? { ogImageWidth: imageWidth } : {}),
    ...(imageHeight ? { ogImageHeight: imageHeight } : {}),
    ogType: type,
    ogSiteName: SITE_NAME,
    ogLocale: locale,
  };
}

// ─── Twitter Card Generation ────────────────────────────────

/**
 * Generate Twitter card meta tags.
 */
export function generateTwitterCard(
  options: TwitterCardOptions
): TwitterCardData {
  const {
    title,
    description,
    cardType = DEFAULT_TWITTER_CARD,
    site,
    creator,
    image,
    imageAlt,
  } = options;

  return {
    cardType,
    ...(site ? { site } : {}),
    ...(creator ? { creator } : {}),
    title: truncate(title, MAX_TITLE_LENGTH),
    description: truncate(description, MAX_DESCRIPTION_LENGTH),
    ...(image ? { image } : {}),
    ...(imageAlt ? { imageAlt } : {}),
  };
}

// ─── Schema.org JSON-LD Generators ──────────────────────────

/**
 * Generate Organization JSON-LD structured data.
 */
export function generateSchemaOrg(
  type: "Organization",
  options: OrganizationSchemaOptions
): SchemaOrgData;
export function generateSchemaOrg(
  type: "SoftwareApplication",
  options: SoftwareApplicationSchemaOptions
): SchemaOrgData;
export function generateSchemaOrg(
  type: "FAQPage",
  options: { readonly faqs: readonly FAQItem[] }
): SchemaOrgData;
export function generateSchemaOrg(
  type: "Article",
  options: ArticleSchemaOptions
): SchemaOrgData;
export function generateSchemaOrg(
  type: "BreadcrumbList",
  options: { readonly items: readonly BreadcrumbItem[] }
): SchemaOrgData;
export function generateSchemaOrg(
  type: "Service",
  options: ServiceSchemaOptions
): SchemaOrgData;
export function generateSchemaOrg(
  type: string,
  options:
    | OrganizationSchemaOptions
    | SoftwareApplicationSchemaOptions
    | { readonly faqs: readonly FAQItem[] }
    | ArticleSchemaOptions
    | { readonly items: readonly BreadcrumbItem[] }
    | ServiceSchemaOptions
    | Record<string, unknown>
): SchemaOrgData {
  switch (type) {
    case "Organization":
      return buildOrganizationSchema(
        options as unknown as OrganizationSchemaOptions
      );
    case "SoftwareApplication":
      return buildSoftwareApplicationSchema(
        options as unknown as SoftwareApplicationSchemaOptions
      );
    case "FAQPage":
      return buildFAQPageSchema(
        options as unknown as { faqs: readonly FAQItem[] }
      );
    case "Article":
      return buildArticleSchema(
        options as unknown as ArticleSchemaOptions
      );
    case "BreadcrumbList":
      return buildBreadcrumbListSchema(
        options as unknown as { items: readonly BreadcrumbItem[] }
      );
    case "Service":
      return buildServiceSchema(
        options as unknown as ServiceSchemaOptions
      );
    default:
      return { "@context": "https://schema.org", "@type": type, ...options };
  }
}

function buildOrganizationSchema(
  opts: OrganizationSchemaOptions
): SchemaOrgData {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: opts.name,
    url: opts.url,
    logo: opts.logo,
    ...(opts.description ? { description: opts.description } : {}),
    ...(opts.email ? { email: opts.email } : {}),
    ...(opts.phone ? { telephone: opts.phone } : {}),
    ...(opts.sameAs ? { sameAs: [...opts.sameAs] } : {}),
    ...(opts.address
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: opts.address.street,
            addressLocality: opts.address.city,
            addressRegion: opts.address.state,
            postalCode: opts.address.postalCode,
            addressCountry: opts.address.country,
          },
        }
      : {}),
  };
}

function buildSoftwareApplicationSchema(
  opts: SoftwareApplicationSchemaOptions
): SchemaOrgData {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: opts.name,
    description: opts.description,
    url: opts.url,
    applicationCategory: opts.applicationCategory,
    ...(opts.operatingSystem
      ? { operatingSystem: opts.operatingSystem }
      : {}),
    ...(opts.offers
      ? {
          offers: {
            "@type": "Offer",
            price: opts.offers.price,
            priceCurrency: opts.offers.priceCurrency,
          },
        }
      : {}),
    ...(opts.aggregateRating
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: opts.aggregateRating.ratingValue,
            ratingCount: opts.aggregateRating.ratingCount,
          },
        }
      : {}),
  };
}

function buildFAQPageSchema(
  opts: { faqs: readonly FAQItem[] }
): SchemaOrgData {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: opts.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

function buildArticleSchema(
  opts: ArticleSchemaOptions
): SchemaOrgData {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: opts.headline,
    description: opts.description,
    url: opts.url,
    image: opts.image,
    datePublished: opts.datePublished,
    ...(opts.dateModified
      ? { dateModified: opts.dateModified }
      : {}),
    author: {
      "@type": "Person",
      name: opts.authorName,
      ...(opts.authorUrl ? { url: opts.authorUrl } : {}),
    },
    publisher: {
      "@type": "Organization",
      name: opts.publisherName,
      logo: {
        "@type": "ImageObject",
        url: opts.publisherLogo,
      },
    },
    ...(opts.keywords ? { keywords: opts.keywords.join(", ") } : {}),
  };
}

function buildBreadcrumbListSchema(
  opts: { items: readonly BreadcrumbItem[] }
): SchemaOrgData {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: opts.items.map((item) => ({
      "@type": "ListItem",
      position: item.position,
      name: item.name,
      item: item.url,
    })),
  };
}

function buildServiceSchema(
  opts: ServiceSchemaOptions
): SchemaOrgData {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: opts.name,
    description: opts.description,
    provider: {
      "@type": "Organization",
      name: opts.provider,
      url: opts.providerUrl,
    },
    ...(opts.serviceType ? { serviceType: opts.serviceType } : {}),
    ...(opts.areaServed ? { areaServed: opts.areaServed } : {}),
    ...(opts.url ? { url: opts.url } : {}),
  };
}

// ─── Breadcrumb Generation ──────────────────────────────────

/**
 * Generate a breadcrumb trail from a URL path.
 * Example: "/features/analytics" produces:
 *   Home > Features > Analytics
 */
export function generateBreadcrumbs(
  path: string,
  baseUrl: string = BASE_URL
): readonly BreadcrumbItem[] {
  const cleanPath = path.replace(/^\/+|\/+$/g, "");

  if (cleanPath === "") {
    return [{ name: "Home", url: baseUrl, position: 1 }];
  }

  const segments = cleanPath.split("/").filter(Boolean);
  const items: BreadcrumbItem[] = [
    { name: "Home", url: baseUrl, position: 1 },
  ];

  let accumulatedPath = "";
  for (let i = 0; i < segments.length; i++) {
    accumulatedPath += `/${segments[i]}`;
    items.push({
      name: formatPathSegment(segments[i]),
      url: `${baseUrl}${accumulatedPath}`,
      position: i + 2,
    });
  }

  return items;
}

// ─── Sitemap Entry Generation ───────────────────────────────

/**
 * Generate a sitemap XML entry string for a page.
 */
export function generateSitemapEntry(
  options: SitemapEntryOptions
): SitemapEntry {
  const {
    path,
    lastmod = new Date().toISOString().split("T")[0],
    changefreq = "weekly",
    priority = 0.5,
    baseUrl = BASE_URL,
  } = options;

  return {
    loc: buildCanonicalUrl(path, baseUrl),
    lastmod,
    changefreq,
    priority: Math.min(1.0, Math.max(0.0, priority)),
  };
}

/**
 * Render a SitemapEntry as an XML string.
 */
export function renderSitemapEntryXml(
  entry: SitemapEntry
): string {
  return [
    "  <url>",
    `    <loc>${escapeXml(entry.loc)}</loc>`,
    `    <lastmod>${entry.lastmod}</lastmod>`,
    `    <changefreq>${entry.changefreq}</changefreq>`,
    `    <priority>${entry.priority.toFixed(1)}</priority>`,
    "  </url>",
  ].join("\n");
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ─── Meta Validation ────────────────────────────────────────

/**
 * Validate title (60 char limit) and description (160 char limit).
 * Returns a structured result with per-field validity and warnings.
 */
export function validateMetaLength(
  title: string,
  description: string
): MetaValidationResult {
  const titleLength = title.length;
  const descriptionLength = description.length;
  const titleValid = titleLength <= MAX_TITLE_LENGTH;
  const descriptionValid = descriptionLength <= MAX_DESCRIPTION_LENGTH;
  const warnings: string[] = [];

  if (!titleValid) {
    warnings.push(
      `Title exceeds ${MAX_TITLE_LENGTH} characters ` +
        `(${titleLength}). May be truncated in search results.`
    );
  }

  if (titleLength < 10) {
    warnings.push(
      "Title is very short. Consider making it more descriptive."
    );
  }

  if (!descriptionValid) {
    warnings.push(
      `Description exceeds ${MAX_DESCRIPTION_LENGTH} characters ` +
        `(${descriptionLength}). May be truncated in search results.`
    );
  }

  if (descriptionLength < 50) {
    warnings.push(
      "Description is very short. Aim for 120-160 characters."
    );
  }

  return {
    valid: titleValid && descriptionValid,
    titleLength,
    titleValid,
    descriptionLength,
    descriptionValid,
    warnings,
  };
}
