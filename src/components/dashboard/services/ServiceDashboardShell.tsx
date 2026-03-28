"use client";

import { ChatbotDashboard } from "./ChatbotDashboard";
import { ReviewDashboard } from "./ReviewDashboard";
import { ContentDashboard } from "./ContentDashboard";
import { EmailDashboard } from "./EmailDashboard";
import { BookingDashboard } from "./BookingDashboard";
import { AdsDashboard } from "./AdsDashboard";
import { SEODashboard } from "./SEODashboard";
import { SocialDashboard } from "./SocialDashboard";
import { AnalyticsDashboard } from "./AnalyticsDashboard";
import { ReputationDashboard } from "./ReputationDashboard";
import { RetargetingDashboard } from "./RetargetingDashboard";
import { ReceptionistDashboard } from "./ReceptionistDashboard";
import { GBPDashboard } from "./GBPDashboard";
import { FSMDashboard } from "./FSMDashboard";
import { ReferralProgramDashboard } from "./ReferralProgramDashboard";
import { EstimateDashboard } from "./EstimateDashboard";
import { AEODashboard } from "./AEODashboard";
import { LTVDashboard } from "./LTVDashboard";
import { ManagedServiceDashboard } from "./ManagedServiceDashboard";

/**
 * Client component that renders the appropriate dashboard based on serviceId.
 * Specialized dashboards exist for many services; all others use the generic
 * ManagedServiceDashboard.
 *
 * NOTE: Some services have aliases (e.g. the activator uses "ai-estimate" while
 * the dashboard route uses "estimate"). Both variants are handled here so the
 * correct dashboard renders regardless of which ID is stored in the database.
 */
export function ServiceDashboardShell({ serviceId }: { serviceId: string }) {
  switch (serviceId) {
    case "chatbot":
      return <ChatbotDashboard />;
    case "reviews":
      return <ReviewDashboard />;
    case "content":
      return <ContentDashboard />;
    case "email":
      return <EmailDashboard />;
    case "booking":
      return <BookingDashboard />;
    case "ads":
      return <AdsDashboard />;
    case "seo":
      return <SEODashboard />;
    case "social":
      return <SocialDashboard />;
    case "analytics":
      return <AnalyticsDashboard />;
    case "reputation":
      return <ReputationDashboard />;
    case "retargeting":
      return <RetargetingDashboard />;
    case "voice-agent":
    case "ai-receptionist":
      return <ReceptionistDashboard />;
    case "gbp":
      return <GBPDashboard />;
    case "fsm":
    case "fsm-sync":
      return <FSMDashboard />;
    case "referral-program":
      return <ReferralProgramDashboard />;
    case "estimate":
    case "ai-estimate":
      return <EstimateDashboard />;
    case "aeo":
      return <AEODashboard />;
    case "customer-ltv":
      return <LTVDashboard />;
    default:
      return <ManagedServiceDashboard serviceId={serviceId} />;
  }
}
