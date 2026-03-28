"use client";
import useSWR from "swr";

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

interface BenchmarkComparison {
  metric: string;
  label: string;
  yourValue: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  percentile: number;
  sampleSize: number;
}

interface PredictiveInsight {
  id: string;
  type: string;
  title: string;
  description: string;
  confidence: number;
  impact: string;
  recommendation: string;
  actionUrl: string | null;
  dismissed: boolean;
}

export function useBenchmarks() {
  const { data, error, isLoading, mutate } = useSWR<{
    benchmarks: BenchmarkComparison[];
    insights: PredictiveInsight[];
  }>("/api/dashboard/benchmarks", fetcher, {
    errorRetryCount: 3,
    errorRetryInterval: 5000,
    revalidateOnFocus: false,
    refreshInterval: 60000, // refresh benchmarks every 60 seconds
    dedupingInterval: 10000,
  });
  return {
    benchmarks: data?.benchmarks || [],
    insights: data?.insights || [],
    isLoading,
    error,
    mutate,
  };
}
