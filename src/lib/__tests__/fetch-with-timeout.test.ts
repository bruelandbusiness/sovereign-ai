import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchWithTimeout } from "../fetch-with-timeout";

describe("fetchWithTimeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("resolves with the fetch response on success", async () => {
    const mockResponse = new Response("ok", { status: 200 });
    vi.mocked(fetch).mockResolvedValue(mockResponse);

    const promise = fetchWithTimeout("https://example.com/api");
    const result = await promise;

    expect(result).toBe(mockResponse);
    expect(fetch).toHaveBeenCalledWith("https://example.com/api", {
      signal: expect.any(AbortSignal),
    });
  });

  it("passes through request init options", async () => {
    const mockResponse = new Response("ok", { status: 200 });
    vi.mocked(fetch).mockResolvedValue(mockResponse);

    await fetchWithTimeout("https://example.com/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "value" }),
    });

    expect(fetch).toHaveBeenCalledWith(
      "https://example.com/api",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "value" }),
      })
    );
  });

  it("throws a timeout error when the request takes too long", async () => {
    // Make fetch hang until abort
    vi.mocked(fetch).mockImplementation((_url, init) => {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(new DOMException("The operation was aborted.", "AbortError"));
        });
      });
    });

    const promise = fetchWithTimeout("https://example.com/api", undefined, 5000);

    // Advance past the timeout
    vi.advanceTimersByTime(5001);

    await expect(promise).rejects.toThrow("timed out after 5000ms");
  });

  it("uses 30000ms as default timeout", async () => {
    vi.mocked(fetch).mockImplementation((_url, init) => {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(new DOMException("The operation was aborted.", "AbortError"));
        });
      });
    });

    const promise = fetchWithTimeout("https://example.com/api");

    // Advance to just before timeout — should not reject
    vi.advanceTimersByTime(29999);

    // Not yet rejected — advance past timeout
    vi.advanceTimersByTime(2);

    await expect(promise).rejects.toThrow("timed out after 30000ms");
  });

  it("re-throws non-abort errors from fetch", async () => {
    const networkError = new TypeError("Failed to fetch");
    vi.mocked(fetch).mockRejectedValue(networkError);

    await expect(
      fetchWithTimeout("https://example.com/api")
    ).rejects.toThrow("Failed to fetch");
  });
});
