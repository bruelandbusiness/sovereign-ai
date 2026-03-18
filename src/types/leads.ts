export interface Lead {
  business_name: string;
  email: string;
  phone: string | null;
  city: string;
  vertical: string;
  score: number;
  findings_count: number;
  critical_count: number;
  captured_at: string;
  status: "new" | "contacted" | "qualified" | "closed";
}

export interface LeadStats {
  total: number;
  today: number;
  critical_issues: number;
  avg_score: number;
  by_vertical?: Record<string, number>;
}
