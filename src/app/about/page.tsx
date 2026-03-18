import { Metadata } from "next";
import { Brain, Zap, Shield, Heart, Target, Users } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { GradientText } from "@/components/shared/GradientText";
import { FadeInView } from "@/components/shared/FadeInView";

export const metadata: Metadata = {
  title: "About Us | Sovereign AI",
  description:
    "We're on a mission to give every local service business access to enterprise-grade AI marketing. Meet the team behind Sovereign AI.",
};

const values = [
  {
    icon: Target,
    title: "Results First",
    description:
      "Every decision we make is guided by one question: does this get our clients more leads, more revenue, and better ROI?",
  },
  {
    icon: Shield,
    title: "Radical Transparency",
    description:
      "No long-term contracts, no hidden fees, no vanity metrics. You see everything in your real-time dashboard.",
  },
  {
    icon: Zap,
    title: "Speed Matters",
    description:
      "48-hour deployment. Real-time results. We move fast because your business can't wait for a committee to approve a campaign.",
  },
  {
    icon: Heart,
    title: "Client Obsession",
    description:
      "We succeed when you succeed. That's why we offer a 60-day money-back guarantee on every plan.",
  },
];

const aiStack = [
  {
    name: "Natural Language Processing",
    description: "Powers chatbots, review responses, and AI-written content",
  },
  {
    name: "Predictive Analytics",
    description: "Forecasts lead quality, optimal send times, and campaign performance",
  },
  {
    name: "Computer Vision",
    description: "Analyzes competitor websites and generates visual content",
  },
  {
    name: "Reinforcement Learning",
    description: "Continuously optimizes ad spend, bidding, and targeting",
  },
  {
    name: "Voice AI",
    description: "Human-like phone agents that qualify leads and book appointments",
  },
  {
    name: "Recommendation Engine",
    description: "Suggests optimal services and strategies based on your vertical",
  },
];

const team = [
  {
    name: "Alex Rivera",
    role: "CEO & Co-Founder",
    bio: "Former head of marketing automation at a Fortune 500. Built AI systems used by 10,000+ businesses.",
  },
  {
    name: "Dr. Priya Sharma",
    role: "CTO & Co-Founder",
    bio: "PhD in Machine Learning from MIT. Previously led AI research at Google DeepMind.",
  },
  {
    name: "Marcus Thompson",
    role: "VP of Client Success",
    bio: "15 years in home services marketing. Managed $50M+ in ad spend for service businesses.",
  },
  {
    name: "Jessica Kim",
    role: "Head of AI Engineering",
    bio: "Built NLP systems at OpenAI and Anthropic. Expert in conversational AI and content generation.",
  },
];

const stats = [
  { value: "500+", label: "Active Clients" },
  { value: "47K+", label: "Leads Generated" },
  { value: "8.7x", label: "Average Client ROI" },
  { value: "$12M+", label: "Client Revenue Generated" },
];

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <Section>
          <Container size="md">
            <FadeInView>
              <div className="mx-auto max-w-3xl text-center">
                <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                  We Give Local Businesses{" "}
                  <GradientText>Unfair Advantages</GradientText>
                </h1>
                <p className="mt-6 text-lg text-muted-foreground">
                  Sovereign AI was built on a simple belief: every local service business
                  deserves access to the same AI-powered marketing that Fortune 500
                  companies use — without the Fortune 500 budget.
                </p>
              </div>
            </FadeInView>
          </Container>
        </Section>

        {/* Stats */}
        <Section className="bg-muted/30 py-12">
          <Container>
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {stats.map((stat, i) => (
                <FadeInView key={stat.label} delay={i * 0.1}>
                  <div className="text-center">
                    <p className="font-display text-3xl font-bold text-primary sm:text-4xl">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </FadeInView>
              ))}
            </div>
          </Container>
        </Section>

        {/* Mission */}
        <Section>
          <Container size="md">
            <FadeInView>
              <div className="mx-auto max-w-2xl text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <h2 className="font-display text-3xl font-bold">
                  Our <GradientText>Mission</GradientText>
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Local service businesses are the backbone of every community. Plumbers,
                  HVAC technicians, roofers, electricians — they keep our homes running.
                  But most can&apos;t afford a marketing department, let alone an AI one.
                </p>
                <p className="mt-4 text-muted-foreground">
                  We built Sovereign AI so that a one-person plumbing shop in Atlanta can
                  compete with a 50-person franchise — and win. Our 16 AI systems work
                  24/7, generating leads, managing reviews, creating content, and optimizing
                  campaigns while you focus on what you do best: serving your customers.
                </p>
              </div>
            </FadeInView>
          </Container>
        </Section>

        {/* How We're Different */}
        <Section className="bg-muted/30">
          <Container>
            <FadeInView>
              <h2 className="text-center font-display text-3xl font-bold">
                How We&apos;re <GradientText>Different</GradientText>
              </h2>
            </FadeInView>
            <div className="mx-auto mt-12 grid max-w-4xl gap-8 md:grid-cols-2">
              {[
                {
                  title: "AI-First, Not AI-Bolted",
                  description:
                    "Every system was built from scratch with AI at the core — not a traditional tool with AI slapped on as a feature.",
                },
                {
                  title: "Home Services Specialized",
                  description:
                    "We only serve home service businesses. Every AI model, template, and strategy is optimized for your industry.",
                },
                {
                  title: "Done For You",
                  description:
                    "We're not a DIY platform. Our AI systems run autonomously. You don't need to learn new software or hire a marketing person.",
                },
                {
                  title: "Results Guaranteed",
                  description:
                    "60-day money-back guarantee. No long-term contracts. We earn your business every month.",
                },
              ].map((item, i) => (
                <FadeInView key={item.title} delay={i * 0.1}>
                  <div className="rounded-xl border border-border/50 bg-card p-6">
                    <h3 className="font-display text-lg font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </FadeInView>
              ))}
            </div>
          </Container>
        </Section>

        {/* AI Stack */}
        <Section>
          <Container>
            <FadeInView>
              <h2 className="text-center font-display text-3xl font-bold">
                Our <GradientText>AI Stack</GradientText>
              </h2>
              <p className="mt-4 text-center text-muted-foreground">
                Six core AI technologies power our 16 marketing services.
              </p>
            </FadeInView>
            <div className="mx-auto mt-12 grid max-w-4xl gap-4 md:grid-cols-2 lg:grid-cols-3">
              {aiStack.map((tech, i) => (
                <FadeInView key={tech.name} delay={i * 0.05}>
                  <div className="rounded-lg border border-border/50 bg-card p-4">
                    <h3 className="text-sm font-semibold">{tech.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{tech.description}</p>
                  </div>
                </FadeInView>
              ))}
            </div>
          </Container>
        </Section>

        {/* Team */}
        <Section className="bg-muted/30">
          <Container>
            <FadeInView>
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h2 className="font-display text-3xl font-bold">
                  Meet the <GradientText>Team</GradientText>
                </h2>
              </div>
            </FadeInView>
            <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
              {team.map((member, i) => (
                <FadeInView key={member.name} delay={i * 0.1}>
                  <div className="rounded-xl border border-border/50 bg-card p-6">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                      {member.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <h3 className="font-display text-lg font-semibold">{member.name}</h3>
                    <p className="text-sm text-primary">{member.role}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{member.bio}</p>
                  </div>
                </FadeInView>
              ))}
            </div>
          </Container>
        </Section>

        {/* Values */}
        <Section>
          <Container>
            <FadeInView>
              <h2 className="text-center font-display text-3xl font-bold">
                Our <GradientText>Values</GradientText>
              </h2>
            </FadeInView>
            <div className="mx-auto mt-12 grid max-w-4xl gap-8 md:grid-cols-2">
              {values.map((value, i) => (
                <FadeInView key={value.title} delay={i * 0.1}>
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <value.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{value.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{value.description}</p>
                    </div>
                  </div>
                </FadeInView>
              ))}
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </div>
  );
}
