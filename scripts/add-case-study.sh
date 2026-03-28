#!/bin/bash
# ============================================================================
# Sovereign AI — Quick Case Study Generator
# ============================================================================
# Interactive script to create a new case study page from your client data.
# Generates a Next.js page with metadata, JSON-LD, and formatted content.
#
# Usage: ./scripts/add-case-study.sh
# ============================================================================

echo ""
echo "=========================================="
echo "  Sovereign AI — New Case Study"
echo "=========================================="
echo ""

# Collect info
read -p "Client business name: " BIZ_NAME
read -p "Client owner first name: " OWNER_FIRST
read -p "Client owner last name: " OWNER_LAST
read -p "City, State (e.g., Austin, TX): " LOCATION
read -p "Industry (hvac/plumbing/roofing/electrical/landscaping): " VERTICAL
read -p "Bundle used (Starter/Growth/Empire): " BUNDLE
read -p "Timeline to results (e.g., 90 days): " TIMELINE

echo ""
echo "--- Before Sovereign AI ---"
read -p "Monthly leads BEFORE: " LEADS_BEFORE
read -p "Monthly revenue BEFORE: " REV_BEFORE
read -p "Google rating BEFORE (e.g., 3.8): " RATING_BEFORE
read -p "Google review count BEFORE: " REVIEWS_BEFORE

echo ""
echo "--- After Sovereign AI ---"
read -p "Monthly leads AFTER: " LEADS_AFTER
read -p "Monthly revenue AFTER: " REV_AFTER
read -p "Google rating AFTER (e.g., 4.9): " RATING_AFTER
read -p "Google review count AFTER: " REVIEWS_AFTER

echo ""
read -p "Client quote (one sentence): " QUOTE

# Generate slug
SLUG=$(echo "$BIZ_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/ /-/g' | sed 's/[^a-z0-9-]//g')
DIR="src/app/results/${SLUG}"

mkdir -p "$DIR"

cat > "${DIR}/page.tsx" << ENDOFFILE
import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { FadeInView } from "@/components/shared/FadeInView";
import { JsonLd } from "@/components/shared/JsonLd";
import Link from "next/link";

export const metadata: Metadata = {
  title: "${BIZ_NAME} — ${VERTICAL^} Case Study",
  description: "${BIZ_NAME} went from ${LEADS_BEFORE} to ${LEADS_AFTER} leads/month using Sovereign AI. Read the full case study.",
};

export default function CaseStudy() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Article", headline: "${BIZ_NAME} Case Study", description: metadata.description }} />
      <Header />
      <main id="main-content" className="flex-1">
        <Section>
          <Container>
            <FadeInView>
              <div className="mx-auto max-w-3xl">
                <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-4">
                  Case Study — ${VERTICAL^}
                </span>
                <h1 className="font-display text-3xl font-bold sm:text-4xl lg:text-5xl">
                  How ${BIZ_NAME} Went From ${LEADS_BEFORE} to ${LEADS_AFTER} Leads/Month in ${TIMELINE}
                </h1>
                <p className="mt-4 text-lg text-muted-foreground">
                  ${LOCATION} · ${BUNDLE} Bundle · ${TIMELINE} to results
                </p>

                {/* Results grid */}
                <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
                    <p className="text-2xl font-bold gradient-text">${LEADS_AFTER}</p>
                    <p className="text-xs text-muted-foreground">Leads/Month</p>
                    <p className="text-[10px] text-muted-foreground/60">was ${LEADS_BEFORE}</p>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
                    <p className="text-2xl font-bold gradient-text">\$${REV_AFTER}</p>
                    <p className="text-xs text-muted-foreground">Monthly Revenue</p>
                    <p className="text-[10px] text-muted-foreground/60">was \$${REV_BEFORE}</p>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
                    <p className="text-2xl font-bold gradient-text">${RATING_AFTER}</p>
                    <p className="text-xs text-muted-foreground">Google Rating</p>
                    <p className="text-[10px] text-muted-foreground/60">was ${RATING_BEFORE}</p>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
                    <p className="text-2xl font-bold gradient-text">${REVIEWS_AFTER}</p>
                    <p className="text-xs text-muted-foreground">Google Reviews</p>
                    <p className="text-[10px] text-muted-foreground/60">was ${REVIEWS_BEFORE}</p>
                  </div>
                </div>

                {/* Quote */}
                <blockquote className="mt-10 rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
                  <p className="text-lg italic text-muted-foreground">&ldquo;${QUOTE}&rdquo;</p>
                  <footer className="mt-3 text-sm font-medium">
                    — ${OWNER_FIRST} ${OWNER_LAST}, Owner of ${BIZ_NAME}
                  </footer>
                </blockquote>

                {/* CTA */}
                <div className="mt-12 text-center">
                  <p className="text-muted-foreground">Want results like ${BIZ_NAME}?</p>
                  <Link href="/free-audit" className="mt-3 inline-block rounded-xl bg-gradient-to-r from-[#4c85ff] to-[#22d3a1] px-8 py-3 font-medium text-white hover:opacity-90">
                    Get Your Free AI Audit
                  </Link>
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
ENDOFFILE

echo ""
echo "✅ Case study created at: ${DIR}/page.tsx"
echo "   URL: /results/${SLUG}"
echo ""
echo "Next steps:"
echo "  1. Review and customize the content"
echo "  2. Add to sitemap.ts"
echo "  3. Deploy"
