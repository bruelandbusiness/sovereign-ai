"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Mail, ArrowRight, AlertCircle } from "lucide-react";
import { SovereignLogo } from "@/components/brand/SovereignLogo";
import { Card, CardContent } from "@/components/ui/card";

const ERROR_MESSAGES: Record<string, string> = {
  missing_token: "Invalid sign-in link. Please request a new one.",
  invalid_or_expired:
    "This sign-in link has expired or already been used. Please request a new one.",
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlError = searchParams.get("error");

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
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
          <div className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {ERROR_MESSAGES[urlError]}
          </div>
        )}

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@yourbusiness.com"
                    required
                    className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}

              <button
                type="submit"
                disabled={isLoading || !email}
                className="btn-shine flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white gradient-bg transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isLoading ? (
                  "Sending..."
                ) : (
                  <>
                    Send Sign-In Link
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          We&apos;ll send a secure link to your email.
          <br />
          No password needed — ever.
        </p>
      </div>
    </div>
  );
}
