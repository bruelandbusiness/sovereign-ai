import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: session.account.id,
      email: session.account.email,
      name: session.account.name,
      client: session.account.client
        ? {
            id: session.account.client.id,
            businessName: session.account.client.businessName,
            ownerName: session.account.client.ownerName,
            vertical: session.account.client.vertical,
            city: session.account.client.city,
            state: session.account.client.state,
          }
        : null,
    },
  });
}
