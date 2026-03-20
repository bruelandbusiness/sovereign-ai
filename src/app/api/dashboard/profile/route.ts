import { NextResponse } from "next/server";
import { requireClient, AuthError } from "@/lib/require-client";

export async function GET() {
  try {
    const { session } = await requireClient();

    const client = session.account.client!;
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
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    console.error("[profile] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
