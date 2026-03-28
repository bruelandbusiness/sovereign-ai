import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma before importing the module under test
vi.mock("@/lib/db", () => ({
  prisma: {
    revenueEvent: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

// Also mock the re-exported module so the import doesn't fail
vi.mock("@/lib/roi/attribution", () => ({
  attributeRevenueToSource: vi.fn(),
  getAttributionChain: vi.fn(),
}));

import { trackRevenueEvent, getROIByChannel, getFunnelMetrics } from "../revenue-attribution";
import { prisma } from "@/lib/db";

const mockPrisma = vi.mocked(prisma, true);

describe("trackRevenueEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a revenue event with all fields", async () => {
    const mockEvent = { id: "evt-1" };
    mockPrisma.revenueEvent.create.mockResolvedValue(mockEvent as never);

    const result = await trackRevenueEvent("client-1", {
      leadId: "lead-1",
      bookingId: "book-1",
      invoiceId: "inv-1",
      channel: "google_ads",
      campaignId: "camp-1",
      eventType: "payment_received",
      amount: 5000,
      metadata: { source: "web" },
    });

    expect(result).toBe(mockEvent);
    expect(mockPrisma.revenueEvent.create).toHaveBeenCalledWith({
      data: {
        clientId: "client-1",
        leadId: "lead-1",
        bookingId: "book-1",
        invoiceId: "inv-1",
        channel: "google_ads",
        campaignId: "camp-1",
        eventType: "payment_received",
        amount: 5000,
        metadata: JSON.stringify({ source: "web" }),
      },
    });
  });

  it("sets optional fields to null when not provided", async () => {
    mockPrisma.revenueEvent.create.mockResolvedValue({ id: "evt-2" } as never);

    await trackRevenueEvent("client-1", {
      channel: "organic",
      eventType: "lead_captured",
    });

    expect(mockPrisma.revenueEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        leadId: null,
        bookingId: null,
        invoiceId: null,
        campaignId: null,
        amount: null,
        metadata: null,
      }),
    });
  });
});

describe("getROIByChannel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const dateRange = {
    start: new Date("2026-01-01"),
    end: new Date("2026-01-31"),
  };

  it("aggregates events by channel", async () => {
    mockPrisma.revenueEvent.findMany.mockResolvedValue([
      { channel: "google_ads", eventType: "lead_captured", amount: null },
      { channel: "google_ads", eventType: "payment_received", amount: 5000 },
      { channel: "facebook", eventType: "lead_captured", amount: null },
      { channel: "facebook", eventType: "appointment_booked", amount: null },
      { channel: "google_ads", eventType: "payment_received", amount: 3000 },
    ] as never);

    const result = await getROIByChannel("client-1", dateRange);

    // google_ads has more revenue (8000) so it should come first
    expect(result[0].channel).toBe("google_ads");
    expect(result[0].leads).toBe(1);
    expect(result[0].revenue).toBe(8000);
    expect(result[0].events).toBe(3);

    expect(result[1].channel).toBe("facebook");
    expect(result[1].leads).toBe(1);
    expect(result[1].bookings).toBe(1);
    expect(result[1].revenue).toBe(0);
    expect(result[1].events).toBe(2);
  });

  it("returns empty array when no events exist", async () => {
    mockPrisma.revenueEvent.findMany.mockResolvedValue([] as never);

    const result = await getROIByChannel("client-1", dateRange);
    expect(result).toEqual([]);
  });

  it("sorts channels by revenue descending", async () => {
    mockPrisma.revenueEvent.findMany.mockResolvedValue([
      { channel: "organic", eventType: "payment_received", amount: 1000 },
      { channel: "facebook", eventType: "payment_received", amount: 5000 },
      { channel: "google_ads", eventType: "payment_received", amount: 3000 },
    ] as never);

    const result = await getROIByChannel("client-1", dateRange);
    expect(result[0].channel).toBe("facebook");
    expect(result[1].channel).toBe("google_ads");
    expect(result[2].channel).toBe("organic");
  });

  it("uses 'unknown' for events with falsy channel", async () => {
    mockPrisma.revenueEvent.findMany.mockResolvedValue([
      { channel: "", eventType: "lead_captured", amount: null },
    ] as never);

    const result = await getROIByChannel("client-1", dateRange);
    expect(result[0].channel).toBe("unknown");
  });
});

describe("getFunnelMetrics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const dateRange = {
    start: new Date("2026-01-01"),
    end: new Date("2026-01-31"),
  };

  it("calculates funnel metrics from events", async () => {
    mockPrisma.revenueEvent.findMany.mockResolvedValue([
      { eventType: "ad_click", amount: null },
      { eventType: "ad_click", amount: null },
      { eventType: "lead_captured", amount: null },
      { eventType: "appointment_booked", amount: null },
      { eventType: "payment_received", amount: 2000 },
      { eventType: "payment_received", amount: 3000 },
    ] as never);

    const result = await getFunnelMetrics("client-1", dateRange);

    expect(result.adClicks).toBe(2);
    expect(result.leadsCapture).toBe(1);
    expect(result.bookings).toBe(1);
    expect(result.payments).toBe(2);
    expect(result.totalRevenue).toBe(5000);
  });

  it("returns zeros when no events exist", async () => {
    mockPrisma.revenueEvent.findMany.mockResolvedValue([] as never);

    const result = await getFunnelMetrics("client-1", dateRange);

    expect(result.adClicks).toBe(0);
    expect(result.leadsCapture).toBe(0);
    expect(result.bookings).toBe(0);
    expect(result.payments).toBe(0);
    expect(result.totalRevenue).toBe(0);
  });

  it("handles payment events with null amounts", async () => {
    mockPrisma.revenueEvent.findMany.mockResolvedValue([
      { eventType: "payment_received", amount: null },
      { eventType: "payment_received", amount: 1000 },
    ] as never);

    const result = await getFunnelMetrics("client-1", dateRange);
    expect(result.totalRevenue).toBe(1000);
    expect(result.payments).toBe(2);
  });
});
