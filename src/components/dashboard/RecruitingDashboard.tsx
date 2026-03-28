"use client";

import { useState, useCallback, useMemo } from "react";
import { formatShort } from "@/lib/date-utils";
import {
  Briefcase,
  Users,
  UserCheck,
  Plus,
  Search,
  ChevronDown,
  MapPin,
  Clock,
  DollarSign,
  Calendar,
  Mail,
  Phone,
  Send,
  XCircle,
  GripVertical,
  Filter,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "@/components/dashboard/KPICard";
import { FadeInView } from "@/components/shared/FadeInView";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PipelineStage =
  | "applied"
  | "screening"
  | "interview"
  | "offer"
  | "hired";

interface Applicant {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  experienceYears: number;
  skills: string[];
  status: PipelineStage;
  appliedDate: string;
  avatarInitials: string;
  notes: string;
}

interface JobPosting {
  id: string;
  title: string;
  department: string;
  description: string;
  requirements: string[];
  payRange: string;
  location: string;
  type: string;
  applicantCount: number;
  daysOpen: number;
  status: "active" | "paused" | "closed";
  createdAt: string;
}

interface QuickActionModal {
  type: "interview" | "offer" | "reject" | null;
  applicant: Applicant | null;
}

// ---------------------------------------------------------------------------
// Demo Data
// ---------------------------------------------------------------------------

const DEMO_APPLICANTS: Applicant[] = [
  {
    id: "a1",
    name: "Marcus Johnson",
    email: "marcus.johnson@email.com",
    phone: "(214) 555-0142",
    position: "Senior HVAC Technician",
    department: "HVAC",
    experienceYears: 8,
    skills: ["EPA 608", "R-410A", "Ductwork", "Commercial HVAC"],
    status: "interview",
    appliedDate: "2026-03-15",
    avatarInitials: "MJ",
    notes: "Strong commercial experience. Available to start in 2 weeks.",
  },
  {
    id: "a2",
    name: "Sarah Chen",
    email: "sarah.chen@email.com",
    phone: "(469) 555-0198",
    position: "Electrician",
    department: "Electrical",
    experienceYears: 5,
    skills: ["NEC Code", "Panel Upgrades", "Troubleshooting", "EV Chargers"],
    status: "screening",
    appliedDate: "2026-03-18",
    avatarInitials: "SC",
    notes: "Licensed journeyman. Interested in EV charger installations.",
  },
  {
    id: "a3",
    name: "James Rivera",
    email: "james.rivera@email.com",
    phone: "(972) 555-0267",
    position: "Plumbing Technician",
    department: "Plumbing",
    experienceYears: 12,
    skills: ["Water Heaters", "Repiping", "Drain Cleaning", "Gas Lines"],
    status: "offer",
    appliedDate: "2026-03-10",
    avatarInitials: "JR",
    notes: "Master plumber license. Excellent references from prior employer.",
  },
  {
    id: "a4",
    name: "Emily Watson",
    email: "emily.watson@email.com",
    phone: "(817) 555-0334",
    position: "Office Manager",
    department: "Admin",
    experienceYears: 6,
    skills: ["ServiceTitan", "QuickBooks", "Scheduling", "Customer Service"],
    status: "applied",
    appliedDate: "2026-03-22",
    avatarInitials: "EW",
    notes: "Previous experience with ServiceTitan at a competitor.",
  },
  {
    id: "a5",
    name: "David Park",
    email: "david.park@email.com",
    phone: "(214) 555-0411",
    position: "Senior HVAC Technician",
    department: "HVAC",
    experienceYears: 10,
    skills: ["EPA 608", "Refrigeration", "VRF Systems", "Controls"],
    status: "hired",
    appliedDate: "2026-03-01",
    avatarInitials: "DP",
    notes: "Hired! Starting April 7th. VRF specialist.",
  },
  {
    id: "a6",
    name: "Angela Torres",
    email: "angela.torres@email.com",
    phone: "(469) 555-0523",
    position: "Electrician",
    department: "Electrical",
    experienceYears: 3,
    skills: ["Residential Wiring", "Panel Upgrades", "Code Compliance"],
    status: "applied",
    appliedDate: "2026-03-25",
    avatarInitials: "AT",
    notes: "Recently completed apprenticeship. Eager to learn.",
  },
  {
    id: "a7",
    name: "Robert Kim",
    email: "robert.kim@email.com",
    phone: "(972) 555-0687",
    position: "Plumbing Technician",
    department: "Plumbing",
    experienceYears: 7,
    skills: ["Sewer Lines", "Tankless Heaters", "Commercial Plumbing"],
    status: "screening",
    appliedDate: "2026-03-20",
    avatarInitials: "RK",
    notes: "Has commercial plumbing experience. Good phone screen.",
  },
  {
    id: "a8",
    name: "Lisa Nguyen",
    email: "lisa.nguyen@email.com",
    phone: "(817) 555-0745",
    position: "Dispatcher",
    department: "Admin",
    experienceYears: 4,
    skills: ["ServiceTitan", "Route Optimization", "Customer Service"],
    status: "interview",
    appliedDate: "2026-03-17",
    avatarInitials: "LN",
    notes: "Currently dispatching for a plumbing company. Wants to grow.",
  },
  {
    id: "a9",
    name: "Carlos Mendez",
    email: "carlos.mendez@email.com",
    phone: "(214) 555-0856",
    position: "HVAC Install Helper",
    department: "HVAC",
    experienceYears: 1,
    skills: ["Sheet Metal", "Brazing", "Basic Electrical"],
    status: "applied",
    appliedDate: "2026-03-26",
    avatarInitials: "CM",
    notes: "Trade school graduate. Looking for first full-time role.",
  },
  {
    id: "a10",
    name: "Michelle Brooks",
    email: "michelle.brooks@email.com",
    phone: "(469) 555-0912",
    position: "Office Manager",
    department: "Admin",
    experienceYears: 9,
    skills: ["HR Management", "Payroll", "ServiceTitan", "Recruiting"],
    status: "screening",
    appliedDate: "2026-03-19",
    avatarInitials: "MB",
    notes: "Strong HR background. Managed a team of 15 at prior company.",
  },
];

const DEMO_JOB_POSTINGS: JobPosting[] = [
  {
    id: "j1",
    title: "Senior HVAC Technician",
    department: "HVAC",
    description:
      "Experienced HVAC tech for residential and light commercial service, maintenance, and installations.",
    requirements: [
      "EPA 608 Universal",
      "5+ years experience",
      "Valid driver's license",
      "Clean background check",
    ],
    payRange: "$55,000 - $75,000/year",
    location: "Dallas, TX",
    type: "Full-Time",
    applicantCount: 2,
    daysOpen: 27,
    status: "active",
    createdAt: "2026-03-01",
  },
  {
    id: "j2",
    title: "Electrician",
    department: "Electrical",
    description:
      "Licensed electrician for residential electrical service and panel upgrades.",
    requirements: [
      "Journeyman License",
      "3+ years experience",
      "NEC code knowledge",
      "Own basic tools",
    ],
    payRange: "$50,000 - $68,000/year",
    location: "Dallas, TX",
    type: "Full-Time",
    applicantCount: 2,
    daysOpen: 18,
    status: "active",
    createdAt: "2026-03-10",
  },
  {
    id: "j3",
    title: "Plumbing Technician",
    department: "Plumbing",
    description:
      "Skilled plumber for service calls, water heater installs, and drain cleaning.",
    requirements: [
      "Plumbing license",
      "5+ years experience",
      "Water heater experience",
      "Customer-facing skills",
    ],
    payRange: "$48,000 - $65,000/year",
    location: "Fort Worth, TX",
    type: "Full-Time",
    applicantCount: 2,
    daysOpen: 14,
    status: "active",
    createdAt: "2026-03-14",
  },
  {
    id: "j4",
    title: "Office Manager",
    department: "Admin",
    description:
      "Office manager to oversee scheduling, dispatching, and administrative operations.",
    requirements: [
      "ServiceTitan experience preferred",
      "3+ years office management",
      "Strong communication skills",
      "QuickBooks knowledge",
    ],
    payRange: "$45,000 - $55,000/year",
    location: "Dallas, TX",
    type: "Full-Time",
    applicantCount: 2,
    daysOpen: 10,
    status: "active",
    createdAt: "2026-03-18",
  },
  {
    id: "j5",
    title: "Dispatcher",
    department: "Admin",
    description:
      "Dispatcher to coordinate technician routes and manage daily scheduling.",
    requirements: [
      "Dispatch experience",
      "ServiceTitan or similar FSM software",
      "Multitasking ability",
      "Calm under pressure",
    ],
    payRange: "$38,000 - $48,000/year",
    location: "Dallas, TX",
    type: "Full-Time",
    applicantCount: 1,
    daysOpen: 11,
    status: "active",
    createdAt: "2026-03-17",
  },
  {
    id: "j6",
    title: "HVAC Install Helper",
    department: "HVAC",
    description:
      "Entry-level helper for HVAC installation crews. Training provided.",
    requirements: [
      "Trade school or equivalent",
      "Ability to lift 50 lbs",
      "Reliable transportation",
      "Willingness to learn",
    ],
    payRange: "$32,000 - $40,000/year",
    location: "Dallas, TX",
    type: "Full-Time",
    applicantCount: 1,
    daysOpen: 2,
    status: "active",
    createdAt: "2026-03-26",
  },
];

const PIPELINE_STAGES: { key: PipelineStage; label: string; color: string }[] =
  [
    { key: "applied", label: "Applied", color: "bg-blue-500" },
    { key: "screening", label: "Screening", color: "bg-yellow-500" },
    { key: "interview", label: "Interview", color: "bg-purple-500" },
    { key: "offer", label: "Offer", color: "bg-cyan-500" },
    { key: "hired", label: "Hired", color: "bg-emerald-500" },
  ];

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-400",
  paused: "bg-yellow-500/15 text-yellow-400",
  closed: "bg-muted text-muted-foreground",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysAgo(dateStr: string): number {
  const now = new Date("2026-03-28");
  const then = new Date(dateStr);
  return Math.floor(
    (now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24)
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ApplicantPipelineCard({
  applicant,
  onDragStart,
  onQuickAction,
}: {
  applicant: Applicant;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onQuickAction: (type: "interview" | "offer" | "reject", a: Applicant) => void;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, applicant.id)}
      className="group cursor-grab rounded-lg border border-border bg-card p-3 shadow-sm transition-all hover:shadow-md hover:border-primary/30 active:cursor-grabbing"
    >
      <div className="flex items-start gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
          {applicant.avatarInitials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">{applicant.name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {applicant.position}
          </p>
        </div>
        <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        {applicant.skills.slice(0, 2).map((skill) => (
          <span
            key={skill}
            className="inline-flex rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary"
          >
            {skill}
          </span>
        ))}
        {applicant.skills.length > 2 && (
          <span className="inline-flex rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
            +{applicant.skills.length - 2}
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{applicant.experienceYears} yrs exp</span>
        <span>{daysAgo(applicant.appliedDate)}d ago</span>
      </div>

      {/* Quick action buttons */}
      <div className="mt-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {applicant.status !== "interview" && applicant.status !== "offer" && applicant.status !== "hired" && (
          <button
            onClick={() => onQuickAction("interview", applicant)}
            className="flex-1 rounded bg-purple-500/15 px-1.5 py-1 text-[10px] font-medium text-purple-400 hover:bg-purple-500/25 transition-colors"
            title="Schedule Interview"
          >
            <Calendar className="inline h-3 w-3 mr-0.5" />
            Interview
          </button>
        )}
        {applicant.status !== "offer" && applicant.status !== "hired" && (
          <button
            onClick={() => onQuickAction("offer", applicant)}
            className="flex-1 rounded bg-cyan-500/15 px-1.5 py-1 text-[10px] font-medium text-cyan-400 hover:bg-cyan-500/25 transition-colors"
            title="Send Offer"
          >
            <Send className="inline h-3 w-3 mr-0.5" />
            Offer
          </button>
        )}
        {applicant.status !== "hired" && (
          <button
            onClick={() => onQuickAction("reject", applicant)}
            className="flex-1 rounded bg-red-500/15 px-1.5 py-1 text-[10px] font-medium text-red-400 hover:bg-red-500/25 transition-colors"
            title="Reject"
          >
            <XCircle className="inline h-3 w-3 mr-0.5" />
            Reject
          </button>
        )}
      </div>
    </div>
  );
}

function JobPostingCard({
  job,
  isExpanded,
  onToggle,
}: {
  job: JobPosting;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md hover:border-primary/20">
      <button
        onClick={onToggle}
        className="flex w-full items-start gap-4 p-4 text-left transition-colors hover:bg-muted/30"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Briefcase className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold truncate">{job.title}</h3>
            <span
              className={cn(
                "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                statusColors[job.status] ?? statusColors.closed
              )}
            >
              {job.status}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {job.location}
            </span>
            <span className="inline-flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {job.payRange}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3" />
              {job.applicantCount} applicant
              {job.applicantCount !== 1 ? "s" : ""}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {job.daysOpen}d open
            </span>
          </div>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform mt-1",
            isExpanded && "rotate-180"
          )}
        />
      </button>

      {isExpanded && (
        <div className="border-t border-border bg-muted/10 p-4 space-y-3">
          <p className="text-sm text-muted-foreground">{job.description}</p>
          <div>
            <p className="text-xs font-medium text-foreground/80 mb-1">
              Requirements
            </p>
            <ul className="space-y-0.5">
              {job.requirements.map((req) => (
                <li
                  key={req}
                  className="text-xs text-muted-foreground flex items-start gap-1.5"
                >
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                  {req}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary">
              {job.type}
            </span>
            <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
              {job.department}
            </span>
            <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
              Posted {formatShort(job.createdAt)}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Quick Action Modal
// ---------------------------------------------------------------------------

function QuickActionModalComponent({
  modal,
  onClose,
  onConfirm,
}: {
  modal: QuickActionModal;
  onClose: () => void;
  onConfirm: (
    type: "interview" | "offer" | "reject",
    applicant: Applicant,
    message: string
  ) => void;
}) {
  const [message, setMessage] = useState("");

  if (!modal.type || !modal.applicant) return null;

  const config = {
    interview: {
      title: "Schedule Interview",
      description: `Schedule an interview with ${modal.applicant.name} for the ${modal.applicant.position} position.`,
      placeholder:
        "Hi {{name}}, we'd like to schedule an interview for the {{position}} role. Are you available this week for a 30-minute call?",
      buttonLabel: "Send Interview Invite",
      buttonClass: "bg-purple-600 hover:bg-purple-700",
      icon: Calendar,
    },
    offer: {
      title: "Send Offer",
      description: `Extend an offer to ${modal.applicant.name} for the ${modal.applicant.position} position.`,
      placeholder:
        "Hi {{name}}, congratulations! We're pleased to extend an offer for the {{position}} position. Please find the details attached.",
      buttonLabel: "Send Offer Letter",
      buttonClass: "bg-cyan-600 hover:bg-cyan-700",
      icon: Send,
    },
    reject: {
      title: "Send Rejection",
      description: `Send a rejection notice to ${modal.applicant.name} for the ${modal.applicant.position} position.`,
      placeholder:
        "Hi {{name}}, thank you for your interest in the {{position}} role. After careful review, we've decided to move forward with other candidates. We appreciate your time and wish you the best.",
      buttonLabel: "Send Rejection",
      buttonClass: "bg-red-600 hover:bg-red-700",
      icon: XCircle,
    },
  };

  const c = config[modal.type];
  const ActionIcon = c.icon;

  const templateMessage = c.placeholder
    .replace("{{name}}", modal.applicant.name.split(" ")[0])
    .replace("{{position}}", modal.applicant.position);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <ActionIcon className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">{c.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <p className="text-sm text-muted-foreground">{c.description}</p>

          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {modal.applicant.avatarInitials}
              </div>
              <div>
                <p className="text-sm font-medium">{modal.applicant.name}</p>
                <p className="text-xs text-muted-foreground">
                  {modal.applicant.email}
                </p>
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="quick-action-message"
              className="mb-1.5 block text-xs font-medium text-muted-foreground"
            >
              Message
            </label>
            <textarea
              id="quick-action-message"
              value={message || templateMessage}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-border p-4">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() =>
              onConfirm(
                modal.type!,
                modal.applicant!,
                message || templateMessage
              )
            }
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors",
              c.buttonClass
            )}
          >
            {c.buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Job Post Creator
// ---------------------------------------------------------------------------

function JobPostCreator({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (job: Omit<JobPosting, "id" | "applicantCount" | "daysOpen" | "status" | "createdAt">) => void;
}) {
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("HVAC");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [payRange, setPayRange] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("Full-Time");

  const handleSubmit = () => {
    if (!title.trim() || !description.trim()) return;
    onSubmit({
      title: title.trim(),
      department,
      description: description.trim(),
      requirements: requirements
        .split("\n")
        .map((r) => r.trim())
        .filter(Boolean),
      payRange: payRange.trim() || "Competitive",
      location: location.trim() || "TBD",
      type,
    });
  };

  return (
    <FadeInView>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              New Job Posting
            </CardTitle>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label
                htmlFor="new-job-title"
                className="mb-1.5 block text-xs font-medium text-muted-foreground"
              >
                Job Title *
              </label>
              <input
                id="new-job-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Senior HVAC Technician"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label
                htmlFor="new-job-dept"
                className="mb-1.5 block text-xs font-medium text-muted-foreground"
              >
                Department
              </label>
              <select
                id="new-job-dept"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="HVAC">HVAC</option>
                <option value="Electrical">Electrical</option>
                <option value="Plumbing">Plumbing</option>
                <option value="Admin">Admin</option>
                <option value="Sales">Sales</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="new-job-type"
                className="mb-1.5 block text-xs font-medium text-muted-foreground"
              >
                Employment Type
              </label>
              <select
                id="new-job-type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="Full-Time">Full-Time</option>
                <option value="Part-Time">Part-Time</option>
                <option value="Contract">Contract</option>
                <option value="Seasonal">Seasonal</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label
                htmlFor="new-job-desc"
                className="mb-1.5 block text-xs font-medium text-muted-foreground"
              >
                Description *
              </label>
              <textarea
                id="new-job-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Describe the role, responsibilities, and ideal candidate..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="sm:col-span-2">
              <label
                htmlFor="new-job-reqs"
                className="mb-1.5 block text-xs font-medium text-muted-foreground"
              >
                Requirements (one per line)
              </label>
              <textarea
                id="new-job-reqs"
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                rows={3}
                placeholder={
                  "EPA 608 certification\n3+ years experience\nValid driver's license"
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label
                htmlFor="new-job-pay"
                className="mb-1.5 block text-xs font-medium text-muted-foreground"
              >
                Pay Range
              </label>
              <input
                id="new-job-pay"
                type="text"
                value={payRange}
                onChange={(e) => setPayRange(e.target.value)}
                placeholder="e.g., $55,000 - $75,000/year"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label
                htmlFor="new-job-loc"
                className="mb-1.5 block text-xs font-medium text-muted-foreground"
              >
                Location
              </label>
              <input
                id="new-job-loc"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Dallas, TX"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="flex items-end gap-3 sm:col-span-2">
              <button
                onClick={handleSubmit}
                disabled={!title.trim() || !description.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Create Posting
              </button>
              <button
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </FadeInView>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function RecruitingDashboard() {
  const [applicants, setApplicants] = useState<Applicant[]>(DEMO_APPLICANTS);
  const [jobPostings, setJobPostings] =
    useState<JobPosting[]>(DEMO_JOB_POSTINGS);
  const [activeTab, setActiveTab] = useState<
    "pipeline" | "jobs" | "applicants"
  >("pipeline");
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [quickActionModal, setQuickActionModal] = useState<QuickActionModal>({
    type: null,
    applicant: null,
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Toast helper
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // Computed metrics
  const metrics = useMemo(() => {
    const _activeApplicants = applicants.filter((a) => a.status !== "hired");
    const hiredThisMonth = applicants.filter(
      (a) => a.status === "hired"
    ).length;
    const avgDaysToHire = 18; // Demo value
    const costPerHire = 2450; // Demo value
    const applicantsThisMonth = applicants.length;
    const positionsFilled = hiredThisMonth;

    return {
      timeToHire: avgDaysToHire,
      costPerHire,
      applicantsThisMonth,
      positionsFilled,
      openPositions: jobPostings.filter((j) => j.status === "active").length,
      totalApplicants: applicants.length,
    };
  }, [applicants, jobPostings]);

  // Pipeline counts
  const pipelineCounts = useMemo(() => {
    const counts: Record<PipelineStage, number> = {
      applied: 0,
      screening: 0,
      interview: 0,
      offer: 0,
      hired: 0,
    };
    for (const a of applicants) {
      counts[a.status]++;
    }
    return counts;
  }, [applicants]);

  // Filter applicants
  const filteredApplicants = useMemo(() => {
    let filtered = applicants;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.position.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          a.skills.some((s) => s.toLowerCase().includes(q))
      );
    }
    if (departmentFilter !== "all") {
      filtered = filtered.filter((a) => a.department === departmentFilter);
    }
    return filtered;
  }, [applicants, searchQuery, departmentFilter]);

  // Filter jobs
  const filteredJobs = useMemo(() => {
    let filtered = jobPostings;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.location.toLowerCase().includes(q) ||
          j.department.toLowerCase().includes(q)
      );
    }
    if (departmentFilter !== "all") {
      filtered = filtered.filter((j) => j.department === departmentFilter);
    }
    return filtered;
  }, [jobPostings, searchQuery, departmentFilter]);

  // Drag and drop handlers
  const handleDragStart = useCallback(
    (e: React.DragEvent, applicantId: string) => {
      e.dataTransfer.setData("text/plain", applicantId);
      e.dataTransfer.effectAllowed = "move";
    },
    []
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, newStatus: PipelineStage) => {
      e.preventDefault();
      const applicantId = e.dataTransfer.getData("text/plain");
      setApplicants((prev) =>
        prev.map((a) =>
          a.id === applicantId ? { ...a, status: newStatus } : a
        )
      );
      const applicant = applicants.find((a) => a.id === applicantId);
      if (applicant) {
        showToast(
          `Moved ${applicant.name} to ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`
        );
      }
    },
    [applicants, showToast]
  );

  // Quick action handler
  const handleQuickAction = useCallback(
    (type: "interview" | "offer" | "reject", applicant: Applicant) => {
      setQuickActionModal({ type, applicant });
    },
    []
  );

  const handleQuickActionConfirm = useCallback(
    (
      type: "interview" | "offer" | "reject",
      applicant: Applicant,
      _message: string
    ) => {
      const statusMap: Record<string, PipelineStage> = {
        interview: "interview",
        offer: "offer",
      };

      if (type === "reject") {
        setApplicants((prev) => prev.filter((a) => a.id !== applicant.id));
        showToast(`Rejection sent to ${applicant.name}`);
      } else {
        const newStatus = statusMap[type];
        setApplicants((prev) =>
          prev.map((a) =>
            a.id === applicant.id ? { ...a, status: newStatus } : a
          )
        );
        const label = type === "interview" ? "Interview scheduled" : "Offer sent";
        showToast(`${label} for ${applicant.name}`);
      }
      setQuickActionModal({ type: null, applicant: null });
    },
    [showToast]
  );

  // Create job handler
  const handleCreateJob = useCallback(
    (
      jobData: Omit<
        JobPosting,
        "id" | "applicantCount" | "daysOpen" | "status" | "createdAt"
      >
    ) => {
      const newJob: JobPosting = {
        ...jobData,
        id: `j${jobPostings.length + 1}`,
        applicantCount: 0,
        daysOpen: 0,
        status: "active",
        createdAt: "2026-03-28",
      };
      setJobPostings((prev) => [newJob, ...prev]);
      setShowCreateForm(false);
      showToast(`Created job posting: ${jobData.title}`);
    },
    [jobPostings.length, showToast]
  );

  // Unique departments
  const departments = useMemo(() => {
    const depts = new Set<string>();
    for (const j of jobPostings) depts.add(j.department);
    for (const a of applicants) depts.add(a.department);
    return Array.from(depts).sort();
  }, [jobPostings, applicants]);

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toastMessage}
        </div>
      )}

      {/* Quick Action Modal */}
      <QuickActionModalComponent
        modal={quickActionModal}
        onClose={() => setQuickActionModal({ type: null, applicant: null })}
        onConfirm={handleQuickActionConfirm}
      />

      {/* Header */}
      <FadeInView>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Technician Recruiting
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your hiring pipeline, job postings, and applicants for your
              home service team.
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Create Job Posting
          </button>
        </div>
      </FadeInView>

      {/* Hiring Metrics KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Time to Hire"
          value={metrics.timeToHire}
          suffix=" days"
          icon={Clock}
          iconColor="bg-blue-500/10 text-blue-400"
          change="3 days faster"
          changeType="positive"
          subtext="vs last quarter"
          delay={0}
          tooltipText="Average number of days from job posting to accepted offer"
        />
        <KPICard
          label="Cost per Hire"
          value={metrics.costPerHire}
          prefix="$"
          icon={DollarSign}
          iconColor="bg-emerald-500/10 text-emerald-400"
          change="12% lower"
          changeType="positive"
          subtext="vs last quarter"
          delay={0.05}
          tooltipText="Average total cost to fill a position including advertising and time"
        />
        <KPICard
          label="Applicants This Month"
          value={metrics.applicantsThisMonth}
          icon={Users}
          iconColor="bg-purple-500/10 text-purple-400"
          change="+4 from last month"
          changeType="positive"
          delay={0.1}
          sparklineData={[3, 5, 4, 7, 6, 8, 10]}
          tooltipText="Total new applicants received in the current month"
        />
        <KPICard
          label="Positions Filled"
          value={metrics.positionsFilled}
          icon={UserCheck}
          iconColor="bg-cyan-500/10 text-cyan-400"
          change="On track"
          changeType="positive"
          subtext="this month"
          delay={0.15}
          tooltipText="Number of positions successfully filled this month"
        />
      </div>

      {/* Create Job Form */}
      {showCreateForm && (
        <JobPostCreator
          onClose={() => setShowCreateForm(false)}
          onSubmit={handleCreateJob}
        />
      )}

      {/* Tabs + Search + Filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div
          className="flex gap-1 rounded-lg bg-card p-1 ring-1 ring-foreground/10"
          role="tablist"
          aria-label="Recruiting views"
        >
          {(
            [
              { key: "pipeline", label: "Hiring Pipeline" },
              { key: "jobs", label: "Open Positions" },
              { key: "applicants", label: "All Applicants" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50",
                activeTab === tab.key
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              aria-label="Filter by department"
              className="rounded-lg border border-border bg-background py-2 pl-8 pr-8 text-sm outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="all">All Depts</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              aria-label="Search recruiting"
              className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/50 sm:w-56"
            />
          </div>
        </div>
      </div>

      {/* ============================================================= */}
      {/* PIPELINE TAB - Kanban Board                                    */}
      {/* ============================================================= */}
      {activeTab === "pipeline" && (
        <FadeInView>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {PIPELINE_STAGES.map((stage) => {
              const stageApplicants = filteredApplicants.filter(
                (a) => a.status === stage.key
              );
              return (
                <div
                  key={stage.key}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, stage.key)}
                  className="flex w-72 shrink-0 flex-col rounded-xl border border-border bg-card/50"
                >
                  {/* Column header */}
                  <div className="flex items-center gap-2 border-b border-border p-3">
                    <div
                      className={cn(
                        "h-2.5 w-2.5 rounded-full",
                        stage.color
                      )}
                    />
                    <h3 className="text-sm font-semibold">{stage.label}</h3>
                    <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      {pipelineCounts[stage.key]}
                    </span>
                  </div>

                  {/* Column body */}
                  <div className="flex-1 space-y-2 p-2 min-h-[120px]">
                    {stageApplicants.length === 0 ? (
                      <div className="flex h-20 items-center justify-center rounded-lg border-2 border-dashed border-border/50 text-xs text-muted-foreground/50">
                        Drop here
                      </div>
                    ) : (
                      stageApplicants.map((applicant) => (
                        <ApplicantPipelineCard
                          key={applicant.id}
                          applicant={applicant}
                          onDragStart={handleDragStart}
                          onQuickAction={handleQuickAction}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </FadeInView>
      )}

      {/* ============================================================= */}
      {/* JOBS TAB - Open Positions                                      */}
      {/* ============================================================= */}
      {activeTab === "jobs" && (
        <FadeInView>
          {filteredJobs.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <Briefcase className="h-10 w-10 text-muted-foreground/50 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">
                    {searchQuery || departmentFilter !== "all"
                      ? "No jobs match your filters"
                      : "No job postings yet"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/70">
                    {searchQuery || departmentFilter !== "all"
                      ? "Try adjusting your search or department filter."
                      : "Create your first job posting to start attracting technicians."}
                  </p>
                  {!searchQuery && departmentFilter === "all" && (
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
                    >
                      <Plus className="h-4 w-4" />
                      Create Job Posting
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredJobs.map((job) => (
                <JobPostingCard
                  key={job.id}
                  job={job}
                  isExpanded={expandedJobId === job.id}
                  onToggle={() =>
                    setExpandedJobId(
                      expandedJobId === job.id ? null : job.id
                    )
                  }
                />
              ))}
            </div>
          )}
        </FadeInView>
      )}

      {/* ============================================================= */}
      {/* APPLICANTS TAB - Full Applicant Cards                          */}
      {/* ============================================================= */}
      {activeTab === "applicants" && (
        <FadeInView>
          {filteredApplicants.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <Users className="h-10 w-10 text-muted-foreground/50 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">
                    {searchQuery || departmentFilter !== "all"
                      ? "No applicants match your filters"
                      : "No applicants yet"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/70 max-w-sm">
                    {searchQuery || departmentFilter !== "all"
                      ? "Try adjusting your search or department filter."
                      : "Applicants will appear here once candidates apply."}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredApplicants.map((applicant) => {
                const stageInfo = PIPELINE_STAGES.find(
                  (s) => s.key === applicant.status
                );
                return (
                  <Card
                    key={applicant.id}
                    className="relative overflow-hidden transition-all hover:shadow-md hover:border-primary/20"
                  >
                    {/* Status bar */}
                    <div
                      className={cn(
                        "absolute inset-x-0 top-0 h-1",
                        stageInfo?.color ?? "bg-muted"
                      )}
                    />
                    <CardContent className="pt-5 space-y-3">
                      {/* Header */}
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                          {applicant.avatarInitials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold truncate">
                            {applicant.name}
                          </h3>
                          <p className="text-xs text-primary truncate">
                            {applicant.position}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {applicant.department} &middot;{" "}
                            {applicant.experienceYears} yrs experience
                          </p>
                        </div>
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                            applicant.status === "applied" &&
                              "bg-blue-500/15 text-blue-400",
                            applicant.status === "screening" &&
                              "bg-yellow-500/15 text-yellow-400",
                            applicant.status === "interview" &&
                              "bg-purple-500/15 text-purple-400",
                            applicant.status === "offer" &&
                              "bg-cyan-500/15 text-cyan-400",
                            applicant.status === "hired" &&
                              "bg-emerald-500/15 text-emerald-400"
                          )}
                        >
                          {applicant.status}
                        </span>
                      </div>

                      {/* Skills */}
                      <div className="flex flex-wrap gap-1">
                        {applicant.skills.map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>

                      {/* Contact */}
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p className="flex items-center gap-1.5 truncate">
                          <Mail className="h-3 w-3 shrink-0" />
                          {applicant.email}
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Phone className="h-3 w-3 shrink-0" />
                          {applicant.phone}
                        </p>
                      </div>

                      {/* Notes */}
                      {applicant.notes && (
                        <p className="text-xs text-muted-foreground/80 line-clamp-2 italic">
                          {applicant.notes}
                        </p>
                      )}

                      {/* Applied date */}
                      <p className="text-[11px] text-muted-foreground">
                        Applied {daysAgo(applicant.appliedDate)} days ago
                      </p>

                      {/* Quick Actions */}
                      {applicant.status !== "hired" && (
                        <div className="flex gap-1.5 pt-1 border-t border-border">
                          {applicant.status !== "interview" &&
                            applicant.status !== "offer" && (
                              <button
                                onClick={() =>
                                  handleQuickAction("interview", applicant)
                                }
                                className="flex-1 rounded-md bg-purple-500/10 px-2 py-1.5 text-xs font-medium text-purple-400 hover:bg-purple-500/20 transition-colors"
                              >
                                <Calendar className="inline h-3 w-3 mr-1" />
                                Interview
                              </button>
                            )}
                          {applicant.status !== "offer" && (
                            <button
                              onClick={() =>
                                handleQuickAction("offer", applicant)
                              }
                              className="flex-1 rounded-md bg-cyan-500/10 px-2 py-1.5 text-xs font-medium text-cyan-400 hover:bg-cyan-500/20 transition-colors"
                            >
                              <Send className="inline h-3 w-3 mr-1" />
                              Offer
                            </button>
                          )}
                          <button
                            onClick={() =>
                              handleQuickAction("reject", applicant)
                            }
                            className="flex-1 rounded-md bg-red-500/10 px-2 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors"
                          >
                            <XCircle className="inline h-3 w-3 mr-1" />
                            Reject
                          </button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </FadeInView>
      )}
    </div>
  );
}
