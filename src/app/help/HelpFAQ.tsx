"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "How quickly will I start seeing leads after signing up?",
    answer:
      "Most clients see their first AI-generated leads within 5 to 7 days of completing onboarding. Our AI systems need 48 hours to deploy and begin optimizing your campaigns across search, social, and review platforms. The ramp-up period depends on your market and service area, but consistent lead flow typically stabilizes within the first 30 days.",
  },
  {
    question: "Do I need to provide content or manage anything myself?",
    answer:
      "No. Sovereign AI is a fully done-for-you service. Our AI generates all content including blog posts, social media updates, review responses, and email campaigns. You simply review leads in your dashboard and focus on closing jobs. If you want to approve content before it goes live, you can enable approval mode in your dashboard settings.",
  },
  {
    question: "Can I use Sovereign AI if I already have a website?",
    answer:
      "Absolutely. We integrate with your existing website rather than replacing it. Our AI services layer on top of your current online presence — optimizing your Google Business Profile, managing reviews, running social campaigns, and driving traffic to your existing site. If your site needs SEO improvements, our AI handles that too.",
  },
  {
    question: "What happens if I want to cancel my subscription?",
    answer:
      "You can cancel anytime from your dashboard under Settings > Billing. There are no long-term contracts or cancellation fees. We also offer a 60-day money-back guarantee — if you are not satisfied with the results within your first 60 days, we will refund your investment in full. After cancellation, your AI services will remain active until the end of your current billing cycle.",
  },
  {
    question: "How do I track my return on investment?",
    answer:
      "Your dashboard includes a dedicated ROI section that tracks every lead, its source, estimated value, and cost per acquisition. You can see exactly how much revenue each AI service has generated compared to what you are paying. We also send monthly QBR (Quarterly Business Review) reports with detailed performance analysis and optimization recommendations.",
  },
  {
    question: "Is my business data secure?",
    answer:
      "Yes. We use 256-bit AES encryption for all data at rest and TLS 1.3 for data in transit. Your business information is never shared with competitors or third parties. We are SOC 2 compliant and follow industry-standard security practices. You own all of your data and can export it at any time from your dashboard.",
  },
  {
    question: "What types of home service businesses do you work with?",
    answer:
      "We work with HVAC, plumbing, electrical, roofing, landscaping, pest control, cleaning, painting, garage door, and general contracting businesses. Our AI is trained on marketing data from thousands of home service companies, so it understands the seasonality, local competition, and customer behavior patterns specific to your trade.",
  },
];

export function HelpFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className="divide-y divide-white/[0.06] rounded-xl border border-white/[0.06]">
      {FAQ_ITEMS.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={index} className="group">
            <button
              onClick={() => toggle(index)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left text-sm font-medium text-foreground transition-colors hover:text-primary"
            >
              <span>{item.question}</span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                  isOpen && "rotate-180 text-primary"
                )}
              />
            </button>
            <div
              className={cn(
                "grid transition-all duration-200 ease-in-out",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden">
                <p className="px-6 pb-5 text-sm leading-relaxed text-muted-foreground">
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
