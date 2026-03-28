import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { stripe, assertStripeConfigured } from "@/lib/stripe";
import { createAccountWithMagicLink } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/email";
import { logger } from "@/lib/logger";
import { BUNDLES, getServiceById } from "@/lib/constants";
import { z } from "zod";
import { rateLimitByIP, setRateLimitHeaders } from "@/lib/rate-limit";
import { trackReferralConversion } from "@/lib/referral-tracker";

export const dynamic = "force-dynamic";

const onboardingSchema = z.object({
  step1: z.object({
    businessName: z.string().min(1, "Business name is required").max(200),
    ownerName: z.string().min(1, "Owner name is required").max(200),
    email: z.string().email("Valid email is required"),
    phone: z.string().min(10, "Phone number is required").max(30),
    website: z.string().max(500).optional().default(""),
    city: z.string().min(2, "City is required").max(100),
    state: z.string().min(2, "State is required").max(100),
    industry: z.string().min(1, "Industry is required").max(100),
    serviceAreaRadius: z.string().max(50).optional().default(""),
  }),
  step2: z.object({
    averageJobValue: z.string().max(50).optional().default(""),
    monthlyMarketingBudget: z.string().max(50).optional().default(""),
    currentMarketingActivities: z.array(z.string()).optional().default([]),
    topCompetitors: z.string().max(500).optional().default(""),
    googleBusinessProfile: z.string().max(50).optional().default("unsure"),
    primaryGoal: z.string().max(500).optional().default(""),
    biggestChallenge: z.string().max(500).optional().default(""),
  }),
  step3: z.object({
    selectedServices: z.array(z.string().max(100)).min(1, "At least one service must be selected"),
  }),
  step4: z.object({
    gbpEmail: z.string().max(254).optional().default(""),
    gaEmail: z.string().max(254).optional().default(""),
    socialAccounts: z.string().max(1000).optional().default(""),
    additionalNotes: z.string().max(5000).optional().default(""),
  }),
  referralCode: z.string().max(50).nullable().optional(),
  agencySlug: z.string().max(100).optional(),
});

/**
 * Match selected services to a bundle.
 * Returns the matching bundle if the selected services exactly match a bundle's service set.
 */
function matchBundle(selectedServices: string[]) {
  const selected = new Set(selectedServices);
  for (const bundle of BUNDLES) {
    const bundleSet = new Set<string>(bundle.services);
    if (selected.size === bundleSet.size && [...selected].every((s) => bundleSet.has(s))) {
      return bundle;
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  // Rate limit: 10 onboarding submissions per hour per IP
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = await rateLimitByIP(ip, "onboarding", 10);
  if (!rl.allowed) {
    return setRateLimitHeaders(
      NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      ),
      rl
    );
  }

  try {
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const parsed = onboardingSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const body = parsed.data;
    const selectedServices = body.step3.selectedServices;
    const email = body.step1.email;
    const ownerName = body.step1.ownerName;
    const businessName = body.step1.businessName;

    // Try to create a Stripe checkout session if services were selected
    if (selectedServices.length > 0) {
      try {
        assertStripeConfigured();

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.trysovereignai.com";

        // Fetch agency if slug provided
        let agency = null;
        let agencyId = "";
        if (body.agencySlug) {
          agency = await prisma.agency.findUnique({
            where: { slug: body.agencySlug },
          });
          if (agency) {
            agencyId = agency.id;
          }
        }

        // Calculate price: try to match a bundle first, otherwise sum individual services
        let amount = 0; // in cents
        let productName = "Sovereign AI Services";
        let bundleId = "";

        const matchedBundle = matchBundle(selectedServices);

        if (matchedBundle) {
          // Matched a bundle — use agency custom pricing if available
          if (agency) {
            // Determine which price to use based on bundle ID
            let customPrice: number | null = null;
            if (matchedBundle.id === "starter" && agency.starterPrice) {
              customPrice = agency.starterPrice;
            } else if (matchedBundle.id === "growth" && agency.growthPrice) {
              customPrice = agency.growthPrice;
            } else if (matchedBundle.id === "empire" && agency.empirePrice) {
              customPrice = agency.empirePrice;
            }

            amount = customPrice !== null ? customPrice : Math.round(matchedBundle.price * 100);
          } else {
            amount = Math.round(matchedBundle.price * 100);
          }
          productName = `Sovereign AI ${matchedBundle.name} Bundle`;
          bundleId = matchedBundle.id;
        } else {
          // Individual services — sum their prices
          for (const serviceId of selectedServices) {
            const service = getServiceById(serviceId);
            if (service) {
              amount += Math.round(service.price * 100);
            }
          }
          productName = `Sovereign AI Custom Plan (${selectedServices.length} services)`;
        }

        if (amount > 0) {
          // Store only essential onboarding data in metadata (Stripe has 500 char limit per value)
          const onboardingEssentials = {
            businessName,
            ownerName,
            phone: body.step1.phone,
            city: body.step1.city,
            state: body.step1.state,
            industry: body.step1.industry,
            website: body.step1.website,
            serviceAreaRadius: body.step1.serviceAreaRadius,
          };

          const checkoutSession = await stripe.checkout.sessions.create({
            mode: "subscription",
            payment_method_types: ["card"],
            customer_email: email,
            subscription_data: {
              trial_period_days: 14,
            },
            line_items: [
              {
                price_data: {
                  currency: "usd",
                  product_data: { name: productName },
                  recurring: { interval: "month" },
                  unit_amount: amount,
                },
                quantity: 1,
              },
            ],
            metadata: {
              bundle_id: bundleId,
              services: JSON.stringify(selectedServices),
              customer_name: ownerName,
              business_name: businessName,
              email,
              onboarding_data: JSON.stringify(onboardingEssentials),
              referral_code: body.referralCode || "",
              agency_id: agencyId,
            },
            success_url: `${appUrl}/dashboard/billing/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${appUrl}/onboarding?checkout=canceled`,
          } as Parameters<typeof stripe.checkout.sessions.create>[0]);

          return NextResponse.json({
            success: true,
            checkout_url: checkoutSession.url,
            session_id: checkoutSession.id,
          });
        }
      } catch (stripeError) {
        logger.errorWithCause("[onboarding] Stripe checkout creation failed", stripeError);
        // Fall through to create a free account if Stripe fails
      }
    }

    // Create a free account so they can access the dashboard
    if (email) {
      try {
        const authResult = await createAccountWithMagicLink(email, ownerName);

        // Fetch agency if slug provided
        let agencyId = "";
        if (body.agencySlug) {
          const agency = await prisma.agency.findUnique({
            where: { slug: body.agencySlug },
          });
          if (agency) {
            agencyId = agency.id;
          }
        }

        await prisma.client.upsert({
          where: { accountId: authResult.account.id },
          create: {
            accountId: authResult.account.id,
            agencyId: agencyId || null,
            businessName: businessName || "My Business",
            ownerName: ownerName || "",
            phone: body.step1.phone || null,
            city: body.step1.city || null,
            state: body.step1.state || null,
            vertical: body.step1.industry || null,
            website: body.step1.website || null,
            serviceAreaRadius: body.step1.serviceAreaRadius || null,
            onboardingData: JSON.stringify(body),
          },
          update: {
            onboardingData: JSON.stringify(body),
          },
        });

        await sendWelcomeEmail(
          email,
          ownerName || "there",
          businessName || "your business",
          authResult.url
        );

        // Track referral attribution
        if (body.referralCode) {
          try {
            const newClient = await prisma.client.findUnique({
              where: { accountId: authResult.account.id },
            });

            if (newClient) {
              // Client-to-client referrals (ReferralCode table)
              // Uses trackReferralConversion which handles self-referral
              // prevention, double-credit prevention, notifications, and emails
              await trackReferralConversion(newClient.id, body.referralCode);

              // Affiliate partner referrals (AffiliateReferral table).
              // Use updateMany with status guard to prevent double-crediting
              // when both the onboarding route and Stripe webhook process
              // the same referral code concurrently.
              const affiliateRef = await prisma.affiliateReferral.findUnique({
                where: { code: body.referralCode },
              });
              if (affiliateRef && !affiliateRef.clientId && affiliateRef.status === "clicked") {
                await prisma.affiliateReferral.updateMany({
                  where: {
                    id: affiliateRef.id,
                    status: "clicked",
                  },
                  data: {
                    clientId: newClient.id,
                    email,
                    status: "signed_up",
                    convertedAt: new Date(),
                  },
                });
              }
            }
          } catch (refErr) {
            logger.errorWithCause("[onboarding] Referral tracking failed", refErr);
          }
        }
      } catch (error) {
        logger.errorWithCause("[onboarding] Failed to create account", error);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Onboarding submitted successfully",
    });
  } catch {
    return NextResponse.json(
      { error: "Onboarding submission failed" },
      { status: 500 }
    );
  }
}
