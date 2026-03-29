import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import Stripe from "stripe";
import { stripe, assertStripeConfigured } from "@/lib/stripe";
import { createAccountWithMagicLink } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/email";
import { logger } from "@/lib/logger";
import { BUNDLES, getServiceById } from "@/lib/constants";
import { z } from "zod";

export const dynamic = "force-dynamic";

const onboardingSchema = z.object({
  step1: z.object({
    businessName: z.string().min(1, "Business name is required").max(200),
    ownerName: z.string().min(1, "Owner name is required").max(200),
    email: z.string().email("Valid email is required"),
    phone: z.string().max(30).optional().default(""),
    website: z.string().max(500).optional().default(""),
    city: z.string().max(100).optional().default(""),
    state: z.string().max(100).optional().default(""),
    industry: z.string().max(100).optional().default(""),
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
  billingInterval: z.enum(["monthly", "annual"]).default("monthly"),
  referralCode: z.string().max(50).nullable().optional(),
  agencySlug: z.string().max(100).nullable().optional(),
  coupon: z.string().max(50).nullable().optional(),
  utm: z.object({
    utm_source: z.string().max(200).optional(),
    utm_medium: z.string().max(200).optional(),
    utm_campaign: z.string().max(200).optional(),
    utm_term: z.string().max(200).optional(),
    utm_content: z.string().max(200).optional(),
  }).optional(),
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
  try {
    const rawBody = await request.json();

    const parsed = onboardingSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { detail: "Invalid input", errors: parsed.error.issues.map((i) => i.message) },
        { status: 400 }
      );
    }

    const body = parsed.data;
    const selectedServices = body.step3.selectedServices;
    const billingInterval = body.billingInterval;
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

            if (customPrice !== null) {
              amount = customPrice;
            } else if (billingInterval === "annual") {
              amount = Math.round(matchedBundle.annualPrice * 12 * 100);
            } else {
              amount = Math.round(matchedBundle.price * 100);
            }
          } else {
            amount =
              billingInterval === "annual"
                ? Math.round(matchedBundle.annualPrice * 12 * 100)
                : Math.round(matchedBundle.price * 100);
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
          // Prevent duplicate checkout sessions from double-clicks:
          // If a checkout was created for this email in the last 60 seconds, return it
          const recentCheckout = await prisma.auditLog.findFirst({
            where: {
              action: "onboarding_checkout_created",
              resource: "email",
              resourceId: email,
              createdAt: { gt: new Date(Date.now() - 60_000) },
            },
          });
          if (recentCheckout?.metadata) {
            try {
              const meta = JSON.parse(recentCheckout.metadata);
              if (meta.checkout_url) {
                return NextResponse.json({
                  success: true,
                  checkout_url: meta.checkout_url,
                  session_id: meta.session_id,
                });
              }
            } catch {
              // Fall through to create new session if metadata is corrupt
            }
          }

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

          // Only allow known coupon IDs to prevent abuse
          const ALLOWED_COUPONS = ["reactivation_20", "abandoned_10"];
          const couponId = body.coupon && ALLOWED_COUPONS.includes(body.coupon)
            ? body.coupon
            : undefined;

          const checkoutParams: Stripe.Checkout.SessionCreateParams = {
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
                  recurring: { interval: billingInterval === "annual" ? "year" : "month" },
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
              billing_interval: billingInterval,
              referral_code: body.referralCode || "",
              agency_id: agencyId,
              coupon: couponId || "",
              utm_source: body.utm?.utm_source || "",
              utm_medium: body.utm?.utm_medium || "",
              utm_campaign: body.utm?.utm_campaign || "",
            },
            success_url: `${appUrl}/dashboard?checkout=success`,
            cancel_url: `${appUrl}/onboarding?checkout=canceled`,
          };

          // Apply discount coupon if provided (reactivation, abandoned cart, etc.)
          if (couponId) {
            checkoutParams.discounts = [{ coupon: couponId }];
            // Coupons and trials can't both be applied — remove trial when using a coupon
            delete checkoutParams.subscription_data;
          }

          const checkoutSession = await stripe.checkout.sessions.create(checkoutParams);

          // Record checkout creation for double-click deduplication
          await prisma.auditLog.create({
            data: {
              action: "onboarding_checkout_created",
              resource: "email",
              resourceId: email,
              metadata: JSON.stringify({
                checkout_url: checkoutSession.url,
                session_id: checkoutSession.id,
              }),
            },
          }).catch((err) => {
            logger.errorWithCause("[onboarding] Failed to log checkout creation", err);
          });

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

        // Track referral attribution (atomic updates to prevent race conditions)
        if (body.referralCode) {
          try {
            const newClient = await prisma.client.findUnique({
              where: { accountId: authResult.account.id },
            });
            if (newClient) {
              // Atomic: only update if referredClientId is still null
              await prisma.referralCode.updateMany({
                where: { code: body.referralCode, referredClientId: null },
                data: {
                  referredClientId: newClient.id,
                  creditCents: 50000,
                  status: "credited",
                },
              });

              // Atomic: only update if clientId is still null
              await prisma.affiliateReferral.updateMany({
                where: { code: body.referralCode, clientId: null },
                data: {
                  clientId: newClient.id,
                  email,
                  status: "signed_up",
                  convertedAt: new Date(),
                },
              });
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
      { detail: "Onboarding submission failed" },
      { status: 500 }
    );
  }
}
