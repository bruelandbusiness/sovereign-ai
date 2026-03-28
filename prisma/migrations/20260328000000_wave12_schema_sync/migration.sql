
-- DropIndex
DROP INDEX IF EXISTS "ActivityEvent_type_idx";

-- DropIndex
DROP INDEX IF EXISTS "AffiliatePartner_email_idx";

-- DropIndex
DROP INDEX IF EXISTS "AffiliatePartner_slug_idx";

-- DropIndex
DROP INDEX IF EXISTS "AffiliateReferral_code_idx";

-- DropIndex
DROP INDEX IF EXISTS "BlogPost_slug_idx";

-- DropIndex
DROP INDEX IF EXISTS "ColdEmailRecipient_trackingId_idx";

-- DropIndex
DROP INDEX IF EXISTS "PhoneCall_createdAt_idx";

-- DropIndex
DROP INDEX IF EXISTS "ReferralCode_code_idx";

-- DropIndex
DROP INDEX IF EXISTS "SnapshotReport_shareToken_idx";

-- AlterTable: Session (idempotent)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Session' AND column_name='lastUsedAt' AND is_nullable='NO') THEN
    ALTER TABLE "Session" ALTER COLUMN "lastUsedAt" DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Session' AND column_name='lastUsedAt' AND column_default IS NOT NULL) THEN
    ALTER TABLE "Session" ALTER COLUMN "lastUsedAt" DROP DEFAULT;
  END IF;
END $$;

-- AlterTable: WebhookLog (idempotent)
ALTER TABLE "WebhookLog" ADD COLUMN IF NOT EXISTS "attemptLog" TEXT;
ALTER TABLE "WebhookLog" ADD COLUMN IF NOT EXISTS "attempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "WebhookLog" ADD COLUMN IF NOT EXISTS "deadLetteredAt" TIMESTAMP(3);
ALTER TABLE "WebhookLog" ADD COLUMN IF NOT EXISTS "deliveredAt" TIMESTAMP(3);
ALTER TABLE "WebhookLog" ADD COLUMN IF NOT EXISTS "lastError" TEXT;
ALTER TABLE "WebhookLog" ADD COLUMN IF NOT EXISTS "maxAttempts" INTEGER NOT NULL DEFAULT 3;
ALTER TABLE "WebhookLog" ADD COLUMN IF NOT EXISTS "nextRetryAt" TIMESTAMP(3);
ALTER TABLE "WebhookLog" ADD COLUMN IF NOT EXISTS "responseTimeMs" INTEGER;
ALTER TABLE "WebhookLog" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'pending';

-- CreateTable
CREATE TABLE IF NOT EXISTS "DashboardSnapshot" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "data" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DashboardSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "DashboardSnapshot_token_key" ON "DashboardSnapshot"("token");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "DashboardSnapshot_clientId_idx" ON "DashboardSnapshot"("clientId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "DashboardSnapshot_expiresAt_idx" ON "DashboardSnapshot"("expiresAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AdCampaign_status_idx" ON "AdCampaign"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AgentExecution_status_idx" ON "AgentExecution"("status");

-- Deduplicate AuditLog rows before creating unique index
DELETE FROM "AuditLog" a USING "AuditLog" b
WHERE a.id > b.id AND a.resource = b.resource AND a."resourceId" = b."resourceId";

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "AuditLog_resource_resourceId_key" ON "AuditLog"("resource", "resourceId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Booking_status_idx" ON "Booking"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CallLog_createdAt_idx" ON "CallLog"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ClientService_status_idx" ON "ClientService"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ContentJob_status_idx" ON "ContentJob"("status");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "CustomerLifetimeValue_clientId_customerEmail_key" ON "CustomerLifetimeValue"("clientId", "customerEmail");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "FinancingApplication_status_idx" ON "FinancingApplication"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Lead_email_idx" ON "Lead"("email");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Lead_phone_idx" ON "Lead"("phone");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "NPSResponse_surveyType_idx" ON "NPSResponse"("surveyType");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "OrchestrationEvent_createdAt_idx" ON "OrchestrationEvent"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ReferralCode_clientId_idx" ON "ReferralCode"("clientId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ReferralCode_referredClientId_idx" ON "ReferralCode"("referredClientId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ReviewCampaign_status_idx" ON "ReviewCampaign"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ServiceReminder_status_idx" ON "ServiceReminder"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ServiceReminder_nextDueDate_idx" ON "ServiceReminder"("nextDueDate");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SocialPost_status_idx" ON "SocialPost"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SupportTicket_status_idx" ON "SupportTicket"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "WebhookLog_status_idx" ON "WebhookLog"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "WebhookLog_createdAt_idx" ON "WebhookLog"("createdAt");

-- AddForeignKey (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CaseStudy_clientId_fkey') THEN
    ALTER TABLE "CaseStudy" ADD CONSTRAINT "CaseStudy_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DashboardSnapshot_clientId_fkey') THEN
    ALTER TABLE "DashboardSnapshot" ADD CONSTRAINT "DashboardSnapshot_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

