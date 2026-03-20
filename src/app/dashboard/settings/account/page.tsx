import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AccountSettings from "@/components/dashboard/settings/AccountSettings";

export const metadata = { title: "Account Settings — Sovereign AI" };

export default async function AccountSettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  return <AccountSettings />;
}
