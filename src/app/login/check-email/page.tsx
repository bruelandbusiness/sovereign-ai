"use client";

import { useSearchParams } from "next/navigation";
import { Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { SovereignLogo } from "@/components/brand/SovereignLogo";
import { Card, CardContent } from "@/components/ui/card";

export default function CheckEmailPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "your email";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <SovereignLogo variant="mark" size="lg" />
          </div>
          <h1 className="font-display text-2xl font-bold">Check your email</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We sent a sign-in link to
          </p>
          <p className="mt-1 font-medium text-primary">{email}</p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2 text-center">
              <p className="text-sm text-muted-foreground">
                Click the link in the email to sign in. The link expires in 15
                minutes.
              </p>
              <p className="text-xs text-muted-foreground">
                Don&apos;t see it? Check your spam folder.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
