import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AccountSettings from "@/components/dashboard/settings/AccountSettings";

export const metadata: Metadata = {
  title: "Account Settings",
  description:
    "Manage your Sovereign AI account settings, profile, notifications, and preferences.",
  openGraph: {
    title: "Account Settings — Sovereign AI",
    description:
      "Manage your Sovereign AI account settings, profile, notifications, and preferences.",
  },
  robots: { index: false, follow: false },
};

export default async function AccountSettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  return <AccountSettings />;
}
