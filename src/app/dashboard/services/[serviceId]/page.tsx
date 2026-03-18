import { notFound } from "next/navigation";
import { getServiceById } from "@/lib/constants";
import { ServiceDashboardShell } from "@/components/dashboard/services/ServiceDashboardShell";

export default async function ServicePage({
  params,
}: {
  params: Promise<{ serviceId: string }>;
}) {
  const { serviceId } = await params;

  const service = getServiceById(serviceId);
  if (!service) {
    notFound();
  }

  return <ServiceDashboardShell serviceId={serviceId} />;
}
