"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import {
  DollarSign,
  Users,
  TrendingUp,
  CheckCircle2,
  Award,
  Zap,
  Shield,
  ChevronDown,
  Star,
  Calculator,
} from "lucide-react";

const COMMISSION_TIERS = [
  {
    name: "Silver",
    rate: 25,
    requirement: "0-4 active referrals",
    color: "text-gray-300",
    bgColor: "bg-gray-500/10",
    borderColor: "border-gray-500/20",
  },
  {
    name: "Gold",
    rate: 30,
    requirement: "5-14 active referrals",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/20",
  },
  {
    name: "Platinum",
    rate: 35,
    requirement: "15+ active referrals",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
  },
] as const;

const AFFILIATE_TESTIMONIALS = [
  {
    name: "Derek Morales",
    role: "Marketing Consultant",
    location: "Austin, TX",
    quote:
      "I recommended Sovereign AI to three HVAC clients last quarter. Two signed up for Growth, one for Empire. I now earn over $6,200/mo in recurring commissions from those three referrals alone.",
    earnings: "$6,200/mo recurring",
    referrals: 3,
  },
  {
    name: "Priya Anand",
    role: "Business Coach",
    location: "Denver, CO",
    quote:
      "My coaching clients kept asking me about marketing tools. Once I started recommending Sovereign AI, the affiliate income became my second largest revenue stream. It took eight months to build to 12 referrals.",
    earnings: "$28,400/mo recurring",
    referrals: 12,
  },
  {
    name: "Carlos Vega",
    role: "Industry YouTuber",
    location: "Miami, FL",
    quote:
      "I made one video about Sovereign AI for my trades channel. That single video has driven 9 signups over six months. At Platinum tier now, earning 35% on every one of them.",
    earnings: "$22,100/mo recurring",
    referrals: 9,
  },
] as const;

const FAQ_ITEMS = [
  {
    q: "How and when do I get paid?",
    a: "Commissions are calculated on the last day of each month and paid via Stripe on the 1st. You can connect your bank account or receive payouts to your Stripe balance. Minimum payout threshold is $100.",
  },
  {
    q: "How long does the cookie last?",
    a: "Our referral tracking cookie lasts 90 days. If someone clicks your link and signs up within 90 days, you earn the commission -- even if they don't sign up on the first visit.",
  },
  {
    q: "What counts as an 'active referral' for tier progression?",
    a: "Any referred client with an active, paying subscription counts toward your tier. If a client churns, they no longer count toward your active total, but you keep all commissions earned while they were active.",
  },
  {
    q: "Can I refer myself or my own business?",
    a: "No. Self-referrals are not eligible for commissions. The program is designed for referring other businesses to Sovereign AI.",
  },
  {
    q: "Is there a cost to join?",
    a: "The affiliate program is completely free. There are no fees, no minimums, and no obligations. You earn commissions purely by referring paying clients.",
  },
  {
    q: "Do you provide marketing materials?",
    a: "Yes. Once approved, you'll get access to branded banners, email templates, case study one-pagers, and social media copy in your affiliate dashboard. We also provide a co-branded landing page option for Platinum partners.",
  },
] as const;

/** Average monthly price across bundles, used for the earnings calculator. */
const AVG_MONTHLY_PRICE = 6997;

function getCommissionRate(referrals: number): number {
  if (referrals >= 15) return 35;
  if (referrals >= 5) return 30;
  return 25;
}

export function AffiliateSignup() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    website: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    referralCode?: string;
    error?: string;
  } | null>(null);
  const [calcReferrals, setCalcReferrals] = useState(10);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const commissionRate = getCommissionRate(calcReferrals);
  const monthlyEarnings = Math.round(
    calcReferrals * AVG_MONTHLY_PRICE * (commissionRate / 100),
  );
  const annualEarnings = monthlyEarnings * 12;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setResult(null);

    try {
      const res = await fetch("/api/affiliates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (res.ok) {
        setResult({
          success: true,
          referralCode: data.affiliate.referralCode,
        });
      } else {
        setResult({ success: false, error: data.error });
      }
    } catch {
      setResult({
        success: false,
        error: "Network error. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#0a0a0f] pt-32 pb-20">
        <Container>
          <div className="mx-auto max-w-5xl">
            {/* Hero */}
            <div className="mb-16 text-center">
              <div className="mx-auto mb-4 inline-flex items-center rounded-full bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-400">
                <DollarSign className="mr-1.5 h-4 w-4" />
                Up to 35% Recurring Lifetime Commissions
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Turn Referrals Into
                <br />
                <span className="bg-gradient-to-r from-[#4c85ff] to-[#22d3a1] bg-clip-text text-transparent">
                  Recurring Revenue
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
                Refer home service businesses to Sovereign AI and earn up to 35%
                of every monthly payment -- for the lifetime of the client. No
                caps, no expiration, no fine print.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-emerald-400" />
                  90-day cookie
                </span>
                <span className="flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-emerald-400" />
                  Real-time tracking
                </span>
                <span className="flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-emerald-400" />
                  Monthly Stripe payouts
                </span>
              </div>
            </div>

            {/* Value Props */}
            <div className="mb-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
              <ValueCard
                icon={<DollarSign className="h-6 w-6 text-emerald-400" />}
                title="Up to 35% Recurring"
                description="Start at 25% and unlock higher rates as you grow. Growth bundle referral at Platinum = $2,449/mo to you."
              />
              <ValueCard
                icon={<TrendingUp className="h-6 w-6 text-blue-400" />}
                title="Lifetime Duration"
                description="Commissions continue as long as the client stays. Average client lifetime is 18+ months."
              />
              <ValueCard
                icon={<Users className="h-6 w-6 text-purple-400" />}
                title="Real-Time Dashboard"
                description="Track every click, signup, and conversion. See your commissions accrue and manage payouts from one dashboard."
              />
            </div>

            {/* Commission Tiers */}
            <div className="mb-16">
              <h2 className="mb-2 text-center text-2xl font-bold text-white">
                Commission Tiers
              </h2>
              <p className="mb-8 text-center text-muted-foreground">
                The more clients you refer, the higher your rate on{" "}
                <span className="text-white">all</span> referrals.
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {COMMISSION_TIERS.map((tier) => (
                  <div
                    key={tier.name}
                    className={`relative rounded-xl border ${tier.borderColor} ${tier.bgColor} p-6 text-center`}
                  >
                    {tier.name === "Gold" && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-yellow-500 px-3 py-0.5 text-xs font-bold text-black">
                        Most Common
                      </div>
                    )}
                    <Award className={`mx-auto mb-3 h-8 w-8 ${tier.color}`} />
                    <h3 className={`text-lg font-bold ${tier.color}`}>
                      {tier.name}
                    </h3>
                    <div className="mt-2 text-4xl font-bold text-white">
                      {tier.rate}%
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      recurring commission
                    </p>
                    <p className="mt-3 text-sm text-muted-foreground">
                      {tier.requirement}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Earnings Calculator */}
            <div className="mb-16 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8">
              <div className="mb-6 flex items-center justify-center gap-2">
                <Calculator className="h-6 w-6 text-emerald-400" />
                <h2 className="text-center text-2xl font-bold text-white">
                  Earnings Calculator
                </h2>
              </div>

              <div className="mx-auto max-w-lg">
                <label
                  htmlFor="calc-slider"
                  className="mb-2 block text-center text-sm text-muted-foreground"
                >
                  Number of active referrals (Growth bundle avg)
                </label>
                <input
                  id="calc-slider"
                  type="range"
                  min={1}
                  max={50}
                  value={calcReferrals}
                  onChange={(e) =>
                    setCalcReferrals(Number(e.target.value))
                  }
                  className="w-full accent-emerald-500"
                />
                <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                  <span>1</span>
                  <span className="font-medium text-white">
                    {calcReferrals} referrals @ {commissionRate}%
                  </span>
                  <span>50</span>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-white/5 p-5 text-center">
                  <div className="text-sm text-muted-foreground">
                    Monthly Earnings
                  </div>
                  <div className="mt-2 text-3xl font-bold text-emerald-400">
                    ${monthlyEarnings.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">/mo</div>
                </div>
                <div className="rounded-xl bg-white/5 p-5 text-center">
                  <div className="text-sm text-muted-foreground">
                    Annual Earnings
                  </div>
                  <div className="mt-2 text-3xl font-bold text-emerald-400">
                    ${annualEarnings.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">/yr</div>
                </div>
                <div className="rounded-xl bg-white/5 p-5 text-center">
                  <div className="text-sm text-muted-foreground">
                    Lifetime Value (18 mo avg)
                  </div>
                  <div className="mt-2 text-3xl font-bold text-emerald-400">
                    ${(monthlyEarnings * 18).toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">total</div>
                </div>
              </div>

              <p className="mt-4 text-center text-xs text-muted-foreground">
                Based on Growth bundle ($6,997/mo). Actual earnings vary by
                client plan selection.
              </p>
            </div>

            {/* How It Works */}
            <div className="mb-16">
              <h2 className="mb-8 text-center text-2xl font-bold text-white">
                How It Works
              </h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
                {[
                  {
                    step: "1",
                    title: "Apply",
                    desc: "Fill out the form below. We review and approve within 24 hours.",
                  },
                  {
                    step: "2",
                    title: "Share",
                    desc: "Get your unique referral link and marketing materials from your dashboard.",
                  },
                  {
                    step: "3",
                    title: "Convert",
                    desc: "When someone signs up through your link, we track it automatically with a 90-day cookie.",
                  },
                  {
                    step: "4",
                    title: "Earn",
                    desc: "Receive up to 35% of their monthly payment, every month, for the lifetime of the client.",
                  },
                ].map((s) => (
                  <div key={s.step} className="text-center">
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-[#4c85ff] to-[#22d3a1] text-sm font-bold text-white">
                      {s.step}
                    </div>
                    <h4 className="font-semibold text-white">{s.title}</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {s.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Affiliate Testimonials */}
            <div className="mb-16">
              <h2 className="mb-2 text-center text-2xl font-bold text-white">
                What Our Affiliates Say
              </h2>
              <p className="mb-8 text-center text-muted-foreground">
                Real partners, real recurring income.
              </p>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                {AFFILIATE_TESTIMONIALS.map((t) => (
                  <div
                    key={t.name}
                    className="rounded-xl border border-white/10 bg-white/5 p-6"
                  >
                    <div className="mb-3 flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className="h-4 w-4 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    <div className="mt-4 border-t border-white/10 pt-4">
                      <p className="font-semibold text-white">{t.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.role} -- {t.location}
                      </p>
                      <div className="mt-2 inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                        {t.earnings} from {t.referrals} referral
                        {(t.referrals as number) !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Signup Form or Success */}
            <div id="apply">
              {result?.success ? (
                <div className="mx-auto max-w-md rounded-2xl border border-emerald-500/20 bg-white/5 p-8 text-center">
                  <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-400" />
                  <h2 className="text-2xl font-bold text-white">
                    Application Received!
                  </h2>
                  <p className="mt-2 text-muted-foreground">
                    We&apos;ll review your application and activate your account
                    within 24 hours.
                  </p>
                  {result.referralCode && (
                    <div className="mt-6 rounded-lg bg-white/5 p-4">
                      <p className="text-xs text-muted-foreground">
                        Your referral code (active once approved):
                      </p>
                      <code className="mt-1 block text-lg font-bold text-emerald-400">
                        {result.referralCode}
                      </code>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/5 p-8">
                  <h2 className="mb-2 text-center text-xl font-bold text-white">
                    Apply Now
                  </h2>
                  <p className="mb-6 text-center text-sm text-muted-foreground">
                    Free to join. Start earning within 24 hours of approval.
                  </p>

                  {result?.error && (
                    <div
                      role="alert"
                      className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-400"
                    >
                      {result.error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label
                        htmlFor="aff-name"
                        className="mb-1.5 block text-sm font-medium text-foreground/80"
                      >
                        Full Name *
                      </label>
                      <input
                        id="aff-name"
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, name: e.target.value }))
                        }
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-gray-500 focus:border-emerald-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        placeholder="John Smith"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="aff-email"
                        className="mb-1.5 block text-sm font-medium text-foreground/80"
                      >
                        Email *
                      </label>
                      <input
                        id="aff-email"
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, email: e.target.value }))
                        }
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-gray-500 focus:border-emerald-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        placeholder="john@example.com"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="aff-company"
                        className="mb-1.5 block text-sm font-medium text-foreground/80"
                      >
                        Company
                      </label>
                      <input
                        id="aff-company"
                        type="text"
                        value={form.company}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, company: e.target.value }))
                        }
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-gray-500 focus:border-emerald-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        placeholder="Your business or brand"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="aff-website"
                        className="mb-1.5 block text-sm font-medium text-foreground/80"
                      >
                        Website / Social
                      </label>
                      <input
                        id="aff-website"
                        type="text"
                        value={form.website}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, website: e.target.value }))
                        }
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-gray-500 focus:border-emerald-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        placeholder="https://yoursite.com"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full rounded-lg bg-gradient-to-r from-[#4c85ff] to-[#22d3a1] px-6 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      {isSubmitting ? "Submitting..." : "Apply to Join"}
                    </button>

                    <p className="text-center text-xs text-muted-foreground">
                      Free to join. No minimums. Payouts via Stripe on the 1st
                      of each month.
                    </p>
                  </form>
                </div>
              )}
            </div>

            {/* FAQ */}
            <div className="mt-16">
              <h2 className="mb-8 text-center text-2xl font-bold text-white">
                Frequently Asked Questions
              </h2>
              <div className="mx-auto max-w-2xl space-y-2">
                {FAQ_ITEMS.map((item, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-white/10 bg-white/5"
                  >
                    <button
                      onClick={() =>
                        setOpenFaq(openFaq === i ? null : i)
                      }
                      className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium text-white hover:text-emerald-400 transition-colors"
                      aria-expanded={openFaq === i}
                    >
                      {item.q}
                      <ChevronDown
                        className={`ml-2 h-4 w-4 shrink-0 transition-transform ${
                          openFaq === i ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {openFaq === i && (
                      <div className="px-5 pb-4 text-sm text-muted-foreground">
                        {item.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}

function ValueCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6">
      <div className="mb-3">{icon}</div>
      <h3 className="font-semibold text-white">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
