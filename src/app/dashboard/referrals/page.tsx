"use client";

import { ArrowLeft, Gift, Share2, UserPlus, DollarSign, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { ReferralHub } from "@/components/dashboard/ReferralHub";

const HOW_IT_WORKS_STEPS = [
  {
    step: "1",
    icon: Share2,
    title: "Share Your Link",
    desc: "Send your unique referral link to fellow business owners via email, SMS, or social media.",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
  },
  {
    step: "2",
    icon: UserPlus,
    title: "They Sign Up",
    desc: "When they subscribe to any paid plan, the referral is automatically tracked to your account.",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
  },
  {
    step: "3",
    icon: DollarSign,
    title: "You Earn $500",
    desc: "A $500 credit is applied to your account for every successful referral. No limits on earnings.",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
  },
];

export default function ReferralsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <Header variant="minimal" />

      <main className="flex-1 py-8">
        <Container>
          <div className="mb-6 flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <Gift className="h-6 w-6 text-primary" />
            <h1 className="font-display text-2xl font-bold">
              Referral Program
            </h1>
          </div>

          <ReferralHub />

          {/* How it works */}
          <div className="mt-10 rounded-xl border border-border/50 bg-card p-6 sm:p-8">
            <div className="text-center mb-6">
              <h3 className="text-lg font-bold">How It Works</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Three simple steps to start earning referral rewards
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              {HOW_IT_WORKS_STEPS.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={item.step} className="relative text-center">
                    {/* Connector arrow (between cards on desktop) */}
                    {index < HOW_IT_WORKS_STEPS.length - 1 && (
                      <div className="hidden sm:block absolute top-8 -right-3 z-10">
                        <ArrowRight className="h-5 w-5 text-muted-foreground/30" />
                      </div>
                    )}

                    <div
                      className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl ${item.bgColor}`}
                    >
                      <Icon className={`h-7 w-7 ${item.color}`} />
                    </div>

                    <div className="mx-auto mb-2 flex h-6 w-6 items-center justify-center rounded-full gradient-bg text-[10px] font-bold text-white">
                      {item.step}
                    </div>

                    <h4 className="text-sm font-semibold">{item.title}</h4>
                    <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed max-w-[220px] mx-auto">
                      {item.desc}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Fine print */}
            <div className="mt-8 rounded-lg bg-muted/30 px-4 py-3 text-center">
              <p className="text-xs text-muted-foreground">
                Rewards are credited within 30 days of referral conversion.
                Referred businesses must maintain an active subscription for 60
                days. See{" "}
                <Link
                  href="/terms"
                  className="text-primary hover:underline"
                >
                  full terms
                </Link>{" "}
                for details.
              </p>
            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
