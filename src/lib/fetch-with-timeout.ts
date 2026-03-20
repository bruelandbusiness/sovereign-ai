/**
 * Fetch wrapper with automatic timeout via AbortController.
 * Defaults to 30 seconds. Properly cleans up on completion or abort.
 */
export async function fetchWithTimeout(
  url: string,
  init?: RequestInit,
  timeoutMs: number = 30000
): Promise<Response> {
  const controller = new AbortController();
  if (init?.signal) {
    // If caller already provided a signal, forward abort
    init.signal.addEventListener("abort", () => controller.abort());
  }
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    if (controller.signal.aborted) {
      throw new Error(`Request to ${new URL(url).hostname} timed out after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
