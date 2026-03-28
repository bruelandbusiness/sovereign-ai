export type ProductTier = "infrastructure" | "revenue_engine" | "saas_lite";

export type ProductCategory =
  | "mcp_server"
  | "rag_kit"
  | "security"
  | "agent"
  | "pipeline"
  | "template"
  | "toolkit"
  | "course"
  | "content_pack";

export type DeliveryType = "download" | "access" | "api_key" | "github";

export interface ProductReviewData {
  id: string;
  rating: number;
  title: string | null;
  content: string | null;
  createdAt: string;
  account: {
    name: string | null;
    email: string;
  };
}

/** Shape returned by the list endpoint (/api/products) */
export interface ProductListItem {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  tier: ProductTier;
  category: ProductCategory;
  price: number; // cents
  comparePrice: number | null;
  imageUrl: string | null;
  deliveryType: DeliveryType;
  features: string[];
  isPublished: boolean;
  isFeatured: boolean;
  salesCount: number;
  rating: number;
  reviewCount: number;
  createdAt: string;
}

/** Shape returned by the detail endpoint (/api/products/[slug]) */
export interface ProductDetail extends ProductListItem {
  description: string;
  previewUrl: string | null;
  deliveryUrl: string | null;
  deliveryNotes: string | null;
  techStack: string[];
  includes: string[];
  updatedAt: string;
  reviews: ProductReviewData[];
}

/** Shape returned by the library endpoint (/api/products/library) */
export interface ProductPurchase {
  id: string;
  productId: string;
  accountId: string;
  stripeSessionId: string | null;
  amount: number;
  status: string;
  accessUrl: string | null;
  downloadCount: number;
  createdAt: string;
  product: {
    id: string;
    slug: string;
    name: string;
    tagline: string;
    tier: ProductTier;
    category: ProductCategory;
    price: number;
    imageUrl: string | null;
    deliveryType: DeliveryType;
    deliveryNotes: string | null;
    features: string[];
    techStack: string[];
    includes: string[];
  };
}

export const TIER_CONFIG = {
  infrastructure: {
    label: "Enterprise",
    color: "amber",
    bgClass: "bg-amber-500/10",
    textClass: "text-amber-500",
    borderClass: "border-amber-500/30",
    badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  },
  revenue_engine: {
    label: "Pro",
    color: "indigo",
    bgClass: "bg-indigo-500/10",
    textClass: "text-indigo-400",
    borderClass: "border-indigo-500/30",
    badgeClass: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
  },
  saas_lite: {
    label: "Starter",
    color: "emerald",
    bgClass: "bg-emerald-500/10",
    textClass: "text-emerald-400",
    borderClass: "border-emerald-500/30",
    badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
} as const;

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  mcp_server: "MCP Servers",
  rag_kit: "RAG Kits",
  security: "Security",
  agent: "AI Agents",
  pipeline: "Pipelines",
  template: "Templates",
  toolkit: "Toolkits",
  course: "Courses",
  content_pack: "Content Packs",
};

export const TIER_LABELS: Record<ProductTier, string> = {
  infrastructure: "Infrastructure",
  revenue_engine: "Revenue Engines",
  saas_lite: "SaaS-Lite",
};

