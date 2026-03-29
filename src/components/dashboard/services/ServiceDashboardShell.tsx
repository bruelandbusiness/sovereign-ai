"use client";

import dynamic from "next/dynamic";

const DashboardLoadingSkeleton = () => (
  <div className="animate-pulse h-96 bg-muted rounded-lg" />
);

const dynamicOpts = {
  ssr: false as const,
  loading: DashboardLoadingSkeleton,
};

const ChatbotDashboard = dynamic(
  () => import("./ChatbotDashboard").then((m) => m.ChatbotDashboard),
  dynamicOpts,
);
const ReviewDashboard = dynamic(
  () => import("./ReviewDashboard").then((m) => m.ReviewDashboard),
  dynamicOpts,
);
const ContentDashboard = dynamic(
  () => import("./ContentDashboard").then((m) => m.ContentDashboard),
  dynamicOpts,
);
const EmailDashboard = dynamic(
  () => import("./EmailDashboard").then((m) => m.EmailDashboard),
  dynamicOpts,
);
const BookingDashboard = dynamic(
  () => import("./BookingDashboard").then((m) => m.BookingDashboard),
  dynamicOpts,
);
const AdsDashboard = dynamic(
  () => import("./AdsDashboard").then((m) => m.AdsDashboard),
  dynamicOpts,
);
const SEODashboard = dynamic(
  () => import("./SEODashboard").then((m) => m.SEODashboard),
  dynamicOpts,
);
const SocialDashboard = dynamic(
  () => import("./SocialDashboard").then((m) => m.SocialDashboard),
  dynamicOpts,
);
const AnalyticsDashboard = dynamic(
  () => import("./AnalyticsDashboard").then((m) => m.AnalyticsDashboard),
  dynamicOpts,
);
const ReputationDashboard = dynamic(
  () => import("./ReputationDashboard").then((m) => m.ReputationDashboard),
  dynamicOpts,
);
const RetargetingDashboard = dynamic(
  () => import("./RetargetingDashboard").then((m) => m.RetargetingDashboard),
  dynamicOpts,
);
const ReceptionistDashboard = dynamic(
  () => import("./ReceptionistDashboard").then((m) => m.ReceptionistDashboard),
  dynamicOpts,
);
const GBPDashboard = dynamic(
  () => import("./GBPDashboard").then((m) => m.GBPDashboard),
  dynamicOpts,
);
const FSMDashboard = dynamic(
  () => import("./FSMDashboard").then((m) => m.FSMDashboard),
  dynamicOpts,
);
const ReferralProgramDashboard = dynamic(
  () => import("./ReferralProgramDashboard").then((m) => m.ReferralProgramDashboard),
  dynamicOpts,
);
const EstimateDashboard = dynamic(
  () => import("./EstimateDashboard").then((m) => m.EstimateDashboard),
  dynamicOpts,
);
const AEODashboard = dynamic(
  () => import("./AEODashboard").then((m) => m.AEODashboard),
  dynamicOpts,
);
const LTVDashboard = dynamic(
  () => import("./LTVDashboard").then((m) => m.LTVDashboard),
  dynamicOpts,
);
const ManagedServiceDashboard = dynamic(
  () => import("./ManagedServiceDashboard").then((m) => m.ManagedServiceDashboard),
  dynamicOpts,
);

/**
 * Client component that renders the appropriate dashboard based on serviceId.
 * Specialized dashboards exist for many services; all others use the generic
 * ManagedServiceDashboard.
 *
 * All dashboard components are lazily loaded with next/dynamic (ssr: false)
 * to reduce the initial bundle size — only the active service's code is fetched.
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
