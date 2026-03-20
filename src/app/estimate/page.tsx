"use client";

import { useState, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Camera,
  Upload,
  CheckCircle,
  Loader2,
  Phone,
  Mail,
  User,
  ArrowRight,
  Shield,
  Zap,
  Clock,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────

interface EstimateResult {
  id: string;
  issueCategory: string;
  issueDescription: string;
  estimateLow: number;
  estimateHigh: number;
  confidence: "high" | "medium" | "low";
  aiAnalysis: string;
  leadId: string | null;
}

// ─── Helpers ────────────────────────────────────────────────

function formatDollars(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatCategory(cat: string): string {
  return cat
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

const CONFIDENCE_STYLES: Record<string, string> = {
  high: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  low: "bg-red-500/10 text-red-400 border-red-500/30",
};

// ─── Component ──────────────────────────────────────────────

export default function EstimatePage() {
  const searchParams = useSearchParams();
  const clientId = searchParams.get("biz") || "";

  const [step, setStep] = useState<"form" | "analyzing" | "results">("form");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [vertical, setVertical] = useState("hvac");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<EstimateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (JPEG, PNG, etc.)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be under 10 MB");
      return;
    }
    setError(null);
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
      }
    },
    [handleFile]
  );

  const handleSubmit = async () => {
    if (!selectedFile || !clientId) {
      setError(
        !clientId
          ? "Missing business identifier. Please use the link provided by your service company."
          : "Please upload a photo first."
      );
      return;
    }

    setStep("analyzing");
    setError(null);

    const formData = new FormData();
    formData.append("image", selectedFile);
    formData.append("clientId", clientId);
    formData.append("vertical", vertical);
    if (name.trim()) formData.append("customerName", name.trim());
    if (phone.trim()) formData.append("customerPhone", phone.trim());
    if (email.trim()) formData.append("customerEmail", email.trim());

    try {
      const res = await fetch("/api/estimate/analyze", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Analysis failed");
      }

      const data = (await res.json()) as EstimateResult;
      setResult(data);
      setStep("results");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
      setStep("form");
    }
  };

  const handleReset = () => {
    setStep("form");
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
  };

  // ─── No client ID ─────────────────────────────────────────

  if (!clientId) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] text-white flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <Camera className="mx-auto mb-4 h-12 w-12 text-amber-400" />
          <h1 className="text-2xl font-bold mb-2">AI Photo Estimating</h1>
          <p className="text-gray-400">
            This page requires a business link. Please use the estimate link
            provided by your home service company.
          </p>
        </div>
      </div>
    );
  }

  // ─── Analyzing state ──────────────────────────────────────

  if (step === "analyzing") {
    return (
      <div className="min-h-screen bg-[#0a0a1a] text-white flex items-center justify-center p-6" role="status" aria-live="polite">
        <div className="max-w-md text-center">
          <Loader2 className="mx-auto mb-6 h-16 w-16 text-amber-400 animate-spin" aria-hidden="true" />
          <h2 className="text-2xl font-bold mb-2">Analyzing Your Photo...</h2>
          <p className="text-gray-400">
            Our AI is examining the image to identify the issue and calculate an
            estimate. This usually takes 5-10 seconds.
          </p>
        </div>
      </div>
    );
  }

  // ─── Results state ────────────────────────────────────────

  if (step === "results" && result) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] text-white">
        <div className="mx-auto max-w-lg px-4 py-8 sm:py-12">
          {/* Success header */}
          <div className="mb-8 text-center">
            <CheckCircle className="mx-auto mb-4 h-12 w-12 text-emerald-400" />
            <h1 className="text-2xl font-bold sm:text-3xl">
              Your Estimate is Ready
            </h1>
          </div>

          {/* Estimate range card */}
          <div className="mb-6 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-6 text-center">
            <p className="text-sm font-medium text-gray-400 mb-2">
              Estimated Repair Cost
            </p>
            <p className="text-4xl font-extrabold text-amber-400 sm:text-5xl">
              {formatDollars(result.estimateLow)} &ndash;{" "}
              {formatDollars(result.estimateHigh)}
            </p>
            <div className="mt-3">
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${CONFIDENCE_STYLES[result.confidence]}`}
              >
                {result.confidence} confidence
              </span>
            </div>
          </div>

          {/* Issue details */}
          <div className="mb-6 rounded-xl border border-[#1f3a6e] bg-[#16213e] p-5">
            <h3 className="mb-1 text-sm font-semibold text-gray-400 uppercase tracking-wide">
              Issue Detected
            </h3>
            <p className="text-lg font-bold mb-2">
              {formatCategory(result.issueCategory)}
            </p>
            <p className="text-sm text-gray-300 leading-relaxed">
              {result.issueDescription}
            </p>
          </div>

          {/* Photo preview */}
          {previewUrl && (
            <div className="mb-6 overflow-hidden rounded-xl border border-[#1f3a6e]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Submitted photo"
                className="w-full object-cover"
                style={{ maxHeight: "250px" }}
              />
            </div>
          )}

          {/* CTA */}
          <button
            type="button"
            className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4 text-lg font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            onClick={() => {
              // Navigate to the client's booking widget using the biz param
              if (clientId) {
                window.location.href = `/embed/booking/widget?biz=${encodeURIComponent(clientId)}`;
              } else {
                window.location.href = "/embed/booking/widget";
              }
            }}
          >
            Book a Technician
            <ArrowRight className="ml-2 inline h-5 w-5" />
          </button>

          <p className="mt-3 text-center text-xs text-gray-500">
            This is an AI-generated ballpark estimate. Final pricing may vary
            after on-site inspection.
          </p>

          <button
            type="button"
            className="mt-6 w-full rounded-lg border border-[#1f3a6e] bg-[#16213e] py-3 text-sm font-medium text-gray-300 transition-colors hover:bg-[#1a2744] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={handleReset}
          >
            Submit Another Photo
          </button>
        </div>
      </div>
    );
  }

  // ─── Form state (default) ─────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#16213e] to-[#0a0a1a] py-10 sm:py-16 px-4 text-center">
        <div className="mx-auto max-w-lg">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-1.5 text-sm font-medium text-amber-400">
            <Zap className="h-4 w-4" /> AI-Powered
          </div>
          <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">
            Get an Instant AI Estimate
          </h1>
          <p className="mt-3 text-gray-400 sm:text-lg">
            Snap a photo of the issue, and our AI will identify the problem and
            give you a ballpark price &mdash; in seconds.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> Takes 10 seconds
            </span>
            <span className="flex items-center gap-1">
              <Shield className="h-3.5 w-3.5" /> No obligation
            </span>
            <span className="flex items-center gap-1">
              <Camera className="h-3.5 w-3.5" /> Works from your phone
            </span>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="mx-auto max-w-lg px-4 py-8">
        {/* Photo upload */}
        <div
          role="button"
          tabIndex={0}
          className={`mb-6 cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
            dragOver
              ? "border-amber-400 bg-amber-500/5"
              : "border-[#1f3a6e] hover:border-amber-400/50"
          }`}
          onClick={() => fileRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") fileRef.current?.click();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            aria-label="Upload photo for estimate"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFile(e.target.files[0]);
            }}
          />

          {previewUrl ? (
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Preview"
                className="mx-auto mb-3 max-h-48 rounded-lg object-cover"
              />
              <p className="text-sm font-medium text-amber-400">
                {selectedFile?.name}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Tap to change photo
              </p>
            </div>
          ) : (
            <div>
              <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10">
                <Upload className="h-7 w-7 text-amber-400" />
              </div>
              <p className="font-semibold text-white">
                Tap to take a photo or upload
              </p>
              <p className="mt-1 text-sm text-gray-500">
                JPEG, PNG, or WebP up to 10 MB
              </p>
            </div>
          )}
        </div>

        {/* Form fields */}
        <div className="space-y-4">
          {/* Issue type */}
          <div>
            <label htmlFor="estimate-vertical" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">
              Issue Type
            </label>
            <select
              id="estimate-vertical"
              value={vertical}
              onChange={(e) => setVertical(e.target.value)}
              className="w-full rounded-lg border border-[#1f3a6e] bg-[#0f3460] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400/50"
            >
              <option value="hvac">HVAC / Air Conditioning</option>
              <option value="plumbing">Plumbing</option>
              <option value="roofing">Roofing</option>
              <option value="electrical">Electrical</option>
              <option value="general">General Home Repair</option>
            </select>
          </div>

          {/* Name */}
          <div>
            <label htmlFor="estimate-name" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">
              <User className="mr-1 inline h-3 w-3" aria-hidden="true" /> Your Name
            </label>
            <input
              id="estimate-name"
              type="text"
              placeholder="John Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-[#1f3a6e] bg-[#0f3460] px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400/50"
            />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="estimate-phone" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">
              <Phone className="mr-1 inline h-3 w-3" aria-hidden="true" /> Phone Number
            </label>
            <input
              id="estimate-phone"
              type="tel"
              placeholder="(555) 123-4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-[#1f3a6e] bg-[#0f3460] px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400/50"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="estimate-email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">
              <Mail className="mr-1 inline h-3 w-3" aria-hidden="true" /> Email (optional)
            </label>
            <input
              id="estimate-email"
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-[#1f3a6e] bg-[#0f3460] px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400/50"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <p role="alert" className="mt-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!selectedFile}
          className="mt-6 w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 text-lg font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        >
          <Camera className="mr-2 inline h-5 w-5" />
          Analyze Photo & Get Estimate
        </button>

        <p className="mt-3 text-center text-xs text-gray-600">
          Your information is kept private and used only to provide your
          estimate. Powered by Sovereign AI.
        </p>
      </div>
    </div>
  );
}
