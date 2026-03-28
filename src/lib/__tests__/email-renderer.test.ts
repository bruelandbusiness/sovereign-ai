import { describe, it, expect } from "vitest";
import {
  renderEmail,
  renderEmailPlainText,
  renderMagicLink,
  renderWelcome,
  renderInvoice,
  renderLeadNotification,
  renderWeeklyReport,
} from "@/lib/email-renderer";

// ---------------------------------------------------------------------------
// renderMagicLink
// ---------------------------------------------------------------------------

describe("renderMagicLink", () => {
  const props = {
    email: "user@example.com",
    magicLinkUrl: "https://app.example.com/auth/verify?token=abc123",
    expiresInMinutes: 15,
  };

  it("returns subject, html, and text fields", async () => {
    const result = await renderMagicLink(props);
    expect(result).toHaveProperty("subject");
    expect(result).toHaveProperty("html");
    expect(result).toHaveProperty("text");
  });

  it("produces valid HTML with a doctype", async () => {
    const { html } = await renderMagicLink(props);
    expect(html).toContain("<!DOCTYPE");
    expect(html).toContain("</html>");
  });

  it("includes the magic link URL in the HTML", async () => {
    const { html } = await renderMagicLink(props);
    expect(html).toContain(props.magicLinkUrl);
  });

  it("returns a meaningful subject line", async () => {
    const { subject } = await renderMagicLink(props);
    expect(subject.length).toBeGreaterThan(5);
    expect(subject.toLowerCase()).toContain("sign in");
  });

  it("produces non-empty plain text", async () => {
    const { text } = await renderMagicLink(props);
    expect(text.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// renderWelcome
// ---------------------------------------------------------------------------

describe("renderWelcome", () => {
  const props = {
    name: "Alice",
    businessName: "Alice's Bakery",
    dashboardUrl: "https://app.example.com/dashboard",
  };

  it("renders without errors", async () => {
    const result = await renderWelcome(props);
    expect(result.html).toContain("<!DOCTYPE");
  });

  it("includes the user name in the subject", async () => {
    const { subject } = await renderWelcome(props);
    expect(subject).toContain("Alice");
  });

  it("includes the dashboard URL in HTML", async () => {
    const { html } = await renderWelcome(props);
    expect(html).toContain(props.dashboardUrl);
  });
});

// ---------------------------------------------------------------------------
// renderInvoice
// ---------------------------------------------------------------------------

describe("renderInvoice", () => {
  const baseProps = {
    name: "Bob",
    businessName: "Bob's Garage",
    invoiceNumber: "INV-001",
    invoiceDate: "2026-03-01",
    lineItems: [
      { description: "AI Receptionist", amount: 99 },
      { description: "SEO Package", amount: 149 },
    ],
    subtotal: 248,
    total: 248,
    paymentMethod: "card",
    billingUrl: "https://app.example.com/billing",
  };

  it("renders an unpaid invoice", async () => {
    const result = await renderInvoice(baseProps);
    expect(result.html).toContain("<!DOCTYPE");
    expect(result.subject).toContain("INV-001");
  });

  it("renders a paid invoice with different subject", async () => {
    const paidProps = { ...baseProps, paidAt: "2026-03-02T12:00:00Z" };
    const result = await renderInvoice(paidProps);
    expect(result.subject.toLowerCase()).toContain("receipt");
    expect(result.subject).toContain("$248.00");
  });

  it("formats total as USD in the paid subject", async () => {
    const paidProps = { ...baseProps, paidAt: "2026-03-02", total: 1234.5 };
    const result = await renderInvoice(paidProps);
    expect(result.subject).toContain("$1,234.50");
  });
});

// ---------------------------------------------------------------------------
// renderLeadNotification
// ---------------------------------------------------------------------------

describe("renderLeadNotification", () => {
  const props = {
    name: "Owner",
    businessName: "ACME Corp",
    leadName: "Jane Doe",
    leadSource: "website",
    dashboardUrl: "https://app.example.com/leads",
    timestamp: "2026-03-28T10:00:00Z",
  };

  it("renders without errors", async () => {
    const result = await renderLeadNotification(props);
    expect(result.html).toBeTruthy();
  });

  it("includes lead name in the subject", async () => {
    const { subject } = await renderLeadNotification(props);
    expect(subject).toContain("Jane Doe");
  });
});

// ---------------------------------------------------------------------------
// renderWeeklyReport
// ---------------------------------------------------------------------------

describe("renderWeeklyReport", () => {
  const props = {
    name: "Owner",
    businessName: "ACME Corp",
    weekOf: "March 21, 2026",
    leads: 12,
    callsAnswered: 45,
    reviewsGenerated: 8,
    bookings: 5,
    estimatedRevenue: 3400,
    topActions: ["Follow up with top lead", "Respond to Google reviews"],
    dashboardUrl: "https://app.example.com/dashboard",
  };

  it("renders without errors", async () => {
    const result = await renderWeeklyReport(props);
    expect(result.html).toContain("<!DOCTYPE");
  });

  it("includes metrics in the subject", async () => {
    const { subject } = await renderWeeklyReport(props);
    expect(subject).toContain("12 leads");
    expect(subject).toContain("45 calls");
  });
});

// ---------------------------------------------------------------------------
// Generic renderEmail / renderEmailPlainText
// ---------------------------------------------------------------------------

describe("renderEmail (generic)", () => {
  it("renders a simple functional component to HTML", async () => {
    const { default: React } = await import("react");
    const SimpleComponent: React.FC<{ greeting: string }> = ({ greeting }) =>
      React.createElement("div", null, greeting);

    const html = await renderEmail(SimpleComponent, {
      greeting: "Hello World",
    });
    expect(html).toContain("Hello World");
  });
});

describe("renderEmailPlainText (generic)", () => {
  it("renders a component to plain text without HTML tags", async () => {
    const { default: React } = await import("react");
    const SimpleComponent: React.FC<{ message: string }> = ({ message }) =>
      React.createElement("p", null, message);

    const text = await renderEmailPlainText(SimpleComponent, {
      message: "Plain text test",
    });
    expect(text).toContain("Plain text test");
    expect(text).not.toContain("<p>");
  });
});
