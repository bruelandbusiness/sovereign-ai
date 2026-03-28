import { redirect } from "next/navigation";

/**
 * /dashboard/leads redirects to /dashboard/crm where the full lead
 * pipeline lives. This ensures notification action links and sidebar
 * links that point to /dashboard/leads resolve correctly.
 */
export default function LeadsPage() {
  redirect("/dashboard/crm");
}
