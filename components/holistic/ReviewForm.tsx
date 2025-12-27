"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { submitReview } from "@/app/actions/review-actions";
import StarRating from "@/components/ui/StarRating";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastContainer";
import EmojiPicker from "@/components/ui/EmojiPicker";

interface ReviewFormProps {
  productId: string;
  productSlug: string;
  onReviewAdded?: (review: any) => void;
  onReviewError?: () => void;
  onReviewSuccess?: () => void;
}

export default function ReviewForm({
  productId,
  productSlug,
  onReviewAdded,
  onReviewError,
  onReviewSuccess,
}: ReviewFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useUser();
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursorPosition, setCursorPosition] = useState<number>(0);

  // Track cursor position in textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setCursorPosition(e.target.selectionStart);
  };

  const handleTextareaClick = () => {
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart);
    }
  };

  const handleTextareaKeyUp = () => {
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart);
    }
  };

  // Handle emoji selection - insert at cursor position
  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = cursorPosition;
    const end = cursorPosition;
    const newContent = content.substring(0, start) + emoji + content.substring(end);

    setContent(newContent);

    // Set cursor position after emoji
    const newCursorPos = start + emoji.length;
    setCursorPosition(newCursorPos);

    // Focus textarea and set cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

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

    // Optimistic update: Create temporary review immediately
    const tempId = `temp-${Date.now()}`;
    const optimisticReview = {
      id: tempId,
      rating,
      content: content.trim(),
      created_at: new Date().toISOString(),
      profiles: user ? {
        id: user.id,
        full_name: user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : user.firstName || user.emailAddresses[0]?.emailAddress || "User",
        username: null,
        avatar_url: user.imageUrl,
        healer_score: 0,
      } : null,
    };

    // Add optimistic review immediately
    if (onReviewAdded) {
      onReviewAdded(optimisticReview);
    }

    startTransition(async () => {
      try {
        await submitReview(productId, rating, content, productSlug);
        setSuccess(true);
        setRating(0);
        setContent("");

        // Call success callback to fetch fresh reviews
        if (onReviewSuccess) {
          onReviewSuccess();
        }

        // Also trigger router refresh
        router.refresh();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to submit review";
        setError(errorMessage);

        // Remove optimistic review on error
        if (onReviewError) {
          onReviewError();
        }

        // Show toast notification
        if (errorMessage.toLowerCase().includes("policy") || errorMessage.toLowerCase().includes("permission")) {
          showToast("Security Check: Please sign in to contribute to the Lab.", "error");
        } else {
          showToast(errorMessage, "error");
        }
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-12 border border-translucent-emerald bg-muted-moss p-8"
    >
      <h3 className="mb-6 font-serif text-xl font-semibold text-bone-white">
        Share Your Experience
      </h3>

      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-slate-100 font-mono">
          Rating
        </label>
        <StarRating value={rating} onChange={setRating} disabled={isPending} />
      </div>

      <div className="mb-6">
        <label
          htmlFor="review-content"
          className="mb-2 block text-sm font-medium text-slate-100 font-mono"
        >
          Your Review
        </label>
        <div className="relative">
          <textarea
            ref={textareaRef}
            id="review-content"
            value={content}
            onChange={handleTextareaChange}
            onClick={handleTextareaClick}
            onKeyUp={handleTextareaKeyUp}
            disabled={isPending}
            rows={4}
            className="w-full border border-translucent-emerald bg-forest-obsidian px-4 py-3 text-slate-100 placeholder-slate-100/50 focus:border-heart-green focus:outline-none transition-all font-mono"
            placeholder="Share your experience with this product..."
          />
          {/* Emoji Picker Button */}
          <div className="absolute bottom-2 right-2">
            <EmojiPicker onEmojiSelect={handleEmojiSelect} />
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 border border-heart-green bg-heart-green/10 p-3 text-sm text-heart-green font-mono">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 border border-heart-green bg-heart-green/10 p-3 text-sm text-heart-green font-mono">
          Review submitted successfully!
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        disabled={isPending}
        className="border border-sme-gold bg-sme-gold text-forest-obsidian hover:bg-[#9A7209] hover:border-[#9A7209] font-mono uppercase tracking-wider"
      >
        {isPending ? "Processing..." : "Submit Review"}
      </Button>
    </form>
  );
}

