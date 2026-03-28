import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";

interface ReferralPageProps {
  params: Promise<{ code: string }>;
}

export default async function ReferralLandingPage({ params }: ReferralPageProps) {
  const { code } = await params;

  // Validate the referral code
  const referral = await prisma.referralCode.findUnique({
    where: { code },
    include: {
      client: {
        select: { ownerName: true, businessName: true, vertical: true },
      },
    },
  });

  if (!referral) {
    redirect("/");
  }

  // Set the referral cookie (30-day expiry)
  const cookieStore = await cookies();
  cookieStore.set("ref_code", code, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });

  const referrerName =
    referral.client.ownerName || referral.client.businessName;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header variant="minimal" />

      <main id="main-content" className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden py-20 sm:py-28">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
          <Container>
            <div className="relative mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                Referred by {referrerName}
              </div>

              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                AI-Powered Marketing
                <br />
                <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
                  That Actually Works
                </span>
              </h1>

              <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
                Join hundreds of contractors using Sovereign AI to generate leads,
                automate reviews, and grow their business — all on autopilot.
              </p>

              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <a
                  href="/strategy-call"
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-emerald-400 px-8 text-base font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:brightness-110"
                >
                  Book Your Free Strategy Call
                </a>
                <a
                  href="/pricing"
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-card px-8 text-base font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  View Pricing
                </a>
              </div>
            </div>
          </Container>
        </section>

        {/* Trust badges */}
        <section className="border-y border-border/50 bg-muted/30 py-12">
          <Container>
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
              {[
                { value: "500+", label: "Active Clients" },
                { value: "10x", label: "Average ROI" },
                { value: "50K+", label: "Leads Generated" },
                { value: "4.9/5", label: "Client Rating" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-2xl font-bold text-foreground sm:text-3xl">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* Features */}
        <section className="py-20">
          <Container>
            <h2 className="mb-12 text-center text-3xl font-bold">
              Everything You Need to Dominate Your Market
            </h2>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "AI Lead Generation",
                  desc: "Automatically discover and reach out to potential customers in your service area.",
                },
                {
                  title: "Review Automation",
                  desc: "Get 5-star reviews on autopilot with smart follow-up campaigns.",
                },
                {
                  title: "Content Engine",
                  desc: "AI-generated social posts, blog articles, and email campaigns.",
                },
                {
                  title: "Smart Chatbot",
                  desc: "24/7 website chatbot that qualifies leads and books appointments.",
                },
                {
                  title: "Performance Dashboard",
                  desc: "Track leads, revenue, and ROI in real-time from one dashboard.",
                },
                {
                  title: "Dedicated Support",
                  desc: "Your own account manager plus priority email and chat support.",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/30"
                >
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* Testimonial */}
        <section className="border-t border-border/50 bg-muted/20 py-20">
          <Container>
            <div className="mx-auto max-w-2xl text-center">
              <blockquote className="text-xl font-medium leading-relaxed text-foreground sm:text-2xl">
                &ldquo;Sovereign AI transformed our business. We went from 10
                leads a month to over 60 — and the reviews practically manage
                themselves.&rdquo;
              </blockquote>
              <div className="mt-6">
                <p className="font-semibold text-foreground">Mike R.</p>
                <p className="text-sm text-muted-foreground">
                  Owner, Elite Roofing Solutions
                </p>
              </div>
            </div>
          </Container>
        </section>

        {/* CTA */}
        <section className="py-20">
          <Container>
            <div className="mx-auto max-w-2xl rounded-2xl border border-primary/20 bg-gradient-to-b from-primary/10 to-transparent p-8 text-center sm:p-12">
              <h2 className="text-2xl font-bold sm:text-3xl">
                Ready to Grow Your Business?
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
                Book a free 15-minute strategy call. We&apos;ll show you exactly
                how AI can generate more leads and revenue for your business.
              </p>
              <a
                href="/strategy-call"
                className="mt-8 inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-emerald-400 px-8 text-base font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:brightness-110"
              >
                Book Your Free Strategy Call
              </a>
            </div>
          </Container>
        </section>
      </main>

      <Footer />
    </div>
  );
}
