"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Package,
  DollarSign,
  ShoppingCart,
  Star,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "@/lib/constants";

// ── Types ──────────────────────────────────────────────────────

interface Product {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  tier: string;
  category: string;
  price: number;
  comparePrice: number | null;
  imageUrl: string | null;
  previewUrl: string | null;
  deliveryType: string;
  deliveryUrl: string | null;
  deliveryNotes: string | null;
  features: string[];
  techStack: string[];
  includes: string[];
  isPublished: boolean;
  isFeatured: boolean;
  salesCount: number;
  rating: number;
  reviewCount: number;
  purchaseCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ProductStats {
  totalProducts: number;
  totalRevenue: number;
  totalSales: number;
  avgRating: number;
}

interface ProductFormData {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  tier: string;
  category: string;
  price: string;
  comparePrice: string;
  deliveryType: string;
  deliveryUrl: string;
  deliveryNotes: string;
  features: string[];
  techStack: string[];
  includes: string[];
  isPublished: boolean;
  isFeatured: boolean;
  imageUrl: string;
  previewUrl: string;
}

const TIERS = [
  { value: "infrastructure", label: "Infrastructure" },
  { value: "revenue_engine", label: "Revenue Engine" },
  { value: "saas_lite", label: "SaaS Lite" },
];

const CATEGORIES = [
  { value: "mcp_server", label: "MCP Server" },
  { value: "rag_kit", label: "RAG Kit" },
  { value: "security", label: "Security" },
  { value: "agent", label: "Agent" },
  { value: "pipeline", label: "Pipeline" },
  { value: "template", label: "Template" },
  { value: "toolkit", label: "Toolkit" },
  { value: "course", label: "Course" },
  { value: "content_pack", label: "Content Pack" },
];

const DELIVERY_TYPES = [
  { value: "download", label: "Download" },
  { value: "access", label: "Access" },
  { value: "api_key", label: "API Key" },
  { value: "github", label: "GitHub" },
];

const TIER_COLORS: Record<string, string> = {
  infrastructure: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  revenue_engine: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  saas_lite: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const emptyForm: ProductFormData = {
  name: "",
  slug: "",
  tagline: "",
  description: "",
  tier: "infrastructure",
  category: "mcp_server",
  price: "",
  comparePrice: "",
  deliveryType: "download",
  deliveryUrl: "",
  deliveryNotes: "",
  features: [],
  techStack: [],
  includes: [],
  isPublished: false,
  isFeatured: false,
  imageUrl: "",
  previewUrl: "",
};

// ── KPI Cards ──────────────────────────────────────────────────

function ProductKPIs({ stats }: { stats: ProductStats }) {
  const kpis = [
    {
      label: "Total Products",
      value: stats.totalProducts.toString(),
      icon: Package,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Total Revenue",
      value: formatPrice(stats.totalRevenue / 100),
      icon: DollarSign,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Total Sales",
      value: stats.totalSales.toString(),
      icon: ShoppingCart,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
    {
      label: "Avg Rating",
      value: stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "N/A",
      icon: Star,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <Card key={kpi.label}>
          <CardContent className="flex items-center gap-4 p-5">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${kpi.bg}`}
            >
              <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
              <p className="mt-0.5 text-xl font-bold tabular-nums text-foreground">
                {kpi.value}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── List Item Input (for features, techStack, includes) ──────

function ListInput({
  label,
  items,
  onAdd,
  onRemove,
  placeholder,
}: {
  label: string;
  items: string[];
  onAdd: (item: string) => void;
  onRemove: (index: number) => void;
  placeholder?: string;
}) {
  const [inputValue, setInputValue] = useState("");

  function handleAdd() {
    const trimmed = inputValue.trim();
    if (trimmed && !items.includes(trimmed)) {
      onAdd(trimmed);
      setInputValue("");
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          className="shrink-0"
          aria-label={`Add ${label.toLowerCase()}`}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-md border border-white/[0.06] bg-secondary/50 px-2 py-0.5 text-xs text-foreground"
            >
              {item}
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="ml-0.5 text-muted-foreground hover:text-foreground"
                aria-label={`Remove ${item}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Product Form ───────────────────────────────────────────────

function ProductForm({
  form,
  setForm,
  onSubmit,
  onCancel,
  isEditing,
  isSaving,
}: {
  form: ProductFormData;
  setForm: React.Dispatch<React.SetStateAction<ProductFormData>>;
  onSubmit: () => void;
  onCancel: () => void;
  isEditing: boolean;
  isSaving: boolean;
}) {
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  function handleNameChange(name: string) {
    setForm((prev) => ({
      ...prev,
      name,
      slug: isEditing ? prev.slug : slugify(name),
    }));
  }

  function validateAndSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSaving) return;
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = "Name is required";
    if (!form.slug.trim()) errors.slug = "Slug is required";
    if (!form.tagline.trim()) errors.tagline = "Tagline is required";
    if (!form.description.trim()) errors.description = "Description is required";
    if (!form.price || Number(form.price) <= 0) errors.price = "Valid price is required";
    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) return;
    onSubmit();
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {isEditing ? "Edit Product" : "Create Product"}
          </h2>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={validateAndSubmit}>
        <div className="grid gap-5 sm:grid-cols-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="product-name">Name *</Label>
            <Input
              id="product-name"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="MCP Lead Router"
              required
              aria-invalid={!!validationErrors.name}
            />
            {validationErrors.name && (
              <p className="text-xs text-destructive">{validationErrors.name}</p>
            )}
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <Label htmlFor="product-slug">Slug *</Label>
            <Input
              id="product-slug"
              value={form.slug}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, slug: e.target.value }))
              }
              placeholder="mcp-lead-router"
              required
              aria-invalid={!!validationErrors.slug}
            />
            {validationErrors.slug && (
              <p className="text-xs text-destructive">{validationErrors.slug}</p>
            )}
          </div>

          {/* Tagline */}
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="product-tagline">Tagline *</Label>
            <Input
              id="product-tagline"
              value={form.tagline}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, tagline: e.target.value }))
              }
              placeholder="Route and qualify leads with AI..."
              required
              aria-invalid={!!validationErrors.tagline}
            />
            {validationErrors.tagline && (
              <p className="text-xs text-destructive">{validationErrors.tagline}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="product-description">Description *</Label>
            <Textarea
              id="product-description"
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Full product description..."
              rows={4}
              required
              aria-invalid={!!validationErrors.description}
            />
            {validationErrors.description && (
              <p className="text-xs text-destructive">{validationErrors.description}</p>
            )}
          </div>

          {/* Tier */}
          <div className="space-y-1.5">
            <Label htmlFor="product-tier">Tier *</Label>
            <select
              id="product-tier"
              value={form.tier}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, tier: e.target.value }))
              }
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              {TIERS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label htmlFor="product-category">Category *</Label>
            <select
              id="product-category"
              value={form.category}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, category: e.target.value }))
              }
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Price */}
          <div className="space-y-1.5">
            <Label htmlFor="product-price">Price (cents) *</Label>
            <Input
              id="product-price"
              type="number"
              value={form.price}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, price: e.target.value }))
              }
              placeholder="4900"
              required
              aria-invalid={!!validationErrors.price}
            />
            {validationErrors.price && (
              <p className="text-xs text-destructive">{validationErrors.price}</p>
            )}
            {form.price && !validationErrors.price && (
              <p className="text-xs text-muted-foreground">
                = {formatPrice(Number(form.price) / 100)}
              </p>
            )}
          </div>

          {/* Compare Price */}
          <div className="space-y-1.5">
            <Label htmlFor="product-compare-price">Compare Price (cents)</Label>
            <Input
              id="product-compare-price"
              type="number"
              value={form.comparePrice}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, comparePrice: e.target.value }))
              }
              placeholder="9900"
            />
            {form.comparePrice && (
              <p className="text-xs text-muted-foreground">
                = {formatPrice(Number(form.comparePrice) / 100)}
              </p>
            )}
          </div>

          {/* Delivery Type */}
          <div className="space-y-1.5">
            <Label htmlFor="product-delivery-type">Delivery Type *</Label>
            <select
              id="product-delivery-type"
              value={form.deliveryType}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, deliveryType: e.target.value }))
              }
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              {DELIVERY_TYPES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {/* Delivery URL */}
          <div className="space-y-1.5">
            <Label htmlFor="product-delivery-url">Delivery URL</Label>
            <Input
              id="product-delivery-url"
              value={form.deliveryUrl}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, deliveryUrl: e.target.value }))
              }
              placeholder="https://github.com/..."
            />
          </div>

          {/* Delivery Notes */}
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="product-delivery-notes">Delivery Notes</Label>
            <Textarea
              id="product-delivery-notes"
              value={form.deliveryNotes}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  deliveryNotes: e.target.value,
                }))
              }
              placeholder="Instructions for the buyer..."
              rows={2}
            />
          </div>

          {/* Features */}
          <div className="sm:col-span-2">
            <ListInput
              label="Features"
              items={form.features}
              placeholder="Add a feature..."
              onAdd={(item) =>
                setForm((prev) => ({
                  ...prev,
                  features: [...prev.features, item],
                }))
              }
              onRemove={(i) =>
                setForm((prev) => ({
                  ...prev,
                  features: prev.features.filter((_, idx) => idx !== i),
                }))
              }
            />
          </div>

          {/* Tech Stack */}
          <div className="sm:col-span-2">
            <ListInput
              label="Tech Stack"
              items={form.techStack}
              placeholder="Add a tech..."
              onAdd={(item) =>
                setForm((prev) => ({
                  ...prev,
                  techStack: [...prev.techStack, item],
                }))
              }
              onRemove={(i) =>
                setForm((prev) => ({
                  ...prev,
                  techStack: prev.techStack.filter((_, idx) => idx !== i),
                }))
              }
            />
          </div>

          {/* Includes */}
          <div className="sm:col-span-2">
            <ListInput
              label="Includes"
              items={form.includes}
              placeholder="Add what's included..."
              onAdd={(item) =>
                setForm((prev) => ({
                  ...prev,
                  includes: [...prev.includes, item],
                }))
              }
              onRemove={(i) =>
                setForm((prev) => ({
                  ...prev,
                  includes: prev.includes.filter((_, idx) => idx !== i),
                }))
              }
            />
          </div>

          {/* Image URL */}
          <div className="space-y-1.5">
            <Label htmlFor="product-image-url">Image URL</Label>
            <Input
              id="product-image-url"
              value={form.imageUrl}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, imageUrl: e.target.value }))
              }
              placeholder="https://..."
            />
          </div>

          {/* Preview URL */}
          <div className="space-y-1.5">
            <Label htmlFor="product-preview-url">Preview URL</Label>
            <Input
              id="product-preview-url"
              value={form.previewUrl}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, previewUrl: e.target.value }))
              }
              placeholder="https://..."
            />
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-6 sm:col-span-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    isPublished: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-input accent-primary"
              />
              <span className="text-foreground">Published</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    isFeatured: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-input accent-primary"
              />
              <span className="text-foreground">Featured</span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <Button type="submit" disabled={isSaving} aria-busy={isSaving}>
            {isSaving
              ? "Saving..."
              : isEditing
                ? "Update Product"
                : "Create Product"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ── Main Page ──────────────────────────────────────────────────

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormData>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchProducts = useCallback(async (query: string) => {
    try {
      const params = query ? `?search=${encodeURIComponent(query)}` : "";
      const res = await fetch(`/api/admin/products${params}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products);
        setStats(data.stats);
        setError(null);
      } else {
        setError("Failed to load products. Please try again.");
      }
    } catch {
      setError("Connection issue while loading products. Please check your internet and try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts(search);
  }, [search, fetchProducts]);

  function openCreateForm() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
    setError(null);
  }

  function openEditForm(product: Product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      slug: product.slug,
      tagline: product.tagline,
      description: product.description,
      tier: product.tier,
      category: product.category,
      price: product.price.toString(),
      comparePrice: product.comparePrice?.toString() || "",
      deliveryType: product.deliveryType,
      deliveryUrl: product.deliveryUrl || "",
      deliveryNotes: product.deliveryNotes || "",
      features: product.features,
      techStack: product.techStack,
      includes: product.includes,
      isPublished: product.isPublished,
      isFeatured: product.isFeatured,
      imageUrl: product.imageUrl || "",
      previewUrl: product.previewUrl || "",
    });
    setShowForm(true);
    setError(null);
  }

  async function handleSubmit() {
    setIsSaving(true);
    setError(null);
    try {
      const payload = {
        ...(editingId && { id: editingId }),
        name: form.name,
        slug: form.slug,
        tagline: form.tagline,
        description: form.description,
        tier: form.tier,
        category: form.category,
        price: Number(form.price),
        comparePrice: form.comparePrice ? Number(form.comparePrice) : null,
        deliveryType: form.deliveryType,
        deliveryUrl: form.deliveryUrl,
        deliveryNotes: form.deliveryNotes,
        features: form.features,
        techStack: form.techStack,
        includes: form.includes,
        isPublished: form.isPublished,
        isFeatured: form.isFeatured,
        imageUrl: form.imageUrl,
        previewUrl: form.previewUrl,
      };

      const res = await fetch("/api/admin/products", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save product");
        return;
      }

      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      fetchProducts(search);
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This action cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/admin/products?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchProducts(search);
      } else {
        setError("Failed to delete product. Please try again.");
      }
    } catch {
      setError("Connection issue while deleting product.");
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 page-enter">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage digital products in the marketplace.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-xl" />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-14 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage digital products in the marketplace.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder="Search products..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
              aria-label="Search products"
            />
          </div>

          {/* Create */}
          <Button onClick={openCreateForm} className="shrink-0">
            <Plus className="mr-1.5 h-4 w-4" />
            Create Product
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {stats && <ProductKPIs stats={stats} />}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400" role="alert">
          {error}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <ProductForm
          form={form}
          setForm={setForm}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingId(null);
            setForm(emptyForm);
            setError(null);
          }}
          isEditing={!!editingId}
          isSaving={isSaving}
        />
      )}

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Digital products in the marketplace</caption>
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Product
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Tier
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Price
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Sales
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Revenue
                  </th>
                  <th scope="col" className="px-4 py-3 text-center font-medium text-muted-foreground">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-12 text-center text-muted-foreground"
                    >
                      {search
                        ? "No products match your search. Try adjusting your search terms."
                        : "No products yet. Click \"Create Product\" above to add your first product."}
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr
                      key={product.id}
                      className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {product.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {product.tagline}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${
                            TIER_COLORS[product.tier] ||
                            "bg-muted text-muted-foreground"
                          }`}
                        >
                          {TIERS.find((t) => t.value === product.tier)?.label ||
                            product.tier}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-foreground">
                        {formatPrice(product.price / 100)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-foreground">
                        {product.salesCount}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-foreground">
                        {formatPrice(
                          (product.salesCount * product.price) / 100
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          variant={
                            product.isPublished ? "default" : "secondary"
                          }
                        >
                          {product.isPublished ? "Published" : "Draft"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditForm(product)}
                            className="h-8 w-8 p-0"
                            aria-label={`Edit ${product.name}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleDelete(product.id, product.name)
                            }
                            className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                            aria-label={`Delete ${product.name}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
