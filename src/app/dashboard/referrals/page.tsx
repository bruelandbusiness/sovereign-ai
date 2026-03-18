"use client";

import { useState } from "react";
import useSWR from "swr";
import { Gift, Copy, Check, Users, DollarSign, ArrowRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GradientButton } from "@/components/shared/GradientButton";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface ReferralData {
  referrals: {
    id: string;
    code: string;
    status: string;
    creditCents: number;
    referredBusiness: string | null;
    createdAt: string;
  }[];
  totalCredits: number;
  totalReferred: number;
}

export default function ReferralsPage() {
  const { data, mutate } = useSWR<ReferralData>("/api/dashboard/referrals", fetcher);
  const [copied, setCopied] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const copyLink = (code: string) => {
    navigator.clipboard.writeText(`${baseUrl}/onboarding?ref=${code}`);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const generateCode = async () => {
    setGenerating(true);
    await fetch("/api/dashboard/referrals", { method: "POST" });
    await mutate();
    setGenerating(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <Header variant="minimal" />

      <main className="flex-1 py-8">
        <Container size="md">
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <Gift className="h-6 w-6 text-primary" />
              <h1 className="font-display text-2xl font-bold">Referral Program</h1>
            </div>
            <p className="mt-2 text-muted-foreground">
              Earn $500 credit for every business you refer to Sovereign AI.
            </p>
          </div>

          {/* Stats */}
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{data?.totalReferred ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Businesses Referred</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-accent" />
                  <div>
                    <p className="text-2xl font-bold">
                      ${((data?.totalCredits ?? 0) / 100).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Credits Earned</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 flex items-center justify-center">
                <GradientButton onClick={generateCode} disabled={generating}>
                  {generating ? "Generating..." : "Generate New Link"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </GradientButton>
              </CardContent>
            </Card>
          </div>

          {/* Referral Codes */}
          <h2 className="mb-4 text-lg font-semibold">Your Referral Links</h2>
          {!data?.referrals?.length ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Gift className="mx-auto mb-3 h-10 w-10 opacity-30" />
                <p>No referral codes yet. Generate your first link above!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {data.referrals.map((ref) => (
                <Card key={ref.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <code className="rounded bg-muted px-2 py-0.5 text-sm font-mono">
                          {ref.code}
                        </code>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            ref.status === "credited"
                              ? "bg-accent/10 text-accent"
                              : ref.status === "active"
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {ref.status}
                        </span>
                      </div>
                      {ref.referredBusiness && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          Referred: {ref.referredBusiness}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyLink(ref.code)}
                    >
                      {copied === ref.code ? (
                        <Check className="h-4 w-4 text-accent" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* How it works */}
          <div className="mt-10 rounded-xl border border-border/50 bg-card p-6">
            <h3 className="font-semibold">How It Works</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {[
                { step: "1", title: "Share Your Link", desc: "Send your unique referral link to a fellow business owner" },
                { step: "2", title: "They Sign Up", desc: "When they subscribe to any plan, the referral is tracked" },
                { step: "3", title: "Earn $500", desc: "$500 credit is applied to your next billing cycle" },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full gradient-bg text-sm font-bold text-white">
                    {item.step}
                  </div>
                  <h4 className="text-sm font-semibold">{item.title}</h4>
                  <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
