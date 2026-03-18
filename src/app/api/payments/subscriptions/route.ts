import { NextResponse } from "next/server";

const API_URL = process.env.API_URL || "http://localhost:8000";

export async function GET() {
  try {
    const response = await fetch(`${API_URL}/api/payments/subscriptions`);
    if (!response.ok) {
      return NextResponse.json({ detail: "Failed to fetch subscriptions" }, { status: response.status });
    }
    return NextResponse.json(await response.json());
  } catch {
    return NextResponse.json({ detail: "Could not connect to payment service" }, { status: 502 });
  }
}
