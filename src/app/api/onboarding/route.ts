import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createAccountWithMagicLink } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/email";

const API_URL = process.env.API_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const selectedServices = body.step3?.selectedServices || [];
    const email = body.step1?.email || "";
    const ownerName = body.step1?.ownerName || "";
    const businessName = body.step1?.businessName || "";

    // Try to create a checkout session if services were selected
    if (selectedServices.length > 0) {
      try {
        const checkoutResponse = await fetch(
          `${API_URL}/api/payments/checkout`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: selectedServices,
              customer_email: email,
              customer_name: ownerName,
              business_name: businessName,
              metadata: {
                customer_name: ownerName,
                business_name: businessName,
                email,
                services: JSON.stringify(selectedServices),
                onboarding_data: JSON.stringify(body),
              },
            }),
          }
        );

        if (checkoutResponse.ok) {
          const checkout = await checkoutResponse.json();
          return NextResponse.json({
            success: true,
            checkout_url: checkout.checkout_url,
            session_id: checkout.session_id,
          });
        }
      } catch {
        // If checkout fails, still create a free account below
      }
    }

    // Create a free account so they can access the dashboard
    if (email) {
      try {
        const authResult = await createAccountWithMagicLink(email, ownerName);

        await prisma.client.upsert({
          where: { accountId: authResult.account.id },
          create: {
            accountId: authResult.account.id,
            businessName: businessName || "My Business",
            ownerName: ownerName || "",
            phone: body.step1?.phone || null,
            city: body.step1?.city || null,
            state: body.step1?.state || null,
            vertical: body.step1?.industry || null,
            website: body.step1?.website || null,
            serviceAreaRadius: body.step1?.serviceAreaRadius || null,
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
      } catch (error) {
        console.error("Failed to create account:", error);
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
