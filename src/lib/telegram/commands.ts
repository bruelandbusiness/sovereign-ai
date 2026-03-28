import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CommandHandler = (
  chatId: string,
  args: string,
) => Promise<string>;

// ---------------------------------------------------------------------------
// Command registry
// ---------------------------------------------------------------------------

const commands: Record<string, CommandHandler> = {
  status: handleStatus,
  health: handleHealth,
  clients: handleClients,
  client: handleClient,
  leads: handleLeads,
  pipeline: handlePipeline,
  costs: handleCosts,
  mrr: handleMrr,
  jobs: handleJobs,
  errors: handleErrors,
  warmup: handleWarmup,
  approve: handleApprove,
  reject: handleReject,
  pause: handlePause,
  resume: handleResume,
  digest: handleDigest,
  help: handleHelp,
};

// ---------------------------------------------------------------------------
// Main router
// ---------------------------------------------------------------------------

/**
 * Route an incoming command to its handler and log the interaction.
 */
export async function handleCommand(
  chatId: string,
  command: string,
  args: string,
): Promise<string> {
  const handler = commands[command];
  let response: string;

  if (!handler) {
    response =
      `Unknown command: /${command}\n\nType /help for available commands.`;
  } else {
    try {
      response = await handler(chatId, args);
    } catch (err) {
      logger.errorWithCause("[telegram/commands] Handler error", err, {
        command,
        args,
      });
      response = `Error executing /${command}. Please try again later.`;
    }
  }

  // Log the command (fire-and-forget)
  prisma.telegramCommandLog
    .create({
      data: {
        chatId,
        command,
        args: args || null,
        response: response.slice(0, 4000),
      },
    })
    .catch((err) => {
      logger.errorWithCause("[telegram/commands] Failed to log command", err);
    });

  return response;
}

// ---------------------------------------------------------------------------
// /status
// ---------------------------------------------------------------------------

async function handleStatus(): Promise<string> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const [clientCount, recentErrors, pendingApprovals] =
    await Promise.all([
      prisma.client.count(),
      prisma.agentExecution.count({
        where: {
          status: "failed",
          createdAt: { gte: oneHourAgo },
        },
      }),
      prisma.approvalRequest.count({
        where: { status: "pending" },
      }),
    ]);

  return [
    "\u{1F4CA} *System Status*",
    "",
    `\u{1F465} Active clients: ${clientCount}`,
    `\u{274C} Errors (last hour): ${recentErrors}`,
    `\u{23F3} Pending approvals: ${pendingApprovals}`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// /clients
// ---------------------------------------------------------------------------

async function handleClients(): Promise<string> {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      subscription: {
        select: { status: true, bundleId: true, monthlyAmount: true },
      },
    },
  });

  if (clients.length === 0) {
    return "No clients found.";
  }

  const lines = clients.map((c) => {
    const plan = c.subscription?.bundleId || "none";
    const status = c.subscription?.status || "no-sub";
    return `\u{2022} *${c.businessName}* | ${plan} | ${status}`;
  });

  return ["\u{1F465} *Clients*", "", ...lines].join("\n");
}

// ---------------------------------------------------------------------------
// /client <name>
// ---------------------------------------------------------------------------

async function handleClient(
  _chatId: string,
  args: string,
): Promise<string> {
  const name = args.trim();
  if (!name) {
    return "Usage: /client <business name>";
  }

  const client = await prisma.client.findFirst({
    where: {
      businessName: { contains: name, mode: "insensitive" },
    },
    include: {
      subscription: true,
      services: true,
    },
  });

  if (!client) {
    return `No client found matching "${name}".`;
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [leadCount, lastActivity] = await Promise.all([
    prisma.lead.count({
      where: {
        clientId: client.id,
        createdAt: { gte: thirtyDaysAgo },
      },
    }),
    prisma.activityEvent.findFirst({
      where: { clientId: client.id },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, type: true },
    }),
  ]);

  const activeServices = client.services
    .filter((s) => s.status === "active")
    .map((s) => s.serviceId)
    .join(", ") || "none";

  const subStatus = client.subscription?.status || "no subscription";
  const plan = client.subscription?.bundleId || "none";
  const lastAct = lastActivity
    ? `${lastActivity.type} at ${lastActivity.createdAt.toISOString().slice(0, 16)}`
    : "none";

  return [
    `\u{1F50D} *${client.businessName}*`,
    "",
    `\u{1F4C5} Leads (30d): ${leadCount}`,
    `\u{2699}\u{FE0F} Services: ${activeServices}`,
    `\u{1F4B3} Plan: ${plan} (${subStatus})`,
    `\u{1F55A} Last activity: ${lastAct}`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// /leads [clientId]
// ---------------------------------------------------------------------------

async function handleLeads(
  _chatId: string,
  args: string,
): Promise<string> {
  const clientId = args.trim();

  const where = clientId ? { clientId } : {};

  const leads = await prisma.lead.groupBy({
    by: ["status"],
    where,
    _count: { id: true },
  });

  if (leads.length === 0) {
    return clientId
      ? `No leads found for client ${clientId}.`
      : "No leads in the system.";
  }

  const lines = leads.map(
    (g) => `\u{2022} ${g.status}: ${g._count.id}`,
  );

  const title = clientId
    ? `\u{1F3AF} *Leads for ${clientId}*`
    : "\u{1F3AF} *Lead Pipeline*";

  return [title, "", ...lines].join("\n");
}

// ---------------------------------------------------------------------------
// /approve <requestId>
// ---------------------------------------------------------------------------

async function handleApprove(
  _chatId: string,
  args: string,
): Promise<string> {
  const requestId = args.trim();
  if (!requestId) {
    return "Usage: /approve <requestId>";
  }

  const request = await prisma.approvalRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    return `Approval request ${requestId} not found.`;
  }

  if (request.status !== "pending") {
    return `Request ${requestId} is already ${request.status}.`;
  }

  await prisma.approvalRequest.update({
    where: { id: requestId },
    data: {
      status: "approved",
      reviewedAt: new Date(),
    },
  });

  return `\u{2705} Approved request ${requestId} (${request.actionType}).`;
}

// ---------------------------------------------------------------------------
// /reject <requestId>
// ---------------------------------------------------------------------------

async function handleReject(
  _chatId: string,
  args: string,
): Promise<string> {
  const requestId = args.trim();
  if (!requestId) {
    return "Usage: /reject <requestId>";
  }

  const request = await prisma.approvalRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    return `Approval request ${requestId} not found.`;
  }

  if (request.status !== "pending") {
    return `Request ${requestId} is already ${request.status}.`;
  }

  await prisma.approvalRequest.update({
    where: { id: requestId },
    data: {
      status: "rejected",
      reviewedAt: new Date(),
    },
  });

  return `\u{274C} Rejected request ${requestId} (${request.actionType}).`;
}

// ---------------------------------------------------------------------------
// /digest
// ---------------------------------------------------------------------------

async function handleDigest(): Promise<string> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [mrrResult, newLeadsToday, activeOutreach, recentErrors, pendingApprovals] =
    await Promise.all([
      prisma.subscription.aggregate({
        _sum: { monthlyAmount: true },
        where: { status: "active" },
      }),
      prisma.lead.count({
        where: { createdAt: { gte: todayStart } },
      }),
      prisma.outreachEntry.count({
        where: { status: "active" },
      }),
      prisma.agentExecution.count({
        where: {
          status: "failed",
          createdAt: { gte: twentyFourHoursAgo },
        },
      }),
      prisma.approvalRequest.count({
        where: { status: "pending" },
      }),
    ]);

  const mrrCents = mrrResult._sum.monthlyAmount || 0;
  const mrrDollars = (mrrCents / 100).toFixed(2);

  return [
    "\u{1F4CA} *Operator Digest*",
    "",
    `\u{1F4B0} MRR: $${mrrDollars}`,
    `\u{1F3AF} New leads today: ${newLeadsToday}`,
    `\u{1F4E8} Active outreach: ${activeOutreach}`,
    `\u{274C} Errors (24h): ${recentErrors}`,
    `\u{23F3} Pending approvals: ${pendingApprovals}`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// /health
// ---------------------------------------------------------------------------

async function handleHealth(): Promise<string> {
  const now = Date.now();
  const fiveMinAgo = new Date(now - 5 * 60 * 1000);

  const [dbStart, cronRuns, emailQueueSize, failedJobs] = await Promise.all([
    prisma.client.count().then(() => Date.now() - now),
    prisma.agentExecution.count({ where: { createdAt: { gte: fiveMinAgo } } }),
    prisma.emailQueue.count({ where: { status: "pending" } }),
    prisma.agentExecution.count({
      where: { status: "failed", createdAt: { gte: new Date(now - 60 * 60 * 1000) } },
    }),
  ]);

  const dbStatus = dbStart < 500 ? "\u{1F7E2}" : dbStart < 2000 ? "\u{1F7E1}" : "\u{1F534}";
  const cronStatus = cronRuns > 0 ? "\u{1F7E2}" : "\u{1F7E1}";
  const queueStatus = emailQueueSize < 100 ? "\u{1F7E2}" : emailQueueSize < 500 ? "\u{1F7E1}" : "\u{1F534}";
  const errorStatus = failedJobs === 0 ? "\u{1F7E2}" : failedJobs < 5 ? "\u{1F7E1}" : "\u{1F534}";

  return [
    "\u{1F3E5} *System Health*",
    "",
    `${dbStatus} Database: ${dbStart}ms latency`,
    `${cronStatus} Cron jobs: ${cronRuns} runs in last 5 min`,
    `${queueStatus} Email queue: ${emailQueueSize} pending`,
    `${errorStatus} Errors (1h): ${failedJobs}`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// /pipeline
// ---------------------------------------------------------------------------

async function handlePipeline(): Promise<string> {
  const leads = await prisma.lead.groupBy({
    by: ["status"],
    _count: { id: true },
  });

  if (leads.length === 0) return "No leads in pipeline.";

  const total = leads.reduce((s, g) => s + g._count.id, 0);
  const lines = leads
    .sort((a, b) => b._count.id - a._count.id)
    .map((g) => `  ${g.status}: ${g._count.id}`);

  return ["\u{1F4CA} *Full Pipeline*", "", `Total: ${total}`, ...lines].join("\n");
}

// ---------------------------------------------------------------------------
// /costs
// ---------------------------------------------------------------------------

async function handleCosts(): Promise<string> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const usage = await prisma.agentExecution.groupBy({
    by: ["agentType"],
    where: { createdAt: { gte: todayStart } },
    _sum: { totalCostCents: true },
    _count: { id: true },
  });

  if (usage.length === 0) return "\u{1F4B8} No API usage recorded today.";

  const totalCents = usage.reduce((s, g) => s + (g._sum.totalCostCents || 0), 0);
  const lines = usage.map(
    (g) => `  ${g.agentType}: $${((g._sum.totalCostCents || 0) / 100).toFixed(2)} (${g._count.id} runs)`,
  );

  return [
    "\u{1F4B8} *Today's API Costs*",
    "",
    `Total: $${(totalCents / 100).toFixed(2)}`,
    ...lines,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// /mrr
// ---------------------------------------------------------------------------

async function handleMrr(): Promise<string> {
  const [activeResult, clientCount] = await Promise.all([
    prisma.subscription.aggregate({
      _sum: { monthlyAmount: true },
      where: { status: "active" },
    }),
    prisma.subscription.count({ where: { status: "active" } }),
  ]);

  const mrrCents = activeResult._sum.monthlyAmount || 0;
  const mrrDollars = (mrrCents / 100).toFixed(2);
  const avgDollars = clientCount > 0 ? ((mrrCents / clientCount) / 100).toFixed(2) : "0";

  return [
    "\u{1F4B0} *Monthly Recurring Revenue*",
    "",
    `MRR: $${mrrDollars}`,
    `Active subscriptions: ${clientCount}`,
    `Avg revenue/client: $${avgDollars}`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// /jobs
// ---------------------------------------------------------------------------

async function handleJobs(): Promise<string> {
  const recentJobs = await prisma.agentExecution.findMany({
    orderBy: { createdAt: "desc" },
    take: 15,
    select: {
      agentType: true,
      status: true,
      createdAt: true,
      startedAt: true,
      completedAt: true,
    },
  });

  if (recentJobs.length === 0) return "No recent job executions.";

  const statusEmoji: Record<string, string> = {
    completed: "\u{2705}",
    failed: "\u{274C}",
    running: "\u{23F3}",
  };

  const lines = recentJobs.map((j) => {
    const emoji = statusEmoji[j.status] || "\u{2022}";
    const time = j.createdAt.toISOString().slice(11, 16);
    const dur = j.startedAt && j.completedAt
      ? `${((j.completedAt.getTime() - j.startedAt.getTime()) / 1000).toFixed(1)}s`
      : "—";
    return `${emoji} ${time} ${j.agentType} (${dur})`;
  });

  return ["\u{2699}\u{FE0F} *Recent Jobs*", "", ...lines].join("\n");
}

// ---------------------------------------------------------------------------
// /errors
// ---------------------------------------------------------------------------

async function handleErrors(): Promise<string> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const errors = await prisma.agentExecution.findMany({
    where: {
      status: "failed",
      createdAt: { gte: twentyFourHoursAgo },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      agentType: true,
      error: true,
      createdAt: true,
    },
  });

  if (errors.length === 0) return "\u{2705} No errors in the last 24 hours.";

  const lines = errors.map((e) => {
    const time = e.createdAt.toISOString().slice(11, 16);
    const msg = (e.error || "Unknown error").slice(0, 80);
    return `\u{274C} ${time} ${e.agentType}: ${msg}`;
  });

  return ["\u{1F6A8} *Errors (24h)*", "", ...lines].join("\n");
}

// ---------------------------------------------------------------------------
// /warmup
// ---------------------------------------------------------------------------

async function handleWarmup(): Promise<string> {
  const domains = await prisma.outreachDomain.findMany({
    take: 10,
    select: {
      domain: true,
      dailyLimit: true,
      currentDailySent: true,
      reputation: true,
      warmupComplete: true,
    },
  });

  if (domains.length === 0) return "No outreach domains configured.";

  const lines = domains.map((d) => {
    const status = d.warmupComplete ? "\u{1F7E2}" : "\u{1F7E1}";
    const usage = `${d.currentDailySent}/${d.dailyLimit}`;
    return `${status} ${d.domain}: ${usage} sent | rep: ${d.reputation || "—"}`;
  });

  return ["\u{1F4E7} *Warmup Status*", "", ...lines].join("\n");
}

// ---------------------------------------------------------------------------
// /pause <client name>
// ---------------------------------------------------------------------------

async function handlePause(
  _chatId: string,
  args: string,
): Promise<string> {
  const name = args.trim();
  if (!name) return "Usage: /pause <business name>";

  const client = await prisma.client.findFirst({
    where: { businessName: { contains: name, mode: "insensitive" } },
    select: { id: true, businessName: true },
  });

  if (!client) return `No client found matching "${name}".`;

  // Pause all active outreach entries for this client
  const updated = await prisma.outreachEntry.updateMany({
    where: { clientId: client.id, status: "active" },
    data: { status: "paused" },
  });

  return `\u{23F8}\u{FE0F} Paused outreach for *${client.businessName}* (${updated.count} entries paused).`;
}

// ---------------------------------------------------------------------------
// /resume <client name>
// ---------------------------------------------------------------------------

async function handleResume(
  _chatId: string,
  args: string,
): Promise<string> {
  const name = args.trim();
  if (!name) return "Usage: /resume <business name>";

  const client = await prisma.client.findFirst({
    where: { businessName: { contains: name, mode: "insensitive" } },
    select: { id: true, businessName: true },
  });

  if (!client) return `No client found matching "${name}".`;

  const updated = await prisma.outreachEntry.updateMany({
    where: { clientId: client.id, status: "paused" },
    data: { status: "active" },
  });

  return `\u{25B6}\u{FE0F} Resumed outreach for *${client.businessName}* (${updated.count} entries resumed).`;
}

// ---------------------------------------------------------------------------
// /help
// ---------------------------------------------------------------------------

async function handleHelp(): Promise<string> {
  return [
    "\u{2753} *Available Commands*",
    "",
    "/status - System overview",
    "/health - Deep health check with latencies",
    "/clients - List all clients",
    "/client <name> - Deep dive on a client",
    "/leads [name] - Lead pipeline summary",
    "/pipeline - Full pipeline across all clients",
    "/costs - Today's API spend breakdown",
    "/mrr - Current MRR with averages",
    "/jobs - Recent scheduled job runs",
    "/errors - Recent errors (24h)",
    "/warmup - Email domain warmup status",
    "/approve <id> - Approve a pending request",
    "/reject <id> - Reject a pending request",
    "/pause <name> - Pause client outreach",
    "/resume <name> - Resume client outreach",
    "/digest - Generate operator digest",
    "/help - Show this message",
  ].join("\n");
}
