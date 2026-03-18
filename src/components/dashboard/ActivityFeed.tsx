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

const DEMO_ACTIVITIES = [
  {
    icon: Phone,
    iconColor: "bg-emerald-500/10 text-emerald-400",
    title: "AI voice agent answered call",
    description: "Incoming call from (602) 555-0147 — qualified lead, appointment booked",
    timestamp: "Just now",
  },
  {
    icon: Mail,
    iconColor: "bg-blue-500/10 text-blue-400",
    title: "Nurture email #3 sent",
    description: "Follow-up sequence email delivered to David Thompson",
    timestamp: "2 hours ago",
  },
  {
    icon: Star,
    iconColor: "bg-amber-500/10 text-amber-400",
    title: "Review request sent",
    description: "Automated review request sent to Maria Garcia after completed service",
    timestamp: "5 hours ago",
  },
  {
    icon: FileText,
    iconColor: "bg-purple-500/10 text-purple-400",
    title: "Blog post published",
    description: '"Emergency HVAC Repair Phoenix" — 1,200 words, SEO-optimized',
    timestamp: "6 hours ago",
  },
  {
    icon: Send,
    iconColor: "bg-emerald-500/10 text-emerald-400",
    title: "Cold outreach batch sent",
    description: "35 prospects targeted in Scottsdale — personalized sequences initiated",
    timestamp: "8 hours ago",
  },
  {
    icon: Megaphone,
    iconColor: "bg-blue-500/10 text-blue-400",
    title: "Google Ads budget rebalanced",
    description: "CPC reduced to $1.85 — reallocated $120 to top-performing ad group",
    timestamp: "10 hours ago",
  },
  {
    icon: MessageSquare,
    iconColor: "bg-amber-500/10 text-amber-400",
    title: "AI responded to 2-star review",
    description: "Professional response posted — customer updated rating to 4 stars",
    timestamp: "12 hours ago",
  },
  {
    icon: Search,
    iconColor: "bg-purple-500/10 text-purple-400",
    title: "SEO rank improved",
    description: '"hvac repair phoenix" moved from position 7 to position 3',
    timestamp: "1 day ago",
  },
];

interface ActivityFeedProps {
  maxHeight?: string;
}

export function ActivityFeed({ maxHeight = "400px" }: ActivityFeedProps) {
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
              {DEMO_ACTIVITIES.map((activity, i) => (
                <ActivityItemRow key={i} {...activity} />
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </FadeInView>
  );
}
