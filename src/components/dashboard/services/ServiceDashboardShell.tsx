"use client";

import { ChatbotDashboard } from "./ChatbotDashboard";
import { ReviewDashboard } from "./ReviewDashboard";
import { ContentDashboard } from "./ContentDashboard";
import { EmailDashboard } from "./EmailDashboard";
import { BookingDashboard } from "./BookingDashboard";
import { ManagedServiceDashboard } from "./ManagedServiceDashboard";

/**
 * Client component that renders the appropriate dashboard based on serviceId.
 * Specialized dashboards exist for chatbot, reviews, content, email, and booking.
 * All other services use the generic ManagedServiceDashboard.
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
    default:
      return <ManagedServiceDashboard serviceId={serviceId} />;
  }
}
