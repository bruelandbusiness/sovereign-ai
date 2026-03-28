# SOVEREIGN AI — Ultimate Google Stitch UI Design Prompt

Copy everything below the line into Google Stitch:

---

## DESIGN BRIEF

Design a complete, world-class marketing website and client dashboard for **Sovereign AI** — a premium done-for-you AI marketing platform built exclusively for home service contractors (HVAC, plumbing, roofing, electrical, landscaping). The design must feel like a $50M funded SaaS product — on par with Linear, Vercel, Stripe, and Arc Browser in craft and polish. Every pixel matters. This is dark mode only.

---

## BRAND IDENTITY

**Name:** Sovereign AI
**Domain:** trysovereignai.com
**Tagline:** "Done-For-You AI Marketing for Home Services"
**Hero Headline:** "Stop Losing Leads to Competitors With Worse Service"
**Promise:** 16 AI systems working 24/7 to generate leads, book appointments, and grow revenue — fully managed, results guaranteed.

**Brand Personality:** Confident but not arrogant. Technical but accessible. Premium but not elitist. We speak to blue-collar business owners in a way that respects their intelligence while demystifying AI. Think "the Tesla of local marketing" — cutting-edge tech wrapped in a simple, beautiful experience.

**Key Stats to Feature:**
- 16 AI Systems Running 24/7
- 500+ Active Clients
- 47,000+ Leads Generated
- 8.7x Average Client ROI
- $12M+ Client Revenue Generated
- 60-Day Results Guarantee
- 48-Hour Deployment

---

## COLOR SYSTEM

**This is a dark-mode-only design. No light mode.**

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#0a0a0f` | Page background, deepest layer |
| Card | `#101018` | Card surfaces, modals, panels |
| Secondary | `#1c1c22` | Secondary surfaces, inputs, hover states |
| Foreground | `#ececef` | Primary text (off-white, never pure white) |
| Muted Text | `#8a8a9a` | Secondary text, labels, captions |
| Primary | `#4c85ff` | CTAs, links, interactive highlights |
| Accent | `#22d3a1` | Success states, revenue metrics, secondary highlights |
| Warning | `#f5a623` | Warnings, attention items |
| Destructive | `#ef4444` | Errors, destructive actions |
| Border | `rgba(255,255,255,0.08)` | Subtle borders, dividers |
| Strong Border | `rgba(255,255,255,0.15)` | Emphasized borders on hover/focus |

**Signature Gradient:**
`linear-gradient(135deg, #4c85ff, #22d3a1)` — used for gradient text on headlines, primary CTAs, featured card borders, progress bars, and key accent moments. This gradient IS the brand.

**Glassmorphism:**
Cards use `background: rgba(16, 16, 24, 0.6)` with `backdrop-filter: blur(12px)` and a 1px border at `rgba(255,255,255,0.08)`. Used for floating elements, navigation, modals, and featured cards.

**Glow Effects:**
- Primary glow: `box-shadow: 0 0 30px rgba(76, 133, 255, 0.15)`
- Accent glow: `box-shadow: 0 0 30px rgba(34, 211, 161, 0.15)`
- Used sparingly on featured cards, active states, and hover interactions

---

## TYPOGRAPHY

| Role | Font | Weight | Size Range |
|------|------|--------|------------|
| Display / H1 | Plus Jakarta Sans | 800 (ExtraBold) | 48–72px |
| H2 | Plus Jakarta Sans | 700 (Bold) | 36–48px |
| H3 | Plus Jakarta Sans | 600 (SemiBold) | 24–32px |
| Body | DM Sans | 400–500 | 16–18px |
| Small / Labels | DM Sans | 500 | 12–14px |
| Mono / Technical | JetBrains Mono | 400 | 14px |

**Typography Rules:**
- Headlines use gradient text effect (the blue→teal gradient clipped to text) for the most impactful words
- Body text is `#ececef` at 400 weight, secondary text is `#8a8a9a`
- Line height: 1.2 for headlines, 1.6 for body text
- Letter spacing: -0.02em on headlines, normal on body
- Max content width: 680px for reading text, 1280px for page layouts

---

## PAGES TO DESIGN

### PAGE 1: HOMEPAGE (Full Marketing Site)

**Section 1 — Trust Bar (sticky top, subtle)**
Thin bar above nav: "Built exclusively for home service businesses | 16 AI systems working 24/7 | 60-day money-back guarantee"
Dark background, small text, subtle blue/teal accents.

**Section 2 — Navigation**
Glassmorphic sticky header. Logo (shield icon with gradient + "SOVEREIGN AI" wordmark) on left. Links: Home, Services, Pricing, Results, Free Audit, Marketplace. Right side: "Client Login" text link + "Book Strategy Call" gradient button with shine animation on hover. Mobile: Hamburger with full-screen overlay menu.

**Section 3 — Hero**
Full viewport height. Subtle animated gradient mesh background (dark with faint blue/teal aurora borealis effect). Centered layout:
- Eyebrow badge: "DONE-FOR-YOU AI MARKETING FOR HOME SERVICES" in small caps with gradient border pill
- Main headline: "Stop Losing Leads to Competitors With Worse Service" — "Losing Leads" in gradient text
- Subheadline: "Our 16 AI systems work 24/7 to generate leads, book appointments, and grow revenue for home service businesses — fully managed, guaranteed results."
- Two CTAs: "Book Strategy Call →" (gradient button, primary) + "Watch 2-Min Demo ▶" (ghost button, secondary)
- Three animated stat counters below: "16 AI Systems" / "24/7 Always Running" / "60-Day Guarantee"
- Subtle floating UI cards in background showing mock dashboard metrics (glassmorphic, slightly rotated, parallax on scroll)

**Section 4 — Social Proof Bar**
Horizontal scroll of contractor business logos or "Trusted by 500+ home service businesses across the US" with small avatar stack.

**Section 5 — Services Grid (16 AI Services)**
Section heading: "16 AI Systems. One Dashboard. Zero Effort." with gradient on "Zero Effort"
Category filter tabs: All | Lead Generation | Engagement | Management | Intelligence
4-column grid of service cards:
- Each card: Dark glassmorphic card with icon (gradient-filled), service name, one-line description, starting price, "Learn More →" link
- On hover: Card lifts (translateY -4px), border glows with gradient, subtle shadow increase
- Grouped by category with colored category pills

**Section 6 — How It Works**
4-step horizontal process with connecting line:
1. "Pick Your AI Services" (shopping icon)
2. "We Deploy in 48 Hours" (rocket icon)
3. "AI Works 24/7" (brain/circuit icon)
4. "Scale What Works" (chart-up icon)
Each step: Numbered circle with gradient, title, 2-line description. Connecting line has animated gradient flow.

**Section 7 — Pricing Bundles**
Toggle: Monthly / Annual (save 2 months)
4 pricing cards side by side:
- **DIY** ($497/mo) — Basic card, no badge
- **Starter** ($3,497/mo) — Standard card
- **Growth** ($6,997/mo) — FEATURED: Larger card, gradient border glow, "MOST POPULAR" badge, slight scale-up
- **Empire** ($12,997/mo) — Premium card, "BEST VALUE" badge
Each card: Plan name, price, billing period, included services list with checkmarks, CTA button, savings callout
Below cards: "All plans include: 60-day guarantee • No long-term contracts • Dedicated account manager • Real-time dashboard"

**Section 8 — ROI Calculator**
Interactive section: "See Your Revenue Potential"
Sliders for: Monthly marketing budget, Average job value, Current monthly leads
Output: Projected leads, projected revenue, ROI multiplier — all animated counters with gradient text.
Dark card with glassmorphic background, gradient border on the output section.

**Section 9 — Results / Testimonials**
"Real Results from Real Contractors" — gradient on "Real Results"
3-column grid of testimonial cards:
- Client photo (circular), name, business name, location
- Quote text
- Key metric: e.g., "312% increase in leads" in large gradient text
- Star rating

**Section 10 — Final CTA Section**
Full-width dark section with gradient mesh background.
"Ready to Stop Losing Leads?" → "Book Your Free Strategy Call" gradient button
Below: "Valued at $2,500 — Yours free. No obligation."

**Section 11 — Footer**
4-column layout: Product links, Company links, Legal links, Contact info
Bottom: Copyright, social icons, "Made with AI in Arizona"

---

### PAGE 2: CLIENT DASHBOARD

**Layout:** Sidebar + main content area. Sidebar is dark (`#0a0a0f`) with icon-only collapsed mode option. Main area is `#101018`.

**Sidebar Navigation:**
- Logo (icon only)
- Overview (home icon)
- Leads (people icon)
- Services (grid icon)
- Analytics (chart icon)
- CRM (database icon)
- Reports (file icon)
- Billing (credit card icon)
- Settings (gear icon)
- Support (headset icon)
- Divider
- User avatar + name at bottom

**Dashboard Overview Page:**

**Header Area:**
"Good morning, [Name] 👋" with business name and location tag below.
Motivational banner: Progress bar showing "73 of 100 leads this month" with gradient fill.

**KPI Cards Row (4 cards):**
- Total Leads (big number + trend arrow + sparkline)
- Response Rate (percentage + trend)
- Appointments Booked (number + trend)
- Revenue Generated (dollar amount + trend)
Each card: Glassmorphic, with icon in top-right, main metric in 32px bold, trend indicator (green up arrow or red down), mini sparkline chart, "vs last month" comparison.

**Two-Column Layout Below:**

Left Column (60%):
- **Recent Leads Table** — Clean data table with columns: Name, Source, Quality Score (colored dot: hot/warm/cold), Status (pill badge), Date. Hover row highlight. "View All →" link.
- **Activity Feed** — Timeline of system events: "AI Chatbot captured lead from website", "Review request sent to John D.", "Voice agent booked appointment for Thursday". Each with timestamp and service icon.

Right Column (40%):
- **Active Services Card** — Grid of active service icons with green "active" dots, count of active/total services
- **ROI Overview** — Donut chart or bar chart showing investment vs. revenue with the gradient colors
- **Quick Actions** — Button group: "View Reports", "Manage Services", "Contact Support"

---

### PAGE 3: FREE AUDIT PAGE

Full-screen landing page optimized for conversion.

**Hero:**
- Badge: "Previously a $497 Service — Now Free for a Limited Time" (gradient border pill)
- Headline: "Discover Exactly Where Your Marketing Is Leaking Money" — "Leaking Money" in gradient text (red/orange gradient for urgency)
- Subtext: "Our AI scans 47 marketing signals across Google, SEO, reviews, ads, and competitors to find exactly where you're losing leads."
- CTA: "Get Your Free Audit →" (gradient button)

**What You'll Get (3 cards):**
1. "Google Presence Score" — How visible you are in local search
2. "Competitor Gap Analysis" — Where competitors are beating you
3. "Revenue Leak Report" — Exactly how many leads you're losing and why

**Audit Form (Multi-step):**
Step 1: Business name + website URL
Step 2: Primary service + location
Step 3: Name + email + phone
Clean, minimal form with progress indicator. Gradient "Next →" buttons.

---

### PAGE 4: STRATEGY CALL BOOKING

Split layout: Left side = value prop, right side = booking form.

**Left Side:**
- "FREE — NO OBLIGATION" badge
- Headline: "Get Your Custom AI Marketing Roadmap" — "AI" and "Marketing Roadmap" in gradient
- Description of what they'll get in 15 minutes
- Checkmarks: Custom AI roadmap, Competitor analysis, Revenue projection, Implementation timeline
- Social proof: Recent bookings notification ("Felicia from Chicago booked 2 hours ago")

**Right Side:**
- Clean booking form card (glassmorphic)
- "Book Your Strategy Call" heading
- "Valued at $2,500 — Yours free"
- Fields: Name, Business Name, Email, Phone, Industry (dropdown), Monthly Revenue (range), Preferred Time
- "Book My Free Call →" gradient button

---

### PAGE 5: MARKETPLACE

**Header:** "AI Services Marketplace" with "Marketplace" in gradient
**Subtitle:** "Enterprise-grade AI marketing tools, individually or as a bundle"

**Filter Bar:** Category pills (All, Lead Generation, Engagement, Management, Intelligence) + Search bar + Sort dropdown

**Grid Layout (3 columns):**
Each service card:
- Service icon (gradient-filled)
- Category pill (e.g., "Lead Generation" in blue tint)
- Service name (20px semibold)
- One-line description
- Key features (3 bullet points)
- Price (from $X/mo)
- "Learn More" button + "Add to Bundle" secondary button
- Popular badge on key services (Voice Agents, Lead Gen, SEO)

**Sticky Bottom Bar (mobile):**
Shows count of selected services + estimated bundle price + "Get Started →" button

---

## DESIGN PRINCIPLES

1. **Depth through layers** — Use the background → card → element hierarchy consistently. Never flat. Always have visual depth through subtle shadows, borders, and glassmorphism.

2. **Motion with purpose** — Subtle animations on scroll (fade-up, stagger), hover states (lift, glow, border color), and micro-interactions (button shine, counter animations). Never gratuitous.

3. **Gradient as brand** — The blue→teal gradient is the signature. Use it for the most important elements: key headline words, primary CTAs, progress indicators, featured card borders, and data highlights. Never overuse — it loses impact.

4. **Data as design** — Show real metrics, progress bars, sparklines, and charts throughout. Even the marketing site should feel like it's powered by real data. Numbers build trust.

5. **Whitespace is premium** — Generous padding and margins. Section spacing of 120–160px. Cards have 32–48px internal padding. Never cramped.

6. **Contrast hierarchy** — Use the full range from `#0a0a0f` (deepest background) to `#ececef` (brightest text). Most text should be `#8a8a9a` (muted), with only headlines and key info in full brightness.

7. **Mobile-first, desktop-gorgeous** — Every layout must work beautifully on mobile. Cards stack, grids collapse, navigation transforms. But on desktop, the extra space creates a premium, editorial feel.

---

## COMPONENT LIBRARY

Design these reusable components:

**Buttons:**
- Primary: Gradient background (`#4c85ff → #22d3a1`), white text, rounded-lg, hover shine effect
- Secondary: Transparent with gradient border, gradient text, hover fill
- Ghost: Transparent, `#8a8a9a` text, hover brightens to white
- Destructive: `#ef4444` background, white text

**Cards:**
- Default: `#101018` bg, 1px border `rgba(255,255,255,0.08)`, rounded-xl, 32px padding
- Featured: Same + gradient border glow + `shadow: 0 0 30px rgba(76,133,255,0.12)`
- Glass: `rgba(16,16,24,0.6)` bg + `backdrop-filter: blur(12px)` + border
- Interactive: Default + hover: translateY(-4px), border brightens, shadow increases

**Inputs:**
- `#1c1c22` background, 1px border `rgba(255,255,255,0.08)`, `#ececef` text
- Focus: border becomes `#4c85ff`, subtle glow
- Placeholder text: `#555`

**Badges/Pills:**
- Gradient border pill (for eyebrow text)
- Colored pills: Blue (info), Teal (success), Yellow (warning), Red (error)
- "Popular" badge: Gradient background, white text, small rounded pill

**Data Display:**
- KPI card with large number, trend indicator (↑↓), sparkline
- Progress bar with gradient fill
- Stat counter with animated number roll

**Navigation:**
- Top nav: Glassmorphic, sticky, blur background
- Sidebar: Dark, icon+text, collapsible to icon-only
- Mobile: Full-screen overlay with staggered fade-in links

---

## INSPIRATION REFERENCES

Channel the visual quality of these products:
- **Linear** — Clean dark UI, purposeful animations, premium feel
- **Vercel** — Developer-grade polish, beautiful gradients, perfect typography
- **Stripe** — Data visualization, trust-building design, world-class components
- **Arc Browser** — Bold color usage, playful but professional
- **Raycast** — Glassmorphic elements, keyboard-first but beautiful
- **Framer** — Scroll animations, editorial layout, hero section inspiration
- **Pitch** — Presentation-quality marketing pages
- **Loom** — Approachable premium SaaS for non-technical users

The end result should look like something a home service contractor opens and thinks: "This is the most professional thing I've ever seen in my industry." It should feel 10 years ahead of every competitor in the local marketing space.

---

## FINAL NOTES

- All illustrations should be abstract, geometric, and gradient-colored — no stock photos, no cheesy illustrations
- Icons should be from Lucide or a similar clean, modern icon set — never chunky or dated
- Every interactive element needs a hover state, focus state, and active state
- Maintain 4.5:1 minimum contrast ratio for accessibility (WCAG AA)
- Design at 1440px width for desktop, 375px for mobile
- Export assets at 2x resolution
- Include both collapsed and expanded sidebar states for dashboard
- Show at least one loading/skeleton state for the dashboard
