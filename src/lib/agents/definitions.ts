// ---------------------------------------------------------------------------
// Agent Definitions — Registers all system agents with the registry
// ---------------------------------------------------------------------------
// This file registers the metadata for every agent in the system. Runner
// functions are stubbed as no-ops here; real implementations are wired
// elsewhere. Import this module at startup to populate the registry.
// ---------------------------------------------------------------------------

import type { AgentRunResult } from "./base";
import { registerAgent } from "./registry";

// ---------------------------------------------------------------------------
// Placeholder runner (agents wire their real implementations separately)
// ---------------------------------------------------------------------------

function stubRunner(agentName: string) {
  return async (
    clientId: string | null,
    dryRun: boolean
  ): Promise<AgentRunResult> => ({
    agentName,
    clientId,
    status: "failed",
    itemsProcessed: 0,
    itemsSucceeded: 0,
    itemsFailed: 0,
    errors: [{ message: `No runner implementation registered for "${agentName}"` }],
    durationSeconds: 0,
    dryRun,
    summary: `Stub: "${agentName}" has no runner implementation yet`,
  });
}

// ---------------------------------------------------------------------------
// Acquisition agents
// ---------------------------------------------------------------------------

registerAgent(
  {
    name: "acquisition.prospector",
    description: "Find contractor prospects",
    schedule: "0 6 * * 1",
    clientScoped: false,
    requiresApproval: false,
  },
  stubRunner("acquisition.prospector")
);

registerAgent(
  {
    name: "acquisition.qualifier",
    description: "Score and rank prospects",
    schedule: "runs after prospector",
    clientScoped: false,
    requiresApproval: false,
  },
  stubRunner("acquisition.qualifier")
);

registerAgent(
  {
    name: "acquisition.outreach",
    description: "Send personalized outreach to prospects",
    schedule: "*/15 * * * *",
    clientScoped: false,
    requiresApproval: false,
  },
  stubRunner("acquisition.outreach")
);

registerAgent(
  {
    name: "acquisition.closer",
    description: "Generate proposals for interested prospects",
    schedule: "on-demand",
    clientScoped: false,
    requiresApproval: true,
  },
  stubRunner("acquisition.closer")
);

// ---------------------------------------------------------------------------
// Delivery agents
// ---------------------------------------------------------------------------

registerAgent(
  {
    name: "delivery.discovery",
    description: "Discover leads for clients",
    schedule: "0 5 * * *",
    clientScoped: true,
    requiresApproval: false,
  },
  stubRunner("delivery.discovery")
);

registerAgent(
  {
    name: "delivery.enrichment",
    description: "Enrich discovered leads",
    schedule: "0 6 * * *",
    clientScoped: true,
    requiresApproval: false,
  },
  stubRunner("delivery.enrichment")
);

registerAgent(
  {
    name: "delivery.outreach",
    description: "Send personalized outreach to leads",
    schedule: "*/15 * * * *",
    clientScoped: true,
    requiresApproval: false,
  },
  stubRunner("delivery.outreach")
);

registerAgent(
  {
    name: "delivery.followup",
    description: "Process follow-up sequences",
    schedule: "*/15 * * * *",
    clientScoped: true,
    requiresApproval: false,
  },
  stubRunner("delivery.followup")
);

// ---------------------------------------------------------------------------
// Operations agents
// ---------------------------------------------------------------------------

registerAgent(
  {
    name: "operations.health_score",
    description: "Calculate client health scores",
    schedule: "0 7 * * *",
    clientScoped: false,
    requiresApproval: false,
  },
  stubRunner("operations.health_score")
);

registerAgent(
  {
    name: "operations.system_monitor",
    description: "Monitor system health",
    schedule: "*/5 * * * *",
    clientScoped: false,
    requiresApproval: false,
  },
  stubRunner("operations.system_monitor")
);

registerAgent(
  {
    name: "operations.weekly_report",
    description: "Generate weekly client reports",
    schedule: "0 8 * * 1",
    clientScoped: true,
    requiresApproval: true, // requires approval for first 2 weeks
  },
  stubRunner("operations.weekly_report")
);

registerAgent(
  {
    name: "operations.roi_weekly",
    description: "Generate weekly ROI reports",
    schedule: "0 8 * * 1",
    clientScoped: true,
    requiresApproval: false,
  },
  stubRunner("operations.roi_weekly")
);

registerAgent(
  {
    name: "operations.roi_monthly",
    description: "Generate monthly ROI reports",
    schedule: "0 8 1 * *",
    clientScoped: true,
    requiresApproval: false,
  },
  stubRunner("operations.roi_monthly")
);
