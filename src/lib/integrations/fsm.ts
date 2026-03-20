// Field Service Management (FSM) integration library
// Bidirectional sync with ServiceTitan, Jobber, and Housecall Pro
// Falls back to mock data when API keys aren't configured

import { logger } from "@/lib/logger";
import {
  fetchWithRetry,
  IntegrationError,
  refreshOAuthToken,
  sanitizePathSegment,
  type RetryOptions,
} from "@/lib/integrations/integration-utils";

// ─── Types ───────────────────────────────────────────────────

export type FSMPlatform = "servicetitan" | "jobber" | "housecallpro";

export interface FSMJob {
  id: string;
  externalId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  address?: string;
  status: string;
  scheduledAt?: string;
  completedAt?: string;
  totalAmount?: number; // cents
  description?: string;
  isMock: boolean;
}

export interface FSMCustomer {
  id: string;
  externalId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt: string;
  totalJobs?: number;
  totalRevenue?: number; // cents
  isMock: boolean;
}

export interface FSMPushResult {
  success: boolean;
  externalId: string;
  platform: FSMPlatform;
  isMock: boolean;
  error?: string;
}

export interface FSMSyncResult {
  jobs: FSMJob[];
  customers: FSMCustomer[];
  isMock: boolean;
  syncedAt: string;
}

export interface FSMJobStatus {
  externalId: string;
  status: string;
  lastUpdated: string;
  isMock: boolean;
}

export interface FSMCustomerHistory {
  externalId: string;
  jobs: FSMJob[];
  totalRevenue: number;
  isMock: boolean;
}

// ─── Platform Config ─────────────────────────────────────────

interface PlatformCredentials {
  accessToken: string | undefined;
  clientId: string | undefined;
  clientSecret: string | undefined;
  tenantId: string | undefined;
  refreshToken: string | undefined;
}

function getEnvCredentials(platform: FSMPlatform): PlatformCredentials {
  switch (platform) {
    case "servicetitan":
      return {
        accessToken: process.env.SERVICETITAN_ACCESS_TOKEN,
        clientId: process.env.SERVICETITAN_CLIENT_ID,
        clientSecret: process.env.SERVICETITAN_CLIENT_SECRET,
        tenantId: process.env.SERVICETITAN_TENANT_ID,
        refreshToken: process.env.SERVICETITAN_REFRESH_TOKEN,
      };
    case "jobber":
      return {
        accessToken: process.env.JOBBER_ACCESS_TOKEN,
        clientId: process.env.JOBBER_CLIENT_ID,
        clientSecret: process.env.JOBBER_CLIENT_SECRET,
        tenantId: undefined,
        refreshToken: process.env.JOBBER_REFRESH_TOKEN,
      };
    case "housecallpro":
      return {
        accessToken: process.env.HOUSECALLPRO_ACCESS_TOKEN,
        clientId: process.env.HOUSECALLPRO_CLIENT_ID,
        clientSecret: process.env.HOUSECALLPRO_CLIENT_SECRET,
        tenantId: undefined,
        refreshToken: process.env.HOUSECALLPRO_REFRESH_TOKEN,
      };
  }
}

/** Token refresh endpoints per platform */
const TOKEN_URLS: Record<FSMPlatform, string> = {
  servicetitan: "https://auth.servicetitan.io/connect/token",
  jobber: "https://api.getjobber.com/api/oauth/token",
  housecallpro: "https://api.housecallpro.com/oauth/token",
};

/**
 * Attempt to refresh the OAuth token for a given platform.
 * Returns the new access token or undefined if refresh is not possible.
 */
async function tryRefreshToken(platform: FSMPlatform): Promise<string | undefined> {
  const creds = getEnvCredentials(platform);
  if (!creds.clientId || !creds.clientSecret || !creds.refreshToken) {
    return undefined;
  }

  try {
    const result = await refreshOAuthToken(
      {
        tokenUrl: TOKEN_URLS[platform],
        clientId: creds.clientId,
        clientSecret: creds.clientSecret,
        refreshToken: creds.refreshToken,
      },
      `fsm-${platform}`,
    );
    // NOTE: In production, persist result.accessToken & result.refreshToken
    // to database / credential store. For now, log and return.
    logger.info(`[fsm] Refreshed token for ${platform}`);
    return result.accessToken;
  } catch (err) {
    logger.error(`[fsm] Token refresh failed for ${platform}`, {
      error: err instanceof Error ? err.message : String(err),
    });
    return undefined;
  }
}

function isPlatformConfigured(platform: FSMPlatform): boolean {
  const creds = getEnvCredentials(platform);
  return !!(creds.accessToken || (creds.clientId && creds.clientSecret));
}

// ─── Abstract FSM Adapter ────────────────────────────────────

export interface FSMAdapter {
  platform: FSMPlatform;
  syncJobs(accessToken?: string): Promise<FSMJob[]>;
  syncCustomers(accessToken?: string): Promise<FSMCustomer[]>;
  pushLead(data: {
    name: string;
    email?: string;
    phone?: string;
    notes?: string;
  }, accessToken?: string): Promise<FSMPushResult>;
  pushBooking(data: {
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    scheduledAt: string;
    description?: string;
  }, accessToken?: string): Promise<FSMPushResult>;
  getJobStatus(externalId: string, accessToken?: string): Promise<FSMJobStatus>;
  getCustomerHistory(externalId: string, accessToken?: string): Promise<FSMCustomerHistory>;
}

// ─── Mock Data Generators ────────────────────────────────────

function mockJobs(platform: FSMPlatform): FSMJob[] {
  const statuses = ["scheduled", "in_progress", "completed", "cancelled"];
  const names = [
    "John Smith", "Maria Garcia", "David Johnson", "Sarah Williams",
    "Mike Brown", "Emily Davis", "Robert Wilson", "Lisa Anderson",
  ];

  return Array.from({ length: 8 }, (_, i) => ({
    id: `mock-job-${platform}-${i + 1}`,
    externalId: `${platform}-job-${1000 + i}`,
    customerName: names[i % names.length],
    customerEmail: `${names[i % names.length].toLowerCase().replace(" ", ".")}@example.com`,
    customerPhone: `(555) ${String(100 + i).padStart(3, "0")}-${String(4000 + i * 111).padStart(4, "0")}`,
    address: `${100 + i * 50} Main St, Anytown, US`,
    status: statuses[i % statuses.length],
    scheduledAt: new Date(Date.now() + (i - 3) * 86400000).toISOString(),
    completedAt: i % statuses.length === 2 ? new Date(Date.now() - i * 86400000).toISOString() : undefined,
    totalAmount: (15000 + i * 5000),
    description: `${["HVAC Repair", "Plumbing Fix", "Electrical Work", "Roof Inspection"][i % 4]} — Job #${1000 + i}`,
    isMock: true,
  }));
}

function mockCustomers(platform: FSMPlatform): FSMCustomer[] {
  const names = [
    "John Smith", "Maria Garcia", "David Johnson", "Sarah Williams",
    "Mike Brown", "Emily Davis", "Robert Wilson", "Lisa Anderson",
    "James Taylor", "Jennifer Martinez",
  ];

  return Array.from({ length: 10 }, (_, i) => ({
    id: `mock-customer-${platform}-${i + 1}`,
    externalId: `${platform}-cust-${2000 + i}`,
    name: names[i % names.length],
    email: `${names[i % names.length].toLowerCase().replace(" ", ".")}@example.com`,
    phone: `(555) ${String(200 + i).padStart(3, "0")}-${String(5000 + i * 111).padStart(4, "0")}`,
    address: `${200 + i * 25} Oak Ave, Anytown, US`,
    createdAt: new Date(Date.now() - (30 + i * 15) * 86400000).toISOString(),
    totalJobs: 1 + Math.floor(Math.random() * 8),
    totalRevenue: (10000 + Math.floor(Math.random() * 50000)),
    isMock: true,
  }));
}

// ─── ServiceTitan Adapter ────────────────────────────────────

class ServiceTitanAdapter implements FSMAdapter {
  platform: FSMPlatform = "servicetitan";

  private baseUrl = "https://api.servicetitan.io";
  private retryOpts: RetryOptions = { integration: "fsm-servicetitan" };

  private getToken(accessToken?: string): string | undefined {
    return accessToken || getEnvCredentials("servicetitan").accessToken;
  }

  private getTenantId(): string | undefined {
    return getEnvCredentials("servicetitan").tenantId;
  }

  /**
   * Resolve a valid access token, refreshing if needed.
   */
  private async resolveToken(accessToken?: string): Promise<string | undefined> {
    const token = this.getToken(accessToken);
    if (token) return token;
    return tryRefreshToken("servicetitan");
  }

  async syncJobs(accessToken?: string): Promise<FSMJob[]> {
    const token = await this.resolveToken(accessToken);
    const tenantId = this.getTenantId();

    if (!token || !tenantId) {
      logger.warn("[fsm] ServiceTitan not configured — returning mock jobs");
      return mockJobs("servicetitan");
    }

    const response = await fetchWithRetry(
      `${this.baseUrl}/jpm/v2/tenant/${encodeURIComponent(tenantId)}/jobs?page=1&pageSize=50&orderBy=createdOn desc`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "ST-App-Key": getEnvCredentials("servicetitan").clientId || "",
        },
      },
      undefined,
      this.retryOpts,
    );

    const data = (await response.json()) as {
      data: Array<{
        id: number;
        customer: { id: number; name: string; email?: string; phone?: string; address?: { street?: string } };
        jobStatus: string;
        schedule?: { start?: string; end?: string };
        completedOn?: string;
        total?: number;
        summary?: string;
      }>;
    };

    return (data.data ?? []).map((job) => ({
      id: String(job.id),
      externalId: String(job.id),
      customerName: job.customer?.name || "Unknown",
      customerEmail: job.customer?.email,
      customerPhone: job.customer?.phone,
      address: job.customer?.address?.street,
      status: job.jobStatus?.toLowerCase() || "unknown",
      scheduledAt: job.schedule?.start,
      completedAt: job.completedOn,
      totalAmount: job.total ? Math.round(job.total * 100) : undefined,
      description: job.summary,
      isMock: false,
    }));
  }

  async syncCustomers(accessToken?: string): Promise<FSMCustomer[]> {
    const token = await this.resolveToken(accessToken);
    const tenantId = this.getTenantId();

    if (!token || !tenantId) {
      logger.warn("[fsm] ServiceTitan not configured — returning mock customers");
      return mockCustomers("servicetitan");
    }

    const response = await fetchWithRetry(
      `${this.baseUrl}/crm/v2/tenant/${encodeURIComponent(tenantId)}/customers?page=1&pageSize=50&orderBy=createdOn desc`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "ST-App-Key": getEnvCredentials("servicetitan").clientId || "",
        },
      },
      undefined,
      this.retryOpts,
    );

    const data = (await response.json()) as {
      data: Array<{
        id: number;
        name: string;
        email?: string;
        phone?: string;
        address?: { street?: string };
        createdOn: string;
      }>;
    };

    return (data.data ?? []).map((cust) => ({
      id: String(cust.id),
      externalId: String(cust.id),
      name: cust.name || "Unknown",
      email: cust.email,
      phone: cust.phone,
      address: cust.address?.street,
      createdAt: cust.createdOn,
      isMock: false,
    }));
  }

  async pushLead(data: {
    name: string;
    email?: string;
    phone?: string;
    notes?: string;
  }, accessToken?: string): Promise<FSMPushResult> {
    const token = await this.resolveToken(accessToken);
    const tenantId = this.getTenantId();

    if (!token || !tenantId) {
      logger.warn("[fsm] ServiceTitan not configured — returning mock push result");
      return {
        success: true,
        externalId: `mock-st-lead-${Date.now()}`,
        platform: "servicetitan",
        isMock: true,
      };
    }

    try {
      const response = await fetchWithRetry(
        `${this.baseUrl}/crm/v2/tenant/${encodeURIComponent(tenantId)}/customers`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "ST-App-Key": getEnvCredentials("servicetitan").clientId || "",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: data.name,
            email: data.email,
            phone: data.phone,
            notes: data.notes,
            type: "Residential",
          }),
        },
        undefined,
        this.retryOpts,
      );

      const result = (await response.json()) as { id: number };
      return {
        success: true,
        externalId: String(result.id),
        platform: "servicetitan",
        isMock: false,
      };
    } catch (err) {
      logger.error("[fsm] ServiceTitan pushLead failed", {
        error: err instanceof Error ? err.message : String(err),
      });
      return {
        success: false,
        externalId: "",
        platform: "servicetitan",
        isMock: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  }

  async pushBooking(data: {
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    scheduledAt: string;
    description?: string;
  }, accessToken?: string): Promise<FSMPushResult> {
    const token = await this.resolveToken(accessToken);
    const tenantId = this.getTenantId();

    if (!token || !tenantId) {
      logger.warn("[fsm] ServiceTitan not configured — returning mock push result");
      return {
        success: true,
        externalId: `mock-st-booking-${Date.now()}`,
        platform: "servicetitan",
        isMock: true,
      };
    }

    try {
      const response = await fetchWithRetry(
        `${this.baseUrl}/jpm/v2/tenant/${encodeURIComponent(tenantId)}/jobs`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "ST-App-Key": getEnvCredentials("servicetitan").clientId || "",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customerName: data.customerName,
            schedule: { start: data.scheduledAt },
            summary: data.description || `Booking for ${data.customerName}`,
          }),
        },
        undefined,
        this.retryOpts,
      );

      const result = (await response.json()) as { id: number };
      return {
        success: true,
        externalId: String(result.id),
        platform: "servicetitan",
        isMock: false,
      };
    } catch (err) {
      logger.error("[fsm] ServiceTitan pushBooking failed", {
        error: err instanceof Error ? err.message : String(err),
      });
      return {
        success: false,
        externalId: "",
        platform: "servicetitan",
        isMock: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  }

  async getJobStatus(externalId: string, accessToken?: string): Promise<FSMJobStatus> {
    const token = await this.resolveToken(accessToken);
    const tenantId = this.getTenantId();

    if (!token || !tenantId) {
      return {
        externalId,
        status: "scheduled",
        lastUpdated: new Date().toISOString(),
        isMock: true,
      };
    }

    const safeId = sanitizePathSegment(externalId, "jobId");

    const response = await fetchWithRetry(
      `${this.baseUrl}/jpm/v2/tenant/${encodeURIComponent(tenantId)}/jobs/${safeId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "ST-App-Key": getEnvCredentials("servicetitan").clientId || "",
        },
      },
      undefined,
      this.retryOpts,
    );

    const data = (await response.json()) as { jobStatus: string; modifiedOn: string };
    return {
      externalId,
      status: data.jobStatus?.toLowerCase() || "unknown",
      lastUpdated: data.modifiedOn,
      isMock: false,
    };
  }

  async getCustomerHistory(externalId: string, accessToken?: string): Promise<FSMCustomerHistory> {
    const token = await this.resolveToken(accessToken);
    const tenantId = this.getTenantId();

    if (!token || !tenantId) {
      const jobs = mockJobs("servicetitan").slice(0, 3);
      return {
        externalId,
        jobs,
        totalRevenue: jobs.reduce((sum, j) => sum + (j.totalAmount || 0), 0),
        isMock: true,
      };
    }

    const safeId = sanitizePathSegment(externalId, "customerId");

    const response = await fetchWithRetry(
      `${this.baseUrl}/jpm/v2/tenant/${encodeURIComponent(tenantId)}/jobs?customerId=${safeId}&pageSize=50`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "ST-App-Key": getEnvCredentials("servicetitan").clientId || "",
        },
      },
      undefined,
      this.retryOpts,
    );

    const data = (await response.json()) as {
      data: Array<{
        id: number;
        customer: { name: string };
        jobStatus: string;
        schedule?: { start?: string };
        completedOn?: string;
        total?: number;
        summary?: string;
      }>;
    };

    const jobs: FSMJob[] = (data.data ?? []).map((job) => ({
      id: String(job.id),
      externalId: String(job.id),
      customerName: job.customer?.name || "Unknown",
      status: job.jobStatus?.toLowerCase() || "unknown",
      scheduledAt: job.schedule?.start,
      completedAt: job.completedOn,
      totalAmount: job.total ? Math.round(job.total * 100) : undefined,
      description: job.summary,
      isMock: false,
    }));

    return {
      externalId,
      jobs,
      totalRevenue: jobs.reduce((sum, j) => sum + (j.totalAmount || 0), 0),
      isMock: false,
    };
  }
}

// ─── Jobber Adapter ──────────────────────────────────────────

class JobberAdapter implements FSMAdapter {
  platform: FSMPlatform = "jobber";

  private baseUrl = "https://api.getjobber.com/api/graphql";
  private retryOpts: RetryOptions = { integration: "fsm-jobber" };

  private getToken(accessToken?: string): string | undefined {
    return accessToken || getEnvCredentials("jobber").accessToken;
  }

  private async resolveToken(accessToken?: string): Promise<string | undefined> {
    const token = this.getToken(accessToken);
    if (token) return token;
    return tryRefreshToken("jobber");
  }

  private async graphql(query: string, variables: Record<string, unknown>, token: string) {
    const response = await fetchWithRetry(
      this.baseUrl,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, variables }),
      },
      undefined,
      this.retryOpts,
    );

    return response.json();
  }

  async syncJobs(accessToken?: string): Promise<FSMJob[]> {
    const token = await this.resolveToken(accessToken);

    if (!token) {
      logger.warn("[fsm] Jobber not configured — returning mock jobs");
      return mockJobs("jobber");
    }

    const query = `
      query Jobs($first: Int) {
        jobs(first: $first, sortOrder: DESC) {
          nodes {
            id
            title
            jobStatus
            startAt
            endAt
            total
            client {
              id
              firstName
              lastName
              emails { address }
              phones { number }
            }
          }
        }
      }
    `;

    const data = (await this.graphql(query, { first: 50 }, token)) as {
      data: {
        jobs: {
          nodes: Array<{
            id: string;
            title: string;
            jobStatus: string;
            startAt: string;
            endAt?: string;
            total: number;
            client: {
              id: string;
              firstName: string;
              lastName: string;
              emails: Array<{ address: string }>;
              phones: Array<{ number: string }>;
            };
          }>;
        };
      };
    };

    return (data.data?.jobs?.nodes ?? []).map((job) => ({
      id: job.id,
      externalId: job.id,
      customerName: `${job.client?.firstName || ""} ${job.client?.lastName || ""}`.trim() || "Unknown",
      customerEmail: job.client?.emails?.[0]?.address,
      customerPhone: job.client?.phones?.[0]?.number,
      status: job.jobStatus?.toLowerCase() || "unknown",
      scheduledAt: job.startAt,
      completedAt: job.jobStatus === "COMPLETED" ? job.endAt : undefined,
      totalAmount: job.total ? Math.round(job.total * 100) : undefined,
      description: job.title,
      isMock: false,
    }));
  }

  async syncCustomers(accessToken?: string): Promise<FSMCustomer[]> {
    const token = await this.resolveToken(accessToken);

    if (!token) {
      logger.warn("[fsm] Jobber not configured — returning mock customers");
      return mockCustomers("jobber");
    }

    const query = `
      query Clients($first: Int) {
        clients(first: $first, sortOrder: DESC) {
          nodes {
            id
            firstName
            lastName
            emails { address }
            phones { number }
            billingAddress { street }
            createdAt
          }
        }
      }
    `;

    const data = (await this.graphql(query, { first: 50 }, token)) as {
      data: {
        clients: {
          nodes: Array<{
            id: string;
            firstName: string;
            lastName: string;
            emails: Array<{ address: string }>;
            phones: Array<{ number: string }>;
            billingAddress?: { street?: string };
            createdAt: string;
          }>;
        };
      };
    };

    return (data.data?.clients?.nodes ?? []).map((cust) => ({
      id: cust.id,
      externalId: cust.id,
      name: `${cust.firstName} ${cust.lastName}`.trim(),
      email: cust.emails?.[0]?.address,
      phone: cust.phones?.[0]?.number,
      address: cust.billingAddress?.street,
      createdAt: cust.createdAt,
      isMock: false,
    }));
  }

  async pushLead(data: {
    name: string;
    email?: string;
    phone?: string;
    notes?: string;
  }, accessToken?: string): Promise<FSMPushResult> {
    const token = await this.resolveToken(accessToken);

    if (!token) {
      logger.warn("[fsm] Jobber not configured — returning mock push result");
      return {
        success: true,
        externalId: `mock-jobber-lead-${Date.now()}`,
        platform: "jobber",
        isMock: true,
      };
    }

    const nameParts = data.name.split(" ");
    const firstName = nameParts[0] || data.name;
    const lastName = nameParts.slice(1).join(" ") || "";

    const mutation = `
      mutation ClientCreate($input: ClientCreateInput!) {
        clientCreate(input: $input) {
          client { id }
          userErrors { message }
        }
      }
    `;

    const input: Record<string, unknown> = {
      firstName,
      lastName,
    };
    if (data.email) input.emails = [{ address: data.email }];
    if (data.phone) input.phones = [{ number: data.phone }];
    if (data.notes) input.notes = data.notes;

    const result = (await this.graphql(mutation, { input }, token)) as {
      data: {
        clientCreate: {
          client?: { id: string };
          userErrors: Array<{ message: string }>;
        };
      };
    };

    const userErrors = result.data?.clientCreate?.userErrors ?? [];
    if (userErrors.length > 0) {
      return {
        success: false,
        externalId: "",
        platform: "jobber",
        isMock: false,
        error: userErrors.map((e) => e.message).join(", "),
      };
    }

    return {
      success: true,
      externalId: result.data?.clientCreate?.client?.id || "",
      platform: "jobber",
      isMock: false,
    };
  }

  async pushBooking(data: {
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    scheduledAt: string;
    description?: string;
  }, accessToken?: string): Promise<FSMPushResult> {
    const token = await this.resolveToken(accessToken);

    if (!token) {
      logger.warn("[fsm] Jobber not configured — returning mock push result");
      return {
        success: true,
        externalId: `mock-jobber-booking-${Date.now()}`,
        platform: "jobber",
        isMock: true,
      };
    }

    const mutation = `
      mutation JobCreate($input: JobCreateInput!) {
        jobCreate(input: $input) {
          job { id }
          userErrors { message }
        }
      }
    `;

    const result = (await this.graphql(mutation, {
      input: {
        title: data.description || `Job for ${data.customerName}`,
        startAt: data.scheduledAt,
      },
    }, token)) as {
      data: {
        jobCreate: {
          job?: { id: string };
          userErrors: Array<{ message: string }>;
        };
      };
    };

    const userErrors = result.data?.jobCreate?.userErrors ?? [];
    if (userErrors.length > 0) {
      return {
        success: false,
        externalId: "",
        platform: "jobber",
        isMock: false,
        error: userErrors.map((e) => e.message).join(", "),
      };
    }

    return {
      success: true,
      externalId: result.data?.jobCreate?.job?.id || "",
      platform: "jobber",
      isMock: false,
    };
  }

  async getJobStatus(externalId: string, accessToken?: string): Promise<FSMJobStatus> {
    const token = await this.resolveToken(accessToken);

    if (!token) {
      return {
        externalId,
        status: "scheduled",
        lastUpdated: new Date().toISOString(),
        isMock: true,
      };
    }

    const query = `
      query Job($id: EncodedId!) {
        job(id: $id) {
          jobStatus
          updatedAt
        }
      }
    `;

    const data = (await this.graphql(query, { id: externalId }, token)) as {
      data: { job: { jobStatus: string; updatedAt: string } };
    };

    return {
      externalId,
      status: data.data?.job?.jobStatus?.toLowerCase() || "unknown",
      lastUpdated: data.data?.job?.updatedAt || new Date().toISOString(),
      isMock: false,
    };
  }

  async getCustomerHistory(externalId: string, accessToken?: string): Promise<FSMCustomerHistory> {
    const token = await this.resolveToken(accessToken);

    if (!token) {
      const jobs = mockJobs("jobber").slice(0, 3);
      return {
        externalId,
        jobs,
        totalRevenue: jobs.reduce((sum, j) => sum + (j.totalAmount || 0), 0),
        isMock: true,
      };
    }

    const query = `
      query ClientJobs($clientId: EncodedId!) {
        client(id: $clientId) {
          jobs(first: 50) {
            nodes {
              id
              title
              jobStatus
              startAt
              endAt
              total
            }
          }
        }
      }
    `;

    const data = (await this.graphql(query, { clientId: externalId }, token)) as {
      data: {
        client: {
          jobs: {
            nodes: Array<{
              id: string;
              title: string;
              jobStatus: string;
              startAt: string;
              endAt?: string;
              total: number;
            }>;
          };
        };
      };
    };

    const jobs: FSMJob[] = (data.data?.client?.jobs?.nodes ?? []).map((job) => ({
      id: job.id,
      externalId: job.id,
      customerName: "",
      status: job.jobStatus?.toLowerCase() || "unknown",
      scheduledAt: job.startAt,
      completedAt: job.jobStatus === "COMPLETED" ? job.endAt : undefined,
      totalAmount: job.total ? Math.round(job.total * 100) : undefined,
      description: job.title,
      isMock: false,
    }));

    return {
      externalId,
      jobs,
      totalRevenue: jobs.reduce((sum, j) => sum + (j.totalAmount || 0), 0),
      isMock: false,
    };
  }
}

// ─── Housecall Pro Adapter ───────────────────────────────────

class HousecallProAdapter implements FSMAdapter {
  platform: FSMPlatform = "housecallpro";

  private baseUrl = "https://api.housecallpro.com";
  private retryOpts: RetryOptions = { integration: "fsm-housecallpro" };

  private getToken(accessToken?: string): string | undefined {
    return accessToken || getEnvCredentials("housecallpro").accessToken;
  }

  private async resolveToken(accessToken?: string): Promise<string | undefined> {
    const token = this.getToken(accessToken);
    if (token) return token;
    return tryRefreshToken("housecallpro");
  }

  async syncJobs(accessToken?: string): Promise<FSMJob[]> {
    const token = await this.resolveToken(accessToken);

    if (!token) {
      logger.warn("[fsm] Housecall Pro not configured — returning mock jobs");
      return mockJobs("housecallpro");
    }

    const response = await fetchWithRetry(
      `${this.baseUrl}/jobs?page=1&page_size=50&sort_direction=desc&sort_field=created_at`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      },
      undefined,
      this.retryOpts,
    );

    const data = (await response.json()) as {
      jobs: Array<{
        id: string;
        customer: { id: string; first_name: string; last_name: string; email?: string; phone_number?: string };
        work_status: string;
        scheduled_start?: string;
        completed_at?: string;
        total_amount?: number;
        description?: string;
        address?: { street?: string };
      }>;
    };

    return (data.jobs ?? []).map((job) => ({
      id: job.id,
      externalId: job.id,
      customerName: `${job.customer?.first_name || ""} ${job.customer?.last_name || ""}`.trim() || "Unknown",
      customerEmail: job.customer?.email,
      customerPhone: job.customer?.phone_number,
      address: job.address?.street,
      status: job.work_status?.toLowerCase() || "unknown",
      scheduledAt: job.scheduled_start,
      completedAt: job.completed_at,
      totalAmount: job.total_amount ? Math.round(job.total_amount * 100) : undefined,
      description: job.description,
      isMock: false,
    }));
  }

  async syncCustomers(accessToken?: string): Promise<FSMCustomer[]> {
    const token = await this.resolveToken(accessToken);

    if (!token) {
      logger.warn("[fsm] Housecall Pro not configured — returning mock customers");
      return mockCustomers("housecallpro");
    }

    const response = await fetchWithRetry(
      `${this.baseUrl}/customers?page=1&page_size=50&sort_direction=desc&sort_field=created_at`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      },
      undefined,
      this.retryOpts,
    );

    const data = (await response.json()) as {
      customers: Array<{
        id: string;
        first_name: string;
        last_name: string;
        email?: string;
        phone_number?: string;
        address?: { street?: string };
        created_at: string;
      }>;
    };

    return (data.customers ?? []).map((cust) => ({
      id: cust.id,
      externalId: cust.id,
      name: `${cust.first_name || ""} ${cust.last_name || ""}`.trim() || "Unknown",
      email: cust.email,
      phone: cust.phone_number,
      address: cust.address?.street,
      createdAt: cust.created_at,
      isMock: false,
    }));
  }

  async pushLead(data: {
    name: string;
    email?: string;
    phone?: string;
    notes?: string;
  }, accessToken?: string): Promise<FSMPushResult> {
    const token = await this.resolveToken(accessToken);

    if (!token) {
      logger.warn("[fsm] Housecall Pro not configured — returning mock push result");
      return {
        success: true,
        externalId: `mock-hcp-lead-${Date.now()}`,
        platform: "housecallpro",
        isMock: true,
      };
    }

    const nameParts = data.name.split(" ");
    const firstName = nameParts[0] || data.name;
    const lastName = nameParts.slice(1).join(" ") || "";

    try {
      const response = await fetchWithRetry(
        `${this.baseUrl}/customers`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            first_name: firstName,
            last_name: lastName,
            email: data.email,
            phone_number: data.phone,
            notifications_enabled: true,
            tags: ["sovereign-ai-lead"],
          }),
        },
        undefined,
        this.retryOpts,
      );

      const result = (await response.json()) as { id: string };
      return {
        success: true,
        externalId: result.id,
        platform: "housecallpro",
        isMock: false,
      };
    } catch (err) {
      logger.error("[fsm] Housecall Pro pushLead failed", {
        error: err instanceof Error ? err.message : String(err),
      });
      return {
        success: false,
        externalId: "",
        platform: "housecallpro",
        isMock: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  }

  async pushBooking(data: {
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    scheduledAt: string;
    description?: string;
  }, accessToken?: string): Promise<FSMPushResult> {
    const token = await this.resolveToken(accessToken);

    if (!token) {
      logger.warn("[fsm] Housecall Pro not configured — returning mock push result");
      return {
        success: true,
        externalId: `mock-hcp-booking-${Date.now()}`,
        platform: "housecallpro",
        isMock: true,
      };
    }

    try {
      const response = await fetchWithRetry(
        `${this.baseUrl}/jobs`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            scheduled_start: data.scheduledAt,
            description: data.description || `Job for ${data.customerName}`,
          }),
        },
        undefined,
        this.retryOpts,
      );

      const result = (await response.json()) as { id: string };
      return {
        success: true,
        externalId: result.id,
        platform: "housecallpro",
        isMock: false,
      };
    } catch (err) {
      logger.error("[fsm] Housecall Pro pushBooking failed", {
        error: err instanceof Error ? err.message : String(err),
      });
      return {
        success: false,
        externalId: "",
        platform: "housecallpro",
        isMock: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  }

  async getJobStatus(externalId: string, accessToken?: string): Promise<FSMJobStatus> {
    const token = await this.resolveToken(accessToken);

    if (!token) {
      return {
        externalId,
        status: "scheduled",
        lastUpdated: new Date().toISOString(),
        isMock: true,
      };
    }

    const safeId = sanitizePathSegment(externalId, "jobId");

    const response = await fetchWithRetry(
      `${this.baseUrl}/jobs/${safeId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      },
      undefined,
      this.retryOpts,
    );

    const data = (await response.json()) as { work_status: string; updated_at: string };
    return {
      externalId,
      status: data.work_status?.toLowerCase() || "unknown",
      lastUpdated: data.updated_at,
      isMock: false,
    };
  }

  async getCustomerHistory(externalId: string, accessToken?: string): Promise<FSMCustomerHistory> {
    const token = await this.resolveToken(accessToken);

    if (!token) {
      const jobs = mockJobs("housecallpro").slice(0, 3);
      return {
        externalId,
        jobs,
        totalRevenue: jobs.reduce((sum, j) => sum + (j.totalAmount || 0), 0),
        isMock: true,
      };
    }

    const safeId = sanitizePathSegment(externalId, "customerId");

    const response = await fetchWithRetry(
      `${this.baseUrl}/jobs?customer_id=${safeId}&page_size=50`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      },
      undefined,
      this.retryOpts,
    );

    const data = (await response.json()) as {
      jobs: Array<{
        id: string;
        customer: { first_name: string; last_name: string };
        work_status: string;
        scheduled_start?: string;
        completed_at?: string;
        total_amount?: number;
        description?: string;
      }>;
    };

    const jobs: FSMJob[] = (data.jobs ?? []).map((job) => ({
      id: job.id,
      externalId: job.id,
      customerName: `${job.customer?.first_name || ""} ${job.customer?.last_name || ""}`.trim(),
      status: job.work_status?.toLowerCase() || "unknown",
      scheduledAt: job.scheduled_start,
      completedAt: job.completed_at,
      totalAmount: job.total_amount ? Math.round(job.total_amount * 100) : undefined,
      description: job.description,
      isMock: false,
    }));

    return {
      externalId,
      jobs,
      totalRevenue: jobs.reduce((sum, j) => sum + (j.totalAmount || 0), 0),
      isMock: false,
    };
  }
}

// ─── Adapter Factory ─────────────────────────────────────────

function getFSMAdapter(platform: FSMPlatform): FSMAdapter {
  switch (platform) {
    case "servicetitan":
      return new ServiceTitanAdapter();
    case "jobber":
      return new JobberAdapter();
    case "housecallpro":
      return new HousecallProAdapter();
    default:
      throw new Error(`Unknown FSM platform: ${platform}`);
  }
}

/** Convenience: run full sync for a connection and return results */
export async function runFSMSync(
  platform: FSMPlatform,
  accessToken?: string
): Promise<FSMSyncResult> {
  const adapter = getFSMAdapter(platform);
  const [jobs, customers] = await Promise.all([
    adapter.syncJobs(accessToken),
    adapter.syncCustomers(accessToken),
  ]);

  return {
    jobs,
    customers,
    isMock: jobs.length > 0 ? jobs[0].isMock : true,
    syncedAt: new Date().toISOString(),
  };
}

/** Push a lead to all active FSM connections for a client */
export async function pushLeadToFSM(
  platform: FSMPlatform,
  data: { name: string; email?: string; phone?: string; notes?: string },
  accessToken?: string
): Promise<FSMPushResult> {
  const adapter = getFSMAdapter(platform);
  return adapter.pushLead(data, accessToken);
}

/** Push a booking to all active FSM connections for a client */
export async function pushBookingToFSM(
  platform: FSMPlatform,
  data: {
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    scheduledAt: string;
    description?: string;
  },
  accessToken?: string
): Promise<FSMPushResult> {
  const adapter = getFSMAdapter(platform);
  return adapter.pushBooking(data, accessToken);
}
