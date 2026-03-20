"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import {
  Briefcase,
  Users,
  UserCheck,
  Star,
  Plus,
  Search,
  ChevronDown,
  MapPin,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "@/components/dashboard/KPICard";
import { ApplicantCard } from "@/components/dashboard/ApplicantCard";
import { FadeInView } from "@/components/shared/FadeInView";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast-context";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface JobPosting {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  compensation: string | null;
  location: string | null;
  type: string;
  status: string;
  applicantCount: number;
  viewCount: number;
  createdAt: string;
}

interface Applicant {
  id: string;
  jobId: string;
  jobTitle: string;
  name: string;
  email: string;
  phone: string | null;
  experience: string | null;
  certifications: string[];
  aiScore: number | null;
  aiSummary: string | null;
  status: string;
  coverLetter: string | null;
  notes: string | null;
  createdAt: string;
}

interface RecruitingData {
  kpis: {
    openPositions: number;
    totalApplicants: number;
    avgAiScore: number;
    hiredThisMonth: number;
  };
  jobPostings: JobPosting[];
  applicants: Applicant[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to load data");
    return res.json();
  });

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-400",
  paused: "bg-yellow-500/15 text-yellow-400",
  closed: "bg-zinc-500/15 text-zinc-400",
  filled: "bg-blue-500/15 text-blue-400",
};

const typeLabels: Record<string, string> = {
  full_time: "Full-Time",
  part_time: "Part-Time",
  contract: "Contract",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RecruitingDashboard() {
  const { toast } = useToast();
  const { data, error, isLoading, mutate } = useSWR<RecruitingData>(
    "/api/dashboard/recruiting",
    fetcher,
    { refreshInterval: 60000, dedupingInterval: 10000, revalidateOnFocus: false }
  );

  const [activeTab, setActiveTab] = useState<"jobs" | "applicants">("jobs");
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [creating, setCreating] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formRequirements, setFormRequirements] = useState("");
  const [formCompensation, setFormCompensation] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formType, setFormType] = useState("full_time");

  const handleCreateJob = useCallback(async () => {
    if (!formTitle.trim() || !formDescription.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/dashboard/recruiting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle.trim(),
          description: formDescription.trim(),
          requirements: formRequirements
            .split("\n")
            .map((r) => r.trim())
            .filter(Boolean),
          compensation: formCompensation.trim() || null,
          location: formLocation.trim() || null,
          type: formType,
        }),
      });
      if (!res.ok) {
        toast("We couldn't create the job posting. Please check your details and try again.", "error");
        return;
      }
      setShowCreateForm(false);
      setFormTitle("");
      setFormDescription("");
      setFormRequirements("");
      setFormCompensation("");
      setFormLocation("");
      setFormType("full_time");
      await mutate();
      toast("Job posting created", "success");
    } catch {
      toast("Connection issue while creating the job posting. Please try again.", "error");
    } finally {
      setCreating(false);
    }
  }, [
    formTitle,
    formDescription,
    formRequirements,
    formCompensation,
    formLocation,
    formType,
    mutate,
    toast,
  ]);

  const handleApplicantStatusChange = useCallback(
    async (applicantId: string, jobId: string, newStatus: string) => {
      try {
        const res = await fetch(`/api/dashboard/recruiting/${jobId}/applicants`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ applicantId, status: newStatus }),
        });
        if (!res.ok) throw new Error("Failed to load data");
        mutate();
      } catch {
        toast("We couldn't update the applicant status. Please try again.", "error");
      }
    },
    [mutate, toast]
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-xl bg-card ring-1 ring-foreground/10"
            />
          ))}
        </div>
        <div className="h-96 animate-pulse rounded-xl bg-card ring-1 ring-foreground/10" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <p className="text-red-400">
            Failed to load recruiting data. Please try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  const kpis = data?.kpis ?? {
    openPositions: 0,
    totalApplicants: 0,
    avgAiScore: 0,
    hiredThisMonth: 0,
  };
  const jobs = data?.jobPostings ?? [];
  const allApplicants = data?.applicants ?? [];

  // Filter
  const filteredJobs = searchQuery
    ? jobs.filter(
        (j) =>
          j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (j.location ?? "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : jobs;

  const filteredApplicants = searchQuery
    ? allApplicants.filter(
        (a) =>
          a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (a.jobTitle ?? "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allApplicants;

  // Get applicants for expanded job
  const jobApplicants = expandedJobId
    ? allApplicants.filter((a) => a.jobId === expandedJobId)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <FadeInView>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Technician Recruiting
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage job postings, review applicants, and hire top technicians
              with AI scoring.
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

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Open Positions"
          value={kpis.openPositions}
          icon={Briefcase}
          iconColor="bg-blue-500/10 text-blue-400"
          delay={0}
        />
        <KPICard
          label="Total Applicants"
          value={kpis.totalApplicants}
          icon={Users}
          iconColor="bg-purple-500/10 text-purple-400"
          delay={0.05}
        />
        <KPICard
          label="Avg AI Score"
          value={kpis.avgAiScore}
          icon={Star}
          iconColor="bg-yellow-500/10 text-yellow-400"
          delay={0.1}
        />
        <KPICard
          label="Hired This Month"
          value={kpis.hiredThisMonth}
          icon={UserCheck}
          iconColor="bg-emerald-500/10 text-emerald-400"
          delay={0.15}
        />
      </div>

      {/* Create Job Form */}
      {showCreateForm && (
        <FadeInView>
          <Card>
            <CardHeader>
              <CardTitle>New Job Posting</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="recruit-title" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Job Title *
                  </label>
                  <input
                    id="recruit-title"
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g., Senior HVAC Technician"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="recruit-desc" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Description *
                  </label>
                  <textarea
                    id="recruit-desc"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    rows={3}
                    placeholder="Describe the role, responsibilities, and ideal candidate..."
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="recruit-reqs" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Requirements (one per line)
                  </label>
                  <textarea
                    id="recruit-reqs"
                    value={formRequirements}
                    onChange={(e) => setFormRequirements(e.target.value)}
                    rows={3}
                    placeholder={"EPA 608 certification\n3+ years experience\nValid driver's license"}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label htmlFor="recruit-comp" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Compensation
                  </label>
                  <input
                    id="recruit-comp"
                    type="text"
                    value={formCompensation}
                    onChange={(e) => setFormCompensation(e.target.value)}
                    placeholder="e.g., $55,000 - $75,000/year"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label htmlFor="recruit-loc" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Location
                  </label>
                  <input
                    id="recruit-loc"
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="e.g., Dallas, TX"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label htmlFor="recruit-type" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Type
                  </label>
                  <select
                    id="recruit-type"
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="full_time">Full-Time</option>
                    <option value="part_time">Part-Time</option>
                    <option value="contract">Contract</option>
                  </select>
                </div>
                <div className="flex items-end gap-3 sm:col-span-2">
                  <button
                    onClick={handleCreateJob}
                    disabled={creating || !formTitle.trim() || !formDescription.trim()}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                  >
                    {creating ? "Creating..." : "Create Posting"}
                  </button>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="rounded-lg px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeInView>
      )}

      {/* Tabs + Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-lg bg-card p-1 ring-1 ring-foreground/10" role="tablist" aria-label="Recruiting views">
          <button
            role="tab"
            aria-selected={activeTab === "jobs"}
            onClick={() => setActiveTab("jobs")}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50",
              activeTab === "jobs"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Job Postings
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "applicants"}
            onClick={() => setActiveTab("applicants")}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50",
              activeTab === "applicants"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            All Applicants
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === "jobs"
                ? "Search jobs..."
                : "Search applicants..."
            }
            aria-label={activeTab === "jobs" ? "Search job postings" : "Search applicants"}
            className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/50 sm:w-64"
          />
        </div>
      </div>

      {/* Job Postings Tab */}
      {activeTab === "jobs" && (
        <FadeInView>
          <Card>
            <CardContent className="p-0">
              {filteredJobs.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  {searchQuery
                    ? "No jobs match your search. Try adjusting your search terms."
                    : "No job postings yet. Click \"Create Job Posting\" above to start hiring."}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredJobs.map((job) => (
                    <div key={job.id}>
                      <button
                        onClick={() =>
                          setExpandedJobId(
                            expandedJobId === job.id ? null : job.id
                          )
                        }
                        className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-muted/30"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">
                              {job.title}
                            </span>
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
                            {job.location && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {job.location}
                              </span>
                            )}
                            <span>{typeLabels[job.type] ?? job.type}</span>
                            <span>
                              {job.applicantCount} applicant
                              {job.applicantCount !== 1 ? "s" : ""}
                            </span>
                            <span>{formatDate(job.createdAt)}</span>
                          </div>
                        </div>
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                            expandedJobId === job.id && "rotate-180"
                          )}
                        />
                      </button>

                      {/* Expanded applicants */}
                      {expandedJobId === job.id && (
                        <div className="border-t border-border bg-muted/10 p-4">
                          {jobApplicants.length === 0 ? (
                            <p className="text-center text-sm text-muted-foreground">
                              No applicants yet for this position. Share the job posting to start receiving applications.
                            </p>
                          ) : (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                              {jobApplicants
                                .sort(
                                  (a, b) =>
                                    (b.aiScore ?? 0) - (a.aiScore ?? 0)
                                )
                                .map((applicant) => (
                                  <ApplicantCard
                                    key={applicant.id}
                                    applicant={applicant}
                                    onStatusChange={(newStatus) =>
                                      handleApplicantStatusChange(
                                        applicant.id,
                                        applicant.jobId,
                                        newStatus
                                      )
                                    }
                                  />
                                ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </FadeInView>
      )}

      {/* Applicants Tab */}
      {activeTab === "applicants" && (
        <FadeInView>
          {filteredApplicants.length === 0 ? (
            <Card>
              <CardContent>
                <p className="text-center text-sm text-muted-foreground">
                  {searchQuery
                    ? "No applicants match your search. Try adjusting your search terms."
                    : "No applicants yet. Applicants will appear here once you publish a job posting."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredApplicants
                .sort((a, b) => (b.aiScore ?? 0) - (a.aiScore ?? 0))
                .map((applicant) => (
                  <ApplicantCard
                    key={applicant.id}
                    applicant={applicant}
                    showJobTitle
                    onStatusChange={(newStatus) =>
                      handleApplicantStatusChange(
                        applicant.id,
                        applicant.jobId,
                        newStatus
                      )
                    }
                  />
                ))}
            </div>
          )}
        </FadeInView>
      )}
    </div>
  );
}
