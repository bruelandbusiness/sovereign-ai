"use client";

import { useCallback, useState } from "react";
import { api } from "@/lib/api";
import type { AuditRequest, AuditResult, AuditState } from "@/types/audit";

interface UseAuditReturn {
  state: AuditState;
  result: AuditResult | null;
  error: string | null;
  submitAudit: (data: AuditRequest) => void;
  reset: () => void;
}

export function useAudit(): UseAuditReturn {
  const [state, setState] = useState<AuditState>("idle");
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submitAudit = useCallback(async (data: AuditRequest) => {
    setState("scanning");
    setError(null);

    try {
      const auditResult = await api.audit.run(data);
      setResult(auditResult);
      setState("results");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      setState("error");
    }
  }, []);

  const reset = useCallback(() => {
    setState("idle");
    setResult(null);
    setError(null);
  }, []);

  return { state, result, error, submitAudit, reset };
}
