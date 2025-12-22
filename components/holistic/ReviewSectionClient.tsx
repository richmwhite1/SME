"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ReviewForm from "./ReviewForm";
import ReviewFormPrompt from "./ReviewFormPrompt";
import ReviewCard from "./ReviewCard";

interface Review {
  id: string;
  rating: number;
  content: string;
  created_at: string;
  profiles: {
    id: string;
    full_name: string;
    username: string | null;
    avatar_url: string | null;
    contributor_score: number | null;
    is_verified_expert: boolean | null;
  } | null;
}

interface ReviewSectionClientProps {
  productId: string;
  productSlug: string;
  productTitle?: string;
  initialReviews: Review[];
  user: any;
}

export default function ReviewSectionClient({
  productId,
  productSlug,
  productTitle,
  initialReviews,
  user,
}: ReviewSectionClientProps) {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>(initialReviews);

  // Sync state with props when router.refresh() updates initialReviews
  useEffect(() => {
    setReviews(initialReviews);
  }, [initialReviews]);

  // Fetch fresh reviews function


  return (
    <div>

      {/* Review Form */}
      {user ? (
        <ReviewForm
          productId={productId}
          productSlug={productSlug}
          onReviewAdded={(newReview) => {
            // Optimistic update: add review immediately
            setReviews((prev) => [newReview, ...prev]);
          }}
          onReviewError={() => {
            // On error, remove optimistic review and refetch
            setReviews(initialReviews);
            router.refresh();
          }}
          onReviewSuccess={() => {
            // On success, refresh from server
            router.refresh();
          }}
        />
      ) : (
        <ReviewFormPrompt />
      )}

      {/* Reviews List */}
      <div className="mt-12 space-y-6">
        {reviews.length === 0 ? (
          <div className="border border-translucent-emerald bg-muted-moss p-8 text-center">
            <p className="text-bone-white font-mono">
              Signal Pending: Be the first auditor to share your intuition.
            </p>
          </div>
        ) : (
          reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              productTitle={productTitle}
              productSlug={productSlug}
            />
          ))
        )}
      </div>
    </div>
  );
}



