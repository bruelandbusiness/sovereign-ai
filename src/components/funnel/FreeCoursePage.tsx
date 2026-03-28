"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { trackEvent } from "@/lib/tracking";
import {
  Play,
  CheckCircle2,
  ArrowRight,
  Lock,
  BookOpen,
  Users,
  Star,
  Zap,
  Bot,
  MessageSquare,
} from "lucide-react";

const LESSONS = [
  {
    number: 1,
    title: "Install an AI Chatbot on Your Website",
    description:
      "Set up a 24/7 chatbot that qualifies leads, answers FAQs, and books appointments — while you sleep.",
    icon: Bot,
    free: true,
  },
  {
    number: 2,
    title: "Automate 5-Star Review Requests",
    description:
      "Build an automated review funnel that turns every completed job into a Google review.",
    icon: Star,
    free: true,
    requiresAccount: true,
  },
  {
    number: 3,
    title: "Set Up Missed-Call Text-Back",
    description:
      "Never lose a lead again. Auto-text customers who call when you can't answer.",
    icon: MessageSquare,
    free: true,
    requiresAccount: true,
  },
  {
    number: 4,
    title: "Launch Your First AI Ad Campaign",
    description:
      "Create a Facebook ad that drives leads directly into your AI-powered booking system.",
    icon: Zap,
    free: true,
    requiresAccount: true,
  },
  {
    number: 5,
    title: "Build Your Full AI Marketing Stack",
    description:
      "Connect all the pieces: chatbot + reviews + ads + CRM into one automated system.",
    icon: BookOpen,
    free: true,
    requiresAccount: true,
  },
];

export function FreeCoursePage() {
  const [form, setForm] = useState({ name: "", email: "", trade: "" });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    trackEvent("free_course_signup", { trade: form.trade });

    try {
      await fetch("/api/leads/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          source: "free-course",
          trade: form.trade,
        }),
      });
    } catch {
      // Still show success
    }

    setSubmitted(true);
    setIsSubmitting(false);
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#0a0a0f] pb-20 pt-32">
        <Container>
          <div className="mx-auto max-w-4xl">
            {/* Hero */}
            <div className="mb-12 text-center">
              <div className="mx-auto mb-4 inline-flex items-center rounded-full bg-blue-500/10 px-4 py-1.5 text-sm font-medium text-blue-400">
                <BookOpen className="mr-1.5 h-4 w-4" />
                Free 5-Lesson Course
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                How to Install AI Marketing for Your{" "}
                <span className="bg-gradient-to-r from-[#4c85ff] to-[#22d3a1] bg-clip-text text-transparent">
                  Home Service Business
                </span>
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                Learn how to set up an AI chatbot, automate review requests, and
                book leads 24/7 — step by step, completely free. No fluff, no
                upsells in the course.
              </p>
            </div>

            {/* Social Proof */}
            <div className="mb-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-blue-400" />
                2,400+ enrolled
              </span>
              <span>|</span>
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500" fill="currentColor" />
                4.9/5 rating
              </span>
              <span>|</span>
              <span>100% free forever</span>
            </div>

            {/* Course Outline */}
            <div className="mb-12">
              <h2 className="mb-6 text-center text-2xl font-bold text-white">
                Course Outline
              </h2>
              <div className="space-y-3">
                {LESSONS.map((lesson) => (
                  <div
                    key={lesson.number}
                    className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/5 p-5 transition hover:border-white/20"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#4c85ff] to-[#22d3a1] text-sm font-bold text-white">
                      {lesson.number}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white">
                          {lesson.title}
                        </h3>
                        {lesson.requiresAccount && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                            <Lock className="h-2.5 w-2.5" />
                            Requires free account
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {lesson.description}
                      </p>
                    </div>
                    <lesson.icon className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </div>

            {/* Signup / Success */}
            {submitted ? (
              <div className="mx-auto max-w-md rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center">
                <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-400" />
                <h2 className="text-2xl font-bold text-white">
                  You&apos;re Enrolled!
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Check your email for Lesson 1. To unlock Lessons 2-5,
                  you&apos;ll create a free Sovereign AI account — takes 60
                  seconds.
                </p>
                <a
                  href="/onboarding"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#4c85ff] to-[#22d3a1] px-8 py-3 font-bold text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  Create Free Account
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            ) : (
              <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/5 p-8">
                <h2 className="mb-1 text-center text-xl font-bold text-white">
                  Start the Free Course
                </h2>
                <p className="mb-6 text-center text-sm text-muted-foreground">
                  Get Lesson 1 in your inbox instantly. No credit card. No spam.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="course-name" className="sr-only">Your Name</label>
                    <input
                      id="course-name"
                      type="text"
                      required
                      placeholder="Your Name"
                      value={form.name}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, name: e.target.value }))
                      }
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                  <div>
                    <label htmlFor="course-email" className="sr-only">Email Address</label>
                    <input
                      id="course-email"
                      type="email"
                      required
                      placeholder="Email Address"
                      value={form.email}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, email: e.target.value }))
                      }
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                  <div>
                    <label htmlFor="course-trade" className="sr-only">Your Trade</label>
                    <select
                      id="course-trade"
                      required
                      value={form.trade}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, trade: e.target.value }))
                      }
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-blue-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                    <option value="" className="bg-background">
                      What&apos;s your trade?
                    </option>
                    <option value="hvac" className="bg-background">
                      HVAC
                    </option>
                    <option value="plumbing" className="bg-background">
                      Plumbing
                    </option>
                    <option value="roofing" className="bg-background">
                      Roofing
                    </option>
                    <option value="electrical" className="bg-background">
                      Electrical
                    </option>
                    <option value="landscaping" className="bg-background">
                      Landscaping
                    </option>
                    <option value="other" className="bg-background">
                      Other Home Service
                    </option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-lg bg-gradient-to-r from-[#4c85ff] to-[#22d3a1] px-6 py-3 font-bold text-white transition hover:opacity-90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    {isSubmitting ? "Enrolling..." : "Get Lesson 1 Free"}
                  </button>
                </form>

                <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Play className="h-3 w-3" />
                    Video lessons
                  </span>
                  <span>|</span>
                  <span>Self-paced</span>
                  <span>|</span>
                  <span>100% free</span>
                </div>
              </div>
            )}

            {/* Why This Works */}
            <div className="mt-16">
              <h3 className="mb-8 text-center text-2xl font-bold text-white">
                Why 2,400+ Business Owners Took This Course
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                  {
                    title: "Actionable, Not Theoretical",
                    desc: "Every lesson ends with a working automation you can turn on today.",
                  },
                  {
                    title: "Built for Non-Technical Owners",
                    desc: "No coding required. If you can use a smartphone, you can do this.",
                  },
                  {
                    title: "Real Results in 48 Hours",
                    desc: "Students report booking their first AI-captured lead within 2 days.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-xl border border-white/10 bg-white/5 p-6"
                  >
                    <h4 className="font-semibold text-white">{item.title}</h4>
                    <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
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
