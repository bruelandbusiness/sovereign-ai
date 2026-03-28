import { logger } from "@/lib/logger";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { RealEstateSourceConfig, RawDiscoveredLead } from "../types";

const PROPERTY_DATA_API_URL = "https://api.gateway.attomdata.com/propertyapi/v1.0.0/sale/snapshot";

/**
 * Fetch recent home sales from a property data API.
 *
 * Uses PROPERTY_DATA_API_KEY from env or config.apiKey.
 * Returns empty array with warning if no API key is available.
 */
export async function fetchRecentSales(
  config: RealEstateSourceConfig,
): Promise<RawDiscoveredLead[]> {
  const apiKey = config.apiKey || process.env.PROPERTY_DATA_API_KEY;

  if (!apiKey) {
    logger.warn(
      "[discovery:real-estate] PROPERTY_DATA_API_KEY not set, skipping real estate fetch",
      { city: config.city, state: config.state },
    );
    return [];
  }

  const lookbackDate = new Date();
  lookbackDate.setDate(lookbackDate.getDate() - config.lookbackDays);

  const params = new URLSearchParams({
    city: config.city,
    state: config.state,
    minsaledate: lookbackDate.toISOString().split("T")[0],
    orderby: "SaleSearchDate DESC",
    pagesize: "100",
  });

  const url = `${PROPERTY_DATA_API_URL}?${params.toString()}`;

  logger.info("[discovery:real-estate] Fetching recent sales", {
    city: config.city,
    state: config.state,
    lookbackDays: config.lookbackDays,
  });

  let response: Response;
  try {
    response = await fetchWithTimeout(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        apikey: apiKey,
      },
    });
  } catch (err) {
    logger.errorWithCause("[discovery:real-estate] Request failed", err, {
      city: config.city,
      state: config.state,
    });
    return [];
  }

  if (!response.ok) {
    logger.warn("[discovery:real-estate] Non-OK response from property API", {
      status: response.status,
      statusText: response.statusText,
    });
    return [];
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch (err) {
    logger.errorWithCause("[discovery:real-estate] Failed to parse JSON", err);
    return [];
  }

  const records = Array.isArray(data)
    ? data
    : typeof data === "object" && data !== null && "property" in data
      ? (data as { property: unknown[] }).property
      : typeof data === "object" && data !== null && "results" in data
        ? (data as { results: unknown[] }).results
        : [];

  if (!Array.isArray(records)) {
    logger.warn("[discovery:real-estate] Unexpected response shape, no records found");
    return [];
  }

  const leads: RawDiscoveredLead[] = [];

  for (const record of records) {
    if (typeof record !== "object" || record === null) continue;

    const r = record as Record<string, unknown>;

    // Handle nested structures common in property APIs
    const address =
      r.address && typeof r.address === "object"
        ? (r.address as Record<string, unknown>)
        : r;

    const sale =
      r.sale && typeof r.sale === "object"
        ? (r.sale as Record<string, unknown>)
        : r;

    const building =
      r.building && typeof r.building === "object"
        ? (r.building as Record<string, unknown>)
        : r;

    const saleDate = sale.saleSearchDate || sale.sale_date || sale.saleDate;
    const parsedSaleDate = saleDate ? new Date(String(saleDate)) : undefined;

    const salePrice = sale.saleTransAmount || sale.sale_price || sale.salePrice;
    const parsedSalePrice = salePrice ? Math.round(Number(salePrice) * 100) : undefined;

    const yearBuilt = building.yearBuilt || building.year_built || r.yearBuilt;
    const propertyAge =
      yearBuilt
        ? new Date().getFullYear() - Number(yearBuilt)
        : undefined;

    const fullAddress =
      address.oneLine ||
      address.full_address ||
      address.propertyAddress ||
      (address.line1 ? `${address.line1}, ${address.city || config.city}, ${address.state || config.state}` : undefined);

    leads.push({
      externalId: r.identifier
        ? String(
            typeof r.identifier === "object"
              ? (r.identifier as Record<string, unknown>).attomId || (r.identifier as Record<string, unknown>).id
              : r.identifier,
          )
        : r.id
          ? String(r.id)
          : undefined,
      sourceType: "real_estate",
      propertyAddress: fullAddress ? String(fullAddress) : undefined,
      ownerName:
        r.owner_name || (r.owner && typeof r.owner === "object" && (r.owner as Record<string, unknown>).name)
          ? String(r.owner_name || (r.owner as Record<string, unknown>).name)
          : undefined,
      ownerPhone: r.owner_phone ? String(r.owner_phone) : undefined,
      ownerEmail: r.owner_email ? String(r.owner_email) : undefined,
      propertyAge: propertyAge != null && !isNaN(propertyAge) && propertyAge > 0 ? propertyAge : undefined,
      propertyType:
        r.property_type || building.propertyType
          ? String(r.property_type || building.propertyType)
          : undefined,
      saleDate:
        parsedSaleDate && !isNaN(parsedSaleDate.getTime()) ? parsedSaleDate : undefined,
      salePrice:
        parsedSalePrice != null && !isNaN(parsedSalePrice) ? parsedSalePrice : undefined,
      rawData: r,
    });
  }

  logger.info("[discovery:real-estate] Parsed real estate records", {
    city: config.city,
    totalRecords: records.length,
    parsedLeads: leads.length,
  });

  return leads;
}
