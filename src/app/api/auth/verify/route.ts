import { NextRequest, NextResponse } from "next/server";
import { verifyMagicLink, setSessionCookie } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(
      new URL("/login?error=missing_token", request.url)
    );
  }

  const result = await verifyMagicLink(token);

  if (!result) {
    return NextResponse.redirect(
      new URL("/login?error=invalid_or_expired", request.url)
    );
  }

  await setSessionCookie(result.session.token);

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
