export interface AuditRequest {
  business_name: string;
  city: string;
  state?: string;
  vertical: string;
  email: string;
  phone?: string;
}

export type FindingSeverity = "critical" | "warning" | "good";

export interface Finding {
  severity: FindingSeverity;
  title: string;
  description: string;
  impact: string;
}

export interface AuditResult {
  score: number;
  business_name: string;
  city: string;
  vertical: string;
  findings: Finding[];
  competitor_count: number;
  estimated_leads_lost: number;
  top_competitor: string;
  generated_at: string;
}

export type AuditState = "idle" | "scanning" | "results" | "error";
