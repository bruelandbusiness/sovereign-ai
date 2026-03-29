import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import type { ServiceId } from "@/types/services";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ServiceHealthStatus = "healthy" | "degraded" | "down" | "unconfigured";

export interface ServiceHealth {
  serviceId: string;
  status: ServiceHealthStatus;
  lastChecked: Date;
  message?: string;
  metrics?: {
    uptime?: number;       // percentage
    responseTime?: number; // ms
    errorRate?: number;    // percentage
  };
}

interface HealthCriteria {
  requiredEnvVars: string[];
  requiredConfig: string[];
  description: string;
}

// ---------------------------------------------------------------------------
// Service health criteria definitions
// ---------------------------------------------------------------------------

const SERVICE_HEALTH_CRITERIA: Record<string, HealthCriteria> = {
  chatbot: {
    requiredEnvVars: ["ANTHROPIC_API_KEY"],
    requiredConfig: ["systemPrompt", "greeting"],
    description: "AI chatbot widget is responding and configured",
  },
  reviews: {
    requiredEnvVars: ["GOOGLE_PLACES_API_KEY"],
    requiredConfig: ["platforms"],
    description: "Review monitoring is active across configured platforms",
  },
  email: {
    requiredEnvVars: ["SENDGRID_API_KEY"],
    requiredConfig: ["fromEmail"],
    description: "SendGrid is configured and email delivery is operational",
  },
  booking: {
    requiredEnvVars: [],
    requiredConfig: ["businessHours", "slotDuration"],
    description: "Calendar is connected and accepting bookings",
  },
  ads: {
    requiredEnvVars: ["GOOGLE_ADS_API_KEY", "META_ACCESS_TOKEN"],
    requiredConfig: ["campaignId"],
    description: "Google Ads and/or Meta API keys are set and campaigns active",
  },
  "voice-agent": {
    requiredEnvVars: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER"],
    requiredConfig: ["twilioPhoneNumber", "greeting"],
    description: "Twilio is configured and voice agent is handling calls",
  },
  seo: {
    requiredEnvVars: ["ANTHROPIC_API_KEY"],
    requiredConfig: ["keywords"],
    description: "SEO tracking is active and monitoring keyword rankings",
  },
  social: {
    requiredEnvVars: ["FACEBOOK_PAGE_TOKEN"],
    requiredConfig: ["platforms"],
    description: "Social media accounts are connected and posting is active",
  },
  "lead-gen": {
    requiredEnvVars: ["ANTHROPIC_API_KEY"],
    requiredConfig: ["pipelineEnabled", "channels"],
    description: "Lead generation pipeline is active and scoring leads",
  },
  crm: {
    requiredEnvVars: [],
    requiredConfig: ["pipelineStages"],
    description: "CRM pipeline is configured with lead stages",
  },
  website: {
    requiredEnvVars: [],
    requiredConfig: ["domain"],
    description: "Website is published and accessible",
  },
  analytics: {
    requiredEnvVars: [],
    requiredConfig: ["trackingEnabled"],
    description: "Analytics tracking is active and collecting data",
  },
  content: {
    requiredEnvVars: ["ANTHROPIC_API_KEY"],
    requiredConfig: ["contentTypes"],
    description: "AI content generation is configured and producing content",
  },
  reputation: {
    requiredEnvVars: ["GOOGLE_PLACES_API_KEY"],
    requiredConfig: ["monitoringEnabled"],
    description: "Reputation monitoring is active across review platforms",
  },
  retargeting: {
    requiredEnvVars: ["META_ACCESS_TOKEN"],
    requiredConfig: ["pixelId"],
    description: "Retargeting pixel is installed and audiences are building",
  },
  "ai-receptionist": {
    requiredEnvVars: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER"],
    requiredConfig: ["greeting", "businessHours"],
    description: "AI receptionist is answering calls during business hours",
  },
  "ai-estimate": {
    requiredEnvVars: ["ANTHROPIC_API_KEY"],
    requiredConfig: ["estimateTypes"],
    description: "AI estimate generation is configured for project types",
  },
  "fsm-sync": {
    requiredEnvVars: ["SERVICETITAN_ACCESS_TOKEN"],
    requiredConfig: ["syncEnabled"],
    description: "Field service management sync is connected and running",
  },
  "customer-ltv": {
    requiredEnvVars: [],
    requiredConfig: ["trackingEnabled"],
    description: "Customer lifetime value tracking is active",
  },
  aeo: {
    requiredEnvVars: ["ANTHROPIC_API_KEY"],
    requiredConfig: ["monitoredQueries"],
    description: "AI Engine Optimization is monitoring query visibility",
  },
  custom: {
    requiredEnvVars: [],
    requiredConfig: [],
    description: "Custom service — manually configured by the team",
  },
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the health criteria for a specific service.
 *
 * Each service has different health requirements:
 * - chatbot: Anthropic API key set, widget config present
 * - reviews: Google Places API key, platform config
 * - email: SendGrid API key configured
 * - booking: Business hours and slot duration in config
 * - ads: Google Ads and/or Meta API keys set
 * - voice-agent: Twilio credentials configured
 */
export function getServiceHealthCriteria(serviceId: string): HealthCriteria {
  return (
    SERVICE_HEALTH_CRITERIA[serviceId] ?? {
      requiredEnvVars: [],
      requiredConfig: [],
      description: `Unknown service: ${serviceId}`,
    }
  );
}

/**
 * Evaluates the health of a specific service for a client by checking:
 * 1. Whether the ClientService record exists and is active
 * 2. Whether required environment variables are present
 * 3. Whether required config keys are set in the service config
 * 4. Whether there has been recent activity (within 7 days)
 */
export async function evaluateServiceHealth(
  clientId: string,
  serviceId: string,
): Promise<ServiceHealth> {
  const now = new Date();

  const base: ServiceHealth = {
    serviceId,
    status: "unconfigured",
    lastChecked: now,
  };

  try {
    // 1. Check if the service record exists
    const clientService = await prisma.clientService.findUnique({
      where: { clientId_serviceId: { clientId, serviceId } },
    });

    if (!clientService) {
      return {
        ...base,
        status: "unconfigured",
        message: "Service has not been activated for this client.",
      };
    }

    if (clientService.status === "provisioning") {
      return {
        ...base,
        status: "degraded",
        message: "Service is still being provisioned.",
      };
    }

    if (clientService.status === "provisioning_failed") {
      return {
        ...base,
        status: "down",
        message: "Service provisioning failed. Manual intervention required.",
      };
    }

    if (clientService.status === "paused" || clientService.status === "canceled") {
      return {
        ...base,
        status: "down",
        message: `Service is ${clientService.status}.`,
      };
    }

    // 2. Check required environment variables
    const criteria = getServiceHealthCriteria(serviceId);
    const missingEnvVars = criteria.requiredEnvVars.filter(
      (envVar) => !process.env[envVar],
    );

    if (missingEnvVars.length > 0) {
      return {
        ...base,
        status: "degraded",
        message: `Missing environment variables: ${missingEnvVars.join(", ")}. Service may not function fully.`,
      };
    }

    // 3. Check service-specific config
    const configIssues = checkServiceConfig(clientService.config, criteria);

    // 4. Check recent activity (events in the last 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentActivity = await prisma.activityEvent.count({
      where: {
        clientId,
        createdAt: { gte: sevenDaysAgo },
        type: { in: getActivityTypesForService(serviceId) },
      },
    });

    // 5. Build metrics
    const metrics = await buildServiceMetrics(
      clientId,
      serviceId,
      clientService.activatedAt,
    );

    // 6. Determine final status
    if (configIssues.length > 0 && recentActivity === 0) {
      return {
        ...base,
        status: "down",
        message: `Configuration incomplete (${configIssues.join(", ")}) and no recent activity.`,
        metrics,
      };
    }

    if (configIssues.length > 0) {
      return {
        ...base,
        status: "degraded",
        message: `Configuration incomplete: ${configIssues.join(", ")}.`,
        metrics,
      };
    }

    if (recentActivity === 0 && serviceId !== "custom") {
      return {
        ...base,
        status: "degraded",
        message: "No activity detected in the last 7 days.",
        metrics,
      };
    }

    return {
      ...base,
      status: "healthy",
      message: criteria.description,
      metrics,
    };
  } catch (error) {
    logger.errorWithCause(
      `[service-health] Failed to evaluate health for ${serviceId} (client: ${clientId})`,
      error,
    );
    return {
      ...base,
      status: "down",
      message: "Health check failed due to an internal error.",
    };
  }
}

/**
 * Evaluates health for all active services belonging to a client.
 */
export async function evaluateAllServiceHealth(
  clientId: string,
): Promise<ServiceHealth[]> {
  const clientServices = await prisma.clientService.findMany({
    where: { clientId },
    select: { serviceId: true },
  });

  const results = await Promise.all(
    clientServices.map((cs) => evaluateServiceHealth(clientId, cs.serviceId)),
  );

  return results;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Validates that required config keys exist in the service's JSON config blob.
 * Returns a list of missing config keys.
 */
function checkServiceConfig(
  configJson: string | null,
  criteria: HealthCriteria,
): string[] {
  if (criteria.requiredConfig.length === 0) {
    return [];
  }

  if (!configJson) {
    return criteria.requiredConfig;
  }

  try {
    const config = JSON.parse(configJson) as Record<string, unknown>;
    return criteria.requiredConfig.filter((key) => {
      const value = config[key];
      return value === undefined || value === null || value === "";
    });
  } catch {
    return criteria.requiredConfig;
  }
}

/**
 * Maps a service ID to the activity event types that indicate the service
 * is functioning. Used to detect stale or inactive services.
 */
function getActivityTypesForService(serviceId: string): string[] {
  const mapping: Record<string, string[]> = {
    chatbot: ["chat_message", "lead_captured"],
    reviews: ["review_received", "review_response"],
    email: ["email_sent", "email_delivered", "campaign_sent"],
    booking: ["call_booked", "booking_confirmed", "appointment_scheduled"],
    ads: ["ad_campaign_updated", "ad_spend", "campaign_created"],
    "voice-agent": ["call_booked", "call_received", "voicemail_received"],
    seo: ["seo_report", "ranking_change", "seo_audit"],
    social: ["social_post", "social_engagement"],
    "lead-gen": ["lead_captured", "lead_qualified", "lead_scored"],
    crm: ["lead_stage_changed", "pipeline_updated", "lead_captured"],
    website: ["website_visit", "page_published"],
    analytics: ["report_generated", "insight_generated"],
    content: ["content_generated", "content_published"],
    reputation: ["review_received", "reputation_report"],
    retargeting: ["retargeting_event", "audience_updated"],
    "ai-receptionist": ["call_received", "call_booked"],
    "ai-estimate": ["estimate_generated"],
    "fsm-sync": ["fsm_sync_completed", "job_synced"],
    "customer-ltv": ["ltv_calculated", "customer_scored"],
    aeo: ["aeo_check", "visibility_report"],
    custom: ["service_update"],
  };

  return mapping[serviceId] ?? ["service_update"];
}

/**
 * Builds basic health metrics for a service based on activity history.
 */
async function buildServiceMetrics(
  clientId: string,
  serviceId: string,
  activatedAt: Date | null,
): Promise<ServiceHealth["metrics"]> {
  const now = new Date();

  // Calculate uptime as percentage of days since activation that had activity
  let uptime: number | undefined;
  if (activatedAt) {
    const totalDays = Math.max(
      1,
      Math.ceil((now.getTime() - activatedAt.getTime()) / (24 * 60 * 60 * 1000)),
    );
    const daysWithActivity = await countActiveDays(
      clientId,
      serviceId,
      activatedAt,
    );
    uptime = Math.min(100, Math.round((daysWithActivity / totalDays) * 100));
  }

  // Count errors in the last 24 hours vs total events for error rate
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const activityTypes = getActivityTypesForService(serviceId);

  const [recentEvents, recentErrors] = await Promise.all([
    prisma.activityEvent.count({
      where: {
        clientId,
        createdAt: { gte: oneDayAgo },
        type: { in: activityTypes },
      },
    }),
    prisma.activityEvent.count({
      where: {
        clientId,
        createdAt: { gte: oneDayAgo },
        type: { in: activityTypes },
        title: { contains: "failed" },
      },
    }),
  ]);

  const errorRate =
    recentEvents > 0 ? Math.round((recentErrors / recentEvents) * 100) : 0;

  return {
    uptime,
    errorRate,
  };
}

/**
 * Counts the number of distinct days (since activation) that had at least
 * one activity event for the given service. Limited to the last 90 days
 * to keep the query efficient.
 */
async function countActiveDays(
  clientId: string,
  serviceId: string,
  activatedAt: Date,
): Promise<number> {
  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const since = activatedAt > ninetyDaysAgo ? activatedAt : ninetyDaysAgo;
  const activityTypes = getActivityTypesForService(serviceId);

  const events = await prisma.activityEvent.findMany({
    where: {
      clientId,
      createdAt: { gte: since },
      type: { in: activityTypes },
    },
    select: { createdAt: true },
  });

  const uniqueDays = new Set(
    events.map((e) => e.createdAt.toISOString().slice(0, 10)),
  );

  return uniqueDays.size;
}
