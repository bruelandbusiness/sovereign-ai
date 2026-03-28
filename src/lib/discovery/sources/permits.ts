import { logger } from "@/lib/logger";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { PermitSourceConfig, RawDiscoveredLead } from "../types";

/**
 * Fetch building permit records from a public permit API endpoint.
 *
 * If no apiUrl is configured, returns an empty array with a warning log.
 * Parses permit records into the standard RawDiscoveredLead format.
 */
export async function fetchPermits(
  config: PermitSourceConfig,
): Promise<RawDiscoveredLead[]> {
  if (!config.apiUrl) {
    logger.warn("[discovery:permits] No apiUrl configured, skipping permit fetch", {
      county: config.county,
      state: config.state,
    });
    return [];
  }

  const lookbackDate = new Date();
  lookbackDate.setDate(lookbackDate.getDate() - config.lookbackDays);

  const params = new URLSearchParams({
    county: config.county,
    state: config.state,
    permit_types: config.permitTypes.join(","),
    issued_after: lookbackDate.toISOString().split("T")[0],
  });

  const url = `${config.apiUrl}?${params.toString()}`;

  logger.info("[discovery:permits] Fetching permits", {
    url: config.apiUrl,
    county: config.county,
    state: config.state,
    permitTypes: config.permitTypes,
    lookbackDays: config.lookbackDays,
  });

  let response: Response;
  try {
    response = await fetchWithTimeout(url, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
  } catch (err) {
    logger.errorWithCause("[discovery:permits] Request failed", err, {
      url: config.apiUrl,
    });
    return [];
  }

  if (!response.ok) {
    logger.warn("[discovery:permits] Non-OK response from permit API", {
      status: response.status,
      statusText: response.statusText,
    });
    return [];
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch (err) {
    logger.errorWithCause("[discovery:permits] Failed to parse JSON response", err);
    return [];
  }

  const records = Array.isArray(data)
    ? data
    : typeof data === "object" && data !== null && "results" in data
      ? (data as { results: unknown[] }).results
      : [];

  if (!Array.isArray(records)) {
    logger.warn("[discovery:permits] Unexpected response shape, no records found");
    return [];
  }

  const leads: RawDiscoveredLead[] = [];

  for (const record of records) {
    if (typeof record !== "object" || record === null) continue;

    const r = record as Record<string, unknown>;

    const permitDate = r.issued_date || r.permit_date || r.date;
    const parsedDate = permitDate ? new Date(String(permitDate)) : undefined;

    leads.push({
      externalId: r.permit_id ? String(r.permit_id) : r.id ? String(r.id) : undefined,
      sourceType: "permit",
      propertyAddress:
        r.property_address || r.address || r.site_address
          ? String(r.property_address || r.address || r.site_address)
          : undefined,
      ownerName:
        r.owner_name || r.applicant_name
          ? String(r.owner_name || r.applicant_name)
          : undefined,
      ownerPhone: r.owner_phone ? String(r.owner_phone) : undefined,
      ownerEmail: r.owner_email ? String(r.owner_email) : undefined,
      propertyType: r.property_type ? String(r.property_type) : undefined,
      permitType: r.permit_type || r.type ? String(r.permit_type || r.type) : undefined,
      permitDate: parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate : undefined,
      rawData: r,
    });
  }

  logger.info("[discovery:permits] Parsed permit records", {
    county: config.county,
    totalRecords: records.length,
    parsedLeads: leads.length,
  });

  return leads;
}
