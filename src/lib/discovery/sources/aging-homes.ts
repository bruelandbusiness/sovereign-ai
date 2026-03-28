import { logger } from "@/lib/logger";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { AgingHomeConfig, RawDiscoveredLead } from "../types";

const PROPERTY_API_URL =
  "https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/basicprofile";

/**
 * Find aging homes that are likely in need of service work.
 *
 * Cross-references property age with last permit date to find homes
 * that are old enough to need repairs but have not had recent permitted work.
 *
 * Requires PROPERTY_DATA_API_KEY. Returns empty with warning if not set.
 */
export async function findAgingHomes(
  config: AgingHomeConfig,
): Promise<RawDiscoveredLead[]> {
  const apiKey = process.env.PROPERTY_DATA_API_KEY;

  if (!apiKey) {
    logger.warn(
      "[discovery:aging-homes] PROPERTY_DATA_API_KEY not set, skipping aging home detection",
      { city: config.city, state: config.state },
    );
    return [];
  }

  const cutoffYear = new Date().getFullYear() - config.minAge;

  const params = new URLSearchParams({
    city: config.city,
    state: config.state,
    maxyearbuilt: String(cutoffYear),
    orderby: "yearBuilt ASC",
    pagesize: "100",
  });

  const url = `${PROPERTY_API_URL}?${params.toString()}`;

  logger.info("[discovery:aging-homes] Fetching aging home data", {
    city: config.city,
    state: config.state,
    minAge: config.minAge,
    cutoffYear,
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
    logger.errorWithCause("[discovery:aging-homes] Request failed", err, {
      city: config.city,
      state: config.state,
    });
    return [];
  }

  if (!response.ok) {
    logger.warn("[discovery:aging-homes] Non-OK response from property API", {
      status: response.status,
      statusText: response.statusText,
    });
    return [];
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch (err) {
    logger.errorWithCause("[discovery:aging-homes] Failed to parse JSON", err);
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
    logger.warn("[discovery:aging-homes] Unexpected response shape, no records found");
    return [];
  }

  const currentYear = new Date().getFullYear();
  const permitCutoffDate = new Date();
  permitCutoffDate.setFullYear(
    permitCutoffDate.getFullYear() - config.lookbackPermitYears,
  );

  const leads: RawDiscoveredLead[] = [];

  for (const record of records) {
    if (typeof record !== "object" || record === null) continue;

    const r = record as Record<string, unknown>;

    const building =
      r.building && typeof r.building === "object"
        ? (r.building as Record<string, unknown>)
        : r;

    const address =
      r.address && typeof r.address === "object"
        ? (r.address as Record<string, unknown>)
        : r;

    const yearBuilt = Number(building.yearBuilt || building.year_built || r.yearBuilt);
    if (isNaN(yearBuilt) || yearBuilt <= 0) continue;

    const propertyAge = currentYear - yearBuilt;
    if (propertyAge < config.minAge) continue;

    // Check if property has had recent permits
    const lastPermitDate = r.lastPermitDate || r.last_permit_date;
    if (lastPermitDate) {
      const parsedPermitDate = new Date(String(lastPermitDate));
      if (
        !isNaN(parsedPermitDate.getTime()) &&
        parsedPermitDate > permitCutoffDate
      ) {
        // Property has had recent permitted work, less likely to need service
        continue;
      }
    }

    const fullAddress =
      address.oneLine ||
      address.full_address ||
      address.propertyAddress ||
      (address.line1
        ? `${address.line1}, ${address.city || config.city}, ${address.state || config.state}`
        : undefined);

    leads.push({
      externalId: r.identifier
        ? String(
            typeof r.identifier === "object"
              ? (r.identifier as Record<string, unknown>).attomId ||
                  (r.identifier as Record<string, unknown>).id
              : r.identifier,
          )
        : r.id
          ? String(r.id)
          : undefined,
      sourceType: "aging_home",
      propertyAddress: fullAddress ? String(fullAddress) : undefined,
      ownerName:
        r.owner_name || (r.owner && typeof r.owner === "object" && (r.owner as Record<string, unknown>).name)
          ? String(
              r.owner_name ||
                (r.owner as Record<string, unknown>).name,
            )
          : undefined,
      ownerPhone: r.owner_phone ? String(r.owner_phone) : undefined,
      ownerEmail: r.owner_email ? String(r.owner_email) : undefined,
      propertyAge,
      propertyType:
        r.property_type || building.propertyType
          ? String(r.property_type || building.propertyType)
          : undefined,
      rawData: r,
    });
  }

  logger.info("[discovery:aging-homes] Parsed aging home records", {
    city: config.city,
    totalRecords: records.length,
    qualifyingLeads: leads.length,
  });

  return leads;
}
