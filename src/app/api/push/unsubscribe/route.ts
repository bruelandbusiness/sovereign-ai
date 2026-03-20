import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { unsubscribeFromPush } from "@/lib/push-notifications";
import { z } from "zod";

const unsubscribeSchema = z.object({
  endpoint: z.string().url().max(1000),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = unsubscribeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { endpoint } = parsed.data;

    await unsubscribeFromPush(session.account.id, endpoint);

    return NextResponse.json({ message: "Push subscription removed" });
  } catch (error) {
    console.error("Push unsubscribe error:", error);
    return NextResponse.json(
      { error: "Failed to remove push subscription" },
      { status: 500 }
    );
  }
}
