"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Send, CheckCircle2 } from "lucide-react";

const SUBJECTS = [
  "General",
  "Sales",
  "Support",
  "Partnerships",
  "Billing",
] as const;

interface FormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

const INITIAL_FORM: FormData = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

export function ContactForm() {
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [serverError, setServerError] = useState("");

  function validate(): boolean {
    const next: Partial<Record<keyof FormData, string>> = {};
    if (!form.name.trim()) next.name = "Name is required";
    if (!form.email.trim()) {
      next.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = "Please enter a valid email";
    }
    if (!form.subject) next.subject = "Please select a subject";
    if (!form.message.trim()) {
      next.message = "Message is required";
    } else if (form.message.trim().length < 10) {
      next.message = "Message must be at least 10 characters";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (errors[name as keyof FormData]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[name as keyof FormData];
        return copy;
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setStatus("submitting");
    setServerError("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim() || undefined,
          subject: form.subject,
          message: form.message.trim(),
        }),
      });

      if (res.status === 429) {
        setServerError("Too many requests. Please try again later.");
        setStatus("error");
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setServerError(
          body.error || "Something went wrong. Please try again."
        );
        setStatus("error");
        return;
      }

      setStatus("success");
      setForm(INITIAL_FORM);
    } catch {
      setServerError("Network error. Please check your connection and try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="mt-6 flex flex-col items-center py-8 text-center" role="status">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10">
          <CheckCircle2 className="h-7 w-7 text-green-500" />
        </div>
        <h3 className="mt-4 font-display text-lg font-bold">
          Message Sent!
        </h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Thank you for reaching out. Our team will respond within 4 hours
          during business hours (Mon-Fri, 8 AM - 6 PM AZ time).
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-6 text-sm font-medium text-primary hover:underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
      {/* Name */}
      <div>
        <label htmlFor="contact-name" className="block text-sm font-medium">
          Name <span className="text-destructive">*</span>
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          autoComplete="name"
          value={form.name}
          onChange={handleChange}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "contact-name-error" : undefined}
          className={cn(
            "mt-1.5 h-11 w-full rounded-lg border bg-white/[0.04] px-4 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-primary/40 focus:ring-1 focus:ring-primary/20",
            errors.name ? "border-red-500/50" : "border-border/50"
          )}
          placeholder="Your full name"
        />
        {errors.name && (
          <p id="contact-name-error" className="mt-1 text-xs text-red-400">
            {errors.name}
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="contact-email" className="block text-sm font-medium">
          Email <span className="text-destructive">*</span>
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "contact-email-error" : undefined}
          className={cn(
            "mt-1.5 h-11 w-full rounded-lg border bg-white/[0.04] px-4 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-primary/40 focus:ring-1 focus:ring-primary/20",
            errors.email ? "border-red-500/50" : "border-border/50"
          )}
          placeholder="you@company.com"
        />
        {errors.email && (
          <p id="contact-email-error" className="mt-1 text-xs text-red-400">
            {errors.email}
          </p>
        )}
      </div>

      {/* Phone (optional) */}
      <div>
        <label htmlFor="contact-phone" className="block text-sm font-medium">
          Phone <span className="text-muted-foreground text-xs">(optional)</span>
        </label>
        <input
          id="contact-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          value={form.phone}
          onChange={handleChange}
          className="mt-1.5 h-11 w-full rounded-lg border border-border/50 bg-white/[0.04] px-4 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
          placeholder="(555) 123-4567"
        />
      </div>

      {/* Subject */}
      <div>
        <label htmlFor="contact-subject" className="block text-sm font-medium">
          Subject <span className="text-destructive">*</span>
        </label>
        <select
          id="contact-subject"
          name="subject"
          value={form.subject}
          onChange={handleChange}
          aria-invalid={!!errors.subject}
          aria-describedby={errors.subject ? "contact-subject-error" : undefined}
          className={cn(
            "mt-1.5 h-11 w-full rounded-lg border bg-white/[0.04] px-4 text-sm text-foreground outline-none transition-colors focus:border-primary/40 focus:ring-1 focus:ring-primary/20 appearance-none",
            !form.subject && "text-muted-foreground/50",
            errors.subject ? "border-red-500/50" : "border-border/50"
          )}
        >
          <option value="" disabled>
            Select a subject...
          </option>
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>
              {s === "General"
                ? "General Inquiry"
                : s === "Sales"
                  ? "Sales / Pricing"
                  : s === "Support"
                    ? "Technical Support"
                    : s === "Partnerships"
                      ? "Partnerships / Integrations"
                      : "Billing / Account"}
            </option>
          ))}
        </select>
        {errors.subject && (
          <p id="contact-subject-error" className="mt-1 text-xs text-red-400">
            {errors.subject}
          </p>
        )}
      </div>

      {/* Message */}
      <div>
        <label htmlFor="contact-message" className="block text-sm font-medium">
          Message <span className="text-destructive">*</span>
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={5}
          value={form.message}
          onChange={handleChange}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "contact-message-error" : undefined}
          className={cn(
            "mt-1.5 w-full rounded-lg border bg-white/[0.04] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-primary/40 focus:ring-1 focus:ring-primary/20 resize-y min-h-[120px]",
            errors.message ? "border-red-500/50" : "border-border/50"
          )}
          placeholder="Tell us how we can help..."
        />
        {errors.message && (
          <p id="contact-message-error" className="mt-1 text-xs text-red-400">
            {errors.message}
          </p>
        )}
      </div>

      {/* Server error */}
      {serverError && (
        <p role="alert" className="text-sm text-red-400">
          {serverError}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={status === "submitting"}
        aria-busy={status === "submitting"}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#4c85ff] to-[#22d3a1] px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 sm:w-auto"
      >
        {status === "submitting" ? (
          "Sending..."
        ) : (
          <>
            Send Message
            <Send className="h-4 w-4" />
          </>
        )}
      </button>
    </form>
  );
}
