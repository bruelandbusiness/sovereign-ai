-- AlterTable: Add missing columns to Session (idempotent)
ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "lastUsedAt" TIMESTAMP(3);
ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "userAgent" TEXT;
ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "ipAddress" TEXT;

-- CreateTable (idempotent)
CREATE TABLE IF NOT EXISTS "ColdOutreachCampaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "fromEmail" TEXT NOT NULL,
    "fromName" TEXT NOT NULL,
    "subjectVariants" TEXT NOT NULL,
    "bodyTemplate" TEXT NOT NULL,
    "dailySendLimit" INTEGER NOT NULL DEFAULT 50,
    "warmupEnabled" BOOLEAN NOT NULL DEFAULT true,
    "warmupStartSent" INTEGER NOT NULL DEFAULT 5,
    "warmupRampRate" INTEGER NOT NULL DEFAULT 3,
    "sequenceStep" INTEGER NOT NULL DEFAULT 1,
    "dayOffset" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "pausedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ColdOutreachCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable (idempotent)
CREATE TABLE IF NOT EXISTS "ColdEmailRecipient" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "company" TEXT,
    "vertical" TEXT,
    "city" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "trackingId" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "repliedAt" TIMESTAMP(3),
    "bouncedAt" TIMESTAMP(3),
    "subjectUsed" TEXT,
    "clickUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ColdEmailRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (idempotent)
CREATE INDEX IF NOT EXISTS "ColdOutreachCampaign_status_idx" ON "ColdOutreachCampaign"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "ColdEmailRecipient_trackingId_key" ON "ColdEmailRecipient"("trackingId");
CREATE INDEX IF NOT EXISTS "ColdEmailRecipient_campaignId_idx" ON "ColdEmailRecipient"("campaignId");
CREATE INDEX IF NOT EXISTS "ColdEmailRecipient_status_idx" ON "ColdEmailRecipient"("status");
CREATE INDEX IF NOT EXISTS "ColdEmailRecipient_trackingId_idx" ON "ColdEmailRecipient"("trackingId");
CREATE UNIQUE INDEX IF NOT EXISTS "ColdEmailRecipient_campaignId_email_key" ON "ColdEmailRecipient"("campaignId", "email");

-- CreateIndex: New indexes on existing tables (idempotent)
CREATE INDEX IF NOT EXISTS "Client_agencyId_idx" ON "Client"("agencyId");
CREATE INDEX IF NOT EXISTS "EmailCampaign_status_idx" ON "EmailCampaign"("status");
CREATE INDEX IF NOT EXISTS "AlertLog_type_idx" ON "AlertLog"("type");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX IF NOT EXISTS "OrchestrationEvent_clientId_idx" ON "OrchestrationEvent"("clientId");
CREATE INDEX IF NOT EXISTS "ConversationThread_status_idx" ON "ConversationThread"("status");

-- AddForeignKey (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ColdEmailRecipient_campaignId_fkey'
  ) THEN
    ALTER TABLE "ColdEmailRecipient" ADD CONSTRAINT "ColdEmailRecipient_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "ColdOutreachCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
