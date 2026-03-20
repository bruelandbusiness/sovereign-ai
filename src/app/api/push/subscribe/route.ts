import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { subscribeToPush } from "@/lib/push-notifications";
import { z } from "zod";

const subscribeSchema = z.object({
  endpoint: z.string().url().max(1000),
  keys: z.object({
    p256dh: z.string().min(1).max(500),
    auth: z.string().min(1).max(500),
  }),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = subscribeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { endpoint, keys } = parsed.data;

    const subscription = await subscribeToPush(session.account.id, {
      endpoint,
      keys: { p256dh: keys.p256dh, auth: keys.auth },
    });

    return NextResponse.json({
      id: subscription.id,
      message: "Push subscription saved",
    });
  } catch (error) {
    console.error("Push subscribe error:", error);
    return NextResponse.json(
      { error: "Failed to save push subscription" },
      { status: 500 }
    );
  }
}
