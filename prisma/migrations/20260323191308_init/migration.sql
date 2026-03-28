-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'client',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MagicLink" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MagicLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "agencyId" TEXT,
    "businessName" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "phone" TEXT,
    "city" TEXT,
    "state" TEXT,
    "vertical" TEXT,
    "website" TEXT,
    "serviceAreaRadius" TEXT,
    "onboardingData" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "stripeSubId" TEXT,
    "stripeCustId" TEXT,
    "bundleId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "monthlyAmount" INTEGER NOT NULL DEFAULT 0,
    "currentPeriodEnd" TIMESTAMP(3),
    "isTrial" BOOLEAN NOT NULL DEFAULT false,
    "trialEndsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientService" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'provisioning',
    "activatedAt" TIMESTAMP(3),
    "config" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "source" TEXT NOT NULL DEFAULT 'website',
    "status" TEXT NOT NULL DEFAULT 'new',
    "notes" TEXT,
    "score" INTEGER,
    "stage" TEXT,
    "value" INTEGER,
    "assignedTo" TEXT,
    "lastContactedAt" TIMESTAMP(3),
    "nextFollowUpAt" TIMESTAMP(3),
    "locationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityEvent" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatbotConfig" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "greeting" TEXT NOT NULL DEFAULT 'Hi! How can I help you today?',
    "primaryColor" TEXT NOT NULL DEFAULT '#4c85ff',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatbotConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatbotConversation" (
    "id" TEXT NOT NULL,
    "chatbotId" TEXT NOT NULL,
    "visitorName" TEXT,
    "visitorEmail" TEXT,
    "messages" TEXT NOT NULL,
    "leadCaptured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatbotConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewCampaign" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewUrl" TEXT,
    "sentAt" TIMESTAMP(3),
    "remindedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "rating" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentJob" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'blog',
    "title" TEXT,
    "content" TEXT,
    "keywords" TEXT,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "publishAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailCampaign" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'drip',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "recipients" INTEGER NOT NULL DEFAULT 0,
    "opens" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "serviceType" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "notes" TEXT,
    "locationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPost" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "author" TEXT NOT NULL DEFAULT 'Seth Brueland',
    "category" TEXT NOT NULL,
    "tags" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingStep" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "stepKey" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OnboardingStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralCode" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "referredClientId" TEXT,
    "creditCents" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketMessage" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "senderRole" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "actionUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NPSResponse" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "feedback" TEXT,
    "surveyType" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "NPSResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdCampaign" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "externalId" TEXT,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "budget" INTEGER NOT NULL DEFAULT 0,
    "spent" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "costPerLead" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "targeting" TEXT,
    "adCopy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agency" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ownerAccountId" TEXT NOT NULL,
    "logoUrl" TEXT,
    "primaryColor" TEXT,
    "accentColor" TEXT,
    "customDomain" TEXT,
    "starterPrice" INTEGER,
    "growthPrice" INTEGER,
    "empirePrice" INTEGER,
    "stripeAccountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Agency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentExecution" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "agentType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "input" TEXT,
    "output" TEXT,
    "error" TEXT,
    "triggeredBy" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "totalCostCents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentStep" (
    "id" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "input" TEXT,
    "output" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "tokensUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertLog" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlertLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "config" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlertRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnomalyLog" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" TEXT,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnomalyLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalRequest" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "agentExecutionId" TEXT,
    "actionType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "payload" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovernanceRule" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "ruleType" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "scope" TEXT,
    "config" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GovernanceRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetTracker" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "limitCents" INTEGER NOT NULL,
    "spentCents" INTEGER NOT NULL DEFAULT 0,
    "alertThreshold" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BudgetTracker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "accountId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailQueue" (
    "id" TEXT NOT NULL,
    "clientId" TEXT,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "html" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "lastError" TEXT,
    "messageId" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailEvent" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT,
    "messageId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrchestrationEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "payload" TEXT,
    "clientId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "processedAt" TIMESTAMP(3),
    "claimedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrchestrationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventSubscription" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "handlerKey" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FSMConnection" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "externalAccountId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "syncStatus" TEXT NOT NULL DEFAULT 'pending',
    "syncError" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "config" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FSMConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FSMSyncLog" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "externalId" TEXT,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FSMSyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FranchiseLocation" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "phone" TEXT,
    "manager" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "leadsThisMonth" INTEGER NOT NULL DEFAULT 0,
    "revenueThisMonth" INTEGER NOT NULL DEFAULT 0,
    "bookingsThisMonth" INTEGER NOT NULL DEFAULT 0,
    "avgRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FranchiseLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancingApplication" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT,
    "amount" INTEGER NOT NULL,
    "term" INTEGER NOT NULL,
    "apr" DOUBLE PRECISION NOT NULL,
    "monthlyPayment" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "externalId" TEXT,
    "prequalAmount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinancingApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT,
    "customerEmail" TEXT,
    "description" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "stripePaymentLinkId" TEXT,
    "stripePaymentLinkUrl" TEXT,
    "paidAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobPosting" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requirements" TEXT NOT NULL,
    "compensation" TEXT,
    "location" TEXT,
    "type" TEXT NOT NULL DEFAULT 'full-time',
    "status" TEXT NOT NULL DEFAULT 'active',
    "applicantCount" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobPosting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Applicant" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "experience" TEXT,
    "certifications" TEXT NOT NULL,
    "coverLetter" TEXT,
    "aiScore" INTEGER,
    "aiSummary" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Applicant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "phone" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MCPApiKey" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "scopes" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MCPApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MCPUsageLog" (
    "id" TEXT NOT NULL,
    "apiKeyId" TEXT NOT NULL,
    "tool" TEXT NOT NULL,
    "input" TEXT,
    "output" TEXT,
    "durationMs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MCPUsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissedCallTextback" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "callerPhone" TEXT NOT NULL,
    "textSent" BOOLEAN NOT NULL DEFAULT false,
    "textMessage" TEXT,
    "callSid" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MissedCallTextback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformancePlan" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "pricePerLead" INTEGER NOT NULL,
    "pricePerBooking" INTEGER NOT NULL,
    "monthlyMinimum" INTEGER NOT NULL,
    "monthlyCap" INTEGER,
    "servicesIncluded" TEXT,
    "billingCycleStart" TIMESTAMP(3) NOT NULL,
    "currentLeadCount" INTEGER NOT NULL DEFAULT 0,
    "currentBookingCount" INTEGER NOT NULL DEFAULT 0,
    "currentCharges" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerformancePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceEvent" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "leadId" TEXT,
    "bookingId" TEXT,
    "description" TEXT,
    "invoiced" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerformanceEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhoneCall" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "callSid" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ringing',
    "sentiment" TEXT,
    "duration" INTEGER,
    "transcript" TEXT,
    "transcription" TEXT,
    "summary" TEXT,
    "recordingUrl" TEXT,
    "leadId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhoneCall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhotoEstimate" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "imageUrl" TEXT NOT NULL,
    "vertical" TEXT,
    "issueCategory" TEXT,
    "issueDescription" TEXT,
    "estimateLow" INTEGER,
    "estimateHigh" INTEGER,
    "confidence" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "leadId" TEXT,
    "bookingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhotoEstimate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PredictiveInsight" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "impact" TEXT NOT NULL DEFAULT 'medium',
    "recommendation" TEXT,
    "actionUrl" TEXT,
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PredictiveInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "leadId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT,
    "customerEmail" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "lineItems" TEXT NOT NULL,
    "subtotal" INTEGER NOT NULL,
    "tax" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "shareToken" TEXT,
    "sentAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceptionistConfig" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "greeting" TEXT,
    "businessName" TEXT,
    "businessHours" TEXT,
    "afterHoursMsg" TEXT,
    "emergencyKeywords" TEXT NOT NULL,
    "emergencyAction" TEXT,
    "emergencyPhone" TEXT,
    "voiceId" TEXT,
    "maxCallMinutes" INTEGER,
    "collectInfo" TEXT NOT NULL,
    "canBookJobs" BOOLEAN,
    "systemPrompt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReceptionistConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueEvent" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "leadId" TEXT,
    "bookingId" TEXT,
    "invoiceId" TEXT,
    "channel" TEXT,
    "campaignId" TEXT,
    "eventType" TEXT NOT NULL,
    "amount" INTEGER,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevenueEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewResponse" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "reviewerName" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "reviewText" TEXT,
    "responseText" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SEOKeyword" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "position" INTEGER,
    "prevPosition" INTEGER,
    "searchVolume" INTEGER,
    "difficulty" INTEGER,
    "url" TEXT,
    "trackedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SEOKeyword_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeasonalCampaign" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "vertical" TEXT,
    "season" TEXT,
    "triggerMonth" INTEGER,
    "subject" TEXT,
    "body" TEXT,
    "discount" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),
    "totalSent" INTEGER NOT NULL DEFAULT 0,
    "totalBooked" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeasonalCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceArea" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceReminder" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "serviceType" TEXT NOT NULL,
    "lastServiceDate" TIMESTAMP(3) NOT NULL,
    "nextDueDate" TIMESTAMP(3) NOT NULL,
    "frequency" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sentAt" TIMESTAMP(3),
    "bookedAt" TIMESTAMP(3),
    "revenue" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceReminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SnapshotReport" (
    "id" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "website" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "vertical" TEXT,
    "city" TEXT,
    "state" TEXT,
    "seoScore" INTEGER NOT NULL DEFAULT 0,
    "reviewScore" INTEGER NOT NULL DEFAULT 0,
    "socialScore" INTEGER NOT NULL DEFAULT 0,
    "websiteScore" INTEGER NOT NULL DEFAULT 0,
    "overallScore" INTEGER NOT NULL DEFAULT 0,
    "findings" TEXT NOT NULL,
    "recommendations" TEXT NOT NULL,
    "estimatedRevenue" INTEGER NOT NULL DEFAULT 0,
    "shareToken" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SnapshotReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialPost" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mediaUrls" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "scheduledAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "engagement" TEXT,
    "externalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "vertical" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "tags" TEXT,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationThread" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "contactName" TEXT,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "lastMessageAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnifiedMessage" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "threadId" TEXT,
    "channel" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "senderName" TEXT,
    "senderContact" TEXT,
    "content" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UnifiedMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEndpoint" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "events" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookEndpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookLog" (
    "id" TEXT NOT NULL,
    "endpointId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "statusCode" INTEGER,
    "response" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AEOStrategy" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "impact" TEXT,
    "contentType" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AEOStrategy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AEOQuery" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "isCited" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER,
    "checkedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AEOQuery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AEOContent" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT,
    "targetQuery" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AEOContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndustryBenchmark" (
    "id" TEXT NOT NULL,
    "vertical" TEXT NOT NULL,
    "region" TEXT,
    "metric" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "p25" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "p50" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "p75" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "p90" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sampleSize" INTEGER NOT NULL DEFAULT 0,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IndustryBenchmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientBenchmarkScore" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "benchmarkId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "percentile" INTEGER NOT NULL DEFAULT 50,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientBenchmarkScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QBRReport" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "quarter" TEXT NOT NULL,
    "summary" TEXT,
    "metrics" TEXT,
    "highlights" TEXT,
    "recommendations" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QBRReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DigitalProduct" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT,
    "description" TEXT,
    "tier" TEXT,
    "category" TEXT,
    "price" INTEGER NOT NULL DEFAULT 0,
    "comparePrice" INTEGER,
    "imageUrl" TEXT,
    "previewUrl" TEXT,
    "deliveryType" TEXT NOT NULL DEFAULT 'download',
    "deliveryUrl" TEXT,
    "deliveryNotes" TEXT,
    "features" TEXT NOT NULL,
    "techStack" TEXT NOT NULL,
    "includes" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "salesCount" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DigitalProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductPurchase" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "stripeSessionId" TEXT,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "accessUrl" TEXT,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductReview" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "content" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerReferral" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "referrerName" TEXT NOT NULL,
    "referrerPhone" TEXT,
    "referrerEmail" TEXT,
    "referredName" TEXT NOT NULL,
    "referredPhone" TEXT,
    "referredEmail" TEXT,
    "code" TEXT NOT NULL,
    "reward" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerReferral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityPost" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityComment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallLog" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "callerPhone" TEXT NOT NULL,
    "callerName" TEXT,
    "status" TEXT NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "isEmergency" BOOLEAN NOT NULL DEFAULT false,
    "sentiment" TEXT,
    "summary" TEXT,
    "transcript" TEXT,
    "recordingUrl" TEXT,
    "bookingCreated" BOOLEAN NOT NULL DEFAULT false,
    "bookingId" TEXT,
    "leadCreated" BOOLEAN NOT NULL DEFAULT false,
    "leadId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CallLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeArticle" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerLifetimeValue" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerName" TEXT,
    "totalJobs" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" INTEGER NOT NULL DEFAULT 0,
    "avgJobValue" INTEGER NOT NULL DEFAULT 0,
    "firstJobDate" TIMESTAMP(3),
    "lastJobDate" TIMESTAMP(3),
    "predictedLTV" INTEGER NOT NULL DEFAULT 0,
    "churnRisk" TEXT,
    "segment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerLifetimeValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliatePartner" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company" TEXT,
    "website" TEXT,
    "slug" TEXT NOT NULL,
    "commissionRate" INTEGER NOT NULL DEFAULT 30,
    "tier" TEXT NOT NULL DEFAULT 'standard',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "totalEarned" INTEGER NOT NULL DEFAULT 0,
    "totalPaid" INTEGER NOT NULL DEFAULT 0,
    "stripeAccountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliatePartner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateReferral" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "clientId" TEXT,
    "code" TEXT NOT NULL,
    "email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'clicked',
    "monthlyAmount" INTEGER NOT NULL DEFAULT 0,
    "totalEarned" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "convertedAt" TIMESTAMP(3),

    CONSTRAINT "AffiliateReferral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliatePayout" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AffiliatePayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProspectLead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "source" TEXT NOT NULL,
    "trade" TEXT,
    "partnerSlug" TEXT,
    "referralCode" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "metadata" JSONB,
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProspectLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceConfig" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "physicalAddress" TEXT NOT NULL,
    "fromName" TEXT NOT NULL,
    "fromEmail" TEXT NOT NULL,
    "tcpaConsentRequired" BOOLEAN NOT NULL DEFAULT true,
    "smsQuietStartHour" INTEGER NOT NULL DEFAULT 8,
    "smsQuietEndHour" INTEGER NOT NULL DEFAULT 21,
    "timezone" TEXT NOT NULL DEFAULT 'America/Chicago',
    "maxContactAttempts" INTEGER NOT NULL DEFAULT 3,
    "cooldownDays" INTEGER NOT NULL DEFAULT 30,
    "dataPurgeDays" INTEGER NOT NULL DEFAULT 90,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentRecord" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "channel" TEXT NOT NULL,
    "consentType" TEXT NOT NULL,
    "consentSource" TEXT NOT NULL,
    "consentText" TEXT,
    "ipAddress" TEXT,
    "consentedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuppressionList" (
    "id" TEXT NOT NULL,
    "clientId" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "channel" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SuppressionList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactAttemptLog" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "blockReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactAttemptLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscoverySource" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "config" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),
    "lastRunStatus" TEXT,
    "lastRunError" TEXT,
    "lastRunCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscoverySource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscoveredLead" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "externalId" TEXT,
    "propertyAddress" TEXT,
    "ownerName" TEXT,
    "ownerEmail" TEXT,
    "ownerPhone" TEXT,
    "propertyAge" INTEGER,
    "propertyType" TEXT,
    "saleDate" TIMESTAMP(3),
    "salePrice" INTEGER,
    "permitType" TEXT,
    "permitDate" TIMESTAMP(3),
    "reviewPlatform" TEXT,
    "reviewRating" INTEGER,
    "reviewSnippet" TEXT,
    "competitorName" TEXT,
    "seasonalTrigger" TEXT,
    "rawData" TEXT,
    "discoveryScore" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'new',
    "convertedLeadId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscoveredLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnrichmentRecord" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "leadId" TEXT,
    "discoveredLeadId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "addressInput" TEXT,
    "ownerName" TEXT,
    "mailingAddress" TEXT,
    "emailFound" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailSource" TEXT,
    "phoneFound" TEXT,
    "phoneLineType" TEXT,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "socialProfiles" TEXT,
    "propertyAge" INTEGER,
    "propertyValue" INTEGER,
    "lastPermitDate" TIMESTAMP(3),
    "lastPermitType" TEXT,
    "enrichedAt" TIMESTAMP(3),
    "rawData" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnrichmentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnrichmentProvider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "apiKeyEnv" TEXT NOT NULL,
    "rateLimit" INTEGER NOT NULL DEFAULT 100,
    "costPerCall" INTEGER NOT NULL DEFAULT 0,
    "config" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnrichmentProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachDomain" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "dailyLimit" INTEGER NOT NULL DEFAULT 20,
    "currentDailySent" INTEGER NOT NULL DEFAULT 0,
    "warmupStartDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "warmupComplete" BOOLEAN NOT NULL DEFAULT false,
    "rampRate" INTEGER NOT NULL DEFAULT 10,
    "maxDailyLimit" INTEGER NOT NULL DEFAULT 200,
    "reputation" TEXT NOT NULL DEFAULT 'warming',
    "lastResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutreachDomain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachSequence" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'email',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "steps" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutreachSequence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachEntry" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "sequenceId" TEXT NOT NULL,
    "leadId" TEXT,
    "discoveredLeadId" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "contactName" TEXT,
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastStepAt" TIMESTAMP(3),
    "nextStepAt" TIMESTAMP(3),
    "personalizedData" TEXT,
    "engagementData" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutreachEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmsWarmupTracker" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "dailyLimit" INTEGER NOT NULL DEFAULT 50,
    "currentDailySent" INTEGER NOT NULL DEFAULT 0,
    "warmupStartDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "warmupComplete" BOOLEAN NOT NULL DEFAULT false,
    "rampRate" INTEGER NOT NULL DEFAULT 25,
    "maxDailyLimit" INTEGER NOT NULL DEFAULT 500,
    "lastResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmsWarmupTracker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FollowUpSequence" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "triggerType" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "steps" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FollowUpSequence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FollowUpEntry" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "sequenceId" TEXT NOT NULL,
    "leadId" TEXT,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "currentChannel" TEXT NOT NULL DEFAULT 'email',
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastStepAt" TIMESTAMP(3),
    "nextStepAt" TIMESTAMP(3),
    "engagementLog" TEXT,
    "replyClassification" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FollowUpEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelegramConfig" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "accountId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "alertLevels" TEXT NOT NULL DEFAULT '["critical","revenue"]',
    "dailyDigest" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelegramConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelegramCommandLog" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "command" TEXT NOT NULL,
    "args" TEXT,
    "response" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelegramCommandLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ROIReport" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "periodType" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "totalLeads" INTEGER NOT NULL DEFAULT 0,
    "totalBookings" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" INTEGER NOT NULL DEFAULT 0,
    "totalSpend" INTEGER NOT NULL DEFAULT 0,
    "roi" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "channelBreakdown" TEXT,
    "sourceBreakdown" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ROIReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prospect" (
    "id" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "ownerName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "vertical" TEXT,
    "city" TEXT,
    "state" TEXT,
    "estimatedRevenue" INTEGER,
    "employeeCount" INTEGER,
    "techReadiness" INTEGER,
    "painSignals" TEXT,
    "budgetSignals" TEXT,
    "score" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'new',
    "source" TEXT,
    "outreachEntryId" TEXT,
    "lastContactedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prospect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProspectActivity" (
    "id" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProspectActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseStudy" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "vertical" TEXT,
    "metrics" TEXT NOT NULL,
    "narrative" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseStudy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "pricing" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "shareToken" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "viewedAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_email_key" ON "Account"("email");

-- CreateIndex
CREATE UNIQUE INDEX "MagicLink_token_key" ON "MagicLink"("token");

-- CreateIndex
CREATE INDEX "MagicLink_accountId_idx" ON "MagicLink"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_accountId_idx" ON "Session"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "Client_accountId_key" ON "Client"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_clientId_key" ON "Subscription"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeSubId_key" ON "Subscription"("stripeSubId");

-- CreateIndex
CREATE INDEX "ClientService_clientId_idx" ON "ClientService"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientService_clientId_serviceId_key" ON "ClientService"("clientId", "serviceId");

-- CreateIndex
CREATE INDEX "Lead_clientId_idx" ON "Lead"("clientId");

-- CreateIndex
CREATE INDEX "Lead_createdAt_idx" ON "Lead"("createdAt");

-- CreateIndex
CREATE INDEX "Lead_locationId_idx" ON "Lead"("locationId");

-- CreateIndex
CREATE INDEX "ActivityEvent_clientId_createdAt_idx" ON "ActivityEvent"("clientId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ChatbotConfig_clientId_key" ON "ChatbotConfig"("clientId");

-- CreateIndex
CREATE INDEX "ChatbotConversation_chatbotId_idx" ON "ChatbotConversation"("chatbotId");

-- CreateIndex
CREATE INDEX "ReviewCampaign_clientId_idx" ON "ReviewCampaign"("clientId");

-- CreateIndex
CREATE INDEX "ContentJob_clientId_idx" ON "ContentJob"("clientId");

-- CreateIndex
CREATE INDEX "EmailCampaign_clientId_idx" ON "EmailCampaign"("clientId");

-- CreateIndex
CREATE INDEX "Booking_clientId_startsAt_idx" ON "Booking"("clientId", "startsAt");

-- CreateIndex
CREATE INDEX "Booking_locationId_idx" ON "Booking"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");

-- CreateIndex
CREATE INDEX "BlogPost_slug_idx" ON "BlogPost"("slug");

-- CreateIndex
CREATE INDEX "BlogPost_publishedAt_idx" ON "BlogPost"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingStep_clientId_stepKey_key" ON "OnboardingStep"("clientId", "stepKey");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralCode_code_key" ON "ReferralCode"("code");

-- CreateIndex
CREATE INDEX "ReferralCode_code_idx" ON "ReferralCode"("code");

-- CreateIndex
CREATE INDEX "SupportTicket_clientId_idx" ON "SupportTicket"("clientId");

-- CreateIndex
CREATE INDEX "TicketMessage_ticketId_idx" ON "TicketMessage"("ticketId");

-- CreateIndex
CREATE INDEX "Notification_accountId_read_idx" ON "Notification"("accountId", "read");

-- CreateIndex
CREATE INDEX "NPSResponse_clientId_idx" ON "NPSResponse"("clientId");

-- CreateIndex
CREATE INDEX "AdCampaign_clientId_idx" ON "AdCampaign"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "Agency_slug_key" ON "Agency"("slug");

-- CreateIndex
CREATE INDEX "Agency_ownerAccountId_idx" ON "Agency"("ownerAccountId");

-- CreateIndex
CREATE INDEX "AgentExecution_clientId_idx" ON "AgentExecution"("clientId");

-- CreateIndex
CREATE INDEX "AgentStep_executionId_idx" ON "AgentStep"("executionId");

-- CreateIndex
CREATE INDEX "AlertLog_severity_idx" ON "AlertLog"("severity");

-- CreateIndex
CREATE INDEX "AlertLog_resolved_idx" ON "AlertLog"("resolved");

-- CreateIndex
CREATE INDEX "AnomalyLog_clientId_idx" ON "AnomalyLog"("clientId");

-- CreateIndex
CREATE INDEX "ApprovalRequest_clientId_idx" ON "ApprovalRequest"("clientId");

-- CreateIndex
CREATE INDEX "ApprovalRequest_status_idx" ON "ApprovalRequest"("status");

-- CreateIndex
CREATE INDEX "GovernanceRule_clientId_idx" ON "GovernanceRule"("clientId");

-- CreateIndex
CREATE INDEX "BudgetTracker_clientId_idx" ON "BudgetTracker"("clientId");

-- CreateIndex
CREATE INDEX "AuditLog_accountId_idx" ON "AuditLog"("accountId");

-- CreateIndex
CREATE INDEX "AuditLog_resource_idx" ON "AuditLog"("resource");

-- CreateIndex
CREATE INDEX "EmailQueue_status_idx" ON "EmailQueue"("status");

-- CreateIndex
CREATE INDEX "EmailQueue_scheduledAt_idx" ON "EmailQueue"("scheduledAt");

-- CreateIndex
CREATE INDEX "EmailQueue_clientId_idx" ON "EmailQueue"("clientId");

-- CreateIndex
CREATE INDEX "EmailEvent_messageId_idx" ON "EmailEvent"("messageId");

-- CreateIndex
CREATE INDEX "EmailEvent_campaignId_idx" ON "EmailEvent"("campaignId");

-- CreateIndex
CREATE INDEX "OrchestrationEvent_status_idx" ON "OrchestrationEvent"("status");

-- CreateIndex
CREATE INDEX "OrchestrationEvent_type_idx" ON "OrchestrationEvent"("type");

-- CreateIndex
CREATE INDEX "EventSubscription_eventType_idx" ON "EventSubscription"("eventType");

-- CreateIndex
CREATE UNIQUE INDEX "FSMConnection_clientId_platform_key" ON "FSMConnection"("clientId", "platform");

-- CreateIndex
CREATE INDEX "FSMSyncLog_connectionId_idx" ON "FSMSyncLog"("connectionId");

-- CreateIndex
CREATE INDEX "FranchiseLocation_clientId_idx" ON "FranchiseLocation"("clientId");

-- CreateIndex
CREATE INDEX "FinancingApplication_clientId_idx" ON "FinancingApplication"("clientId");

-- CreateIndex
CREATE INDEX "Invoice_clientId_idx" ON "Invoice"("clientId");

-- CreateIndex
CREATE INDEX "JobPosting_clientId_idx" ON "JobPosting"("clientId");

-- CreateIndex
CREATE INDEX "Applicant_jobId_idx" ON "Applicant"("jobId");

-- CreateIndex
CREATE INDEX "Location_clientId_idx" ON "Location"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "MCPApiKey_keyHash_key" ON "MCPApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "MCPApiKey_accountId_idx" ON "MCPApiKey"("accountId");

-- CreateIndex
CREATE INDEX "MCPUsageLog_apiKeyId_idx" ON "MCPUsageLog"("apiKeyId");

-- CreateIndex
CREATE INDEX "MissedCallTextback_clientId_idx" ON "MissedCallTextback"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "PerformancePlan_clientId_key" ON "PerformancePlan"("clientId");

-- CreateIndex
CREATE INDEX "PerformanceEvent_clientId_idx" ON "PerformanceEvent"("clientId");

-- CreateIndex
CREATE INDEX "PerformanceEvent_planId_idx" ON "PerformanceEvent"("planId");

-- CreateIndex
CREATE UNIQUE INDEX "PhoneCall_callSid_key" ON "PhoneCall"("callSid");

-- CreateIndex
CREATE INDEX "PhoneCall_clientId_idx" ON "PhoneCall"("clientId");

-- CreateIndex
CREATE INDEX "PhotoEstimate_clientId_idx" ON "PhotoEstimate"("clientId");

-- CreateIndex
CREATE INDEX "PredictiveInsight_clientId_idx" ON "PredictiveInsight"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_accountId_endpoint_key" ON "PushSubscription"("accountId", "endpoint");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_shareToken_key" ON "Quote"("shareToken");

-- CreateIndex
CREATE INDEX "Quote_clientId_idx" ON "Quote"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "ReceptionistConfig_clientId_key" ON "ReceptionistConfig"("clientId");

-- CreateIndex
CREATE INDEX "RevenueEvent_clientId_idx" ON "RevenueEvent"("clientId");

-- CreateIndex
CREATE INDEX "RevenueEvent_createdAt_idx" ON "RevenueEvent"("createdAt");

-- CreateIndex
CREATE INDEX "ReviewResponse_clientId_idx" ON "ReviewResponse"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "SEOKeyword_clientId_keyword_key" ON "SEOKeyword"("clientId", "keyword");

-- CreateIndex
CREATE INDEX "SeasonalCampaign_clientId_idx" ON "SeasonalCampaign"("clientId");

-- CreateIndex
CREATE INDEX "ServiceArea_clientId_idx" ON "ServiceArea"("clientId");

-- CreateIndex
CREATE INDEX "ServiceArea_zip_idx" ON "ServiceArea"("zip");

-- CreateIndex
CREATE INDEX "ServiceReminder_clientId_idx" ON "ServiceReminder"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "SnapshotReport_shareToken_key" ON "SnapshotReport"("shareToken");

-- CreateIndex
CREATE INDEX "SnapshotReport_shareToken_idx" ON "SnapshotReport"("shareToken");

-- CreateIndex
CREATE INDEX "SocialPost_clientId_idx" ON "SocialPost"("clientId");

-- CreateIndex
CREATE INDEX "Template_category_idx" ON "Template"("category");

-- CreateIndex
CREATE INDEX "ConversationThread_clientId_idx" ON "ConversationThread"("clientId");

-- CreateIndex
CREATE INDEX "ConversationThread_lastMessageAt_idx" ON "ConversationThread"("lastMessageAt");

-- CreateIndex
CREATE INDEX "UnifiedMessage_clientId_idx" ON "UnifiedMessage"("clientId");

-- CreateIndex
CREATE INDEX "UnifiedMessage_threadId_idx" ON "UnifiedMessage"("threadId");

-- CreateIndex
CREATE INDEX "WebhookEndpoint_clientId_idx" ON "WebhookEndpoint"("clientId");

-- CreateIndex
CREATE INDEX "WebhookLog_endpointId_idx" ON "WebhookLog"("endpointId");

-- CreateIndex
CREATE INDEX "AEOStrategy_clientId_idx" ON "AEOStrategy"("clientId");

-- CreateIndex
CREATE INDEX "AEOQuery_clientId_idx" ON "AEOQuery"("clientId");

-- CreateIndex
CREATE INDEX "AEOContent_clientId_idx" ON "AEOContent"("clientId");

-- CreateIndex
CREATE INDEX "IndustryBenchmark_vertical_period_idx" ON "IndustryBenchmark"("vertical", "period");

-- CreateIndex
CREATE UNIQUE INDEX "ClientBenchmarkScore_clientId_benchmarkId_key" ON "ClientBenchmarkScore"("clientId", "benchmarkId");

-- CreateIndex
CREATE UNIQUE INDEX "QBRReport_clientId_quarter_key" ON "QBRReport"("clientId", "quarter");

-- CreateIndex
CREATE UNIQUE INDEX "DigitalProduct_slug_key" ON "DigitalProduct"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ProductPurchase_productId_accountId_key" ON "ProductPurchase"("productId", "accountId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductReview_productId_accountId_key" ON "ProductReview"("productId", "accountId");

-- CreateIndex
CREATE INDEX "CustomerReferral_clientId_idx" ON "CustomerReferral"("clientId");

-- CreateIndex
CREATE INDEX "CommunityPost_authorId_idx" ON "CommunityPost"("authorId");

-- CreateIndex
CREATE INDEX "CommunityPost_category_idx" ON "CommunityPost"("category");

-- CreateIndex
CREATE INDEX "CommunityComment_postId_idx" ON "CommunityComment"("postId");

-- CreateIndex
CREATE INDEX "CommunityComment_authorId_idx" ON "CommunityComment"("authorId");

-- CreateIndex
CREATE INDEX "CallLog_clientId_idx" ON "CallLog"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeArticle_slug_key" ON "KnowledgeArticle"("slug");

-- CreateIndex
CREATE INDEX "KnowledgeArticle_category_idx" ON "KnowledgeArticle"("category");

-- CreateIndex
CREATE INDEX "CustomerLifetimeValue_clientId_idx" ON "CustomerLifetimeValue"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliatePartner_accountId_key" ON "AffiliatePartner"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliatePartner_email_key" ON "AffiliatePartner"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliatePartner_slug_key" ON "AffiliatePartner"("slug");

-- CreateIndex
CREATE INDEX "AffiliatePartner_slug_idx" ON "AffiliatePartner"("slug");

-- CreateIndex
CREATE INDEX "AffiliatePartner_email_idx" ON "AffiliatePartner"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateReferral_code_key" ON "AffiliateReferral"("code");

-- CreateIndex
CREATE INDEX "AffiliateReferral_affiliateId_idx" ON "AffiliateReferral"("affiliateId");

-- CreateIndex
CREATE INDEX "AffiliateReferral_code_idx" ON "AffiliateReferral"("code");

-- CreateIndex
CREATE INDEX "AffiliatePayout_affiliateId_idx" ON "AffiliatePayout"("affiliateId");

-- CreateIndex
CREATE INDEX "ProspectLead_email_idx" ON "ProspectLead"("email");

-- CreateIndex
CREATE INDEX "ProspectLead_source_idx" ON "ProspectLead"("source");

-- CreateIndex
CREATE INDEX "ProspectLead_partnerSlug_idx" ON "ProspectLead"("partnerSlug");

-- CreateIndex
CREATE INDEX "ProspectLead_createdAt_idx" ON "ProspectLead"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ComplianceConfig_clientId_key" ON "ComplianceConfig"("clientId");

-- CreateIndex
CREATE INDEX "ConsentRecord_clientId_idx" ON "ConsentRecord"("clientId");

-- CreateIndex
CREATE INDEX "ConsentRecord_contactPhone_idx" ON "ConsentRecord"("contactPhone");

-- CreateIndex
CREATE INDEX "ConsentRecord_contactEmail_idx" ON "ConsentRecord"("contactEmail");

-- CreateIndex
CREATE INDEX "ConsentRecord_channel_idx" ON "ConsentRecord"("channel");

-- CreateIndex
CREATE INDEX "SuppressionList_contactEmail_idx" ON "SuppressionList"("contactEmail");

-- CreateIndex
CREATE INDEX "SuppressionList_contactPhone_idx" ON "SuppressionList"("contactPhone");

-- CreateIndex
CREATE INDEX "SuppressionList_channel_idx" ON "SuppressionList"("channel");

-- CreateIndex
CREATE INDEX "SuppressionList_clientId_idx" ON "SuppressionList"("clientId");

-- CreateIndex
CREATE INDEX "ContactAttemptLog_clientId_idx" ON "ContactAttemptLog"("clientId");

-- CreateIndex
CREATE INDEX "ContactAttemptLog_contactPhone_createdAt_idx" ON "ContactAttemptLog"("contactPhone", "createdAt");

-- CreateIndex
CREATE INDEX "ContactAttemptLog_contactEmail_createdAt_idx" ON "ContactAttemptLog"("contactEmail", "createdAt");

-- CreateIndex
CREATE INDEX "DiscoverySource_clientId_idx" ON "DiscoverySource"("clientId");

-- CreateIndex
CREATE INDEX "DiscoverySource_type_idx" ON "DiscoverySource"("type");

-- CreateIndex
CREATE INDEX "DiscoveredLead_clientId_idx" ON "DiscoveredLead"("clientId");

-- CreateIndex
CREATE INDEX "DiscoveredLead_sourceId_idx" ON "DiscoveredLead"("sourceId");

-- CreateIndex
CREATE INDEX "DiscoveredLead_status_idx" ON "DiscoveredLead"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DiscoveredLead_clientId_sourceType_externalId_key" ON "DiscoveredLead"("clientId", "sourceType", "externalId");

-- CreateIndex
CREATE INDEX "EnrichmentRecord_clientId_idx" ON "EnrichmentRecord"("clientId");

-- CreateIndex
CREATE INDEX "EnrichmentRecord_leadId_idx" ON "EnrichmentRecord"("leadId");

-- CreateIndex
CREATE INDEX "EnrichmentRecord_discoveredLeadId_idx" ON "EnrichmentRecord"("discoveredLeadId");

-- CreateIndex
CREATE INDEX "EnrichmentRecord_status_idx" ON "EnrichmentRecord"("status");

-- CreateIndex
CREATE UNIQUE INDEX "EnrichmentProvider_name_key" ON "EnrichmentProvider"("name");

-- CreateIndex
CREATE INDEX "OutreachDomain_clientId_idx" ON "OutreachDomain"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "OutreachDomain_clientId_domain_key" ON "OutreachDomain"("clientId", "domain");

-- CreateIndex
CREATE INDEX "OutreachSequence_clientId_idx" ON "OutreachSequence"("clientId");

-- CreateIndex
CREATE INDEX "OutreachEntry_clientId_idx" ON "OutreachEntry"("clientId");

-- CreateIndex
CREATE INDEX "OutreachEntry_sequenceId_idx" ON "OutreachEntry"("sequenceId");

-- CreateIndex
CREATE INDEX "OutreachEntry_status_nextStepAt_idx" ON "OutreachEntry"("status", "nextStepAt");

-- CreateIndex
CREATE UNIQUE INDEX "SmsWarmupTracker_clientId_key" ON "SmsWarmupTracker"("clientId");

-- CreateIndex
CREATE INDEX "FollowUpSequence_clientId_idx" ON "FollowUpSequence"("clientId");

-- CreateIndex
CREATE INDEX "FollowUpEntry_clientId_idx" ON "FollowUpEntry"("clientId");

-- CreateIndex
CREATE INDEX "FollowUpEntry_status_nextStepAt_idx" ON "FollowUpEntry"("status", "nextStepAt");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramConfig_chatId_key" ON "TelegramConfig"("chatId");

-- CreateIndex
CREATE INDEX "TelegramCommandLog_chatId_idx" ON "TelegramCommandLog"("chatId");

-- CreateIndex
CREATE INDEX "ROIReport_clientId_idx" ON "ROIReport"("clientId");

-- CreateIndex
CREATE INDEX "ROIReport_periodStart_idx" ON "ROIReport"("periodStart");

-- CreateIndex
CREATE INDEX "Prospect_status_idx" ON "Prospect"("status");

-- CreateIndex
CREATE INDEX "Prospect_score_idx" ON "Prospect"("score");

-- CreateIndex
CREATE INDEX "ProspectActivity_prospectId_idx" ON "ProspectActivity"("prospectId");

-- CreateIndex
CREATE INDEX "CaseStudy_clientId_idx" ON "CaseStudy"("clientId");

-- CreateIndex
CREATE INDEX "CaseStudy_vertical_idx" ON "CaseStudy"("vertical");

-- CreateIndex
CREATE UNIQUE INDEX "Proposal_shareToken_key" ON "Proposal"("shareToken");

-- CreateIndex
CREATE INDEX "Proposal_prospectId_idx" ON "Proposal"("prospectId");

-- AddForeignKey
ALTER TABLE "MagicLink" ADD CONSTRAINT "MagicLink_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientService" ADD CONSTRAINT "ClientService_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityEvent" ADD CONSTRAINT "ActivityEvent_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatbotConfig" ADD CONSTRAINT "ChatbotConfig_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatbotConversation" ADD CONSTRAINT "ChatbotConversation_chatbotId_fkey" FOREIGN KEY ("chatbotId") REFERENCES "ChatbotConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewCampaign" ADD CONSTRAINT "ReviewCampaign_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentJob" ADD CONSTRAINT "ContentJob_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailCampaign" ADD CONSTRAINT "EmailCampaign_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingStep" ADD CONSTRAINT "OnboardingStep_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralCode" ADD CONSTRAINT "ReferralCode_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralCode" ADD CONSTRAINT "ReferralCode_referredClientId_fkey" FOREIGN KEY ("referredClientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketMessage" ADD CONSTRAINT "TicketMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NPSResponse" ADD CONSTRAINT "NPSResponse_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdCampaign" ADD CONSTRAINT "AdCampaign_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentExecution" ADD CONSTRAINT "AgentExecution_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentStep" ADD CONSTRAINT "AgentStep_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "AgentExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnomalyLog" ADD CONSTRAINT "AnomalyLog_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GovernanceRule" ADD CONSTRAINT "GovernanceRule_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetTracker" ADD CONSTRAINT "BudgetTracker_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailEvent" ADD CONSTRAINT "EmailEvent_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "EmailCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FSMConnection" ADD CONSTRAINT "FSMConnection_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FSMSyncLog" ADD CONSTRAINT "FSMSyncLog_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "FSMConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FranchiseLocation" ADD CONSTRAINT "FranchiseLocation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancingApplication" ADD CONSTRAINT "FinancingApplication_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPosting" ADD CONSTRAINT "JobPosting_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Applicant" ADD CONSTRAINT "Applicant_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "JobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MCPApiKey" ADD CONSTRAINT "MCPApiKey_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MCPUsageLog" ADD CONSTRAINT "MCPUsageLog_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "MCPApiKey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissedCallTextback" ADD CONSTRAINT "MissedCallTextback_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformancePlan" ADD CONSTRAINT "PerformancePlan_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceEvent" ADD CONSTRAINT "PerformanceEvent_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhoneCall" ADD CONSTRAINT "PhoneCall_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoEstimate" ADD CONSTRAINT "PhotoEstimate_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PredictiveInsight" ADD CONSTRAINT "PredictiveInsight_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceptionistConfig" ADD CONSTRAINT "ReceptionistConfig_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueEvent" ADD CONSTRAINT "RevenueEvent_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewResponse" ADD CONSTRAINT "ReviewResponse_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SEOKeyword" ADD CONSTRAINT "SEOKeyword_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonalCampaign" ADD CONSTRAINT "SeasonalCampaign_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceArea" ADD CONSTRAINT "ServiceArea_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceReminder" ADD CONSTRAINT "ServiceReminder_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPost" ADD CONSTRAINT "SocialPost_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationThread" ADD CONSTRAINT "ConversationThread_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnifiedMessage" ADD CONSTRAINT "UnifiedMessage_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookEndpoint" ADD CONSTRAINT "WebhookEndpoint_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookLog" ADD CONSTRAINT "WebhookLog_endpointId_fkey" FOREIGN KEY ("endpointId") REFERENCES "WebhookEndpoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AEOStrategy" ADD CONSTRAINT "AEOStrategy_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AEOQuery" ADD CONSTRAINT "AEOQuery_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AEOContent" ADD CONSTRAINT "AEOContent_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientBenchmarkScore" ADD CONSTRAINT "ClientBenchmarkScore_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientBenchmarkScore" ADD CONSTRAINT "ClientBenchmarkScore_benchmarkId_fkey" FOREIGN KEY ("benchmarkId") REFERENCES "IndustryBenchmark"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QBRReport" ADD CONSTRAINT "QBRReport_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductPurchase" ADD CONSTRAINT "ProductPurchase_productId_fkey" FOREIGN KEY ("productId") REFERENCES "DigitalProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductPurchase" ADD CONSTRAINT "ProductPurchase_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductReview" ADD CONSTRAINT "ProductReview_productId_fkey" FOREIGN KEY ("productId") REFERENCES "DigitalProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductReview" ADD CONSTRAINT "ProductReview_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerReferral" ADD CONSTRAINT "CustomerReferral_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPost" ADD CONSTRAINT "CommunityPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityComment" ADD CONSTRAINT "CommunityComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityComment" ADD CONSTRAINT "CommunityComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallLog" ADD CONSTRAINT "CallLog_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerLifetimeValue" ADD CONSTRAINT "CustomerLifetimeValue_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliatePartner" ADD CONSTRAINT "AffiliatePartner_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateReferral" ADD CONSTRAINT "AffiliateReferral_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "AffiliatePartner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateReferral" ADD CONSTRAINT "AffiliateReferral_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliatePayout" ADD CONSTRAINT "AffiliatePayout_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "AffiliatePartner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceConfig" ADD CONSTRAINT "ComplianceConfig_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuppressionList" ADD CONSTRAINT "SuppressionList_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactAttemptLog" ADD CONSTRAINT "ContactAttemptLog_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscoverySource" ADD CONSTRAINT "DiscoverySource_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscoveredLead" ADD CONSTRAINT "DiscoveredLead_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscoveredLead" ADD CONSTRAINT "DiscoveredLead_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "DiscoverySource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrichmentRecord" ADD CONSTRAINT "EnrichmentRecord_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachDomain" ADD CONSTRAINT "OutreachDomain_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachSequence" ADD CONSTRAINT "OutreachSequence_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachEntry" ADD CONSTRAINT "OutreachEntry_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachEntry" ADD CONSTRAINT "OutreachEntry_sequenceId_fkey" FOREIGN KEY ("sequenceId") REFERENCES "OutreachSequence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmsWarmupTracker" ADD CONSTRAINT "SmsWarmupTracker_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUpSequence" ADD CONSTRAINT "FollowUpSequence_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUpEntry" ADD CONSTRAINT "FollowUpEntry_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUpEntry" ADD CONSTRAINT "FollowUpEntry_sequenceId_fkey" FOREIGN KEY ("sequenceId") REFERENCES "FollowUpSequence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ROIReport" ADD CONSTRAINT "ROIReport_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProspectActivity" ADD CONSTRAINT "ProspectActivity_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE CASCADE ON UPDATE CASCADE;
