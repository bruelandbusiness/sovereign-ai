import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session?.account.client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = session.account.client;
  const initials = client.businessName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return NextResponse.json({
    businessName: client.businessName,
    ownerName: client.ownerName,
    initials,
    city: client.city && client.state ? `${client.city}, ${client.state}` : "",
    vertical: client.vertical || "",
    plan: "", // will be filled from subscription
  });
}
