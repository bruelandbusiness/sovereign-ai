/**
 * Service icon mapping — client-only.
 *
 * This file contains the lucide-react icon imports for each service.
 * It is separated from lib/constants.ts so that server-side API routes
 * that import constants (for getServiceById, getBundleById, etc.) do
 * not pull lucide-react into the server bundle.
 *
 * Client components that need service icons should call getServiceIcon(id)
 * from this module instead of reading service.icon directly.
 */

import {
  Zap,
  Phone,
  PhoneCall,
  MessageSquare,
  Search,
  Megaphone,
  Mail,
  Share2,
  Star,
  Calendar,
  Users,
  Globe,
  BarChart3,
  FileText,
  Shield,
  Target,
  Wrench,
  HeartHandshake,
  Brain,
  Camera,
  RefreshCw,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const SERVICE_ICONS: Record<string, LucideIcon> = {
  "lead-gen": Zap,
  "voice-agent": Phone,
  "ai-receptionist": PhoneCall,
  chatbot: MessageSquare,
  seo: Search,
  ads: Megaphone,
  email: Mail,
  social: Share2,
  reviews: Star,
  booking: Calendar,
  crm: Users,
  website: Globe,
  analytics: BarChart3,
  content: FileText,
  reputation: Shield,
  retargeting: Target,
  "customer-ltv": HeartHandshake,
  "ai-estimate": Camera,
  aeo: Brain,
  "fsm-sync": RefreshCw,
  custom: Wrench,
};

/**
 * Get the lucide-react icon component for a service ID.
 * Returns Zap as a fallback for unknown service IDs.
 */
export function getServiceIcon(serviceId: string): LucideIcon {
  return SERVICE_ICONS[serviceId] || Zap;
}
