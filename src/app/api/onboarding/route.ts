import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Create a lead from the onboarding data
    const leadData = {
      business_name: body.step1?.businessName || "",
      email: body.step1?.email || "",
      phone: body.step1?.phone || "",
      city: body.step1?.city || "",
      state: body.step1?.state || "",
      vertical: body.step1?.industry || "",
    };

    // Try to create a checkout session if services were selected
    const selectedServices = body.step3?.selectedServices || [];

    if (selectedServices.length > 0) {
      try {
        const checkoutResponse = await fetch(
          `${API_URL}/api/payments/checkout`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: selectedServices,
              customer_email: leadData.email,
              customer_name: body.step1?.ownerName || "",
              business_name: leadData.business_name,
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
        // If checkout fails, still succeed the onboarding — payment can happen later
      }
    }

    // If no services or checkout failed, just save the lead
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
