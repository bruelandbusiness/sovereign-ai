"use client";

import { useState, useCallback } from "react";
import {
  Bot,
  Check,
  X,
  Clock,
  AlertTriangle,
  Zap,
  RefreshCw,
  Play,
  Pause,
  Plus,
  Power,
  Star,
  FileText,
  UserPlus,
  CalendarCheck,
  ChevronRight,
  Activity,
  Send,
  ArrowRight,
  Hash,
  Mail,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FadeInView } from "@/components/shared/FadeInView";
import { useAutopilot } from "@/hooks/useAutopilot";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AutomationRule {
  readonly id: string;
  readonly name: string;
  readonly trigger: string;
  readonly action: string;
  readonly status: "active" | "paused";
  readonly lastTriggered: string | null;
  readonly triggerCount: number;
}

interface ActivityLogEntry {
  readonly id: string;
  readonly ruleName: string;
  readonly trigger: string;
  readonly action: string;
  readonly outcome: "success" | "failed" | "skipped";
  readonly timestamp: string;
  readonly details: string;
}

interface PrebuiltTemplate {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly trigger: string;
  readonly action: string;
  readonly icon: typeof Mail;
  readonly category: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

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
    color: "bg-muted text-muted-foreground border-border",
    icon: Clock,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-muted text-muted-foreground border-border",
    icon: X,
  },
};

const AGENT_LABELS: Record<string, string> = {
  "campaign-optimizer": "Campaign Optimizer",
  "content-strategist": "Content Strategist",
  "review-responder": "Review Responder",
  "lead-nurture-optimizer": "Lead Nurture Optimizer",
};

const PREBUILT_TEMPLATES: readonly PrebuiltTemplate[] = [
  {
    id: "review-request",
    name: "Send review request 24 hours after job completion",
    description:
      "Automatically request a review from customers one day after their job is marked complete.",
    trigger: "Booking completed",
    action: "Send SMS",
    icon: Star,
    category: "Reviews",
  },
  {
    id: "lead-followup",
    name: "Follow up with unresponsive leads after 48 hours",
    description:
      "Re-engage leads who haven't responded within 48 hours with a friendly follow-up message.",
    trigger: "New lead",
    action: "Send SMS",
    icon: UserPlus,
    category: "Leads",
  },
  {
    id: "booking-reminder",
    name: "Send booking reminder 24 hours before appointment",
    description:
      "Reduce no-shows by sending an automatic reminder the day before a scheduled appointment.",
    trigger: "Booking upcoming",
    action: "Send SMS",
    icon: CalendarCheck,
    category: "Bookings",
  },
  {
    id: "negative-review-alert",
    name: "Alert owner when negative review received",
    description:
      "Instantly notify you when a review with 3 stars or fewer is posted so you can respond quickly.",
    trigger: "Review received",
    action: "Notify owner",
    icon: AlertTriangle,
    category: "Reviews",
  },
  {
    id: "after-hours-response",
    name: "Auto-respond to after-hours inquiries",
    description:
      "Send an automatic acknowledgment to leads and messages received outside business hours.",
    trigger: "New lead",
    action: "Send email",
    icon: Clock,
    category: "Communication",
  },
  {
    id: "weekly-summary",
    name: "Weekly performance summary email",
    description:
      "Receive a digest every Monday with key metrics: leads, bookings, reviews, and revenue.",
    trigger: "Scheduled (weekly)",
    action: "Send email",
    icon: FileText,
    category: "Reports",
  },
] as const;

const TRIGGER_OPTIONS = [
  { value: "new-lead", label: "New lead received" },
  { value: "booking-completed", label: "Booking completed" },
  { value: "review-received", label: "Review received" },
  { value: "invoice-paid", label: "Invoice paid" },
  { value: "booking-upcoming", label: "Booking upcoming" },
  { value: "lead-no-response", label: "Lead not responding" },
] as const;

const CONDITION_OPTIONS = [
  { value: "time-delay-1h", label: "After 1 hour delay" },
  { value: "time-delay-24h", label: "After 24 hour delay" },
  { value: "time-delay-48h", label: "After 48 hour delay" },
  { value: "lead-score-above-50", label: "Lead score above 50" },
  { value: "lead-score-above-75", label: "Lead score above 75" },
  { value: "rating-below-4", label: "Rating below 4 stars" },
  { value: "rating-below-3", label: "Rating below 3 stars" },
  { value: "no-condition", label: "No condition (immediate)" },
] as const;

const ACTION_OPTIONS = [
  { value: "send-sms", label: "Send SMS" },
  { value: "send-email", label: "Send email" },
  { value: "create-task", label: "Create task" },
  { value: "notify-owner", label: "Notify owner" },
  { value: "update-status", label: "Update lead status" },
] as const;

const INITIAL_RULES: readonly AutomationRule[] = [
  {
    id: "rule-1",
    name: "Review Request After Service",
    trigger: "Booking completed",
    action: "Send SMS",
    status: "active",
    lastTriggered: "2026-03-28T09:15:00Z",
    triggerCount: 142,
  },
  {
    id: "rule-2",
    name: "Lead Follow-Up (48h)",
    trigger: "New lead received",
    action: "Send SMS",
    status: "active",
    lastTriggered: "2026-03-27T16:30:00Z",
    triggerCount: 87,
  },
  {
    id: "rule-3",
    name: "Negative Review Alert",
    trigger: "Review received",
    action: "Notify owner",
    status: "active",
    lastTriggered: "2026-03-25T11:00:00Z",
    triggerCount: 9,
  },
  {
    id: "rule-4",
    name: "Appointment Reminder",
    trigger: "Booking upcoming",
    action: "Send SMS",
    status: "paused",
    lastTriggered: "2026-03-20T08:00:00Z",
    triggerCount: 203,
  },
  {
    id: "rule-5",
    name: "Invoice Payment Confirmation",
    trigger: "Invoice paid",
    action: "Send email",
    status: "active",
    lastTriggered: "2026-03-28T10:45:00Z",
    triggerCount: 56,
  },
] as const;

const INITIAL_ACTIVITY_LOG: readonly ActivityLogEntry[] = [
  {
    id: "log-1",
    ruleName: "Review Request After Service",
    trigger: "Booking #1847 completed",
    action: "SMS sent to (555) 234-5678",
    outcome: "success",
    timestamp: "2026-03-28T09:15:00Z",
    details: "Review request sent to Maria Johnson",
  },
  {
    id: "log-2",
    ruleName: "Invoice Payment Confirmation",
    trigger: "Invoice #INV-0392 paid",
    action: "Email sent to client",
    outcome: "success",
    timestamp: "2026-03-28T10:45:00Z",
    details: "Payment confirmation sent to James Wilson ($450)",
  },
  {
    id: "log-3",
    ruleName: "Lead Follow-Up (48h)",
    trigger: "Lead #L-2891 no response",
    action: "SMS follow-up sent",
    outcome: "success",
    timestamp: "2026-03-27T16:30:00Z",
    details: "Follow-up sent to David Chen - Roof Repair inquiry",
  },
  {
    id: "log-4",
    ruleName: "Negative Review Alert",
    trigger: "2-star review on Google",
    action: "Owner notified via push",
    outcome: "success",
    timestamp: "2026-03-25T11:00:00Z",
    details: "Alert sent - Review from Robert K. about delayed service",
  },
  {
    id: "log-5",
    ruleName: "Lead Follow-Up (48h)",
    trigger: "Lead #L-2885 no response",
    action: "SMS follow-up attempted",
    outcome: "failed",
    timestamp: "2026-03-27T14:10:00Z",
    details: "Failed to send - Invalid phone number on file",
  },
  {
    id: "log-6",
    ruleName: "Review Request After Service",
    trigger: "Booking #1844 completed",
    action: "SMS skipped",
    outcome: "skipped",
    timestamp: "2026-03-26T17:00:00Z",
    details: "Customer opted out of marketing messages",
  },
] as const;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getOutcomeConfig(outcome: string) {
  switch (outcome) {
    case "success":
      return {
        label: "Success",
        color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        icon: Check,
      };
    case "failed":
      return {
        label: "Failed",
        color: "bg-red-500/10 text-red-400 border-red-500/20",
        icon: X,
      };
    case "skipped":
      return {
        label: "Skipped",
        color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        icon: Pause,
      };
    default:
      return {
        label: outcome,
        color: "bg-muted text-muted-foreground border-border",
        icon: Activity,
      };
  }
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function AutopilotPage() {
  const { executions, approvals, isLoading, refresh } = useAutopilot();

  const [masterEnabled, setMasterEnabled] = useState(true);
  const [rules, setRules] = useState<readonly AutomationRule[]>(INITIAL_RULES);
  const [showRuleBuilder, setShowRuleBuilder] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] =
    useState<PrebuiltTemplate | null>(null);

  const activeRuleCount = rules.filter((r) => r.status === "active").length;

  const running = executions.filter((e) => e.status === "running").length;
  const pending = approvals.length;
  const today = executions.filter((e) => {
    const created = new Date(e.createdAt);
    const now = new Date();
    return created.toDateString() === now.toDateString();
  }).length;

  const toggleRule = useCallback(
    (ruleId: string) => {
      setRules(
        rules.map((r) =>
          r.id === ruleId
            ? { ...r, status: r.status === "active" ? "paused" : "active" }
            : r,
        ),
      );
    },
    [rules],
  );

  const activateTemplate = useCallback(
    (template: PrebuiltTemplate) => {
      const newRule: AutomationRule = {
        id: `rule-${Date.now()}`,
        name: template.name,
        trigger: template.trigger,
        action: template.action,
        status: "active",
        lastTriggered: null,
        triggerCount: 0,
      };
      setRules([...rules, newRule]);
      setShowTemplateDialog(null);
    },
    [rules],
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="minimal" />
        <main className="flex flex-1 items-center justify-center">
          <div
            role="status"
            aria-label="Loading autopilot data"
            className="text-muted-foreground"
          >
            Loading autopilot...
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <Header variant="minimal" />
      <main className="flex-1 py-8">
        <Container>
          {/* Page Header with Master Toggle */}
          <FadeInView>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <Bot className="h-6 w-6 text-primary" />
                  Autopilot Command Center
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Monitor and control your AI automation rules
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* Master Toggle */}
                <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-2.5">
                  <Power
                    className={`h-4 w-4 ${masterEnabled ? "text-emerald-400" : "text-muted-foreground"}`}
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {masterEnabled ? "Automations On" : "Automations Off"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {activeRuleCount} rule{activeRuleCount !== 1 ? "s" : ""}{" "}
                      active
                    </span>
                  </div>
                  <Switch
                    checked={masterEnabled}
                    onCheckedChange={setMasterEnabled}
                    aria-label="Toggle all automations"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={refresh}>
                  <RefreshCw className="h-4 w-4 mr-1.5" />
                  Refresh
                </Button>
              </div>
            </div>
          </FadeInView>

          {/* Master disabled overlay message */}
          {!masterEnabled && (
            <Card className="mb-6 border-amber-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 text-amber-400">
                  <AlertTriangle className="h-5 w-5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">
                      All automations are paused
                    </p>
                    <p className="text-xs text-muted-foreground">
                      No automation rules will fire while the master toggle is
                      off. Turn it back on to resume.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Cards */}
          <div className="grid gap-4 sm:grid-cols-4 mb-8">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{activeRuleCount}</p>
                    <p className="text-xs text-muted-foreground">
                      Active Rules
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-500/10 p-2">
                    <Activity className="h-5 w-5 text-blue-400" />
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
          <Tabs defaultValue="rules">
            <TabsList className="mb-6">
              <TabsTrigger value="rules">
                Automation Rules
                <Badge
                  variant="outline"
                  className="ml-1.5 h-5 min-w-[20px] px-1 text-xs"
                >
                  {rules.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="agents">Agents</TabsTrigger>
              <TabsTrigger value="activity">Activity Log</TabsTrigger>
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

            {/* ---- Automation Rules Tab ---- */}
            <TabsContent value="rules">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  {activeRuleCount} of {rules.length} rules active
                </p>
                <Button size="sm" onClick={() => setShowRuleBuilder(true)}>
                  <Plus className="h-4 w-4 mr-1.5" />
                  Create Rule
                </Button>
              </div>
              <div className="space-y-3">
                {rules.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                      No automation rules yet. Create one or activate a
                      pre-built template.
                    </CardContent>
                  </Card>
                )}
                {rules.map((rule) => (
                  <AutomationRuleCard
                    key={rule.id}
                    rule={rule}
                    masterEnabled={masterEnabled}
                    onToggle={toggleRule}
                  />
                ))}
              </div>
            </TabsContent>

            {/* ---- Pre-built Templates Tab ---- */}
            <TabsContent value="templates">
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">
                  Ready-to-activate automation templates. Click to preview and
                  activate.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {PREBUILT_TEMPLATES.map((template) => {
                  const alreadyActive = rules.some(
                    (r) => r.name === template.name,
                  );
                  return (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      alreadyActive={alreadyActive}
                      onActivate={() => setShowTemplateDialog(template)}
                    />
                  );
                })}
              </div>
            </TabsContent>

            {/* ---- Agents Tab ---- */}
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

            {/* ---- Activity Log Tab ---- */}
            <TabsContent value="activity">
              <ActivityLog entries={INITIAL_ACTIVITY_LOG} />
            </TabsContent>

            {/* ---- Approvals Tab ---- */}
            <TabsContent value="approvals">
              <ApprovalsList approvals={approvals} onAction={refresh} />
            </TabsContent>
          </Tabs>
        </Container>
      </main>
      <Footer />

      {/* Custom Rule Builder Dialog */}
      <RuleBuilderDialog
        open={showRuleBuilder}
        onOpenChange={setShowRuleBuilder}
        onSave={(newRule) => {
          setRules([...rules, newRule]);
          setShowRuleBuilder(false);
        }}
      />

      {/* Template Activation Dialog */}
      {showTemplateDialog !== null && (
        <TemplateActivationDialog
          template={showTemplateDialog}
          onClose={() => setShowTemplateDialog(null)}
          onActivate={() => activateTemplate(showTemplateDialog)}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Automation Rule Card                                               */
/* ------------------------------------------------------------------ */

function AutomationRuleCard({
  rule,
  masterEnabled,
  onToggle,
}: {
  readonly rule: AutomationRule;
  readonly masterEnabled: boolean;
  readonly onToggle: (id: string) => void;
}) {
  const isActive = rule.status === "active" && masterEnabled;

  return (
    <Card
      className={!isActive ? "opacity-60" : undefined}
    >
      <CardContent className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`rounded-lg p-2 shrink-0 ${isActive ? "bg-emerald-500/10" : "bg-muted"}`}
            >
              {isActive ? (
                <Play className="h-4 w-4 text-emerald-400" />
              ) : (
                <Pause className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{rule.name}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  {rule.trigger}
                </span>
                <ArrowRight className="h-3 w-3 shrink-0" />
                <span className="flex items-center gap-1">
                  <Send className="h-3 w-3" />
                  {rule.action}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1" title="Times triggered">
                <Hash className="h-3 w-3" />
                {rule.triggerCount}
              </span>
              {rule.lastTriggered !== null && (
                <span title="Last triggered">
                  {timeAgo(rule.lastTriggered)}
                </span>
              )}
            </div>
            <Badge
              variant="outline"
              className={
                isActive
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-muted text-muted-foreground border-border"
              }
            >
              {isActive ? "Active" : "Paused"}
            </Badge>
            <Switch
              checked={rule.status === "active"}
              onCheckedChange={() => onToggle(rule.id)}
              aria-label={`Toggle ${rule.name}`}
              size="sm"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Template Card                                                      */
/* ------------------------------------------------------------------ */

function TemplateCard({
  template,
  alreadyActive,
  onActivate,
}: {
  readonly template: PrebuiltTemplate;
  readonly alreadyActive: boolean;
  readonly onActivate: () => void;
}) {
  const Icon = template.icon;

  return (
    <Card
      className={`cursor-pointer transition-colors hover:border-primary/30 ${alreadyActive ? "opacity-60" : ""}`}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="rounded-lg bg-primary/10 p-2 shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <Badge variant="outline" className="text-xs ml-auto shrink-0">
            {template.category}
          </Badge>
        </div>
        <p className="font-medium text-sm mb-1.5">{template.name}</p>
        <p className="text-xs text-muted-foreground mb-4 line-clamp-2">
          {template.description}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>{template.trigger}</span>
            <ChevronRight className="h-3 w-3" />
            <span>{template.action}</span>
          </div>
          {alreadyActive ? (
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs"
            >
              Active
            </Badge>
          ) : (
            <Button size="sm" variant="outline" onClick={onActivate}>
              Activate
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Template Activation Dialog                                         */
/* ------------------------------------------------------------------ */

function TemplateActivationDialog({
  template,
  onClose,
  onActivate,
}: {
  readonly template: PrebuiltTemplate;
  readonly onClose: () => void;
  readonly onActivate: () => void;
}) {
  const Icon = template.icon;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="rounded-lg bg-primary/10 p-2">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle>Activate Template</DialogTitle>
          </div>
          <DialogDescription>{template.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <span className="text-sm text-muted-foreground">Trigger</span>
            <Badge variant="outline">{template.trigger}</Badge>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <span className="text-sm text-muted-foreground">Action</span>
            <Badge variant="outline">{template.action}</Badge>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onActivate}>
            <Play className="h-4 w-4 mr-1.5" />
            Activate Rule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/*  Custom Rule Builder Dialog                                         */
/* ------------------------------------------------------------------ */

function RuleBuilderDialog({
  open,
  onOpenChange,
  onSave,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (rule: AutomationRule) => void;
}) {
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState<string | null>(null);
  const [condition, setCondition] = useState<string | null>(null);
  const [action, setAction] = useState<string | null>(null);

  const canSave =
    name.trim().length > 0 &&
    trigger !== null &&
    condition !== null &&
    action !== null;

  function handleSave() {
    if (!canSave) return;

    const triggerLabel =
      TRIGGER_OPTIONS.find((t) => t.value === trigger)?.label ?? trigger;
    const actionLabel =
      ACTION_OPTIONS.find((a) => a.value === action)?.label ?? action;

    const newRule: AutomationRule = {
      id: `rule-${Date.now()}`,
      name: name.trim(),
      trigger: triggerLabel,
      action: actionLabel,
      status: "active",
      lastTriggered: null,
      triggerCount: 0,
    };

    onSave(newRule);
    setName("");
    setTrigger(null);
    setCondition(null);
    setAction(null);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Automation Rule</DialogTitle>
          <DialogDescription>
            Build a custom rule: choose a trigger, set conditions, and define an
            action.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Rule Name */}
          <div className="space-y-2">
            <Label htmlFor="rule-name">Rule Name</Label>
            <Input
              id="rule-name"
              placeholder="e.g., Follow up with new leads"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Trigger */}
          <div className="space-y-2">
            <Label>Trigger</Label>
            <p className="text-xs text-muted-foreground">
              What event starts this automation?
            </p>
            <Select value={trigger ?? undefined} onValueChange={setTrigger}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a trigger..." />
              </SelectTrigger>
              <SelectContent>
                {TRIGGER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Condition */}
          <div className="space-y-2">
            <Label>Condition</Label>
            <p className="text-xs text-muted-foreground">
              Any requirements before the action fires?
            </p>
            <Select
              value={condition ?? undefined}
              onValueChange={setCondition}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a condition..." />
              </SelectTrigger>
              <SelectContent>
                {CONDITION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action */}
          <div className="space-y-2">
            <Label>Action</Label>
            <p className="text-xs text-muted-foreground">
              What happens when the rule fires?
            </p>
            <Select value={action ?? undefined} onValueChange={setAction}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an action..." />
              </SelectTrigger>
              <SelectContent>
                {ACTION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview */}
          {canSave && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <p className="text-xs font-medium text-primary mb-2">
                Rule Preview
              </p>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="text-xs">
                  {TRIGGER_OPTIONS.find((t) => t.value === trigger)?.label}
                </Badge>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <Badge variant="outline" className="text-xs">
                  {CONDITION_OPTIONS.find((c) => c.value === condition)?.label}
                </Badge>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <Badge variant="outline" className="text-xs">
                  {ACTION_OPTIONS.find((a) => a.value === action)?.label}
                </Badge>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            <Plus className="h-4 w-4 mr-1.5" />
            Create Rule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/*  Activity Log                                                       */
/* ------------------------------------------------------------------ */

function ActivityLog({
  entries,
}: {
  readonly entries: readonly ActivityLogEntry[];
}) {
  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          No automation activity yet. Rules will log here as they fire.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground mb-2">
        Recent automation executions and their outcomes.
      </p>
      {entries.map((entry) => {
        const config = getOutcomeConfig(entry.outcome);
        const OutcomeIcon = config.icon;
        return (
          <Card key={entry.id}>
            <CardContent className="p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`rounded-lg p-2 shrink-0 ${config.color.split(" ").slice(0, 1).join(" ")}`}
                  >
                    <OutcomeIcon
                      className={`h-4 w-4 ${config.color.split(" ").slice(1, 2).join(" ")}`}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{entry.ruleName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {entry.trigger}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {entry.details}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-muted-foreground">
                    {formatDate(entry.timestamp)}
                  </span>
                  <Badge variant="outline" className={config.color}>
                    {config.label}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Approvals List                                                     */
/* ------------------------------------------------------------------ */

function ApprovalsList({
  approvals,
  onAction,
}: {
  readonly approvals: ReadonlyArray<{
    id: string;
    actionType: string;
    description: string;
    expiresAt: string;
    createdAt: string;
  }>;
  readonly onAction: () => void;
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
