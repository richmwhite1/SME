"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitReview } from "@/app/actions/review-actions";
import StarRating from "@/components/ui/StarRating";
import Button from "@/components/ui/Button";

interface ReviewFormProps {
  protocolId: string;
  protocolSlug: string;
}

export default function ReviewForm({
  protocolId,
  protocolSlug,
}: ReviewFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    if (content.trim().length < 10) {
      setError("Please write at least 10 characters");
      return;
    }

    startTransition(async () => {
      try {
        await submitReview(protocolId, rating, content, protocolSlug);
        setSuccess(true);
        setRating(0);
        setContent("");
        // Force refresh to show the new review
        router.refresh();
        // Reset success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to submit review");
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-12 rounded-xl bg-white/50 p-8 backdrop-blur-sm"
    >
      <h3 className="mb-6 text-xl font-semibold text-deep-stone">
        Share Your Experience
      </h3>

      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-deep-stone">
          Rating
        </label>
        <StarRating value={rating} onChange={setRating} disabled={isPending} />
      </div>

      <div className="mb-6">
        <label
          htmlFor="review-content"
          className="mb-2 block text-sm font-medium text-deep-stone"
        >
          Your Review
        </label>
        <textarea
          id="review-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isPending}
          rows={4}
          className="w-full rounded-xl border border-soft-clay/30 bg-white/50 px-4 py-3 text-deep-stone placeholder-deep-stone/40 focus:border-earth-green focus:outline-none focus:ring-2 focus:ring-earth-green/20 transition-all duration-300"
          placeholder="Share your experience with this protocol..."
        />
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-lg bg-earth-green/10 p-3 text-sm text-earth-green">
          Review submitted successfully!
        </div>
      )}

      <Button type="submit" variant="primary" disabled={isPending}>
        {isPending ? "Submitting..." : "Submit Review"}
      </Button>
    </form>
  );
}

