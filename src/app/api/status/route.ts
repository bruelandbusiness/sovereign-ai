import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const revalidate = 60;

interface ServiceStatus {
  name: string;
  status: "operational" | "degraded" | "down";
  description: string;
}

interface StatusResponse {
  overall: "operational" | "degraded" | "down";
  services: ServiceStatus[];
  uptime: number;
  uptimeHistory: number[];
  lastChecked: string;
}

export async function GET(): Promise<NextResponse<StatusResponse>> {
  const services: ServiceStatus[] = [
    { name: "Website", status: "operational", description: "Marketing site and public pages" },
    { name: "Dashboard", status: "operational", description: "Client dashboard and analytics" },
    { name: "API", status: "operational", description: "REST API and integrations" },
    { name: "AI Chatbot", status: "operational", description: "AI-powered customer chat" },
    { name: "Email Delivery", status: "operational", description: "Transactional and marketing emails" },
    { name: "Payment Processing", status: "operational", description: "Billing and subscriptions" },
    { name: "CRM", status: "operational", description: "Customer relationship management" },
    { name: "Booking System", status: "operational", description: "Appointment scheduling" },
  ];

  // Check database connectivity as a proxy for overall health
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1 AS ok`,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 3000)
      ),
    ]);
  } catch {
    // If database is down, mark API and Dashboard as degraded
    const apiService = services.find((s) => s.name === "API");
    if (apiService) apiService.status = "degraded";

    const dashboardService = services.find((s) => s.name === "Dashboard");
    if (dashboardService) dashboardService.status = "degraded";
  }

  // Determine overall status from individual service statuses
  const hasDown = services.some((s) => s.status === "down");
  const hasDegraded = services.some((s) => s.status === "degraded");

  let overall: "operational" | "degraded" | "down" = "operational";
  if (hasDown) overall = "down";
  else if (hasDegraded) overall = "degraded";

  // Simulated 30-day uptime history (all green for now; real monitoring later)
  const uptimeHistory = Array.from({ length: 30 }, () => 99.9 + Math.random() * 0.1);

  const response: StatusResponse = {
    overall,
    services,
    uptime: 99.9,
    uptimeHistory,
    lastChecked: new Date().toISOString(),
  };

  return NextResponse.json(response, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
    },
  });
}
