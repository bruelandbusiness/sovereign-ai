-- Add compound indexes for query performance optimization
-- These target the most frequent query patterns: status+time filtering,
-- cron batch processing, and FK lookups for deduplication.

-- Lead: stale lead detection (lead nurture cron) + status+time queries
CREATE INDEX IF NOT EXISTS "Lead_updatedAt_idx" ON "Lead"("updatedAt");
CREATE INDEX IF NOT EXISTS "Lead_status_createdAt_idx" ON "Lead"("status", "createdAt");

-- Booking: status+time for daily automation and dashboard aggregation
CREATE INDEX IF NOT EXISTS "Booking_status_createdAt_idx" ON "Booking"("status", "createdAt");

-- OrchestrationEvent: batch processing by status and age
CREATE INDEX IF NOT EXISTS "OrchestrationEvent_status_createdAt_idx" ON "OrchestrationEvent"("status", "createdAt");

-- Quote: sales pipeline status filtering with recency sort
CREATE INDEX IF NOT EXISTS "Quote_status_createdAt_idx" ON "Quote"("status", "createdAt");

-- RevenueEvent: health score dashboard aggregation by client and time
CREATE INDEX IF NOT EXISTS "RevenueEvent_clientId_createdAt_idx" ON "RevenueEvent"("clientId", "createdAt");

-- OutreachEntry: FK lookups for enrichment/discovery dedup
CREATE INDEX IF NOT EXISTS "OutreachEntry_leadId_idx" ON "OutreachEntry"("leadId");
CREATE INDEX IF NOT EXISTS "OutreachEntry_discoveredLeadId_idx" ON "OutreachEntry"("discoveredLeadId");

-- Prospect: acquisition pipeline status+time queries
CREATE INDEX IF NOT EXISTS "Prospect_status_createdAt_idx" ON "Prospect"("status", "createdAt");

-- DiscoveredLead: discovery score sorting with status filter
CREATE INDEX IF NOT EXISTS "DiscoveredLead_status_createdAt_idx" ON "DiscoveredLead"("status", "createdAt");

-- AffiliateReferral: multi-tenant lookup by client
CREATE INDEX IF NOT EXISTS "AffiliateReferral_clientId_idx" ON "AffiliateReferral"("clientId");
