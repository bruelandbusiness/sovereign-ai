/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- Prisma mock types don't align with vi.Mock; tests pass at runtime
import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/db", () => ({
  prisma: {
    lead: { findFirst: vi.fn() },
    discoveredLead: { findFirst: vi.fn() },
    enrichmentRecord: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    errorWithCause: vi.fn(),
  },
}));

vi.mock("../providers/reverse-address", () => ({
  lookupAddress: vi.fn(),
}));

vi.mock("../providers/email-finder", () => ({
  findEmail: vi.fn(),
}));

vi.mock("../providers/phone-lookup", () => ({
  lookupPhone: vi.fn(),
}));

vi.mock("../providers/social-match", () => ({
  findSocialProfiles: vi.fn(),
}));

const { prisma } = await import("@/lib/db");
const { enrichLead, enrichDiscoveredLead } = await import("../index");
const { lookupAddress } = await import("../providers/reverse-address");
const { findEmail } = await import("../providers/email-finder");
const { lookupPhone } = await import("../providers/phone-lookup");
const { findSocialProfiles } = await import("../providers/social-match");

const mockPrisma = vi.mocked(prisma);
const mockLookupAddress = vi.mocked(lookupAddress);
const mockFindEmail = vi.mocked(findEmail);
const mockLookupPhone = vi.mocked(lookupPhone);
const mockFindSocialProfiles = vi.mocked(findSocialProfiles);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setupEnrichmentRecordMocks(existingRecord: any = null) {
  mockPrisma.enrichmentRecord.findFirst.mockResolvedValue(existingRecord);
  mockPrisma.enrichmentRecord.create.mockResolvedValue({
    id: "enr-new",
    clientId: "client-1",
    status: "enriching",
  } as any);
  mockPrisma.enrichmentRecord.update.mockImplementation(async ({ data }) => ({
    id: existingRecord?.id ?? "enr-new",
    clientId: "client-1",
    ...data,
  }));
}

// ---------------------------------------------------------------------------
// enrichLead tests
// ---------------------------------------------------------------------------

describe("enrichLead", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupEnrichmentRecordMocks();
  });

  it("throws when lead is not found", async () => {
    mockPrisma.lead.findFirst.mockResolvedValue(null);

    await expect(enrichLead("client-1", "lead-999")).rejects.toThrow(
      "Lead lead-999 not found",
    );
  });

  it("processes a lead and calls all applicable providers", async () => {
    mockPrisma.lead.findFirst.mockResolvedValue({
      id: "lead-1",
      clientId: "client-1",
      name: "John Smith",
      phone: "+15551234567",
    } as any);

    mockFindEmail.mockResolvedValue({
      email: "john@example.com",
      verified: true,
      source: "hunter",
    });
    mockLookupPhone.mockResolvedValue({
      lineType: "mobile",
      verified: true,
    });
    mockFindSocialProfiles.mockResolvedValue({
      linkedin: "https://linkedin.com/in/johnsmith",
    });

    const result = await enrichLead("client-1", "lead-1");

    expect(mockFindEmail).toHaveBeenCalledWith("John Smith");
    expect(mockLookupPhone).toHaveBeenCalledWith("+15551234567");
    expect(mockFindSocialProfiles).toHaveBeenCalledWith("John Smith");
    expect(result.status).toBe("complete");
  });

  it("skips reverse address when no address is available (Lead has no address field)", async () => {
    mockPrisma.lead.findFirst.mockResolvedValue({
      id: "lead-1",
      clientId: "client-1",
      name: "John Smith",
      phone: null,
    } as any);

    mockFindEmail.mockResolvedValue({
      email: "john@example.com",
      verified: true,
      source: "hunter",
    });
    mockFindSocialProfiles.mockResolvedValue({});

    await enrichLead("client-1", "lead-1");

    expect(mockLookupAddress).not.toHaveBeenCalled();
  });

  it("skips phone lookup when no phone is available", async () => {
    mockPrisma.lead.findFirst.mockResolvedValue({
      id: "lead-1",
      clientId: "client-1",
      name: "Jane Doe",
      phone: null,
    } as any);

    mockFindEmail.mockResolvedValue({ verified: false, source: "hunter" });
    mockFindSocialProfiles.mockResolvedValue({});

    await enrichLead("client-1", "lead-1");

    expect(mockLookupPhone).not.toHaveBeenCalled();
  });

  it("sets status to complete when all providers succeed with data", async () => {
    mockPrisma.lead.findFirst.mockResolvedValue({
      id: "lead-1",
      clientId: "client-1",
      name: "Alice",
      phone: "+15559876543",
    } as any);

    mockFindEmail.mockResolvedValue({
      email: "alice@example.com",
      verified: true,
      source: "hunter",
    });
    mockLookupPhone.mockResolvedValue({ lineType: "mobile", verified: true });
    mockFindSocialProfiles.mockResolvedValue({
      linkedin: "https://linkedin.com/in/alice",
    });

    const result = await enrichLead("client-1", "lead-1");

    expect(result.status).toBe("complete");
  });

  it("sets status to partial when some providers fail but others have data", async () => {
    mockPrisma.lead.findFirst.mockResolvedValue({
      id: "lead-1",
      clientId: "client-1",
      name: "Bob",
      phone: "+15551111111",
    } as any);

    mockFindEmail.mockResolvedValue({
      email: "bob@example.com",
      verified: true,
      source: "hunter",
    });
    mockLookupPhone.mockRejectedValue(new Error("Twilio timeout"));
    mockFindSocialProfiles.mockResolvedValue({});

    const result = await enrichLead("client-1", "lead-1");

    expect(result.status).toBe("partial");
  });

  it("sets status to failed when no providers are attempted (no name, no phone)", async () => {
    mockPrisma.lead.findFirst.mockResolvedValue({
      id: "lead-1",
      clientId: "client-1",
      name: null,
      phone: null,
    } as any);

    const result = await enrichLead("client-1", "lead-1");

    expect(result.status).toBe("failed");
    expect(mockFindEmail).not.toHaveBeenCalled();
    expect(mockLookupPhone).not.toHaveBeenCalled();
  });

  it("does not lose lead when a single provider fails (continues pipeline)", async () => {
    mockPrisma.lead.findFirst.mockResolvedValue({
      id: "lead-1",
      clientId: "client-1",
      name: "Carol",
      phone: "+15552222222",
    } as any);

    mockFindEmail.mockRejectedValue(new Error("Hunter.io 500"));
    mockLookupPhone.mockResolvedValue({ lineType: "landline", verified: true });
    mockFindSocialProfiles.mockResolvedValue({});

    const result = await enrichLead("client-1", "lead-1");

    // Pipeline continues despite email failure
    expect(mockLookupPhone).toHaveBeenCalled();
    expect(mockFindSocialProfiles).toHaveBeenCalled();
    // Has data from phone, so not "failed"
    expect(result.status).toBe("partial");
  });

  it("updates existing enrichment record instead of creating a new one", async () => {
    mockPrisma.lead.findFirst.mockResolvedValue({
      id: "lead-1",
      clientId: "client-1",
      name: "Dave",
      phone: null,
    } as any);

    setupEnrichmentRecordMocks({
      id: "existing-enr-1",
      clientId: "client-1",
      leadId: "lead-1",
    });

    mockFindEmail.mockResolvedValue({ verified: false, source: "hunter" });
    mockFindSocialProfiles.mockResolvedValue({});

    await enrichLead("client-1", "lead-1");

    expect(mockPrisma.enrichmentRecord.create).not.toHaveBeenCalled();
    // update called twice: once for status=enriching, once for final status
    expect(mockPrisma.enrichmentRecord.update).toHaveBeenCalledTimes(2);
  });

  it("persists email, phone, and social data in final update", async () => {
    mockPrisma.lead.findFirst.mockResolvedValue({
      id: "lead-1",
      clientId: "client-1",
      name: "Eve",
      phone: "+15553333333",
    } as any);

    mockFindEmail.mockResolvedValue({
      email: "eve@example.com",
      verified: true,
      source: "hunter",
    });
    mockLookupPhone.mockResolvedValue({ lineType: "mobile", verified: true });
    mockFindSocialProfiles.mockResolvedValue({
      linkedin: "https://linkedin.com/in/eve",
      facebook: "https://facebook.com/eve",
    });

    await enrichLead("client-1", "lead-1");

    // When no existing record, create is called first, then update for final.
    // So update is called once (the final persist).
    const updateCalls = mockPrisma.enrichmentRecord.update.mock.calls;
    const finalUpdateCall = updateCalls[updateCalls.length - 1][0];
    expect(finalUpdateCall.data.emailFound).toBe("eve@example.com");
    expect(finalUpdateCall.data.emailVerified).toBe(true);
    expect(finalUpdateCall.data.emailSource).toBe("hunter");
    expect(finalUpdateCall.data.phoneLineType).toBe("mobile");
    expect(finalUpdateCall.data.phoneVerified).toBe(true);
    expect(finalUpdateCall.data.socialProfiles).toContain("linkedin");
    expect(finalUpdateCall.data.socialProfiles).toContain("facebook");
    expect(finalUpdateCall.data.enrichedAt).toBeInstanceOf(Date);
  });

  it("sets status to complete when providers succeed but return no data", async () => {
    mockPrisma.lead.findFirst.mockResolvedValue({
      id: "lead-1",
      clientId: "client-1",
      name: "Frank",
      phone: "+15554444444",
    } as any);

    mockFindEmail.mockResolvedValue({ verified: false, source: "hunter" });
    mockLookupPhone.mockResolvedValue({ verified: false });
    mockFindSocialProfiles.mockResolvedValue({});

    const result = await enrichLead("client-1", "lead-1");

    // All providers succeeded (no errors thrown), but no meaningful data
    // succeeded > 0 but withData === 0 => "complete"
    expect(result.status).toBe("complete");
  });

  it("stores rawData JSON with provider results", async () => {
    mockPrisma.lead.findFirst.mockResolvedValue({
      id: "lead-1",
      clientId: "client-1",
      name: "Grace",
      phone: null,
    } as any);

    mockFindEmail.mockResolvedValue({
      email: "grace@example.com",
      verified: true,
      source: "hunter",
    });
    mockFindSocialProfiles.mockResolvedValue({});

    await enrichLead("client-1", "lead-1");

    const updateCalls = mockPrisma.enrichmentRecord.update.mock.calls;
    const finalUpdateCall = updateCalls[updateCalls.length - 1][0];
    const rawData = JSON.parse(finalUpdateCall.data.rawData as string);

    expect(rawData.providers).toBeDefined();
    expect(rawData.timestamp).toBeDefined();
    expect(rawData.providers.length).toBeGreaterThan(0);
  });

  it("stores null for socialProfiles when no profiles found", async () => {
    mockPrisma.lead.findFirst.mockResolvedValue({
      id: "lead-1",
      clientId: "client-1",
      name: "Hank",
      phone: null,
    } as any);

    mockFindEmail.mockResolvedValue({ verified: false, source: "hunter" });
    mockFindSocialProfiles.mockResolvedValue({});

    await enrichLead("client-1", "lead-1");

    const updateCalls = mockPrisma.enrichmentRecord.update.mock.calls;
    const finalUpdateCall = updateCalls[updateCalls.length - 1][0];
    expect(finalUpdateCall.data.socialProfiles).toBeNull();
  });

  it("uses name from input when reverse address returns no name", async () => {
    // This tests via discoveredLead which has address
    mockPrisma.discoveredLead.findFirst.mockResolvedValue({
      id: "dl-1",
      clientId: "client-1",
      propertyAddress: "123 Main St",
      ownerName: "OriginalName",
      ownerPhone: null,
    } as any);

    mockLookupAddress.mockResolvedValue({
      ownerName: undefined,
      mailingAddress: "456 Oak Ave",
    });
    mockFindEmail.mockResolvedValue({ verified: false, source: "hunter" });
    mockFindSocialProfiles.mockResolvedValue({});

    await enrichDiscoveredLead("client-1", "dl-1");

    // Should fall back to input.name (ownerName from discoveredLead)
    expect(mockFindEmail).toHaveBeenCalledWith("OriginalName");
  });
});

// ---------------------------------------------------------------------------
// enrichDiscoveredLead tests
// ---------------------------------------------------------------------------

describe("enrichDiscoveredLead", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupEnrichmentRecordMocks();
  });

  it("throws when discovered lead is not found", async () => {
    mockPrisma.discoveredLead.findFirst.mockResolvedValue(null);

    await expect(
      enrichDiscoveredLead("client-1", "dl-999"),
    ).rejects.toThrow("DiscoveredLead dl-999 not found");
  });

  it("processes discovered lead with address, running reverse address lookup", async () => {
    mockPrisma.discoveredLead.findFirst.mockResolvedValue({
      id: "dl-1",
      clientId: "client-1",
      propertyAddress: "123 Main St, Denver, CO",
      ownerName: "Grace",
      ownerPhone: "+15555555555",
    } as any);

    mockLookupAddress.mockResolvedValue({
      ownerName: "Grace H.",
      mailingAddress: "456 Oak Ave, Denver, CO",
    });
    mockFindEmail.mockResolvedValue({
      email: "grace@example.com",
      verified: true,
      source: "hunter",
    });
    mockLookupPhone.mockResolvedValue({ lineType: "mobile", verified: true });
    mockFindSocialProfiles.mockResolvedValue({});

    const result = await enrichDiscoveredLead("client-1", "dl-1");

    expect(mockLookupAddress).toHaveBeenCalledWith("123 Main St, Denver, CO");
    expect(result.status).toBe("complete");
  });

  it("uses owner name from reverse address for email lookup when available", async () => {
    mockPrisma.discoveredLead.findFirst.mockResolvedValue({
      id: "dl-1",
      clientId: "client-1",
      propertyAddress: "123 Main St",
      ownerName: null,
      ownerPhone: null,
    } as any);

    mockLookupAddress.mockResolvedValue({
      ownerName: "Discovered Owner",
      mailingAddress: "456 Oak Ave",
    });
    mockFindEmail.mockResolvedValue({ verified: false, source: "hunter" });
    mockFindSocialProfiles.mockResolvedValue({});

    await enrichDiscoveredLead("client-1", "dl-1");

    // email finder should use the name from reverse address
    expect(mockFindEmail).toHaveBeenCalledWith("Discovered Owner");
  });

  it("handles discovered lead with no address (skips reverse address)", async () => {
    mockPrisma.discoveredLead.findFirst.mockResolvedValue({
      id: "dl-2",
      clientId: "client-1",
      propertyAddress: null,
      ownerName: "Hank",
      ownerPhone: null,
    } as any);

    mockFindEmail.mockResolvedValue({ verified: false, source: "hunter" });
    mockFindSocialProfiles.mockResolvedValue({});

    await enrichDiscoveredLead("client-1", "dl-2");

    expect(mockLookupAddress).not.toHaveBeenCalled();
  });

  it("sets status to failed when all providers fail", async () => {
    mockPrisma.discoveredLead.findFirst.mockResolvedValue({
      id: "dl-3",
      clientId: "client-1",
      propertyAddress: "789 Elm St",
      ownerName: "Irene",
      ownerPhone: "+15556666666",
    } as any);

    mockLookupAddress.mockRejectedValue(new Error("Address API down"));
    mockFindEmail.mockRejectedValue(new Error("Hunter.io down"));
    mockLookupPhone.mockRejectedValue(new Error("Twilio down"));
    mockFindSocialProfiles.mockRejectedValue(new Error("Social API down"));

    const result = await enrichDiscoveredLead("client-1", "dl-3");

    expect(result.status).toBe("failed");
  });

  it("records address input in the enrichment record", async () => {
    mockPrisma.discoveredLead.findFirst.mockResolvedValue({
      id: "dl-4",
      clientId: "client-1",
      propertyAddress: "999 Pine St",
      ownerName: "Jack",
      ownerPhone: null,
    } as any);

    mockLookupAddress.mockResolvedValue({});
    mockFindEmail.mockResolvedValue({ verified: false, source: "hunter" });
    mockFindSocialProfiles.mockResolvedValue({});

    await enrichDiscoveredLead("client-1", "dl-4");

    // The create call should include the address
    const createCall = mockPrisma.enrichmentRecord.create.mock.calls[0][0];
    expect(createCall.data.addressInput).toBe("999 Pine St");
  });
});

// ---------------------------------------------------------------------------
// Email Finder provider (via mock - controlled return values)
// ---------------------------------------------------------------------------

describe("findEmail provider behavior (via orchestrator)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupEnrichmentRecordMocks();
  });

  it("records verified=true in enrichment when email finder returns verified", async () => {
    mockPrisma.lead.findFirst.mockResolvedValue({
      id: "lead-1",
      clientId: "client-1",
      name: "Test User",
      phone: null,
    } as any);

    mockFindEmail.mockResolvedValue({
      email: "test@example.com",
      verified: true,
      source: "hunter",
    });
    mockFindSocialProfiles.mockResolvedValue({});

    await enrichLead("client-1", "lead-1");

    const updateCalls = mockPrisma.enrichmentRecord.update.mock.calls;
    const finalUpdate = updateCalls[updateCalls.length - 1][0];
    expect(finalUpdate.data.emailVerified).toBe(true);
    expect(finalUpdate.data.emailFound).toBe("test@example.com");
  });

  it("records verified=false when email finder returns unverified", async () => {
    mockPrisma.lead.findFirst.mockResolvedValue({
      id: "lead-1",
      clientId: "client-1",
      name: "Low Score",
      phone: null,
    } as any);

    mockFindEmail.mockResolvedValue({
      email: "low@example.com",
      verified: false,
      source: "hunter",
    });
    mockFindSocialProfiles.mockResolvedValue({});

    await enrichLead("client-1", "lead-1");

    const updateCalls = mockPrisma.enrichmentRecord.update.mock.calls;
    const finalUpdate = updateCalls[updateCalls.length - 1][0];
    expect(finalUpdate.data.emailVerified).toBe(false);
  });

  it("handles email finder throwing (records failure in providers)", async () => {
    mockPrisma.lead.findFirst.mockResolvedValue({
      id: "lead-1",
      clientId: "client-1",
      name: "Error User",
      phone: null,
    } as any);

    mockFindEmail.mockRejectedValue(new Error("Connection timeout"));
    mockFindSocialProfiles.mockResolvedValue({});

    const result = await enrichLead("client-1", "lead-1");

    const updateCalls = mockPrisma.enrichmentRecord.update.mock.calls;
    const finalUpdate = updateCalls[updateCalls.length - 1][0];
    const rawData = JSON.parse(finalUpdate.data.rawData as string);

    const emailProvider = rawData.providers.find(
      (p: any) => p.name === "email_finder",
    );
    expect(emailProvider).toBeDefined();
    expect(emailProvider.succeeded).toBe(false);
    // Lead is not lost - enrichment completes (albeit with fewer results)
    expect(result).toBeDefined();
  });

  it("records email source from provider", async () => {
    mockPrisma.lead.findFirst.mockResolvedValue({
      id: "lead-1",
      clientId: "client-1",
      name: "Source Test",
      phone: null,
    } as any);

    mockFindEmail.mockResolvedValue({
      email: "src@example.com",
      verified: true,
      source: "hunter",
    });
    mockFindSocialProfiles.mockResolvedValue({});

    await enrichLead("client-1", "lead-1");

    const updateCalls = mockPrisma.enrichmentRecord.update.mock.calls;
    const finalUpdate = updateCalls[updateCalls.length - 1][0];
    expect(finalUpdate.data.emailSource).toBe("hunter");
  });
});

// ---------------------------------------------------------------------------
// Phone Lookup provider behavior (via orchestrator)
// ---------------------------------------------------------------------------

describe("lookupPhone provider behavior (via orchestrator)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupEnrichmentRecordMocks();
  });

  it("identifies mobile line type correctly", async () => {
    mockPrisma.lead.findFirst.mockResolvedValue({
      id: "lead-1",
      clientId: "client-1",
      name: "Mobile User",
      phone: "+15551234567",
    } as any);

    mockFindEmail.mockResolvedValue({ verified: false, source: "hunter" });
    mockLookupPhone.mockResolvedValue({ lineType: "mobile", verified: true });
    mockFindSocialProfiles.mockResolvedValue({});

    await enrichLead("client-1", "lead-1");

    const updateCalls = mockPrisma.enrichmentRecord.update.mock.calls;
    const finalUpdate = updateCalls[updateCalls.length - 1][0];
    expect(finalUpdate.data.phoneLineType).toBe("mobile");
    expect(finalUpdate.data.phoneVerified).toBe(true);
  });

  it("identifies landline line type correctly", async () => {
    mockPrisma.lead.findFirst.mockResolvedValue({
      id: "lead-1",
      clientId: "client-1",
      name: "Landline User",
      phone: "+15559876543",
    } as any);

    mockFindEmail.mockResolvedValue({ verified: false, source: "hunter" });
    mockLookupPhone.mockResolvedValue({
      lineType: "landline",
      verified: true,
    });
    mockFindSocialProfiles.mockResolvedValue({});

    await enrichLead("client-1", "lead-1");

    const updateCalls = mockPrisma.enrichmentRecord.update.mock.calls;
    const finalUpdate = updateCalls[updateCalls.length - 1][0];
    expect(finalUpdate.data.phoneLineType).toBe("landline");
  });

  it("identifies voip line type correctly", async () => {
    mockPrisma.lead.findFirst.mockResolvedValue({
      id: "lead-1",
      clientId: "client-1",
      name: "VoIP User",
      phone: "+15551112222",
    } as any);

    mockFindEmail.mockResolvedValue({ verified: false, source: "hunter" });
    mockLookupPhone.mockResolvedValue({ lineType: "voip", verified: true });
    mockFindSocialProfiles.mockResolvedValue({});

    await enrichLead("client-1", "lead-1");

    const updateCalls = mockPrisma.enrichmentRecord.update.mock.calls;
    const finalUpdate = updateCalls[updateCalls.length - 1][0];
    expect(finalUpdate.data.phoneLineType).toBe("voip");
  });

  it("handles phone lookup failure gracefully (pipeline continues)", async () => {
    mockPrisma.lead.findFirst.mockResolvedValue({
      id: "lead-1",
      clientId: "client-1",
      name: "Timeout User",
      phone: "+15553334444",
    } as any);

    mockFindEmail.mockResolvedValue({
      email: "t@example.com",
      verified: true,
      source: "hunter",
    });
    mockLookupPhone.mockRejectedValue(new Error("Twilio timeout"));
    mockFindSocialProfiles.mockResolvedValue({});

    const result = await enrichLead("client-1", "lead-1");

    // Email succeeded with data, phone failed => partial
    expect(result.status).toBe("partial");
    // Social was still called after phone failure
    expect(mockFindSocialProfiles).toHaveBeenCalled();
  });

  it("stores phone number in phoneFound field", async () => {
    mockPrisma.lead.findFirst.mockResolvedValue({
      id: "lead-1",
      clientId: "client-1",
      name: "Phone Stored",
      phone: "+15557778888",
    } as any);

    mockFindEmail.mockResolvedValue({ verified: false, source: "hunter" });
    mockLookupPhone.mockResolvedValue({ lineType: "mobile", verified: true });
    mockFindSocialProfiles.mockResolvedValue({});

    await enrichLead("client-1", "lead-1");

    const updateCalls = mockPrisma.enrichmentRecord.update.mock.calls;
    const finalUpdate = updateCalls[updateCalls.length - 1][0];
    expect(finalUpdate.data.phoneFound).toBe("+15557778888");
  });
});
