import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get("sovereign-session")?.value;
  const { pathname } = request.nextUrl;

  // Protect dashboard routes
  if (pathname.startsWith("/dashboard")) {
    if (!sessionToken) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect logged-in users away from login
  if (pathname.startsWith("/login") && sessionToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login/:path*"],
};
