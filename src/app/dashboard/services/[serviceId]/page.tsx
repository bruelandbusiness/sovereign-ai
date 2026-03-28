import { notFound } from "next/navigation";
import { getServiceById } from "@/lib/constants";
import { ServiceDashboardShell } from "@/components/dashboard/services/ServiceDashboardShell";

/**
 * Add-on / marketplace service IDs that have dedicated dashboards but are not
 * part of the core SERVICES constant.  Without this list the page would return
 * 404 for any service not found by getServiceById().
 */
const ADDON_SERVICE_IDS = new Set([
  "aeo",
  "gbp",
  "referral-program",
  "estimate",
  "ai-estimate",
  "fsm",
  "fsm-sync",
  "customer-ltv",
  "ai-receptionist",
]);

export default async function ServicePage({
  params,
}: {
  params: Promise<{ serviceId: string }>;
}) {
  const { serviceId } = await params;

  const service = getServiceById(serviceId);
  if (!service && !ADDON_SERVICE_IDS.has(serviceId)) {
    notFound();
  }

  return <ServiceDashboardShell serviceId={serviceId} />;
}
