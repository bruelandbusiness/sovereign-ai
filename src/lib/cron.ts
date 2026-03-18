import { NextResponse } from "next/server";

/**
 * Verify that a cron request is legitimate.
 * In production (Vercel), cron jobs include an Authorization header with CRON_SECRET.
 * In development, we allow requests without the secret.
 */
export function verifyCronSecret(request: Request): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET;

  // In development without CRON_SECRET configured, allow all requests
  if (!cronSecret) {
    return null;
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  return null;
}
