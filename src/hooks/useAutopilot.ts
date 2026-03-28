"use client";
import useSWR from "swr";

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

interface AgentExecution {
  id: string;
  agentType: string;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  totalTokens: number;
  triggeredBy: string | null;
  createdAt: string;
  stepCount: number;
  completedSteps: number;
}

interface ApprovalRequest {
  id: string;
  actionType: string;
  description: string;
  status: string;
  expiresAt: string;
  createdAt: string;
}

const swrConfig = {
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  revalidateOnFocus: false,
  refreshInterval: 30000, // refresh autopilot data every 30 seconds
  dedupingInterval: 10000,
};

export function useAutopilot() {
  const {
    data: executions,
    error: execError,
    isLoading: execLoading,
    mutate: mutateExec,
  } = useSWR<AgentExecution[]>("/api/dashboard/autopilot", fetcher, swrConfig);
  const {
    data: approvals,
    error: appError,
    isLoading: appLoading,
    mutate: mutateApprovals,
  } = useSWR<ApprovalRequest[]>(
    "/api/dashboard/autopilot/approvals",
    fetcher,
    swrConfig,
  );

  return {
    executions: executions || [],
    approvals: approvals || [],
    isLoading: execLoading || appLoading,
    error: execError || appError,
    refresh: () => {
      mutateExec();
      mutateApprovals();
    },
  };
}
