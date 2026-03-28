/**
 * Universal CRM Push Manager
 *
 * Routes qualified leads to the client's CRM of choice: ServiceTitan,
 * HouseCall Pro, Jobber, or a generic webhook endpoint.  Every push is
 * retried on transient errors so that no lead is ever lost.
 */

import { createHmac } from "crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Supported CRM back-ends. */
export type CRMType = "servicetitan" | "housecallpro" | "jobber" | "webhook" | "none";

/** Credentials and routing information for a CRM integration. */
export interface CRMConfig {
  type: CRMType;
  credentials: Record<string, string>;
  /** ServiceTitan tenant / app id. */
  tenantId?: string;
  /** Generic webhook target URL. */
  webhookUrl?: string;
  /** HMAC secret used to sign webhook payloads. */
  webhookSecret?: string;
}

/** Normalised lead payload used across all CRM integrations. */
export interface LeadData {
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  source: string;
  score: number;
  signals: string[];
  notes?: string;
}

/** Result of a CRM push attempt. */
export interface PushResult {
  success: boolean;
  externalId?: string;
  error?: string;
  crmType: CRMType;
  retryable: boolean;
}

// ---------------------------------------------------------------------------
// CRM-specific configuration constants
// ---------------------------------------------------------------------------

/** ServiceTitan API configuration. */
export const SERVICETITAN_CONFIG = {
  baseUrl: "https://api.servicetitan.io",
  tokenEndpoint: "https://auth.servicetitan.io/connect/token",
  authType: "oauth2_client_credentials" as const,
  tokenTTLSeconds: 3600,
  rateLimits: {
    perMinute: 60,
    perDay: 10_000,
  },
  fieldMapping: {
    firstName: "name.first",
    lastName: "name.last",
    email: "email",
    phone: "phoneNumber",
    address: "address.street",
    city: "address.city",
    state: "address.state",
    zipCode: "address.zip",
    source: "customerSource",
    notes: "notes",
  },
} as const;

/** HouseCall Pro API configuration. */
export const HOUSECALLPRO_CONFIG = {
  baseUrl: "https://api.housecallpro.com",
  authType: "bearer_token" as const,
  rateLimits: {
    perSecond: 2,
  },
  fieldMapping: {
    firstName: "first_name",
    lastName: "last_name",
    email: "email",
    phone: "mobile_number",
    address: "address",
    city: "city",
    state: "state",
    zipCode: "zip_code",
    notes: "notes",
    tags: "tags",
  },
} as const;

/** Jobber GraphQL API configuration. */
export const JOBBER_CONFIG = {
  graphqlEndpoint: "https://api.getjobber.com/api/graphql",
  authType: "oauth2" as const,
  tokenEndpoint: "https://api.getjobber.com/api/oauth/token",
  mutation: "clientCreate",
} as const;

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class CRMPushError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly retryable: boolean = false,
  ) {
    super(message);
    this.name = "CRMPushError";
  }
}

// ---------------------------------------------------------------------------
// OAuth token cache
// ---------------------------------------------------------------------------

interface CachedToken {
  token: string;
  expiresAt: number;
}

const tokenCache = new Map<string, CachedToken>();

/**
 * Obtain an OAuth 2.0 access token using the client_credentials grant.
 *
 * Tokens are cached in-memory until they expire (with a 60-second safety
 * margin).
 *
 * @param tokenEndpoint - The token URL of the OAuth server.
 * @param clientId      - OAuth client id.
 * @param clientSecret  - OAuth client secret.
 * @returns A valid bearer token string.
 */
export async function getOAuthToken(
  tokenEndpoint: string,
  clientId: string,
  clientSecret: string,
): Promise<string> {
  const cacheKey = `${tokenEndpoint}:${clientId}`;
  const cached = tokenCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.token;
  }

  const res = await fetch(tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new CRMPushError(
      `OAuth token request failed (${res.status}): ${text}`,
      res.status,
      res.status >= 500,
    );
  }

  const data = (await res.json()) as { access_token: string; expires_in?: number };
  const expiresIn = data.expires_in ?? 3600;
  const token = data.access_token;

  tokenCache.set(cacheKey, {
    token,
    expiresAt: Date.now() + (expiresIn - 60) * 1000,
  });

  return token;
}

// ---------------------------------------------------------------------------
// Retry helper
// ---------------------------------------------------------------------------

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 500;

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const retryable =
        err instanceof CRMPushError ? err.retryable : false;
      if (!retryable || attempt === MAX_RETRIES - 1) {
        throw err;
      }
      const delay = BASE_DELAY_MS * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

// ---------------------------------------------------------------------------
// Field mappers
// ---------------------------------------------------------------------------

/**
 * Map a {@link LeadData} object to the ServiceTitan customer/lead format.
 */
export function mapLeadToServiceTitan(lead: LeadData): Record<string, unknown> {
  return {
    name: {
      first: lead.firstName,
      last: lead.lastName,
    },
    email: lead.email ?? null,
    phoneNumber: lead.phone,
    address: {
      street: lead.address ?? "",
      city: lead.city ?? "",
      state: lead.state ?? "",
      zip: lead.zipCode ?? "",
    },
    customerSource: lead.source,
    notes: [
      lead.notes ?? "",
      `Sovereign Score: ${lead.score}`,
      `Signals: ${lead.signals.join(", ")}`,
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

/**
 * Map a {@link LeadData} object to the HouseCall Pro customer format.
 *
 * Tags are used to preserve lead metadata.
 */
export function mapLeadToHousecallPro(lead: LeadData): Record<string, unknown> {
  return {
    first_name: lead.firstName,
    last_name: lead.lastName,
    email: lead.email ?? null,
    mobile_number: lead.phone,
    address: lead.address ?? "",
    city: lead.city ?? "",
    state: lead.state ?? "",
    zip_code: lead.zipCode ?? "",
    notes: lead.notes ?? "",
    tags: ["sovereign-lead", lead.source, `score-${lead.score}`],
  };
}

/**
 * Map a {@link LeadData} object to a Jobber GraphQL `clientCreate` input.
 */
export function mapLeadToJobber(lead: LeadData): Record<string, unknown> {
  return {
    input: {
      firstName: lead.firstName,
      lastName: lead.lastName,
      emails: lead.email ? [{ description: "main", address: lead.email }] : [],
      phones: [{ description: "main", number: lead.phone }],
      billingAddress: {
        street1: lead.address ?? "",
        city: lead.city ?? "",
        province: lead.state ?? "",
        postalCode: lead.zipCode ?? "",
      },
      note: [
        lead.notes ?? "",
        `Source: ${lead.source}`,
        `Score: ${lead.score}`,
        `Signals: ${lead.signals.join(", ")}`,
      ]
        .filter(Boolean)
        .join("\n"),
    },
  };
}

// ---------------------------------------------------------------------------
// CRM-specific push functions
// ---------------------------------------------------------------------------

/**
 * Push a lead to ServiceTitan via their REST API.
 *
 * Authenticates with OAuth 2.0 client_credentials and creates a customer
 * record.
 */
export async function pushToServiceTitan(
  lead: LeadData,
  config: CRMConfig,
): Promise<PushResult> {
  return withRetry(async () => {
    const token = await getOAuthToken(
      SERVICETITAN_CONFIG.tokenEndpoint,
      config.credentials.clientId ?? "",
      config.credentials.clientSecret ?? "",
    );

    const body = mapLeadToServiceTitan(lead);
    const tenantId = config.tenantId ?? config.credentials.tenantId ?? "";
    const url = `${SERVICETITAN_CONFIG.baseUrl}/crm/v2/tenant/${tenantId}/customers`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "ST-App-Key": config.credentials.appKey ?? "",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "Unknown error");
      const retryable = res.status === 429 || res.status >= 500;
      throw new CRMPushError(
        `ServiceTitan push failed (${res.status}): ${text}`,
        res.status,
        retryable,
      );
    }

    const data = (await res.json()) as { id?: string | number };
    return {
      success: true,
      externalId: data.id != null ? String(data.id) : undefined,
      crmType: "servicetitan" as CRMType,
      retryable: false,
    };
  });
}

/**
 * Push a lead to HouseCall Pro via their REST API.
 *
 * Uses a static bearer token for authentication.
 */
export async function pushToHousecallPro(
  lead: LeadData,
  config: CRMConfig,
): Promise<PushResult> {
  return withRetry(async () => {
    const body = mapLeadToHousecallPro(lead);
    const url = `${HOUSECALLPRO_CONFIG.baseUrl}/customers`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.credentials.apiKey ?? ""}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "Unknown error");
      const retryable = res.status === 429 || res.status >= 500;
      throw new CRMPushError(
        `HouseCall Pro push failed (${res.status}): ${text}`,
        res.status,
        retryable,
      );
    }

    const data = (await res.json()) as { id?: string };
    return {
      success: true,
      externalId: data.id ?? undefined,
      crmType: "housecallpro" as CRMType,
      retryable: false,
    };
  });
}

/**
 * Push a lead to Jobber via their GraphQL API.
 *
 * Authenticates with OAuth 2.0 and executes the `clientCreate` mutation.
 */
export async function pushToJobber(
  lead: LeadData,
  config: CRMConfig,
): Promise<PushResult> {
  return withRetry(async () => {
    const token = await getOAuthToken(
      JOBBER_CONFIG.tokenEndpoint,
      config.credentials.clientId ?? "",
      config.credentials.clientSecret ?? "",
    );

    const variables = mapLeadToJobber(lead);

    const mutation = `
      mutation ClientCreate($input: ClientCreateInput!) {
        clientCreate(input: $input) {
          client {
            id
          }
          userErrors {
            message
            path
          }
        }
      }
    `;

    const res = await fetch(JOBBER_CONFIG.graphqlEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: mutation, variables }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "Unknown error");
      const retryable = res.status === 429 || res.status >= 500;
      throw new CRMPushError(
        `Jobber push failed (${res.status}): ${text}`,
        res.status,
        retryable,
      );
    }

    const data = (await res.json()) as {
      data?: {
        clientCreate?: {
          client?: { id?: string };
          userErrors?: { message: string; path: string[] }[];
        };
      };
      errors?: { message: string }[];
    };

    if (data.errors && data.errors.length > 0) {
      throw new CRMPushError(
        `Jobber GraphQL errors: ${data.errors.map((e) => e.message).join("; ")}`,
        undefined,
        false,
      );
    }

    const userErrors = data.data?.clientCreate?.userErrors;
    if (userErrors && userErrors.length > 0) {
      throw new CRMPushError(
        `Jobber validation errors: ${userErrors.map((e) => e.message).join("; ")}`,
        undefined,
        false,
      );
    }

    const clientId = data.data?.clientCreate?.client?.id;
    return {
      success: true,
      externalId: clientId ?? undefined,
      crmType: "jobber" as CRMType,
      retryable: false,
    };
  });
}

/**
 * Push a lead to a generic webhook endpoint.
 *
 * The payload is signed with HMAC-SHA256 and the signature is sent in the
 * `X-Sovereign-Signature` header so the receiver can verify authenticity.
 */
export async function pushToWebhook(
  lead: LeadData,
  config: CRMConfig,
): Promise<PushResult> {
  return withRetry(async () => {
    const url = config.webhookUrl;
    if (!url) {
      throw new CRMPushError("Webhook URL is required for webhook CRM type.", undefined, false);
    }

    const payload = JSON.stringify({
      event: "lead.created",
      timestamp: new Date().toISOString(),
      data: lead,
    });

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (config.webhookSecret) {
      const signature = createHmac("sha256", config.webhookSecret)
        .update(payload)
        .digest("hex");
      headers["X-Sovereign-Signature"] = signature;
    }

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: payload,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "Unknown error");
      const retryable = res.status === 429 || res.status >= 500;
      throw new CRMPushError(
        `Webhook push failed (${res.status}): ${text}`,
        res.status,
        retryable,
      );
    }

    const data = (await res.json().catch(() => ({}))) as { id?: string };
    return {
      success: true,
      externalId: data.id ?? undefined,
      crmType: "webhook" as CRMType,
      retryable: false,
    };
  });
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Push a lead to the configured CRM.
 *
 * Routes to the correct CRM-specific handler based on `crmConfig.type`.
 * Transient HTTP errors (429, 500, 503) are retried up to three times with
 * exponential back-off.  The function never silently drops a lead -- on
 * permanent failure the returned {@link PushResult} contains an error message
 * and `success: false`.
 *
 * @param lead      - Normalised lead data.
 * @param crmConfig - CRM type, credentials, and connection details.
 * @returns The push result including any external record id.
 */
export async function pushLead(
  lead: LeadData,
  crmConfig: CRMConfig,
): Promise<PushResult> {
  if (crmConfig.type === "none") {
    return {
      success: true,
      crmType: "none",
      retryable: false,
    };
  }

  try {
    switch (crmConfig.type) {
      case "servicetitan":
        return await pushToServiceTitan(lead, crmConfig);
      case "housecallpro":
        return await pushToHousecallPro(lead, crmConfig);
      case "jobber":
        return await pushToJobber(lead, crmConfig);
      case "webhook":
        return await pushToWebhook(lead, crmConfig);
      default: {
        const exhaustive: never = crmConfig.type;
        return {
          success: false,
          error: `Unsupported CRM type: ${exhaustive}`,
          crmType: crmConfig.type,
          retryable: false,
        };
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const retryable = err instanceof CRMPushError ? err.retryable : false;
    return {
      success: false,
      error: message,
      crmType: crmConfig.type,
      retryable,
    };
  }
}
