/**
 * Integrations Module — barrel export
 *
 * Re-exports all integration sub-modules for convenient imports:
 *
 *   import { sendOutboundWebhook, runIntegrationTests } from "@/lib/integrations";
 */

export * from "./voice-client";
export * from "./crm-push";
export * from "./google-apis";
export * from "./data-sources";
export * from "./webhook-handlers";
export * from "./testing";
