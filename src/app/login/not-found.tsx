import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { LogIn, Home } from "lucide-react";

export default function LoginNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0f]">
      <Container>
        <div
          className="mx-auto max-w-md text-center"
          role="main"
          aria-labelledby="login-not-found-heading"
        >
          <p
            className="text-7xl font-extrabold leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-600 select-none"
            aria-hidden="true"
          >
            404
          </p>

          <h1
            id="login-not-found-heading"
            className="mt-4 text-xl font-semibold text-white"
          >
            Page not found
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The login page you are looking for does not exist. Please use the
            link below to sign in.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-background transition-all hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            >
              <LogIn className="h-4 w-4" />
              Go to Login
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-foreground/80 transition-all hover:border-border hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <Home className="h-4 w-4" />
              Go Home
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
