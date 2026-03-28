import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import {
  OrganizationJsonLd,
  SoftwareAppJsonLd,
  ProductJsonLd,
  ArticleJsonLd,
  FaqJsonLd,
  BreadcrumbJsonLd,
  LocalBusinessJsonLd,
  WebPageJsonLd,
  WebSiteJsonLd,
  ServiceJsonLd,
} from "../JsonLd";

function getJsonLdData(container: HTMLElement): Record<string, unknown> {
  const script = container.querySelector('script[type="application/ld+json"]');
  expect(script).not.toBeNull();
  return JSON.parse(script!.textContent || "{}");
}

describe("JsonLd components", () => {
  describe("OrganizationJsonLd", () => {
    it("renders a valid JSON-LD script tag with Organization schema", () => {
      const { container } = render(
        <OrganizationJsonLd
          name="Sovereign AI"
          url="https://www.trysovereignai.com"
          logo="https://www.trysovereignai.com/logo.png"
          description="AI-powered marketing"
        />
      );
      const data = getJsonLdData(container);
      expect(data["@context"]).toBe("https://schema.org");
      expect(data["@type"]).toBe("Organization");
      expect(data.name).toBe("Sovereign AI");
      expect(data.url).toBe("https://www.trysovereignai.com");
    });

    it("includes founder when provided", () => {
      const { container } = render(
        <OrganizationJsonLd
          name="Sovereign AI"
          url="https://www.trysovereignai.com"
          logo="https://www.trysovereignai.com/logo.png"
          description="AI marketing"
          founder="John Doe"
        />
      );
      const data = getJsonLdData(container);
      expect(data.founder).toEqual({ "@type": "Person", name: "John Doe" });
    });

    it("includes sameAs links when provided", () => {
      const sameAs = ["https://twitter.com/sovai", "https://linkedin.com/sovai"];
      const { container } = render(
        <OrganizationJsonLd
          name="Sovereign AI"
          url="https://www.trysovereignai.com"
          logo="https://www.trysovereignai.com/logo.png"
          description="AI marketing"
          sameAs={sameAs}
        />
      );
      const data = getJsonLdData(container);
      expect(data.sameAs).toEqual(sameAs);
    });
  });

  describe("SoftwareAppJsonLd", () => {
    it("renders SoftwareApplication schema", () => {
      const { container } = render(
        <SoftwareAppJsonLd
          name="Sovereign AI"
          description="AI marketing platform"
          lowPrice="497"
          highPrice="1997"
        />
      );
      const data = getJsonLdData(container);
      expect(data["@type"]).toBe("SoftwareApplication");
      expect(data.offers).toBeDefined();
      expect((data.offers as Record<string, unknown>)["@type"]).toBe("AggregateOffer");
    });

    it("includes aggregate rating when provided", () => {
      const { container } = render(
        <SoftwareAppJsonLd
          name="Sovereign AI"
          description="AI marketing platform"
          lowPrice="497"
          highPrice="1997"
          ratingValue="4.9"
          ratingCount="500"
        />
      );
      const data = getJsonLdData(container);
      expect(data.aggregateRating).toBeDefined();
      expect((data.aggregateRating as Record<string, unknown>).ratingValue).toBe("4.9");
    });
  });

  describe("FaqJsonLd", () => {
    it("renders FAQPage schema with questions and answers", () => {
      const items = [
        { question: "What is Sovereign AI?", answer: "An AI marketing platform." },
        { question: "How much does it cost?", answer: "Starting at $497/mo." },
      ];
      const { container } = render(<FaqJsonLd items={items} />);
      const data = getJsonLdData(container);
      expect(data["@type"]).toBe("FAQPage");
      const entities = data.mainEntity as Array<Record<string, unknown>>;
      expect(entities).toHaveLength(2);
      expect(entities[0]["@type"]).toBe("Question");
      expect(entities[0].name).toBe("What is Sovereign AI?");
      expect(
        (entities[0].acceptedAnswer as Record<string, unknown>).text
      ).toBe("An AI marketing platform.");
    });
  });

  describe("BreadcrumbJsonLd", () => {
    it("renders BreadcrumbList schema with positions", () => {
      const items = [
        { name: "Home", url: "/" },
        { name: "Pricing", url: "/pricing" },
      ];
      const { container } = render(<BreadcrumbJsonLd items={items} />);
      const data = getJsonLdData(container);
      expect(data["@type"]).toBe("BreadcrumbList");
      const elements = data.itemListElement as Array<Record<string, unknown>>;
      expect(elements).toHaveLength(2);
      expect(elements[0].position).toBe(1);
      expect(elements[1].position).toBe(2);
    });

    it("prepends base URL for relative URLs", () => {
      const items = [{ name: "Pricing", url: "/pricing" }];
      const { container } = render(<BreadcrumbJsonLd items={items} />);
      const data = getJsonLdData(container);
      const elements = data.itemListElement as Array<Record<string, unknown>>;
      expect(elements[0].item).toBe(
        "https://www.trysovereignai.com/pricing"
      );
    });
  });

  describe("ArticleJsonLd", () => {
    it("renders BlogPosting schema", () => {
      const { container } = render(
        <ArticleJsonLd
          headline="Test Article"
          description="A test description"
          url="https://example.com/blog/test"
          datePublished="2025-01-01"
        />
      );
      const data = getJsonLdData(container);
      expect(data["@type"]).toBe("BlogPosting");
      expect(data.headline).toBe("Test Article");
      expect(data.datePublished).toBe("2025-01-01");
    });
  });

  describe("WebPageJsonLd", () => {
    it("renders WebPage schema", () => {
      const { container } = render(
        <WebPageJsonLd
          name="Pricing"
          description="Pricing page"
          url="https://example.com/pricing"
        />
      );
      const data = getJsonLdData(container);
      expect(data["@type"]).toBe("WebPage");
      expect(data.name).toBe("Pricing");
    });
  });

  describe("WebSiteJsonLd", () => {
    it("renders WebSite schema with search action", () => {
      const { container } = render(
        <WebSiteJsonLd
          name="Sovereign AI"
          url="https://www.trysovereignai.com"
          searchUrl="https://www.trysovereignai.com/search?q={search_term_string}"
        />
      );
      const data = getJsonLdData(container);
      expect(data["@type"]).toBe("WebSite");
      expect(data.potentialAction).toBeDefined();
    });
  });

  describe("ProductJsonLd", () => {
    it("renders Product schema with offers", () => {
      const { container } = render(
        <ProductJsonLd
          name="Sovereign AI Growth"
          description="Growth plan"
          url="https://example.com/growth"
          offers={[
            { name: "Growth Monthly", price: "997" },
            { name: "Growth Annual", price: "797" },
          ]}
        />
      );
      const data = getJsonLdData(container);
      expect(data["@type"]).toBe("Product");
      const offers = data.offers as Array<Record<string, unknown>>;
      expect(offers).toHaveLength(2);
      expect(offers[0]["@type"]).toBe("Offer");
      expect(offers[0].price).toBe("997");
    });
  });

  describe("ServiceJsonLd", () => {
    it("renders Service schema", () => {
      const { container } = render(
        <ServiceJsonLd
          name="AI Voice Agent"
          description="24/7 AI call answering"
        />
      );
      const data = getJsonLdData(container);
      expect(data["@type"]).toBe("Service");
      expect(data.name).toBe("AI Voice Agent");
      expect(
        (data.provider as Record<string, unknown>).name
      ).toBe("Sovereign AI");
    });
  });

  describe("LocalBusinessJsonLd", () => {
    it("renders LocalBusiness schema with address", () => {
      const { container } = render(
        <LocalBusinessJsonLd
          name="Acme HVAC"
          description="HVAC services"
          url="https://acme.com"
          telephone="+15551234567"
          address={{
            city: "Dallas",
            state: "TX",
          }}
        />
      );
      const data = getJsonLdData(container);
      expect(data["@type"]).toBe("LocalBusiness");
      expect(data.telephone).toBe("+15551234567");
      const addr = data.address as Record<string, unknown>;
      expect(addr["@type"]).toBe("PostalAddress");
      expect(addr.addressLocality).toBe("Dallas");
    });
  });

  describe("all JsonLd components", () => {
    it("render script tags with type application/ld+json", () => {
      const { container } = render(
        <>
          <OrganizationJsonLd
            name="Test"
            url="https://test.com"
            logo="https://test.com/logo.png"
            description="Test"
          />
          <WebPageJsonLd
            name="Test Page"
            description="Test"
            url="https://test.com"
          />
        </>
      );
      const scripts = container.querySelectorAll(
        'script[type="application/ld+json"]'
      );
      expect(scripts.length).toBe(2);
      // Verify each produces valid JSON
      scripts.forEach((script) => {
        expect(() => JSON.parse(script.textContent || "")).not.toThrow();
      });
    });
  });
});
