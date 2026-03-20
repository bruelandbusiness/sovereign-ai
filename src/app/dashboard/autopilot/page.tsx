"use client";

import {
  Bot,
  Check,
  X,
  Clock,
  AlertTriangle,
  Zap,
  RefreshCw,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FadeInView } from "@/components/shared/FadeInView";
import { useAutopilot } from "@/hooks/useAutopilot";

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: typeof Bot }
> = {
  completed: {
    label: "Completed",
    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    icon: Check,
  },
  running: {
    label: "Running",
    color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    icon: Zap,
  },
  paused: {
    label: "Awaiting Approval",
    color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    icon: Clock,
  },
  failed: {
    label: "Failed",
    color: "bg-red-500/10 text-red-400 border-red-500/20",
    icon: AlertTriangle,
  },
  queued: {
    label: "Queued",
    color: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    icon: Clock,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    icon: X,
  },
};

const AGENT_LABELS: Record<string, string> = {
  "campaign-optimizer": "Campaign Optimizer",
  "content-strategist": "Content Strategist",
  "review-responder": "Review Responder",
  "lead-nurture-optimizer": "Lead Nurture Optimizer",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function AutopilotPage() {
  const { executions, approvals, isLoading, refresh } = useAutopilot();

  const running = executions.filter((e) => e.status === "running").length;
  const pending = approvals.length;
  const today = executions.filter((e) => {
    const created = new Date(e.createdAt);
    const now = new Date();
    return created.toDateString() === now.toDateString();
  }).length;

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="minimal" />
        <main className="flex flex-1 items-center justify-center">
          <div role="status" aria-label="Loading autopilot data" className="text-muted-foreground">Loading autopilot...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <Header variant="minimal" />
      <main className="flex-1 py-8">
        <Container>
          <FadeInView>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <Bot className="h-6 w-6 text-primary" />
                  Autopilot Command Center
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Monitor and control your AI agents
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={refresh}>
                <RefreshCw className="h-4 w-4 mr-1.5" />
                Refresh
              </Button>
            </div>
          </FadeInView>

          {/* Status Cards */}
          <div className="grid gap-4 sm:grid-cols-3 mb-8">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-500/10 p-2">
                    <Zap className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{running}</p>
                    <p className="text-xs text-muted-foreground">
                      Agents Running
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-amber-500/10 p-2">
                    <Clock className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{pending}</p>
                    <p className="text-xs text-muted-foreground">
                      Pending Approvals
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-500/10 p-2">
                    <Check className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{today}</p>
                    <p className="text-xs text-muted-foreground">
                      Actions Today
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="agents">
            <TabsList className="mb-6">
              <TabsTrigger value="agents">Agents</TabsTrigger>
              <TabsTrigger value="approvals">
                Approvals{" "}
                {pending > 0 && (
                  <Badge
                    variant="destructive"
                    className="ml-1.5 h-5 min-w-[20px] px-1"
                  >
                    {pending}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="agents">
              <div className="space-y-3">
                {executions.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                      No agent executions yet. Agents will appear here as they
                      run.
                    </CardContent>
                  </Card>
                )}
                {executions.map((exec) => {
                  const cfg =
                    STATUS_CONFIG[exec.status] || STATUS_CONFIG.queued;
                  const Icon = cfg.icon;
                  return (
                    <Card key={exec.id}>
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`rounded-lg p-2 ${cfg.color.split(" ").slice(0, 1).join(" ")}`}
                            >
                              <Icon
                                className={`h-4 w-4 ${cfg.color.split(" ").slice(1, 2).join(" ")}`}
                              />
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                {AGENT_LABELS[exec.agentType] || exec.agentType}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {exec.triggeredBy || "Manual"} &middot;{" "}
                                {timeAgo(exec.createdAt)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground">
                              {exec.completedSteps}/{exec.stepCount} steps
                            </span>
                            <Badge variant="outline" className={cfg.color}>
                              {cfg.label}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="approvals">
              <ApprovalsList approvals={approvals} onAction={refresh} />
            </TabsContent>
          </Tabs>
        </Container>
      </main>
      <Footer />
    </div>
  );
}

function ApprovalsList({
  approvals,
  onAction,
}: {
  approvals: Array<{
    id: string;
    actionType: string;
    description: string;
    expiresAt: string;
    createdAt: string;
  }>;
  onAction: () => void;
}) {
  async function handleDecision(
    requestId: string,
    decision: "approved" | "rejected",
  ) {
    await fetch("/api/dashboard/autopilot/approvals", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, decision }),
    });
    onAction();
  }

  if (approvals.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          No pending approvals.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {approvals.map((a) => (
        <Card key={a.id}>
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-sm">{a.description}</p>
                <p className="text-xs text-muted-foreground">
                  {a.actionType} &middot; Expires {timeAgo(a.expiresAt)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10"
                  onClick={() => handleDecision(a.id, "approved")}
                  aria-label={`Approve: ${a.description}`}
                >
                  <Check className="h-4 w-4 mr-1" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-400 border-red-500/20 hover:bg-red-500/10"
                  onClick={() => handleDecision(a.id, "rejected")}
                  aria-label={`Reject: ${a.description}`}
                >
                  <X className="h-4 w-4 mr-1" /> Reject
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
