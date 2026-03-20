"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const PUSH_DISMISSED_KEY = "sovereign-push-dismissed";
const PUSH_SUBSCRIBED_KEY = "sovereign-push-subscribed";

export function PushNotificationPrompt() {
  const [visible, setVisible] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    // Don't show if:
    // - Already dismissed or subscribed
    // - Notifications not supported
    // - Already granted/denied
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;

    const dismissed = localStorage.getItem(PUSH_DISMISSED_KEY);
    const subscribed = localStorage.getItem(PUSH_SUBSCRIBED_KEY);

    if (dismissed || subscribed) return;
    if (Notification.permission === "denied") return;
    if (Notification.permission === "granted") return;

    // Show after a short delay for better UX
    const timer = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleEnable = useCallback(async () => {
    setSubscribing(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setVisible(false);
        localStorage.setItem(PUSH_DISMISSED_KEY, "true");
        return;
      }

      // Register service worker if not already
      const registration = await navigator.serviceWorker.ready;

      // Get VAPID public key from env
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      let subscription: PushSubscription | null = null;

      if (vapidKey) {
        // Convert VAPID key from base64 to Uint8Array
        const padding = "=".repeat((4 - (vapidKey.length % 4)) % 4);
        const base64 = (vapidKey + padding)
          .replace(/-/g, "+")
          .replace(/_/g, "/");
        const rawData = atob(base64);
        const applicationServerKey = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; i++) {
          applicationServerKey[i] = rawData.charCodeAt(i);
        }

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });
      } else {
        // Without VAPID key, try subscribing without applicationServerKey
        // This will work in some browsers for testing
        try {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
          });
        } catch {
          // Can't subscribe without VAPID key - just save the preference
          console.warn("Push subscription failed");
          localStorage.setItem(PUSH_SUBSCRIBED_KEY, "true");
          setVisible(false);
          return;
        }
      }

      if (subscription) {
        const subscriptionJSON = subscription.toJSON();

        // Send subscription to our API
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: subscriptionJSON.endpoint,
            keys: subscriptionJSON.keys,
          }),
        });
      }

      localStorage.setItem(PUSH_SUBSCRIBED_KEY, "true");
      setVisible(false);
    } catch (error) {
      console.error("Failed to enable push notifications:", error);
    } finally {
      setSubscribing(false);
    }
  }, []);

  const handleDismiss = useCallback(() => {
    localStorage.setItem(PUSH_DISMISSED_KEY, "true");
    setVisible(false);
  }, []);

  if (!visible) return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Bell className="h-5 w-5 text-primary" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Enable Push Notifications</p>
          <p className="text-xs text-muted-foreground">
            Get instant alerts when new leads come in, reviews are posted, and more.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            onClick={handleEnable}
            disabled={subscribing}
            className="gradient-bg text-white"
          >
            {subscribing ? "Enabling..." : "Enable"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
