"use client";

import { useState, useEffect, use } from "react";
import { Gift, CheckCircle2, Loader2, ArrowRight } from "lucide-react";

// ── Types ────────────────────────────────────────────────────

interface ProgramInfo {
  businessName: string;
  vertical: string | null;
  rewardText: string;
  terms: string;
  enabled: boolean;
}

// ── Component ────────────────────────────────────────────────

export default function ReferralLandingPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = use(params);

  const [programInfo, setProgramInfo] = useState<ProgramInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    referrerName: "",
    referrerEmail: "",
    referrerPhone: "",
    referredName: "",
    referredEmail: "",
    referredPhone: "",
  });

  useEffect(() => {
    fetch(`/api/referral/${clientId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setProgramInfo(data as ProgramInfo);
        }
      })
      .catch(() => setError("Failed to load referral program"))
      .finally(() => setLoading(false));
  }, [clientId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    if (!form.referrerName.trim() || !form.referredName.trim()) {
      setError("Please fill in at least your name and your friend's name.");
      return;
    }

    if (!form.referrerEmail && !form.referrerPhone) {
      setError("Please provide your email or phone number.");
      return;
    }

    if (!form.referredEmail && !form.referredPhone) {
      setError("Please provide your friend's email or phone number.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const res = await fetch(`/api/referral/${clientId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = (await res.json()) as {
        success?: boolean;
        referralCode?: string;
        error?: string;
      };

      if (data.success) {
        setSubmitted(true);
        setReferralCode(data.referralCode || "");
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Failed to submit referral. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Loading ──────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900" role="status" aria-live="polite">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" aria-hidden="true" />
        <span className="sr-only">Loading referral program...</span>
      </div>
    );
  }

  if (!programInfo || !programInfo.enabled) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900 px-4">
        <div className="text-center">
          <Gift className="mx-auto h-12 w-12 text-slate-500" />
          <h1 className="mt-4 text-xl font-semibold text-white">
            Referral Program Unavailable
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {error || "This referral program is not currently active."}
          </p>
        </div>
      </div>
    );
  }

  // ── Success State ────────────────────────────────────────

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900 px-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-white">
            Thank You for Your Referral!
          </h1>
          <p className="mt-3 text-slate-400">
            Your referral has been submitted. We will reach out to your friend
            shortly.
          </p>
          {referralCode && (
            <div className="mt-6 rounded-xl border border-slate-700 bg-slate-800/50 p-4">
              <p className="text-xs text-slate-400">Your Referral Code</p>
              <p className="mt-1 text-2xl font-bold tracking-wider text-blue-400">
                {referralCode}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Share this code with your friend for their discount
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900 px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/20">
            <Gift className="h-7 w-7 text-blue-400" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-white">
            {programInfo.businessName} Referral Program
          </h1>
          <p className="mt-3 text-lg text-blue-400">{programInfo.rewardText}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {/* Your Info */}
          <fieldset className="rounded-xl border border-slate-700 bg-slate-800/50 p-5">
            <legend className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Your Information
            </legend>
            <div className="mt-4 space-y-3">
              <div>
                <label htmlFor="referrer-name" className="sr-only">Your Name</label>
                <input
                  id="referrer-name"
                  type="text"
                  placeholder="Your Name *"
                  value={form.referrerName}
                  onChange={(e) =>
                    setForm({ ...form, referrerName: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/50"
                  required
                />
              </div>
              <div>
                <label htmlFor="referrer-email" className="sr-only">Your Email</label>
                <input
                  id="referrer-email"
                  type="email"
                  placeholder="Your Email"
                  value={form.referrerEmail}
                  onChange={(e) =>
                    setForm({ ...form, referrerEmail: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/50"
                />
              </div>
              <div>
                <label htmlFor="referrer-phone" className="sr-only">Your Phone</label>
                <input
                  id="referrer-phone"
                  type="tel"
                  placeholder="Your Phone"
                  value={form.referrerPhone}
                  onChange={(e) =>
                    setForm({ ...form, referrerPhone: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/50"
                />
              </div>
            </div>
          </fieldset>

          {/* Friend's Info */}
          <fieldset className="rounded-xl border border-slate-700 bg-slate-800/50 p-5">
            <legend className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Your Friend&apos;s Information
            </legend>
            <div className="mt-4 space-y-3">
              <div>
                <label htmlFor="referred-name" className="sr-only">Friend&apos;s Name</label>
                <input
                  id="referred-name"
                  type="text"
                  placeholder="Friend's Name *"
                  value={form.referredName}
                  onChange={(e) =>
                    setForm({ ...form, referredName: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/50"
                  required
                />
              </div>
              <div>
                <label htmlFor="referred-email" className="sr-only">Friend&apos;s Email</label>
                <input
                  id="referred-email"
                  type="email"
                  placeholder="Friend's Email"
                  value={form.referredEmail}
                  onChange={(e) =>
                    setForm({ ...form, referredEmail: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/50"
                />
              </div>
              <div>
                <label htmlFor="referred-phone" className="sr-only">Friend&apos;s Phone</label>
                <input
                  id="referred-phone"
                  type="tel"
                  placeholder="Friend's Phone"
                  value={form.referredPhone}
                  onChange={(e) =>
                    setForm({ ...form, referredPhone: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/50"
                />
              </div>
            </div>
          </fieldset>

          {error && (
            <p role="alert" className="text-center text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Submit Referral
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          <p className="text-center text-xs text-slate-500">
            {programInfo.terms}
          </p>
        </form>

        <p className="mt-8 text-center text-xs text-slate-600">
          Powered by Sovereign AI
        </p>
      </div>
    </div>
  );
}
