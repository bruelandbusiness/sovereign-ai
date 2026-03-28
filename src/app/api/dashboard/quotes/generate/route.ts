import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateBody } from "@/lib/validate";
import { requireClient, AuthError, getErrorMessage } from "@/lib/require-client";
import { prisma } from "@/lib/db";
import { rateLimitByIP } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
// ---------------------------------------------------------------------------
// POST — AI-generate quote line items based on job description
// ---------------------------------------------------------------------------

const generateSchema = z.object({
  jobDescription: z.string().min(10).max(5000),
  customerName: z.string().min(1).max(200).optional(),
});

// Vertical-based pricing templates
const VERTICAL_PRICING: Record<string, Array<{ description: string; unitPrice: number }>> = {
  hvac: [
    { description: "Diagnostic / Inspection Fee", unitPrice: 8900 },
    { description: "AC Unit Repair (labor)", unitPrice: 15000 },
    { description: "Refrigerant Recharge", unitPrice: 25000 },
    { description: "Thermostat Replacement", unitPrice: 22000 },
    { description: "Ductwork Repair", unitPrice: 45000 },
    { description: "New AC Unit Installation", unitPrice: 450000 },
    { description: "Furnace Repair (labor)", unitPrice: 18000 },
    { description: "Annual Maintenance Plan", unitPrice: 29900 },
  ],
  plumbing: [
    { description: "Service Call / Diagnostic", unitPrice: 7500 },
    { description: "Drain Cleaning", unitPrice: 15000 },
    { description: "Pipe Repair (per section)", unitPrice: 25000 },
    { description: "Water Heater Installation", unitPrice: 185000 },
    { description: "Faucet Replacement", unitPrice: 17500 },
    { description: "Toilet Repair / Replace", unitPrice: 35000 },
    { description: "Sewer Line Camera Inspection", unitPrice: 30000 },
    { description: "Garbage Disposal Install", unitPrice: 22500 },
  ],
  roofing: [
    { description: "Roof Inspection", unitPrice: 25000 },
    { description: "Shingle Repair (per sq ft)", unitPrice: 800 },
    { description: "Roof Patch / Leak Repair", unitPrice: 45000 },
    { description: "Full Roof Replacement (per sq)", unitPrice: 35000 },
    { description: "Gutter Cleaning", unitPrice: 15000 },
    { description: "Gutter Installation (per ft)", unitPrice: 1500 },
    { description: "Flashing Repair", unitPrice: 30000 },
    { description: "Skylight Installation", unitPrice: 150000 },
  ],
  electrical: [
    { description: "Electrical Inspection", unitPrice: 12500 },
    { description: "Outlet Installation (each)", unitPrice: 15000 },
    { description: "Panel Upgrade (200 amp)", unitPrice: 200000 },
    { description: "Ceiling Fan Installation", unitPrice: 17500 },
    { description: "Light Fixture Installation", unitPrice: 12500 },
    { description: "Wiring Repair (per run)", unitPrice: 30000 },
    { description: "EV Charger Installation", unitPrice: 150000 },
    { description: "Whole Home Surge Protection", unitPrice: 40000 },
  ],
  landscaping: [
    { description: "Lawn Mowing (per visit)", unitPrice: 7500 },
    { description: "Landscaping Design Consultation", unitPrice: 25000 },
    { description: "Tree Trimming (per tree)", unitPrice: 20000 },
    { description: "Mulch Installation (per yard)", unitPrice: 7500 },
    { description: "Irrigation System Install", unitPrice: 350000 },
    { description: "Sod Installation (per sq ft)", unitPrice: 200 },
    { description: "Patio / Hardscape (per sq ft)", unitPrice: 2500 },
    { description: "Weekly Maintenance Plan", unitPrice: 30000 },
  ],
  "general-contractor": [
    { description: "Consultation / Estimate", unitPrice: 15000 },
    { description: "Demolition (per day)", unitPrice: 75000 },
    { description: "Framing (per sq ft)", unitPrice: 1200 },
    { description: "Drywall (per sq ft)", unitPrice: 400 },
    { description: "Painting (per room)", unitPrice: 45000 },
    { description: "Flooring Install (per sq ft)", unitPrice: 800 },
    { description: "Kitchen Remodel (base)", unitPrice: 1500000 },
    { description: "Bathroom Remodel (base)", unitPrice: 850000 },
  ],
};

const DEFAULT_PRICING = [
  { description: "Service Call", unitPrice: 10000 },
  { description: "Labor (per hour)", unitPrice: 12500 },
  { description: "Materials", unitPrice: 25000 },
  { description: "Cleanup / Disposal", unitPrice: 7500 },
];

export async function POST(request: NextRequest) {
  // Rate limit: 30 quote generations per hour per IP
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await rateLimitByIP(ip, "quote-generate", 30);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  let clientId: string;
  try {
    ({ clientId } = await requireClient());
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    return NextResponse.json({ error: getErrorMessage(e) }, { status });
  }

  const validation = await validateBody(request, generateSchema);
  if (!validation.success) {
    return validation.response;
  }
  const body = validation.data;

  // Get client vertical for pricing context
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { vertical: true, businessName: true },
  });

  const vertical = client?.vertical || "other";
  const pricingTemplate = VERTICAL_PRICING[vertical] || DEFAULT_PRICING;
  const description = body.jobDescription.toLowerCase();

  // Simple AI-like matching: pick relevant line items based on keyword matching
  const selectedItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }> = [];

  // Always add a service call / diagnostic
  const diagnosticItem = pricingTemplate.find(
    (p) =>
      p.description.toLowerCase().includes("service call") ||
      p.description.toLowerCase().includes("inspection") ||
      p.description.toLowerCase().includes("diagnostic") ||
      p.description.toLowerCase().includes("consultation")
  );
  if (diagnosticItem) {
    selectedItems.push({
      description: diagnosticItem.description,
      quantity: 1,
      unitPrice: diagnosticItem.unitPrice,
      total: diagnosticItem.unitPrice,
    });
  }

  // Match keywords from the job description to pricing template items
  for (const item of pricingTemplate) {
    if (selectedItems.some((s) => s.description === item.description)) continue;

    const keywords = item.description.toLowerCase().split(/[\s/()]+/);
    const matches = keywords.some(
      (kw) => kw.length > 3 && description.includes(kw)
    );

    if (matches) {
      const quantity = 1;
      selectedItems.push({
        description: item.description,
        quantity,
        unitPrice: item.unitPrice,
        total: item.unitPrice * quantity,
      });
    }
  }

  // If we didn't match enough items, add labor + materials
  if (selectedItems.length < 2) {
    const laborItem = pricingTemplate.find((p) =>
      p.description.toLowerCase().includes("labor")
    );
    if (laborItem && !selectedItems.some((s) => s.description === laborItem.description)) {
      selectedItems.push({
        description: laborItem.description,
        quantity: 2,
        unitPrice: laborItem.unitPrice,
        total: laborItem.unitPrice * 2,
      });
    }

    const materialsItem = pricingTemplate.find((p) =>
      p.description.toLowerCase().includes("material")
    );
    if (materialsItem && !selectedItems.some((s) => s.description === materialsItem.description)) {
      selectedItems.push({
        description: materialsItem.description,
        quantity: 1,
        unitPrice: materialsItem.unitPrice,
        total: materialsItem.unitPrice,
      });
    }
  }

  // If still empty, use first two items from template
  if (selectedItems.length === 0) {
    for (let i = 0; i < Math.min(2, pricingTemplate.length); i++) {
      selectedItems.push({
        description: pricingTemplate[i].description,
        quantity: 1,
        unitPrice: pricingTemplate[i].unitPrice,
        total: pricingTemplate[i].unitPrice,
      });
    }
  }

  const subtotal = selectedItems.reduce((sum, item) => sum + item.total, 0);
  const tax = Math.round(subtotal * 0.08); // 8% tax
  const total = subtotal + tax;

  // Generate a professional title
  const titleWords = body.jobDescription.split(" ").slice(0, 6).join(" ");
  const title = `Proposal: ${titleWords}${body.jobDescription.split(" ").length > 6 ? "..." : ""}`;

  return NextResponse.json({
    title,
    description: body.jobDescription,
    lineItems: selectedItems,
    subtotal,
    tax,
    total,
    customerName: body.customerName || "",
    vertical,
    businessName: client?.businessName || "",
  });
}
