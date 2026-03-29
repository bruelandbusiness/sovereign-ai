"use client";

import {
  Play,
  LayoutDashboard,
  Settings,
  FileBarChart,
  Star,
  Users,
  LifeBuoy,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Card, CardContent } from "@/components/ui/card";

// ---------------------------------------------------------------------------
// Tutorial data
// ---------------------------------------------------------------------------

interface Tutorial {
  id: string;
  title: string;
  duration: string;
  description: string;
  icon: React.ReactNode;
}

const TUTORIALS: Tutorial[] = [
  {
    id: "dashboard-overview",
    title: "Dashboard Overview",
    duration: "5 min",
    description:
      "Get a quick tour of your Sovereign AI dashboard — learn where to find your KPIs, leads, activity feed, and settings.",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    id: "setting-up-services",
    title: "Setting Up Your Services",
    duration: "8 min",
    description:
      "Walk through activating and configuring AI services like Lead Generation, Voice Agents, and SEO Domination.",
    icon: <Settings className="h-5 w-5" />,
  },
  {
    id: "reading-reports",
    title: "Reading Your Reports",
    duration: "6 min",
    description:
      "Understand your weekly and monthly performance reports, including ROI tracking, lead attribution, and trend analysis.",
    icon: <FileBarChart className="h-5 w-5" />,
  },
  {
    id: "managing-reviews",
    title: "Managing Your Reviews",
    duration: "7 min",
    description:
      "Learn how to use AI-powered review management to request, respond to, and monitor your Google reviews.",
    icon: <Star className="h-5 w-5" />,
  },
  {
    id: "understanding-leads",
    title: "Understanding Your Leads",
    duration: "5 min",
    description:
      "Explore the lead pipeline, learn lead statuses, and see how to take action on hot leads before they go cold.",
    icon: <Users className="h-5 w-5" />,
  },
  {
    id: "getting-support",
    title: "Getting Support",
    duration: "3 min",
    description:
      "Find out how to reach our support team, submit tickets, and access live chat when you need help.",
    icon: <LifeBuoy className="h-5 w-5" />,
  },
];

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function TutorialsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <Header variant="minimal" />

      <main id="main-content" className="flex-1 py-8">
        <Container>
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-10">
              <div className="flex justify-center mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Play className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
              </div>
              <h1 className="text-3xl font-bold font-display">
                Video Tutorials
              </h1>
              <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
                Short, practical walkthroughs to help you get the most out of
                every feature in your Sovereign AI dashboard.
              </p>
            </div>

            {/* Tutorial grid */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {TUTORIALS.map((tutorial) => (
                <Card
                  key={tutorial.id}
                  className="group relative transition-all hover:border-primary/50 hover:shadow-md"
                >
                  <CardContent className="flex h-full flex-col p-0">
                    {/* Video placeholder */}
                    <div className="relative flex items-center justify-center rounded-t-[11px] bg-muted/50 aspect-video overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform group-hover:scale-110">
                        <Play className="h-5 w-5 ml-0.5" aria-hidden="true" />
                      </div>
                      {/* Duration badge */}
                      <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-md bg-background/80 px-2 py-0.5 text-[10px] font-medium text-foreground backdrop-blur-sm">
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        {tutorial.duration}
                      </span>
                    </div>

                    {/* Text content */}
                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                          {tutorial.icon}
                        </div>
                        <h3 className="text-sm font-semibold leading-tight">
                          {tutorial.title}
                        </h3>
                      </div>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {tutorial.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Help CTA */}
            <Card className="mt-12 border-primary/20 bg-primary/5">
              <CardContent className="p-6 text-center">
                <LifeBuoy
                  className="mx-auto h-8 w-8 text-primary mb-3"
                  aria-hidden="true"
                />
                <h2 className="text-sm font-semibold mb-1">
                  Need more help?
                </h2>
                <p className="text-xs text-muted-foreground mb-4">
                  Browse the full knowledge base or reach out to our support
                  team for one-on-one assistance.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Link
                    href="/knowledge"
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
                  >
                    Knowledge Base
                  </Link>
                  <Link
                    href="/dashboard/support"
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted/50 transition-colors"
                  >
                    Contact Support
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
