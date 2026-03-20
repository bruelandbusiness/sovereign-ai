"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Applicant {
  id: string;
  jobId: string;
  jobTitle?: string;
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

interface ApplicantCardProps {
  applicant: Applicant;
  showJobTitle?: boolean;
  onStatusChange: (newStatus: string) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const statusOptions = [
  { value: "new", label: "New" },
  { value: "screening", label: "Screening" },
  { value: "interview", label: "Interview" },
  { value: "offer", label: "Offer" },
  { value: "hired", label: "Hired" },
  { value: "rejected", label: "Rejected" },
];

const statusColors: Record<string, string> = {
  new: "text-blue-400",
  screening: "text-yellow-400",
  interview: "text-purple-400",
  offer: "text-cyan-400",
  hired: "text-emerald-400",
  rejected: "text-red-400",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getScoreColor(score: number): string {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 40) return "bg-yellow-500";
  return "bg-red-500";
}

function getScoreTextColor(score: number): string {
  if (score >= 70) return "text-emerald-400";
  if (score >= 40) return "text-yellow-400";
  return "text-red-400";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ApplicantCard({
  applicant,
  showJobTitle = false,
  onStatusChange,
}: ApplicantCardProps) {
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    setIsChangingStatus(true);
    try {
      await onStatusChange(newStatus);
    } finally {
      setIsChangingStatus(false);
    }
  };

  const score = applicant.aiScore ?? 0;

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="space-y-3">
        {/* Name + Contact */}
        <div>
          <h3 className="font-semibold truncate">{applicant.name}</h3>
          {showJobTitle && applicant.jobTitle && (
            <p className="text-xs text-primary truncate">
              {applicant.jobTitle}
            </p>
          )}
          <p className="mt-0.5 text-xs text-muted-foreground truncate">
            {applicant.email}
          </p>
          {applicant.phone && (
            <p className="text-xs text-muted-foreground">{applicant.phone}</p>
          )}
        </div>

        {/* AI Score Bar */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              AI Score
            </span>
            <span
              className={cn(
                "text-sm font-bold",
                getScoreTextColor(score)
              )}
            >
              {score}
            </span>
          </div>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={score}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`AI score: ${score} out of 100`}
          >
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                getScoreColor(score)
              )}
              style={{ width: `${Math.min(score, 100)}%` }}
            />
          </div>
        </div>

        {/* AI Summary */}
        {applicant.aiSummary && (
          <p className="text-xs leading-relaxed text-muted-foreground line-clamp-3">
            {applicant.aiSummary}
          </p>
        )}

        {/* Certifications */}
        {applicant.certifications.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {applicant.certifications.map((cert) => (
              <span
                key={cert}
                className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
              >
                {cert}
              </span>
            ))}
          </div>
        )}

        {/* Experience */}
        {applicant.experience && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            <span className="font-medium text-foreground/70">Exp:</span>{" "}
            {applicant.experience}
          </p>
        )}

        {/* Status Dropdown */}
        <div className="flex items-center gap-2 pt-1">
          <label
            htmlFor={`status-${applicant.id}`}
            className={cn(
              "text-xs font-medium",
              statusColors[applicant.status] ?? "text-muted-foreground"
            )}
          >
            Status:
          </label>
          <select
            id={`status-${applicant.id}`}
            value={applicant.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={isChangingStatus}
            aria-label={`Status for ${applicant.name}`}
            className={cn(
              "rounded-md border border-border bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50",
              statusColors[applicant.status] ?? "text-muted-foreground"
            )}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </CardContent>
    </Card>
  );
}
