import { describe, it, expect } from "vitest";
import {
  auditFormSchema,
  bookingFormSchema,
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
} from "../validations";

describe("auditFormSchema", () => {
  it("accepts valid input", () => {
    const result = auditFormSchema.safeParse({
      business_name: "Acme Plumbing",
      city: "Phoenix",
      state: "AZ",
      vertical: "plumber",
      email: "mike@acme.com",
      phone: "555-1234",
    });
    expect(result.success).toBe(true);
  });

  it("accepts input without optional fields", () => {
    const result = auditFormSchema.safeParse({
      business_name: "Acme Plumbing",
      city: "Phoenix",
      vertical: "plumber",
      email: "mike@acme.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing business_name", () => {
    const result = auditFormSchema.safeParse({
      city: "Phoenix",
      vertical: "plumber",
      email: "mike@acme.com",
    });
    expect(result.success).toBe(false);
  });

  it("rejects business_name that is too short", () => {
    const result = auditFormSchema.safeParse({
      business_name: "A",
      city: "Phoenix",
      vertical: "plumber",
      email: "mike@acme.com",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = auditFormSchema.safeParse({
      business_name: "Acme Plumbing",
      city: "Phoenix",
      vertical: "plumber",
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty vertical", () => {
    const result = auditFormSchema.safeParse({
      business_name: "Acme Plumbing",
      city: "Phoenix",
      vertical: "",
      email: "mike@acme.com",
    });
    expect(result.success).toBe(false);
  });
});

describe("bookingFormSchema", () => {
  const validBooking = {
    name: "Mike Rodriguez",
    businessName: "Acme Plumbing",
    email: "mike@acme.com",
    interestedIn: "starter",
  };

  it("accepts valid input", () => {
    const result = bookingFormSchema.safeParse(validBooking);
    expect(result.success).toBe(true);
  });

  it("accepts input with optional fields", () => {
    const result = bookingFormSchema.safeParse({
      ...validBooking,
      phone: "555-1234",
      notes: "I need help ASAP",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing name", () => {
     
    const { name: _name, ...rest } = validBooking;
    const result = bookingFormSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = bookingFormSchema.safeParse({
      ...validBooking,
      email: "bad",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty interestedIn", () => {
    const result = bookingFormSchema.safeParse({
      ...validBooking,
      interestedIn: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("step1Schema", () => {
  const validStep1 = {
    businessName: "Acme Plumbing",
    ownerName: "Mike Rodriguez",
    email: "mike@acme.com",
    phone: "5551234567",
    city: "Phoenix",
    state: "AZ",
    industry: "plumber",
  };

  it("accepts valid input", () => {
    const result = step1Schema.safeParse(validStep1);
    expect(result.success).toBe(true);
  });

  it("accepts empty string for optional website", () => {
    const result = step1Schema.safeParse({ ...validStep1, website: "" });
    expect(result.success).toBe(true);
  });

  it("accepts valid URL for website", () => {
    const result = step1Schema.safeParse({
      ...validStep1,
      website: "https://acme.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid URL for website", () => {
    const result = step1Schema.safeParse({
      ...validStep1,
      website: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("rejects phone shorter than 10 characters", () => {
    const result = step1Schema.safeParse({
      ...validStep1,
      phone: "12345",
    });
    expect(result.success).toBe(false);
  });
});

describe("step2Schema", () => {
  it("accepts valid input", () => {
    const result = step2Schema.safeParse({
      currentMarketingActivities: ["google_ads", "facebook"],
      googleBusinessProfile: "active",
    });
    expect(result.success).toBe(true);
  });

  it("accepts all googleBusinessProfile enum values", () => {
    for (const val of ["active", "inactive", "none", "unsure"]) {
      const result = step2Schema.safeParse({
        currentMarketingActivities: [],
        googleBusinessProfile: val,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid googleBusinessProfile value", () => {
    const result = step2Schema.safeParse({
      currentMarketingActivities: [],
      googleBusinessProfile: "invalid",
    });
    expect(result.success).toBe(false);
  });
});

describe("step3Schema", () => {
  it("accepts array with at least one service", () => {
    const result = step3Schema.safeParse({
      selectedServices: ["seo"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty selectedServices array", () => {
    const result = step3Schema.safeParse({
      selectedServices: [],
    });
    expect(result.success).toBe(false);
  });
});

describe("step4Schema", () => {
  it("accepts all optional fields", () => {
    const result = step4Schema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts valid emails", () => {
    const result = step4Schema.safeParse({
      gbpEmail: "gbp@example.com",
      gaEmail: "ga@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty strings for email fields", () => {
    const result = step4Schema.safeParse({
      gbpEmail: "",
      gaEmail: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email for gbpEmail", () => {
    const result = step4Schema.safeParse({
      gbpEmail: "not-email",
    });
    expect(result.success).toBe(false);
  });
});
