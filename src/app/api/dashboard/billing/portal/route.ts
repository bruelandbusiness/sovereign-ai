import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

const API_URL = process.env.API_URL || "http://localhost:8000";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function POST() {
  const session = await getSession();
  if (!session?.account.client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscription = await prisma.subscription.findUnique({
    where: { clientId: session.account.client.id },
  });

  if (!subscription?.stripeCustId) {
    return NextResponse.json(
      { error: "No Stripe customer found" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(`${API_URL}/api/payments/portal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_id: subscription.stripeCustId,
        return_url: `${APP_URL}/dashboard/billing`,
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to create portal session" },
        { status: 500 }
      );
    }

    const data = await response.json();
    return NextResponse.json({ url: data.url });
  } catch {
    return NextResponse.json(
      { error: "Payment service unavailable" },
      { status: 503 }
    );
  }
}
