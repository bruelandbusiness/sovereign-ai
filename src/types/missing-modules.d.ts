// Type stubs for packages that are referenced in code but not installed locally.
// These declarations prevent TS2307 "Cannot find module" errors during type-checking.

declare module "@sentry/nextjs" {
  export function init(options: Record<string, unknown>): void;
  export function captureException(error: unknown, context?: Record<string, unknown>): string;
  export function captureMessage(message: string, level?: string): string;
  export function captureRequestError(...args: unknown[]): void;
  export function setUser(user: Record<string, unknown> | null): void;
  export function setTag(key: string, value: string): void;
  export function setExtra(key: string, value: unknown): void;
  export function withScope(callback: (scope: unknown) => void): void;
  export const ErrorBoundary: React.ComponentType<Record<string, unknown>>;
  export function showReportDialog(options?: Record<string, unknown>): void;
}

declare module "stripe" {
  interface StripeConstructor {
    new (apiKey: string, config?: Record<string, unknown>): Stripe;
  }
  interface Stripe {
    webhooks: {
      constructEvent(
        payload: string | Buffer,
        sig: string,
        secret: string
      ): Stripe.Event;
    };
    checkout: {
      sessions: {
        create(params: Record<string, unknown>): Promise<Record<string, unknown>>;
      };
    };
    customers: {
      create(params: Record<string, unknown>): Promise<Record<string, unknown>>;
      retrieve(id: string): Promise<Record<string, unknown>>;
    };
    subscriptions: {
      retrieve(id: string): Promise<Record<string, unknown>>;
      update(id: string, params: Record<string, unknown>): Promise<Record<string, unknown>>;
    };
    prices: {
      create(params: Record<string, unknown>): Promise<Record<string, unknown> & { id: string }>;
      list(params?: Record<string, unknown>): Promise<{ data: Record<string, unknown>[] }>;
    };
    paymentLinks: {
      create(params: Record<string, unknown>): Promise<Record<string, unknown> & { id: string; url: string }>;
    };
    products: {
      list(params?: Record<string, unknown>): Promise<{ data: Record<string, unknown>[] }>;
      retrieve(id: string): Promise<Record<string, unknown>>;
    };
    invoices: {
      list(params?: Record<string, unknown>): Promise<{ data: Array<Record<string, unknown> & { payment_intent?: string | { id: string } }> }>;
      retrieve(id: string): Promise<Record<string, unknown>>;
    };
    refunds: {
      create(params: Record<string, unknown>): Promise<Record<string, unknown> & { id: string; amount?: number; status?: string }>;
      retrieve(id: string): Promise<Record<string, unknown>>;
      list(params?: Record<string, unknown>): Promise<{ data: Array<Record<string, unknown> & { id: string; amount: number; currency: string; status: string | null; created: number }> }>;
    };
    charges: {
      list(params?: Record<string, unknown>): Promise<{ data: Array<Record<string, unknown> & { id: string; refunds?: { data: Array<{ id: string; amount: number; currency: string; status: string | null; created: number }> } }> }>;
      retrieve(id: string): Promise<Record<string, unknown>>;
    };
    billingPortal: {
      sessions: {
        create(params: Record<string, unknown>): Promise<Record<string, unknown> & { url: string }>;
      };
    };
  }
  namespace Stripe {
    type LatestApiVersion = string;
    interface Event {
      id: string;
      type: string;
      data: {
        object: Record<string, unknown>;
      };
      [key: string]: unknown;
    }
    namespace Checkout {
      interface Session {
        id: string;
        metadata?: Record<string, string>;
        customer?: string;
        payment_status?: string;
        amount_total?: number;
        [key: string]: unknown;
      }
    }
  }
  const Stripe: StripeConstructor;
  export = Stripe;
}

declare module "twilio" {
  interface TwilioClient {
    messages: {
      create(params: Record<string, unknown>): Promise<{ sid: string; [key: string]: unknown }>;
    };
    calls: {
      create(params: Record<string, unknown>): Promise<{ sid: string; [key: string]: unknown }>;
    };
    recordings(sid: string): {
      fetch(): Promise<{ uri: string; sid: string; [key: string]: unknown }>;
    };
  }
  function twilio(accountSid: string, authToken: string): TwilioClient;
  namespace twilio {
    type Twilio = TwilioClient;
    function validateRequest(
      authToken: string,
      signature: string,
      url: string,
      params: Record<string, string>
    ): boolean;
  }
  export = twilio;
}

declare module "pg" {
  export interface PoolClient {
    query(text: string, values?: unknown[]): Promise<{ rows: unknown[]; rowCount: number }>;
    release(): void;
  }
  export class Pool {
    constructor(config?: Record<string, unknown>);
    query(text: string, values?: unknown[]): Promise<{ rows: unknown[]; rowCount: number }>;
    connect(): Promise<PoolClient>;
    end(): Promise<void>;
  }
  export class Client {
    constructor(config?: Record<string, unknown>);
    connect(): Promise<void>;
    query(text: string, values?: unknown[]): Promise<{ rows: unknown[]; rowCount: number }>;
    end(): Promise<void>;
  }
}

declare module "@prisma/adapter-pg" {
  import { Pool } from "pg";
  export class PrismaPg {
    constructor(pool: Pool);
  }
}

declare module "@playwright/test" {
  export interface Page {
    goto(url: string, options?: Record<string, unknown>): Promise<Response | null>;
    click(selector: string, options?: Record<string, unknown>): Promise<void>;
    fill(selector: string, value: string, options?: Record<string, unknown>): Promise<void>;
    waitForURL(url: string | RegExp, options?: Record<string, unknown>): Promise<void>;
    waitForSelector(selector: string, options?: Record<string, unknown>): Promise<unknown>;
    locator(selector: string): Locator;
    getByRole(role: string, options?: Record<string, unknown>): Locator;
    getByText(text: string | RegExp, options?: Record<string, unknown>): Locator;
    getByLabel(text: string | RegExp, options?: Record<string, unknown>): Locator;
    getByPlaceholder(text: string | RegExp, options?: Record<string, unknown>): Locator;
    getByTestId(testId: string): Locator;
    url(): string;
    title(): Promise<string>;
    content(): Promise<string>;
    context(): BrowserContext;
    on(event: string, handler: (...args: unknown[]) => void): void;
    route(url: string | RegExp, handler: (route: Route) => Promise<void> | void): Promise<void>;
    evaluate<T>(fn: (...args: unknown[]) => T, ...args: unknown[]): Promise<T>;
    [key: string]: unknown;
  }

  export interface Response {
    status(): number;
    ok(): boolean;
    url(): string;
    [key: string]: unknown;
  }

  export interface BrowserContext {
    addCookies(cookies: Array<Record<string, unknown>>): Promise<void>;
    clearCookies(): Promise<void>;
    [key: string]: unknown;
  }

  export interface Locator {
    click(options?: Record<string, unknown>): Promise<void>;
    fill(value: string, options?: Record<string, unknown>): Promise<void>;
    selectOption(value: string | string[] | Record<string, unknown>, options?: Record<string, unknown>): Promise<string[]>;
    filter(options?: Record<string, unknown>): Locator;
    locator(selector: string): Locator;
    isVisible(): Promise<boolean>;
    textContent(): Promise<string | null>;
    count(): Promise<number>;
    first(): Locator;
    nth(index: number): Locator;
    not: Locator;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }

  export interface Route {
    fulfill(options: Record<string, unknown>): Promise<void>;
    continue(options?: Record<string, unknown>): Promise<void>;
    abort(errorCode?: string): Promise<void>;
    request(): Request;
    [key: string]: unknown;
  }

  export interface Request {
    url(): string;
    method(): string;
    headers(): Record<string, string>;
    postData(): string | null;
    [key: string]: unknown;
  }

  interface TestFn {
    (name: string, fn: (args: { page: Page; [key: string]: unknown }) => Promise<void>): void;
    describe: {
      (name: string, fn: () => void): void;
      [key: string]: unknown;
    };
    beforeEach: (fn: (args: { page: Page; [key: string]: unknown }) => Promise<void>) => void;
    afterEach: (fn: (args: { page: Page; [key: string]: unknown }) => Promise<void>) => void;
    beforeAll: (fn: () => Promise<void>) => void;
    afterAll: (fn: () => Promise<void>) => void;
    skip: TestFn;
    only: TestFn;
    [key: string]: unknown;
  }

  export const test: TestFn;
  export const expect: {
    (value: unknown): {
      toBe(expected: unknown): void;
      toEqual(expected: unknown): void;
      toBeTruthy(): void;
      toBeFalsy(): void;
      toContain(expected: unknown): void;
      toHaveLength(length: number): void;
      toBeLessThan(value: number): void;
      toBeVisible(options?: Record<string, unknown>): Promise<void>;
      toHaveURL(url: string | RegExp): Promise<void>;
      toHaveText(text: string | RegExp): Promise<void>;
      toHaveCount(count: number): Promise<void>;
      not: {
        toBeEmpty(): Promise<void>;
        toBe(expected: unknown): void;
        toEqual(expected: unknown): void;
        toContain(expected: unknown): void;
        toBeVisible(options?: Record<string, unknown>): Promise<void>;
        [key: string]: unknown;
      };
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };

  export const devices: Record<string, Record<string, unknown>>;

  export interface PlaywrightTestConfig {
    testDir?: string;
    timeout?: number;
    retries?: number;
    fullyParallel?: boolean;
    forbidOnly?: boolean;
    workers?: number;
    reporter?: string;
    use?: Record<string, unknown>;
    projects?: Record<string, unknown>[];
    webServer?: Record<string, unknown>;
    [key: string]: unknown;
  }

  export function defineConfig(config: PlaywrightTestConfig): PlaywrightTestConfig;
}
