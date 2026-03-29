export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  href: string;
  priority: number;
  condition?: string;
}

/**
 * Returns contextual quick actions based on client state.
 * Prioritized by what would have the most impact right now.
 */
export function getQuickActions(clientState: {
  hasLeads: boolean;
  hasBookings: boolean;
  hasReviews: boolean;
  activeServices: string[];
  onboardingComplete: boolean;
  daysSinceSignup: number;
  unreadNotifications: number;
  pendingLeads: number;
}): QuickAction[] {
  const actions: QuickAction[] = [];

  // New user actions
  if (!clientState.onboardingComplete) {
    actions.push({
      id: "complete-onboarding",
      title: "Complete Your Setup",
      description: "Finish setting up your account to start getting leads",
      icon: "\u{1F680}",
      href: "/dashboard/settings",
      priority: 10,
      condition: "onboarding_incomplete",
    });
  }

  // Pending leads - the highest-value action for an active business
  if (clientState.pendingLeads > 0) {
    actions.push({
      id: "follow-up-leads",
      title: `Follow Up on ${clientState.pendingLeads} New Lead${clientState.pendingLeads === 1 ? "" : "s"}`,
      description: "Respond quickly to increase your close rate",
      icon: "\u{1F4DE}",
      href: "/dashboard/crm",
      priority: 9,
      condition: "has_pending_leads",
    });
  }

  // Unread notifications
  if (clientState.unreadNotifications > 0) {
    actions.push({
      id: "check-notifications",
      title: `${clientState.unreadNotifications} Unread Notification${clientState.unreadNotifications === 1 ? "" : "s"}`,
      description: "Stay on top of updates from your campaigns and leads",
      icon: "\u{1F514}",
      href: "/dashboard/notifications",
      priority: 8,
      condition: "has_unread_notifications",
    });
  }

  // No reviews yet - social proof is critical for home services
  if (!clientState.hasReviews) {
    actions.push({
      id: "request-first-review",
      title: "Get Your First Review",
      description:
        "Send a review request to a past customer to build trust with new leads",
      icon: "\u{2B50}",
      href: "/dashboard/reviews",
      priority: 8,
      condition: "no_reviews",
    });
  }

  // Has reviews but could always use more
  if (clientState.hasReviews && clientState.hasBookings) {
    actions.push({
      id: "request-more-reviews",
      title: "Request New Reviews",
      description:
        "Recent customers are most likely to leave a review - send requests now",
      icon: "\u{1F31F}",
      href: "/dashboard/reviews",
      priority: 5,
      condition: "has_reviews_and_bookings",
    });
  }

  // No bookings yet - drive the user toward their first job
  if (!clientState.hasBookings && clientState.onboardingComplete) {
    actions.push({
      id: "create-first-booking",
      title: "Schedule Your First Job",
      description:
        "Add an upcoming job to your calendar to keep your pipeline organized",
      icon: "\u{1F4C5}",
      href: "/dashboard/bookings",
      priority: 7,
      condition: "no_bookings",
    });
  }

  // No active services configured
  if (clientState.activeServices.length === 0) {
    actions.push({
      id: "add-services",
      title: "Add Your Services",
      description:
        "List the services you offer so customers can find and book you",
      icon: "\u{1F6E0}\u{FE0F}",
      href: "/dashboard/services",
      priority: 9,
      condition: "no_services",
    });
  }

  // Few services - suggest expanding
  if (
    clientState.activeServices.length > 0 &&
    clientState.activeServices.length < 3
  ) {
    actions.push({
      id: "expand-services",
      title: "Add More Services",
      description:
        "Businesses with 3+ listed services get 40% more lead inquiries",
      icon: "\u{1F4CB}",
      href: "/dashboard/services",
      priority: 4,
      condition: "few_services",
    });
  }

  // Early days - encourage profile completion for SEO
  if (clientState.daysSinceSignup <= 7 && clientState.onboardingComplete) {
    actions.push({
      id: "optimize-profile",
      title: "Optimize Your Business Profile",
      description:
        "A complete profile ranks higher in local search results",
      icon: "\u{1F50D}",
      href: "/dashboard/settings/profile",
      priority: 6,
      condition: "new_user_first_week",
    });
  }

  // Has leads but no bookings - conversion issue
  if (clientState.hasLeads && !clientState.hasBookings) {
    actions.push({
      id: "convert-leads",
      title: "Convert Your Leads to Bookings",
      description:
        "You have leads waiting - follow up and schedule jobs to grow revenue",
      icon: "\u{1F4B0}",
      href: "/dashboard/crm",
      priority: 8,
      condition: "leads_no_bookings",
    });
  }

  // Established user - check analytics
  if (clientState.daysSinceSignup > 14 && clientState.hasLeads) {
    actions.push({
      id: "review-analytics",
      title: "Review Your Performance",
      description:
        "See which channels are driving leads and where to focus your budget",
      icon: "\u{1F4CA}",
      href: "/dashboard/analytics",
      priority: 3,
      condition: "established_user_with_leads",
    });
  }

  // Mature account - upsell opportunities
  if (clientState.daysSinceSignup > 30 && clientState.hasBookings) {
    actions.push({
      id: "explore-growth",
      title: "Explore Growth Tools",
      description:
        "Unlock automated follow-ups, seasonal campaigns, and referral tracking",
      icon: "\u{1F4C8}",
      href: "/dashboard/growth",
      priority: 2,
      condition: "mature_account",
    });
  }

  // Sort by priority descending and return top 5
  return actions.sort((a, b) => b.priority - a.priority).slice(0, 5);
}
