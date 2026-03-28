"use client";

import { useState, useCallback } from "react";
import { CheckCircle } from "lucide-react";

interface CareerApplicationFormProps {
  jobId: string;
}

export function CareerApplicationForm({ jobId }: CareerApplicationFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [experience, setExperience] = useState("");
  const [certifications, setCertifications] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim() || !email.trim()) return;

      setSubmitting(true);
      setError(null);

      try {
        const res = await fetch(`/api/careers/${jobId}/apply`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim() || undefined,
            experience: experience.trim() || undefined,
            certifications: certifications
              .split(",")
              .map((c) => c.trim())
              .filter(Boolean),
            coverLetter: coverLetter.trim() || undefined,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to submit application");
        }

        setSubmitted(true);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "We couldn't submit your application. Please try again."
        );
      } finally {
        setSubmitting(false);
      }
    },
    [jobId, name, email, phone, experience, certifications, coverLetter]
  );

  if (submitted) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
          <CheckCircle className="h-8 w-8 text-emerald-400" />
        </div>
        <h3 className="mb-2 text-xl font-semibold">Application Submitted!</h3>
        <p className="max-w-md text-sm text-muted-foreground">
          Thank you for your application. Our AI has scored your profile and
          the hiring team will review it shortly. You will receive an email
          update at <strong className="text-foreground">{email}</strong>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div role="alert" className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="career-name" className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Full Name *
          </label>
          <input
            id="career-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Smith"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-ring"
          />
        </div>
        <div>
          <label htmlFor="career-email" className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Email Address *
          </label>
          <input
            id="career-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-ring"
          />
        </div>
        <div>
          <label htmlFor="career-phone" className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Phone Number
          </label>
          <input
            id="career-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 123-4567"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-ring"
          />
        </div>
        <div>
          <label htmlFor="career-certs" className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Certifications{" "}
            <span className="text-muted-foreground/60">(comma-separated)</span>
          </label>
          <input
            id="career-certs"
            type="text"
            value={certifications}
            onChange={(e) => setCertifications(e.target.value)}
            placeholder="EPA 608, NATE, OSHA"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-ring"
          />
        </div>
      </div>

      <div>
        <label htmlFor="career-experience" className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Experience
        </label>
        <textarea
          id="career-experience"
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          rows={2}
          placeholder="Briefly describe your relevant experience..."
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-ring"
        />
      </div>

      <div>
        <label htmlFor="career-cover-letter" className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Cover Letter
        </label>
        <textarea
          id="career-cover-letter"
          value={coverLetter}
          onChange={(e) => setCoverLetter(e.target.value)}
          rows={4}
          placeholder="Tell us why you'd be a great fit for this role..."
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-ring"
        />
      </div>

      <button
        type="submit"
        disabled={submitting || !name.trim() || !email.trim()}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {submitting ? "Submitting..." : "Submit Application"}
      </button>
    </form>
  );
}
