export type NotificationChannel = "in_app" | "email" | "sms" | "push";
export type NotificationPriority = "low" | "medium" | "high" | "urgent";

export interface NotificationConfig {
  type: string;
  channels: NotificationChannel[];
  priority: NotificationPriority;
  template?: string;
}

/**
 * Maps notification types to their default channels and priority.
 * Used to determine how to deliver each type of notification.
 */
export const NOTIFICATION_CONFIGS: Record<string, NotificationConfig> = {
  // Lead notifications
  new_lead: { type: "new_lead", channels: ["in_app", "email", "push"], priority: "high" },
  lead_converted: { type: "lead_converted", channels: ["in_app"], priority: "medium" },

  // Booking notifications
  booking_confirmed: { type: "booking_confirmed", channels: ["in_app", "email", "sms"], priority: "high" },
  booking_cancelled: { type: "booking_cancelled", channels: ["in_app", "email"], priority: "high" },
  booking_noshow: { type: "booking_noshow", channels: ["in_app", "email"], priority: "medium" },
  booking_reminder: { type: "booking_reminder", channels: ["sms", "push"], priority: "medium" },

  // Review notifications
  new_review: { type: "new_review", channels: ["in_app", "email", "push"], priority: "high" },
  negative_review: { type: "negative_review", channels: ["in_app", "email", "sms"], priority: "urgent" },

  // Billing notifications
  payment_received: { type: "payment_received", channels: ["in_app", "email"], priority: "low" },
  payment_failed: { type: "payment_failed", channels: ["in_app", "email", "sms"], priority: "urgent" },
  subscription_expiring: { type: "subscription_expiring", channels: ["in_app", "email"], priority: "high" },

  // System notifications
  service_activated: { type: "service_activated", channels: ["in_app", "email"], priority: "medium" },
  weekly_report: { type: "weekly_report", channels: ["email"], priority: "low" },
  system_alert: { type: "system_alert", channels: ["in_app"], priority: "high" },
};

/**
 * Gets the notification config for a given type, with fallback.
 */
export function getNotificationConfig(type: string): NotificationConfig {
  return NOTIFICATION_CONFIGS[type] ?? {
    type,
    channels: ["in_app"],
    priority: "medium" as NotificationPriority,
  };
}

/**
 * Filters channels based on user preferences.
 */
export function getActiveChannels(
  type: string,
  userPreferences?: Partial<Record<NotificationChannel, boolean>>,
): NotificationChannel[] {
  const config = getNotificationConfig(type);
  if (!userPreferences) return config.channels;

  return config.channels.filter(channel => {
    // Urgent notifications always go through all channels
    if (config.priority === "urgent") return true;
    // in_app is always enabled
    if (channel === "in_app") return true;
    return userPreferences[channel] !== false;
  });
}
