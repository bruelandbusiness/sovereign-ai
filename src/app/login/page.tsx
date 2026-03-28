"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Mail, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { SovereignLogo } from "@/components/brand/SovereignLogo";
import { Card, CardContent } from "@/components/ui/card";

const ERROR_MESSAGES: Record<string, string> = {
  missing_token: "Invalid sign-in link. Please request a new one.",
  invalid_or_expired:
    "This sign-in link has expired or already been used. Please request a new one.",
  too_many_attempts: "Too many attempts. Please try again later.",
  oauth_denied: "Sign in was cancelled. Please try again.",
  oauth_invalid: "Invalid OAuth response. Please try again.",
  oauth_state_mismatch: "Security check failed. Please try again.",
  oauth_not_configured: "Google sign-in is not available at this time.",
  oauth_token_failed: "Failed to complete Google sign-in. Please try again.",
  oauth_profile_failed:
    "Could not retrieve your Google profile. Please try again.",
  oauth_no_email: "No email address found in your Google account.",
  oauth_unverified_email:
    "Your Google email is not verified. Please verify it and try again.",
  oauth_failed: "Google sign-in failed. Please try again.",
};

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();

  const emailError =
    emailTouched && email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? "Please enter a valid email address"
      : "";

  const urlError = searchParams.get("error");
  const redirect = searchParams.get("redirect");

  function handleGoogleSignIn() {
    setIsGoogleLoading(true);
    const params = redirect
      ? `?redirect=${encodeURIComponent(redirect)}`
      : "";
    window.location.href = `/api/auth/google${params}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/send-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      if (!res.ok) {
        setError("Something went wrong. Please try again.");
        return;
      }

      router.push(`/login/check-email?email=${encodeURIComponent(email)}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main id="main-content" className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <SovereignLogo variant="mark" size="lg" />
          </div>
          <h1 className="font-display text-2xl font-bold">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to your client dashboard
          </p>
        </div>

        {urlError && ERROR_MESSAGES[urlError] && (
          <div role="alert" className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {ERROR_MESSAGES[urlError]}
          </div>
        )}

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Google OAuth */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-background py-3 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {isGoogleLoading ? (
                  "Redirecting..."
                ) : (
                  <>
                    <GoogleIcon className="h-5 w-5" />
                    Sign in with Google
                  </>
                )}
              </button>

              {/* Separator */}
              <div className="relative flex items-center">
                <div className="flex-1 border-t border-border" />
                <span className="px-3 text-xs text-muted-foreground">
                  Or continue with email
                </span>
                <div className="flex-1 border-t border-border" />
              </div>

              {/* Magic link form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => setEmailTouched(true)}
                      placeholder="you@yourbusiness.com"
                      required
                      autoComplete="email"
                      aria-invalid={!!(emailError || error)}
                      aria-describedby={
                        emailError
                          ? "login-email-error"
                          : error
                            ? "login-submit-error"
                            : undefined
                      }
                      className={`w-full rounded-lg border bg-background py-3 pl-10 pr-4 text-base sm:text-sm min-h-[44px] transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                        emailError ? "border-red-500" : "border-border"
                      }`}
                    />
                  </div>
                  {emailError && (
                    <p id="login-email-error" className="mt-1 text-xs text-red-400">
                      {emailError}
                    </p>
                  )}
                </div>

                {error && (
                  <p id="login-submit-error" className="text-sm text-red-400" role="alert">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !email || !!emailError}
                  aria-busy={isLoading}
                  className="btn-shine flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold text-white gradient-bg transition-opacity hover:opacity-90 disabled:opacity-50 min-h-[44px]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Access My Dashboard
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          We&apos;ll send a secure link to your email.
          <br />
          No password needed — ever.
        </p>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <a href="/signup" className="font-semibold text-primary hover:underline">
            Start your free trial &rarr;
          </a>
        </p>
      </div>
    </main>
  );
}
