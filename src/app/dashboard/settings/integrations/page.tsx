import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { IntegrationSetup } from "@/components/dashboard/IntegrationSetup";

export const metadata = {
  title: "Integrations & Connections — Sovereign AI",
  description:
    "Connect Google Ads, Meta Ads, Google Analytics, Twilio, SendGrid, and more to your Sovereign AI dashboard.",
  robots: { index: false, follow: false },
};

export default async function IntegrationsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  return <IntegrationSetup />;
}
