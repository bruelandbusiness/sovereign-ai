/**
 * Circuit breaker pattern for external service calls.
 *
 * Prevents cascading failures by tracking consecutive errors and
 * short-circuiting calls when a service is down, instead of
 * hammering it with requests that will inevitably fail.
 *
 * States:
 *   CLOSED  — normal operation, requests pass through
 *   OPEN    — service is down, requests fail immediately
 *   HALF_OPEN — testing if service recovered (one probe request allowed)
 *
 * @example
 * ```ts
 * const sendgridBreaker = new CircuitBreaker("sendgrid", {
 *   failureThreshold: 5,
 *   resetTimeoutMs: 30_000,
 * });
 *
 * const result = await sendgridBreaker.execute(() => sendEmail(to, subject, html));
 * ```
 */

import { logger } from "@/lib/logger";

// ─── Types ───────────────────────────────────────────────────

export type CircuitState = "closed" | "open" | "half_open";

export interface CircuitBreakerOptions {
  /** Number of consecutive failures before opening the circuit. Default: 5. */
  failureThreshold?: number;
  /** How long (ms) to wait in open state before allowing a probe. Default: 30000. */
  resetTimeoutMs?: number;
  /** Number of successful probes needed to close the circuit. Default: 1. */
  successThreshold?: number;
  /**
   * Optional predicate: return true if the error should count as a failure.
   * By default all errors count. Use this to exclude expected errors (e.g. 404).
   */
  isFailure?: (error: unknown) => boolean;
  /** Called when state changes. */
  onStateChange?: (from: CircuitState, to: CircuitState, serviceName: string) => void;
}

// ─── Circuit Breaker ────────────────────────────────────────

export class CircuitBreaker {
  readonly name: string;
  private state: CircuitState = "closed";
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;
  private readonly failureThreshold: number;
  private readonly resetTimeoutMs: number;
  private readonly successThreshold: number;
  private readonly isFailure: (error: unknown) => boolean;
  private readonly onStateChange?: (from: CircuitState, to: CircuitState, name: string) => void;

  constructor(name: string, options?: CircuitBreakerOptions) {
    this.name = name;
    this.failureThreshold = options?.failureThreshold ?? 5;
    this.resetTimeoutMs = options?.resetTimeoutMs ?? 30_000;
    this.successThreshold = options?.successThreshold ?? 1;
    this.isFailure = options?.isFailure ?? (() => true);
    this.onStateChange = options?.onStateChange;
  }

  /**
   * Execute an async operation through the circuit breaker.
   *
   * - In CLOSED state: calls execute normally.
   * - In OPEN state: throws immediately without calling the function.
   * - In HALF_OPEN state: allows one probe call to test recovery.
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      // Check if enough time has passed to allow a probe
      if (Date.now() - this.lastFailureTime >= this.resetTimeoutMs) {
        this.transition("half_open");
      } else {
        throw new CircuitOpenError(this.name, this.resetTimeoutMs);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      if (this.isFailure(error)) {
        this.onFailure();
      }
      throw error;
    }
  }

  /**
   * Execute an operation with a fallback value when the circuit is open.
   * Returns the fallback instead of throwing CircuitOpenError.
   */
  async executeWithFallback<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
    try {
      return await this.execute(fn);
    } catch (error) {
      if (error instanceof CircuitOpenError) {
        logger.warn(
          `[circuit-breaker] ${this.name}: circuit open, using fallback`,
        );
        return fallback;
      }
      throw error;
    }
  }

  /** Current circuit state. */
  getState(): CircuitState {
    return this.state;
  }

  /** Current consecutive failure count. */
  getFailureCount(): number {
    return this.failureCount;
  }

  /** Manually reset the circuit to closed state. */
  reset(): void {
    this.transition("closed");
    this.failureCount = 0;
    this.successCount = 0;
  }

  // ── Internal ─────────────────────────────────────────────

  private onSuccess(): void {
    if (this.state === "half_open") {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        logger.info(
          `[circuit-breaker] ${this.name}: probe succeeded, closing circuit`,
        );
        this.transition("closed");
        this.failureCount = 0;
        this.successCount = 0;
      }
    } else {
      // Reset failure count on success in closed state
      this.failureCount = 0;
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === "half_open") {
      // Probe failed -- go back to open
      logger.warn(
        `[circuit-breaker] ${this.name}: probe failed, reopening circuit`,
      );
      this.transition("open");
      this.successCount = 0;
    } else if (
      this.state === "closed" &&
      this.failureCount >= this.failureThreshold
    ) {
      logger.error(
        `[circuit-breaker] ${this.name}: ${this.failureCount} consecutive failures, opening circuit for ${this.resetTimeoutMs}ms`,
      );
      this.transition("open");
    }
  }

  private transition(newState: CircuitState): void {
    if (this.state === newState) return;
    const from = this.state;
    this.state = newState;
    this.onStateChange?.(from, newState, this.name);
  }
}

// ─── Error ──────────────────────────────────────────────────

export class CircuitOpenError extends Error {
  readonly serviceName: string;
  readonly resetTimeoutMs: number;

  constructor(serviceName: string, resetTimeoutMs: number) {
    super(
      `Circuit breaker for "${serviceName}" is open — service is temporarily unavailable. Will retry after ${Math.round(resetTimeoutMs / 1000)}s.`,
    );
    this.name = "CircuitOpenError";
    this.serviceName = serviceName;
    this.resetTimeoutMs = resetTimeoutMs;
  }
}

// ─── Singleton Registry ─────────────────────────────────────

/**
 * Global registry of circuit breakers, keyed by service name.
 * Use `getCircuitBreaker` to get or create a breaker for a service.
 */
const breakers = new Map<string, CircuitBreaker>();

/**
 * Get or create a circuit breaker for a named service.
 * Re-uses existing instances so state persists across calls.
 */
export function getCircuitBreaker(
  name: string,
  options?: CircuitBreakerOptions,
): CircuitBreaker {
  let breaker = breakers.get(name);
  if (!breaker) {
    breaker = new CircuitBreaker(name, options);
    breakers.set(name, breaker);
  }
  return breaker;
}

/**
 * Get the current status of all circuit breakers.
 * Useful for health check endpoints and monitoring dashboards.
 */
export function getAllCircuitBreakerStatus(): Record<
  string,
  { state: CircuitState; failureCount: number }
> {
  const status: Record<string, { state: CircuitState; failureCount: number }> =
    {};
  for (const [name, breaker] of breakers) {
    status[name] = {
      state: breaker.getState(),
      failureCount: breaker.getFailureCount(),
    };
  }
  return status;
}
