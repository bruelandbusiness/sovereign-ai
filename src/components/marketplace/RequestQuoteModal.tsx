"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, Loader2 } from "lucide-react";
import type { ProResult } from "./ProCard";

interface RequestQuoteModalProps {
  pro: ProResult | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const serviceOptions = [
  "General Inquiry",
  "Repair",
  "Installation",
  "Maintenance",
  "Inspection",
  "Emergency Service",
  "Consultation",
  "Other",
];

export function RequestQuoteModal({
  pro,
  open,
  onOpenChange,
}: RequestQuoteModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceNeeded, setServiceNeeded] = useState("General Inquiry");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setName("");
    setEmail("");
    setPhone("");
    setServiceNeeded("General Inquiry");
    setMessage("");
    setSubmitting(false);
    setSubmitted(false);
    setError(null);
  }

  function handleOpenChange(value: boolean) {
    if (!value) {
      // Reset form on close with a small delay for animation
      setTimeout(resetForm, 200);
    }
    onOpenChange(value);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pro) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/find-a-pro/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: pro.clientId,
          name,
          email,
          phone: phone || undefined,
          serviceNeeded,
          message: message || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to submit request");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  if (!pro) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        {submitted ? (
          /* Success State */
          <div className="flex flex-col items-center py-6 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
              <CheckCircle className="h-7 w-7 text-accent" />
            </div>
            <DialogTitle className="text-xl">Request Sent!</DialogTitle>
            <DialogDescription className="mt-2">
              Your quote request has been sent to{" "}
              <span className="font-medium text-foreground">
                {pro.businessName}
              </span>
              . They will contact you shortly.
            </DialogDescription>
            <Button
              onClick={() => handleOpenChange(false)}
              className="mt-6 gradient-bg text-white hover:opacity-90"
            >
              Done
            </Button>
          </div>
        ) : (
          /* Form State */
          <>
            <DialogHeader>
              <DialogTitle>Request a Quote</DialogTitle>
              <DialogDescription>
                Send a free quote request to{" "}
                <span className="font-medium text-foreground">
                  {pro.businessName}
                </span>
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="quote-name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="quote-name"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="quote-email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="quote-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="quote-phone">Phone</Label>
                <Input
                  id="quote-phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^\d\s\-().+]/g, "");
                    setPhone(val);
                  }}
                  aria-describedby="phone-hint"
                  className="h-9"
                />
                <p id="phone-hint" className="text-xs text-muted-foreground">
                  Optional. US format: (555) 123-4567
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="quote-service">Service Needed</Label>
                <select
                  id="quote-service"
                  value={serviceNeeded}
                  onChange={(e) => setServiceNeeded(e.target.value)}
                  className="flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                >
                  {serviceOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="quote-message">Message</Label>
                <Textarea
                  id="quote-message"
                  placeholder="Describe what you need help with..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                />
              </div>

              {error && (
                <p role="alert" className="text-sm text-destructive">{error}</p>
              )}

              <Button
                type="submit"
                disabled={submitting}
                aria-busy={submitting}
                className="w-full gradient-bg text-white hover:opacity-90"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Quote Request"
                )}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
