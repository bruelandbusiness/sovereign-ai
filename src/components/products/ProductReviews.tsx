"use client";

import { useState } from "react";
import { CheckCircle } from "lucide-react";
import type { ProductReviewData } from "@/types/products";
import { StarRating } from "./StarRating";
import { GradientButton } from "@/components/shared/GradientButton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ProductReviewsProps {
  reviews: ProductReviewData[];
  averageRating: number;
  reviewCount: number;
  canReview?: boolean;
  onSubmitReview?: (review: { rating: number; title: string; content: string }) => void;
}

export function ProductReviews({
  reviews,
  averageRating,
  reviewCount,
  canReview = false,
  onSubmitReview,
}: ProductReviewsProps) {
  const [showForm, setShowForm] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const isFormValid = newRating > 0 && newTitle.trim().length > 0 && newContent.trim().length > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isFormValid) return;
    setSubmitted(true);
    onSubmitReview?.({ rating: newRating, title: newTitle, content: newContent });
    setShowForm(false);
    setNewRating(0);
    setNewTitle("");
    setNewContent("");
  }

  // Distribution of ratings for the bar chart
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.floor(r.rating) === star).length,
    percentage:
      reviews.length > 0
        ? (reviews.filter((r) => Math.floor(r.rating) === star).length / reviews.length) * 100
        : 0,
  }));

  return (
    <div>
      {/* Summary */}
      <div className="flex flex-col gap-6 sm:gap-8 sm:flex-row sm:items-start">
        {/* Average rating */}
        <div className="text-center sm:text-left shrink-0">
          <div className="text-5xl font-bold text-foreground" aria-label={`Average rating: ${averageRating.toFixed(1)} out of 5`}>
            {averageRating.toFixed(1)}
          </div>
          <StarRating rating={averageRating} size="md" className="mt-2 justify-center sm:justify-start" />
          <p className="mt-1 text-sm text-muted-foreground">
            {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
          </p>
        </div>

        {/* Distribution */}
        <div className="flex-1 space-y-2" role="list" aria-label="Rating distribution">
          {distribution.map(({ star, count, percentage }) => (
            <div key={star} className="flex items-center gap-3" role="listitem">
              <span className="w-12 text-right text-sm text-muted-foreground shrink-0">
                {star} {star === 1 ? "star" : "stars"}
              </span>
              <div
                className="h-2 flex-1 overflow-hidden rounded-full bg-muted/60"
                role="meter"
                aria-label={`${star} star reviews`}
                aria-valuenow={count}
                aria-valuemin={0}
                aria-valuemax={reviewCount || 1}
              >
                <div
                  className="h-full rounded-full bg-amber-400 transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="w-8 text-sm text-muted-foreground tabular-nums">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Write review button */}
      {canReview && !showForm && !submitted && (
        <div className="mt-8">
          <GradientButton
            variant="outline"
            size="sm"
            onClick={() => setShowForm(true)}
          >
            Write a Review
          </GradientButton>
        </div>
      )}

      {/* Submitted confirmation */}
      {submitted && (
        <div className="mt-8 flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 p-4" role="status">
          <CheckCircle className="h-5 w-5 text-accent shrink-0" aria-hidden="true" />
          <p className="text-sm text-foreground">Thank you! Your review has been submitted.</p>
        </div>
      )}

      {/* Review form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mt-8 rounded-xl border border-border/60 bg-card p-6" noValidate>
          <h4 className="text-lg font-semibold text-foreground">Write Your Review</h4>

          <fieldset className="mt-4">
            <legend className="text-sm font-medium text-foreground">
              Rating <span className="text-destructive">*</span>
            </legend>
            <div className="mt-1">
              <StarRating
                rating={newRating}
                size="lg"
                interactive
                onRate={setNewRating}
              />
            </div>
            {newRating === 0 && (
              <p className="mt-1 text-xs text-muted-foreground">Select a star rating</p>
            )}
          </fieldset>

          <div className="mt-4">
            <label htmlFor="review-title" className="text-sm font-medium text-foreground">
              Title <span className="text-destructive">*</span>
            </label>
            <Input
              id="review-title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Summarize your experience"
              className="mt-1"
              required
              aria-required="true"
              maxLength={120}
            />
          </div>

          <div className="mt-4">
            <label htmlFor="review-content" className="text-sm font-medium text-foreground">
              Review <span className="text-destructive">*</span>
            </label>
            <Textarea
              id="review-content"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Share your experience with this product..."
              className="mt-1"
              rows={4}
              required
              aria-required="true"
            />
          </div>

          <div className="mt-4 flex gap-3">
            <GradientButton
              type="submit"
              size="sm"
              disabled={!isFormValid}
              aria-disabled={!isFormValid}
            >
              Submit Review
            </GradientButton>
            <GradientButton
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </GradientButton>
          </div>
        </form>
      )}

      {/* Review list */}
      {reviews.length > 0 ? (
        <div className="mt-8 space-y-6" role="list" aria-label="Customer reviews">
          {reviews.map((review) => (
            <article
              key={review.id}
              className="rounded-xl border border-border/40 bg-card/50 p-5"
              role="listitem"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <StarRating rating={review.rating} size="sm" />
                  </div>
                  {review.title && (
                    <h4 className="mt-1.5 font-semibold text-foreground">
                      {review.title}
                    </h4>
                  )}
                </div>
              </div>
              {review.content && (
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {review.content}
                </p>
              )}
              <footer className="mt-3 flex items-center gap-2 text-xs text-muted-foreground/70">
                <span className="font-medium text-muted-foreground">
                  {review.account.name || "Anonymous"}
                </span>
                <span aria-hidden="true">&middot;</span>
                <time dateTime={review.createdAt}>
                  {new Date(review.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </time>
              </footer>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-xl border border-dashed border-border/60 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No reviews yet. Be the first to share how this product has helped your business.
          </p>
        </div>
      )}
    </div>
  );
}
