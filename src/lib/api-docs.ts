// ---------------------------------------------------------------------------
// API Documentation Generation Utility
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Describes a single parameter (query, path, header, or body field). */
export interface APIParam {
  readonly name: string;
  readonly type: "string" | "number" | "boolean" | "object" | "array";
  readonly required: boolean;
  readonly description: string;
  readonly example?: unknown;
  readonly enum?: readonly string[];
}

/** Describes a possible response from an endpoint. */
export interface APIResponse {
  readonly statusCode: number;
  readonly description: string;
  readonly schema: Record<string, unknown>;
}

/** Describes a single API endpoint. */
export interface APIEndpoint {
  readonly method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  readonly path: string;
  readonly summary: string;
  readonly description: string;
  readonly tags: readonly string[];
  readonly authRequired: boolean;
  readonly rateLimit: {
    readonly maxRequests: number;
    readonly windowSeconds: number;
  };
  readonly params: readonly APIParam[];
  readonly requestBody?: {
    readonly contentType: string;
    readonly schema: Record<string, unknown>;
  };
  readonly responses: readonly APIResponse[];
}

/** Logical grouping of related endpoints. */
export interface APIGroup {
  readonly name: string;
  readonly description: string;
  readonly endpoints: readonly APIEndpoint[];
}

/** Top-level API documentation structure. */
export interface APIDoc {
  readonly title: string;
  readonly version: string;
  readonly description: string;
  readonly baseUrl: string;
  readonly groups: readonly APIGroup[];
}

// ---------------------------------------------------------------------------
// API Endpoints Constant
// ---------------------------------------------------------------------------

export const API_ENDPOINTS: readonly APIEndpoint[] = [
  // -- Auth -----------------------------------------------------------------
  {
    method: "POST",
    path: "/api/auth/magic-link",
    summary: "Send magic-link email",
    description:
      "Generates a one-time magic-link token and sends it to the provided email address.",
    tags: ["Auth"],
    authRequired: false,
    rateLimit: { maxRequests: 5, windowSeconds: 60 },
    params: [],
    requestBody: {
      contentType: "application/json",
      schema: {
        type: "object",
        properties: {
          email: { type: "string", format: "email" },
        },
        required: ["email"],
      },
    },
    responses: [
      {
        statusCode: 200,
        description: "Magic-link email sent successfully.",
        schema: { success: true, data: { sent: true } },
      },
      {
        statusCode: 429,
        description: "Rate limit exceeded.",
        schema: {
          success: false,
          error: { code: "RATE_LIMIT", message: "Too many requests" },
        },
      },
    ],
  },
  {
    method: "POST",
    path: "/api/auth/verify",
    summary: "Verify magic-link token",
    description:
      "Validates the supplied magic-link token and returns a session.",
    tags: ["Auth"],
    authRequired: false,
    rateLimit: { maxRequests: 10, windowSeconds: 60 },
    params: [],
    requestBody: {
      contentType: "application/json",
      schema: {
        type: "object",
        properties: {
          token: { type: "string" },
        },
        required: ["token"],
      },
    },
    responses: [
      {
        statusCode: 200,
        description: "Token valid. Session created.",
        schema: {
          success: true,
          data: { sessionId: "string", expiresAt: "string" },
        },
      },
      {
        statusCode: 401,
        description: "Invalid or expired token.",
        schema: {
          success: false,
          error: { code: "INVALID_TOKEN", message: "Token invalid or expired" },
        },
      },
    ],
  },
  {
    method: "GET",
    path: "/api/auth/session",
    summary: "Get current session",
    description: "Returns the authenticated user session or 401 if unauthenticated.",
    tags: ["Auth"],
    authRequired: true,
    rateLimit: { maxRequests: 30, windowSeconds: 60 },
    params: [],
    responses: [
      {
        statusCode: 200,
        description: "Active session returned.",
        schema: {
          success: true,
          data: {
            userId: "string",
            email: "string",
            role: "string",
            expiresAt: "string",
          },
        },
      },
      {
        statusCode: 401,
        description: "No active session.",
        schema: {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Not authenticated" },
        },
      },
    ],
  },

  // -- Dashboard ------------------------------------------------------------
  {
    method: "GET",
    path: "/api/dashboard/kpis",
    summary: "Fetch dashboard KPIs",
    description:
      "Returns key performance indicators for the authenticated user's dashboard.",
    tags: ["Dashboard"],
    authRequired: true,
    rateLimit: { maxRequests: 20, windowSeconds: 60 },
    params: [
      {
        name: "period",
        type: "string",
        required: false,
        description: "Time period for KPI aggregation.",
        example: "30d",
        enum: ["7d", "30d", "90d", "1y"],
      },
    ],
    responses: [
      {
        statusCode: 200,
        description: "KPI data returned.",
        schema: {
          success: true,
          data: {
            revenue: "number",
            leads: "number",
            conversionRate: "number",
            activeClients: "number",
          },
        },
      },
    ],
  },
  {
    method: "GET",
    path: "/api/dashboard/activity",
    summary: "Fetch recent activity",
    description: "Returns a paginated activity feed for the dashboard.",
    tags: ["Dashboard"],
    authRequired: true,
    rateLimit: { maxRequests: 20, windowSeconds: 60 },
    params: [
      {
        name: "page",
        type: "number",
        required: false,
        description: "Page number (1-indexed).",
        example: 1,
      },
      {
        name: "pageSize",
        type: "number",
        required: false,
        description: "Items per page.",
        example: 20,
      },
    ],
    responses: [
      {
        statusCode: 200,
        description: "Activity feed returned.",
        schema: {
          success: true,
          data: { items: "ActivityItem[]" },
          meta: { page: "number", pageSize: "number", total: "number" },
        },
      },
    ],
  },
  {
    method: "POST",
    path: "/api/dashboard/export",
    summary: "Export dashboard data",
    description:
      "Exports dashboard data as CSV or PDF for the specified date range.",
    tags: ["Dashboard"],
    authRequired: true,
    rateLimit: { maxRequests: 5, windowSeconds: 60 },
    params: [],
    requestBody: {
      contentType: "application/json",
      schema: {
        type: "object",
        properties: {
          format: { type: "string", enum: ["csv", "pdf"] },
          startDate: { type: "string", format: "date" },
          endDate: { type: "string", format: "date" },
        },
        required: ["format", "startDate", "endDate"],
      },
    },
    responses: [
      {
        statusCode: 200,
        description: "Export file URL returned.",
        schema: { success: true, data: { url: "string", expiresAt: "string" } },
      },
    ],
  },

  // -- Leads ----------------------------------------------------------------
  {
    method: "GET",
    path: "/api/leads",
    summary: "List leads",
    description: "Returns a paginated list of leads with optional filters.",
    tags: ["Leads"],
    authRequired: true,
    rateLimit: { maxRequests: 30, windowSeconds: 60 },
    params: [
      {
        name: "status",
        type: "string",
        required: false,
        description: "Filter by lead status.",
        enum: ["new", "contacted", "qualified", "converted", "lost"],
      },
      {
        name: "page",
        type: "number",
        required: false,
        description: "Page number.",
        example: 1,
      },
      {
        name: "pageSize",
        type: "number",
        required: false,
        description: "Items per page.",
        example: 25,
      },
    ],
    responses: [
      {
        statusCode: 200,
        description: "Paginated leads list.",
        schema: {
          success: true,
          data: { items: "Lead[]" },
          meta: { page: "number", pageSize: "number", total: "number" },
        },
      },
    ],
  },
  {
    method: "POST",
    path: "/api/leads/inbound",
    summary: "Create inbound lead",
    description:
      "Creates a new lead from an inbound source (website form, chatbot, etc.).",
    tags: ["Leads"],
    authRequired: false,
    rateLimit: { maxRequests: 10, windowSeconds: 60 },
    params: [],
    requestBody: {
      contentType: "application/json",
      schema: {
        type: "object",
        properties: {
          name: { type: "string" },
          email: { type: "string", format: "email" },
          phone: { type: "string" },
          source: { type: "string" },
          message: { type: "string" },
        },
        required: ["name", "email"],
      },
    },
    responses: [
      {
        statusCode: 201,
        description: "Lead created.",
        schema: { success: true, data: { id: "string", status: "new" } },
      },
      {
        statusCode: 422,
        description: "Validation error.",
        schema: {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "string", details: "object" },
        },
      },
    ],
  },
  {
    method: "GET",
    path: "/api/leads/[id]",
    summary: "Get lead by ID",
    description: "Returns full details for a single lead.",
    tags: ["Leads"],
    authRequired: true,
    rateLimit: { maxRequests: 30, windowSeconds: 60 },
    params: [
      {
        name: "id",
        type: "string",
        required: true,
        description: "Lead identifier.",
        example: "lead_abc123",
      },
    ],
    responses: [
      {
        statusCode: 200,
        description: "Lead details returned.",
        schema: { success: true, data: "Lead" },
      },
      {
        statusCode: 404,
        description: "Lead not found.",
        schema: {
          success: false,
          error: { code: "NOT_FOUND", message: "Lead not found" },
        },
      },
    ],
  },

  // -- Services -------------------------------------------------------------
  {
    method: "GET",
    path: "/api/services",
    summary: "List available services",
    description: "Returns all services available for the authenticated client.",
    tags: ["Services"],
    authRequired: true,
    rateLimit: { maxRequests: 20, windowSeconds: 60 },
    params: [],
    responses: [
      {
        statusCode: 200,
        description: "Services list returned.",
        schema: { success: true, data: { items: "Service[]" } },
      },
    ],
  },
  {
    method: "POST",
    path: "/api/services/activate",
    summary: "Activate a service",
    description: "Activates a service for the authenticated client.",
    tags: ["Services"],
    authRequired: true,
    rateLimit: { maxRequests: 5, windowSeconds: 60 },
    params: [],
    requestBody: {
      contentType: "application/json",
      schema: {
        type: "object",
        properties: {
          serviceId: { type: "string" },
          config: { type: "object" },
        },
        required: ["serviceId"],
      },
    },
    responses: [
      {
        statusCode: 200,
        description: "Service activated.",
        schema: {
          success: true,
          data: { serviceId: "string", activatedAt: "string" },
        },
      },
      {
        statusCode: 409,
        description: "Service already active.",
        schema: {
          success: false,
          error: { code: "ALREADY_ACTIVE", message: "Service already active" },
        },
      },
    ],
  },
  {
    method: "GET",
    path: "/api/services/analytics/*",
    summary: "Service analytics",
    description:
      "Returns analytics data for a specific service. The wildcard segment " +
      "identifies the service and metric (e.g. /api/services/analytics/seo/traffic).",
    tags: ["Services"],
    authRequired: true,
    rateLimit: { maxRequests: 20, windowSeconds: 60 },
    params: [
      {
        name: "startDate",
        type: "string",
        required: false,
        description: "Start of the analytics window (ISO date).",
        example: "2026-01-01",
      },
      {
        name: "endDate",
        type: "string",
        required: false,
        description: "End of the analytics window (ISO date).",
        example: "2026-03-29",
      },
    ],
    responses: [
      {
        statusCode: 200,
        description: "Analytics data returned.",
        schema: {
          success: true,
          data: { metric: "string", dataPoints: "DataPoint[]" },
        },
      },
    ],
  },

  // -- Payments -------------------------------------------------------------
  {
    method: "POST",
    path: "/api/payments/checkout",
    summary: "Create checkout session",
    description: "Creates a Stripe Checkout session for a one-time or recurring payment.",
    tags: ["Payments"],
    authRequired: true,
    rateLimit: { maxRequests: 5, windowSeconds: 60 },
    params: [],
    requestBody: {
      contentType: "application/json",
      schema: {
        type: "object",
        properties: {
          priceId: { type: "string" },
          successUrl: { type: "string", format: "uri" },
          cancelUrl: { type: "string", format: "uri" },
        },
        required: ["priceId", "successUrl", "cancelUrl"],
      },
    },
    responses: [
      {
        statusCode: 200,
        description: "Checkout session created.",
        schema: {
          success: true,
          data: { sessionId: "string", url: "string" },
        },
      },
    ],
  },
  {
    method: "GET",
    path: "/api/payments/subscription",
    summary: "Get subscription details",
    description: "Returns the current subscription status for the authenticated user.",
    tags: ["Payments"],
    authRequired: true,
    rateLimit: { maxRequests: 20, windowSeconds: 60 },
    params: [],
    responses: [
      {
        statusCode: 200,
        description: "Subscription details returned.",
        schema: {
          success: true,
          data: {
            status: "string",
            plan: "string",
            currentPeriodEnd: "string",
            cancelAtPeriodEnd: "boolean",
          },
        },
      },
    ],
  },
  {
    method: "POST",
    path: "/api/webhooks/stripe",
    summary: "Stripe webhook handler",
    description:
      "Receives and processes Stripe webhook events. Validated via Stripe signature header.",
    tags: ["Payments"],
    authRequired: false,
    rateLimit: { maxRequests: 100, windowSeconds: 60 },
    params: [],
    requestBody: {
      contentType: "application/json",
      schema: {
        type: "object",
        description: "Raw Stripe event payload (validated by signature).",
      },
    },
    responses: [
      {
        statusCode: 200,
        description: "Webhook processed.",
        schema: { received: true },
      },
      {
        statusCode: 400,
        description: "Invalid signature.",
        schema: {
          success: false,
          error: { code: "INVALID_SIGNATURE", message: "Webhook signature invalid" },
        },
      },
    ],
  },

  // -- Admin ----------------------------------------------------------------
  {
    method: "GET",
    path: "/api/admin/clients",
    summary: "List all clients",
    description: "Returns a paginated list of all clients. Admin-only.",
    tags: ["Admin"],
    authRequired: true,
    rateLimit: { maxRequests: 20, windowSeconds: 60 },
    params: [
      {
        name: "page",
        type: "number",
        required: false,
        description: "Page number.",
        example: 1,
      },
      {
        name: "pageSize",
        type: "number",
        required: false,
        description: "Items per page.",
        example: 50,
      },
      {
        name: "search",
        type: "string",
        required: false,
        description: "Search by name or email.",
      },
    ],
    responses: [
      {
        statusCode: 200,
        description: "Clients list returned.",
        schema: {
          success: true,
          data: { items: "Client[]" },
          meta: { page: "number", pageSize: "number", total: "number" },
        },
      },
      {
        statusCode: 403,
        description: "Forbidden. Admin role required.",
        schema: {
          success: false,
          error: { code: "FORBIDDEN", message: "Admin access required" },
        },
      },
    ],
  },
  {
    method: "GET",
    path: "/api/admin/analytics",
    summary: "Platform-wide analytics",
    description: "Returns aggregate analytics across all clients. Admin-only.",
    tags: ["Admin"],
    authRequired: true,
    rateLimit: { maxRequests: 10, windowSeconds: 60 },
    params: [
      {
        name: "period",
        type: "string",
        required: false,
        description: "Aggregation period.",
        enum: ["7d", "30d", "90d", "1y"],
      },
    ],
    responses: [
      {
        statusCode: 200,
        description: "Platform analytics returned.",
        schema: {
          success: true,
          data: {
            totalRevenue: "number",
            totalClients: "number",
            totalLeads: "number",
            churnRate: "number",
          },
        },
      },
    ],
  },
  {
    method: "GET",
    path: "/api/admin/email-preview",
    summary: "Preview email template",
    description:
      "Renders an email template with sample data for preview. Admin-only.",
    tags: ["Admin"],
    authRequired: true,
    rateLimit: { maxRequests: 10, windowSeconds: 60 },
    params: [
      {
        name: "template",
        type: "string",
        required: true,
        description: "Template identifier.",
        example: "welcome",
      },
    ],
    responses: [
      {
        statusCode: 200,
        description: "Rendered HTML email returned.",
        schema: {
          success: true,
          data: { html: "string", subject: "string" },
        },
      },
      {
        statusCode: 404,
        description: "Template not found.",
        schema: {
          success: false,
          error: { code: "NOT_FOUND", message: "Template not found" },
        },
      },
    ],
  },

  // -- Health ---------------------------------------------------------------
  {
    method: "GET",
    path: "/api/health",
    summary: "Health check",
    description:
      "Returns service health status. Used by uptime monitors and load balancers.",
    tags: ["Health"],
    authRequired: false,
    rateLimit: { maxRequests: 60, windowSeconds: 60 },
    params: [],
    responses: [
      {
        statusCode: 200,
        description: "Service healthy.",
        schema: {
          status: "ok",
          timestamp: "string",
          version: "string",
        },
      },
    ],
  },
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildParamRows(params: readonly APIParam[]): string {
  if (params.length === 0) {
    return "_None_\n";
  }
  const header = "| Name | Type | Required | Description |\n| --- | --- | --- | --- |";
  const rows = params.map(
    (p) =>
      `| \`${p.name}\` | \`${p.type}\` | ${p.required ? "Yes" : "No"} | ${p.description} |`,
  );
  return [header, ...rows].join("\n") + "\n";
}

function jsonBlock(obj: unknown): string {
  return "```json\n" + JSON.stringify(obj, null, 2) + "\n```\n";
}

// ---------------------------------------------------------------------------
// generateOpenAPISpec
// ---------------------------------------------------------------------------

/**
 * Produces an OpenAPI 3.0 compatible specification object from API_ENDPOINTS.
 * No route scanning is performed -- the spec is built entirely from the
 * static endpoint definitions.
 */
export function generateOpenAPISpec(): Record<string, unknown> {
  const paths: Record<string, Record<string, unknown>> = {};

  for (const ep of API_ENDPOINTS) {
    const openApiPath = ep.path.replace(/\[(\w+)\]/g, "{$1}").replace(/\/\*$/, "/{path}");
    const method = ep.method.toLowerCase();

    const parameters: Record<string, unknown>[] = ep.params.map((p) => ({
      name: p.name,
      in: openApiPath.includes(`{${p.name}}`) ? "path" : "query",
      required: p.required,
      description: p.description,
      schema: {
        type: p.type,
        ...(p.enum ? { enum: p.enum } : {}),
        ...(p.example !== undefined ? { example: p.example } : {}),
      },
    }));

    const responsesSpec: Record<string, unknown> = {};
    for (const r of ep.responses) {
      responsesSpec[String(r.statusCode)] = {
        description: r.description,
        content: {
          "application/json": {
            schema: {
              type: "object",
              example: r.schema,
            },
          },
        },
      };
    }

    const operation: Record<string, unknown> = {
      summary: ep.summary,
      description: ep.description,
      tags: [...ep.tags],
      parameters,
      responses: responsesSpec,
      "x-rate-limit": {
        maxRequests: ep.rateLimit.maxRequests,
        windowSeconds: ep.rateLimit.windowSeconds,
      },
    };

    if (ep.authRequired) {
      operation.security = [{ bearerAuth: [] }];
    }

    if (ep.requestBody) {
      operation.requestBody = {
        required: true,
        content: {
          [ep.requestBody.contentType]: {
            schema: ep.requestBody.schema,
          },
        },
      };
    }

    if (!paths[openApiPath]) {
      paths[openApiPath] = {};
    }
    paths[openApiPath][method] = operation;
  }

  return {
    openapi: "3.0.3",
    info: {
      title: "Sovereign AI Platform API",
      version: "1.0.0",
      description:
        "REST API for the Sovereign AI platform -- authentication, dashboard, " +
        "leads, services, payments, and administration.",
    },
    servers: [{ url: "https://api.sovereignai.com", description: "Production" }],
    paths,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  };
}

// ---------------------------------------------------------------------------
// generateEndpointDocs
// ---------------------------------------------------------------------------

/**
 * Generates Markdown documentation for a single APIEndpoint.
 */
export function generateEndpointDocs(endpoint: APIEndpoint): string {
  const lines: string[] = [];

  lines.push(`## ${endpoint.method} \`${endpoint.path}\`\n`);
  lines.push(`${endpoint.description}\n`);
  lines.push(`**Tags:** ${endpoint.tags.join(", ")}  `);
  lines.push(
    `**Auth required:** ${endpoint.authRequired ? "Yes" : "No"}  `,
  );
  lines.push(
    `**Rate limit:** ${endpoint.rateLimit.maxRequests} requests / ${endpoint.rateLimit.windowSeconds}s\n`,
  );

  lines.push("### Parameters\n");
  lines.push(buildParamRows(endpoint.params));

  if (endpoint.requestBody) {
    lines.push("### Request Body\n");
    lines.push(`Content-Type: \`${endpoint.requestBody.contentType}\`\n`);
    lines.push(jsonBlock(endpoint.requestBody.schema));
  }

  lines.push("### Responses\n");
  for (const r of endpoint.responses) {
    lines.push(`#### ${r.statusCode} ${r.description}\n`);
    lines.push(jsonBlock(r.schema));
  }

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// generateAPIReference
// ---------------------------------------------------------------------------

/**
 * Generates a full API reference in Markdown, grouped by tag.
 */
export function generateAPIReference(): string {
  const lines: string[] = [];

  lines.push("# Sovereign AI Platform -- API Reference\n");
  lines.push(
    "Auto-generated API documentation. Do not edit manually.\n",
  );

  const grouped = getEndpointsByTag();

  for (const [tag, endpoints] of Object.entries(grouped)) {
    lines.push(`---\n\n# ${tag}\n`);
    for (const ep of endpoints) {
      lines.push(generateEndpointDocs(ep));
    }
  }

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// validateRequestBody
// ---------------------------------------------------------------------------

/** Result of a request body validation. */
export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

/**
 * Validates a request body object against the endpoint's request body schema.
 *
 * This performs structural validation only (required fields, top-level types).
 * It is intentionally lightweight -- production validation should use a full
 * JSON-Schema validator such as Ajv.
 */
export function validateRequestBody(
  endpoint: APIEndpoint,
  body: unknown,
): ValidationResult {
  const errors: string[] = [];

  if (!endpoint.requestBody) {
    return { valid: true, errors: [] };
  }

  if (body === null || body === undefined || typeof body !== "object" || Array.isArray(body)) {
    return { valid: false, errors: ["Request body must be a JSON object."] };
  }

  const schema = endpoint.requestBody.schema;
  const properties = (schema.properties ?? {}) as Record<
    string,
    Record<string, unknown>
  >;
  const requiredFields = (schema.required ?? []) as readonly string[];
  const record = body as Record<string, unknown>;

  for (const field of requiredFields) {
    if (!(field in record) || record[field] === undefined) {
      errors.push(`Missing required field: "${field}".`);
    }
  }

  for (const [key, value] of Object.entries(record)) {
    const propSchema = properties[key];
    if (!propSchema) {
      continue; // allow additional properties
    }

    const expectedType = propSchema.type as string | undefined;
    if (expectedType && value !== null && value !== undefined) {
      const actualType = Array.isArray(value) ? "array" : typeof value;
      if (actualType !== expectedType) {
        errors.push(
          `Field "${key}" should be of type "${expectedType}" but got "${actualType}".`,
        );
      }
    }

    const enumValues = propSchema.enum as readonly string[] | undefined;
    if (enumValues && value !== null && value !== undefined) {
      if (!enumValues.includes(value as string)) {
        errors.push(
          `Field "${key}" must be one of: ${enumValues.join(", ")}. Got "${String(value)}".`,
        );
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// getEndpointsByTag
// ---------------------------------------------------------------------------

/**
 * Groups API_ENDPOINTS by their tags. An endpoint with multiple tags will
 * appear in each matching group.
 */
export function getEndpointsByTag(
  tag?: string,
): Record<string, APIEndpoint[]> {
  const grouped: Record<string, APIEndpoint[]> = {};

  for (const ep of API_ENDPOINTS) {
    for (const t of ep.tags) {
      if (tag && t !== tag) {
        continue;
      }
      if (!grouped[t]) {
        grouped[t] = [];
      }
      grouped[t].push({ ...ep });
    }
  }

  return grouped;
}
