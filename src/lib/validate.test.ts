import { describe, it, expect } from "vitest";
import { validateBody } from "./validate";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Create a minimal Request-like object with a JSON body.
 */
function mockRequest(body: unknown): Request {
  return new Request("https://localhost/api/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/**
 * Create a Request whose .json() rejects (invalid JSON).
 */
function mockBadJsonRequest(): Request {
  return new Request("https://localhost/api/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "NOT VALID JSON {{{",
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const schema = z.object({
  name: z.string().min(1),
  age: z.number().int().positive(),
});

describe("validateBody", () => {
  it("returns parsed data when body matches the schema", async () => {
    const req = mockRequest({ name: "Alice", age: 30 });
    const result = await validateBody(req, schema);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ name: "Alice", age: 30 });
    }
  });

  it("returns 400 response when required fields are missing", async () => {
    const req = mockRequest({});
    const result = await validateBody(req, schema);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(400);
      const body = await result.response.json();
      expect(body.error).toBe("Validation failed");
      expect(body.details).toBeDefined();
    }
  });

  it("returns 400 response when field types are wrong", async () => {
    const req = mockRequest({ name: "Alice", age: "not-a-number" });
    const result = await validateBody(req, schema);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(400);
      const body = await result.response.json();
      expect(body.details.age).toBeDefined();
    }
  });

  it("returns 400 with 'Invalid JSON body' for malformed JSON", async () => {
    const req = mockBadJsonRequest();
    const result = await validateBody(req, schema);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(400);
      const body = await result.response.json();
      expect(body.error).toBe("Invalid JSON body");
    }
  });

  it("strips extra fields when schema does not allow them", async () => {
    const strictSchema = z
      .object({ name: z.string() })
      .strict();

    const req = mockRequest({ name: "Alice", extra: "field" });
    const result = await validateBody(req, strictSchema);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(400);
    }
  });

  it("handles optional fields correctly", async () => {
    const optionalSchema = z.object({
      name: z.string(),
      bio: z.string().optional(),
    });

    const req = mockRequest({ name: "Bob" });
    const result = await validateBody(req, optionalSchema);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Bob");
      expect(result.data.bio).toBeUndefined();
    }
  });

  it("validates nested object schemas", async () => {
    const nestedSchema = z.object({
      user: z.object({
        email: z.string().email(),
      }),
    });

    const req = mockRequest({ user: { email: "bad" } });
    const result = await validateBody(req, nestedSchema);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(400);
    }
  });

  it("validates array schemas", async () => {
    const arraySchema = z.object({
      tags: z.array(z.string()).min(1),
    });

    const reqEmpty = mockRequest({ tags: [] });
    const resultEmpty = await validateBody(reqEmpty, arraySchema);
    expect(resultEmpty.success).toBe(false);

    const reqValid = mockRequest({ tags: ["a"] });
    const resultValid = await validateBody(reqValid, arraySchema);
    expect(resultValid.success).toBe(true);
  });
});
