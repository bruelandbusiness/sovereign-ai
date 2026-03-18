"use client";

import { Download, Check, X } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { SovereignLogo } from "@/components/brand/SovereignLogo";
import { LogoShowcase } from "@/components/brand/LogoShowcase";
import { ColorSwatch } from "@/components/brand/ColorSwatch";
import { TypeSpecimen } from "@/components/brand/TypeSpecimen";
import { GradientText } from "@/components/shared/GradientText";
import { FadeInView } from "@/components/shared/FadeInView";

/* ------------------------------------------------------------------ */
/*  Brand Colors                                                       */
/* ------------------------------------------------------------------ */
const brandColors = [
  { name: "Primary Blue", hex: "#4c85ff", cssVar: "--primary" },
  { name: "Accent Teal", hex: "#22d3a1", cssVar: "--accent" },
  { name: "Background", hex: "#0a0a0f", cssVar: "--background" },
  { name: "Card", hex: "#101018", cssVar: "--card" },
  { name: "Foreground", hex: "#ececef", cssVar: "--foreground" },
  { name: "Muted", hex: "#858590", cssVar: "--muted-foreground" },
  { name: "Destructive", hex: "#ef4444", cssVar: "--destructive" },
  { name: "Warning", hex: "#f5a623", cssVar: "--warning" },
  { name: "Success", hex: "#22d3aa", cssVar: "--success" },
];

/* ------------------------------------------------------------------ */
/*  Typography                                                         */
/* ------------------------------------------------------------------ */
const typefaces = [
  {
    name: "DM Sans",
    fontClass: "font-sans",
    description: "Used for body text, UI labels, and general prose",
    weights: [
      { label: "Regular", value: "400" },
      { label: "Medium", value: "500" },
      { label: "Semibold", value: "600" },
      { label: "Bold", value: "700" },
    ],
  },
  {
    name: "Plus Jakarta Sans",
    fontClass: "font-display",
    description: "Used for headlines and hero text",
    weights: [
      { label: "Semibold", value: "600" },
      { label: "Bold", value: "700" },
      { label: "Extrabold", value: "800" },
    ],
  },
  {
    name: "JetBrains Mono",
    fontClass: "font-mono",
    description: "Used for code snippets, data labels, and technical values",
    weights: [
      { label: "Regular", value: "400" },
      { label: "Medium", value: "500" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Tone of Voice                                                      */
/* ------------------------------------------------------------------ */
const personalityTraits = [
  {
    trait: "Authoritative",
    description: "We speak from deep expertise. Numbers, proof, and specifics replace vague claims.",
  },
  {
    trait: "Technical",
    description: "We respect our audience's intelligence. Precision over hand-waving.",
  },
  {
    trait: "Results-Driven",
    description: "Every sentence earns its place by pointing toward a measurable outcome.",
  },
  {
    trait: "Accessible",
    description: "Complex ideas in plain language. No jargon for jargon's sake.",
  },
];

const toneExamples: { doText: string; dontText: string }[] = [
  {
    doText: "16 AI systems generate leads 24/7",
    dontText: "Our amazing revolutionary game-changing AI...",
  },
  {
    doText: "93% of calls answered automatically",
    dontText: "We answer most of your calls",
  },
  {
    doText: "Live within 48 hours",
    dontText: "Quick setup",
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function BrandPage() {
  return (
    <div className="flex min-h-screen flex-col page-enter">
      <Header variant="minimal" />

      <main className="flex-1">
        {/* ---- Hero ---- */}
        <Section>
          <Container size="lg">
            <FadeInView>
              <div className="flex flex-col items-center text-center">
                <SovereignLogo variant="mark" size="xl" color="gradient" />
                <h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
                  <GradientText>Brand Guidelines</GradientText>
                </h1>
                <p className="mt-4 max-w-md text-lg text-muted-foreground">
                  Everything you need to represent Sovereign AI consistently.
                </p>
              </div>
            </FadeInView>
          </Container>
        </Section>

        {/* ---- Logo ---- */}
        <Section id="logo">
          <Container>
            <FadeInView>
              <h2 className="font-display text-3xl font-bold tracking-tight">
                Logo
              </h2>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                The Sovereign AI logo comes in three variants: mark, wordmark, and
                logotype. Use the version that best fits the context while
                maintaining legibility.
              </p>
            </FadeInView>

            <FadeInView delay={0.1}>
              <div className="mt-10">
                <LogoShowcase />
              </div>
            </FadeInView>

            {/* Usage rules */}
            <FadeInView delay={0.2}>
              <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                  <h3 className="text-sm font-semibold text-foreground">Minimum Size</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    The logo mark must never be rendered smaller than 16 px in height.
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                  <h3 className="text-sm font-semibold text-foreground">Clear Space</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Maintain clear space equal to 1x the mark height on all sides.
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                  <h3 className="text-sm font-semibold text-foreground">Restrictions</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Do not stretch, rotate, or recolor the logo outside of the provided
                    variants.
                  </p>
                </div>
              </div>
            </FadeInView>

            {/* Downloads */}
            <FadeInView delay={0.3}>
              <div className="mt-10">
                <h3 className="text-sm font-semibold text-foreground">Download Assets</h3>
                <div className="mt-3 flex flex-wrap gap-3">
                  <a
                    href="/logo.svg"
                    download
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
                  >
                    <Download className="h-4 w-4" />
                    logo.svg
                  </a>
                  <a
                    href="/logo-wordmark.svg"
                    download
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
                  >
                    <Download className="h-4 w-4" />
                    logo-wordmark.svg
                  </a>
                  <a
                    href="/logo-white.svg"
                    download
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
                  >
                    <Download className="h-4 w-4" />
                    logo-white.svg
                  </a>
                </div>
              </div>
            </FadeInView>
          </Container>
        </Section>

        {/* ---- Color Palette ---- */}
        <Section id="colors">
          <Container>
            <FadeInView>
              <h2 className="font-display text-3xl font-bold tracking-tight">
                Color Palette
              </h2>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                Our dark-first palette combines a vibrant primary blue with an
                accent teal, anchored on deep backgrounds for maximum contrast.
              </p>
            </FadeInView>

            <FadeInView delay={0.1}>
              <div className="mt-10 grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {brandColors.map((c) => (
                  <ColorSwatch
                    key={c.cssVar}
                    name={c.name}
                    hex={c.hex}
                    cssVar={c.cssVar}
                  />
                ))}
              </div>
            </FadeInView>

            {/* Gradient bar */}
            <FadeInView delay={0.2}>
              <div className="mt-8 overflow-hidden rounded-xl border border-white/10">
                <div
                  className="h-20 w-full"
                  style={{
                    background: "linear-gradient(135deg, #4c85ff, #22d3a1)",
                  }}
                />
                <div className="bg-white/5 px-4 py-3">
                  <p className="text-sm font-medium text-foreground">
                    Primary Gradient
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    135deg, #4c85ff &rarr; #22d3a1
                  </p>
                </div>
              </div>
            </FadeInView>
          </Container>
        </Section>

        {/* ---- Typography ---- */}
        <Section id="typography">
          <Container>
            <FadeInView>
              <h2 className="font-display text-3xl font-bold tracking-tight">
                Typography
              </h2>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                Three typeface families cover every context: display headings,
                body copy, and technical content.
              </p>
            </FadeInView>

            <div className="mt-10 space-y-6">
              {typefaces.map((tf, i) => (
                <FadeInView key={tf.name} delay={i * 0.1}>
                  <TypeSpecimen
                    name={tf.name}
                    fontClass={tf.fontClass}
                    description={tf.description}
                    weights={tf.weights}
                  />
                </FadeInView>
              ))}
            </div>
          </Container>
        </Section>

        {/* ---- Tone of Voice ---- */}
        <Section id="tone">
          <Container>
            <FadeInView>
              <h2 className="font-display text-3xl font-bold tracking-tight">
                Tone of Voice
              </h2>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                How we sound is just as important as how we look. These principles
                guide every piece of copy we write.
              </p>
            </FadeInView>

            {/* Personality traits */}
            <FadeInView delay={0.1}>
              <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {personalityTraits.map((p) => (
                  <div
                    key={p.trait}
                    className="rounded-xl border border-white/10 bg-white/5 p-5"
                  >
                    <h3 className="font-display text-base font-bold text-foreground">
                      {p.trait}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {p.description}
                    </p>
                  </div>
                ))}
              </div>
            </FadeInView>

            {/* Do / Don't examples */}
            <FadeInView delay={0.2}>
              <div className="mt-12">
                <h3 className="font-display text-xl font-bold text-foreground">
                  Writing Examples
                </h3>
                <div className="mt-6 space-y-4">
                  {toneExamples.map((ex, i) => (
                    <div
                      key={i}
                      className="grid gap-4 sm:grid-cols-2"
                    >
                      <div className="flex items-start gap-3 rounded-xl border border-accent/20 bg-accent/5 p-4">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                            Do
                          </p>
                          <p className="mt-1 text-sm text-foreground">
                            &ldquo;{ex.doText}&rdquo;
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                        <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-destructive">
                            Don&apos;t
                          </p>
                          <p className="mt-1 text-sm text-foreground">
                            &ldquo;{ex.dontText}&rdquo;
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeInView>
          </Container>
        </Section>
      </main>

      <Footer />
    </div>
  );
}
