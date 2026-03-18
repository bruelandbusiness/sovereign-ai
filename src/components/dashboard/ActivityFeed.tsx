"use client";

import {
  Phone,
  Mail,
  Star,
  FileText,
  Send,
  Megaphone,
  MessageSquare,
  Search,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FadeInView } from "@/components/shared/FadeInView";
import { ActivityItemRow } from "./ActivityItem";

import type { LucideIcon } from "lucide-react";

const TYPE_ICONS: Record<string, { icon: LucideIcon; color: string }> = {
  lead_captured: { icon: Phone, color: "bg-emerald-500/10 text-emerald-400" },
  review_received: { icon: Star, color: "bg-amber-500/10 text-amber-400" },
  call_booked: { icon: Phone, color: "bg-emerald-500/10 text-emerald-400" },
  email_sent: { icon: Mail, color: "bg-blue-500/10 text-blue-400" },
  content_published: { icon: FileText, color: "bg-purple-500/10 text-purple-400" },
  review_response: { icon: MessageSquare, color: "bg-amber-500/10 text-amber-400" },
  ad_optimized: { icon: Megaphone, color: "bg-blue-500/10 text-blue-400" },
  seo_update: { icon: Search, color: "bg-purple-500/10 text-purple-400" },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface ActivityFeedProps {
  activities?: { id: string; type: string; title: string; description: string; timestamp: string }[];
  maxHeight?: string;
}

export function ActivityFeed({ activities = [], maxHeight = "400px" }: ActivityFeedProps) {
  return (
    <FadeInView>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <CardTitle className="text-base font-semibold">
              AI Activity Feed
            </CardTitle>
            <div className="flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-0.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-400" />
              </span>
              <span className="text-xs font-medium text-red-400">Live</span>
            </div>
            <span className="text-xs text-muted-foreground">
              AI systems active
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="pr-2" style={{ maxHeight }}>
            <div className="space-y-1">
              {activities.map((activity) => {
                const typeConfig = TYPE_ICONS[activity.type] || TYPE_ICONS.seo_update;
                return (
                  <ActivityItemRow
                    key={activity.id}
                    icon={typeConfig.icon}
                    iconColor={typeConfig.color}
                    title={activity.title}
                    description={activity.description}
                    timestamp={timeAgo(activity.timestamp)}
                  />
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </FadeInView>
  );
}
