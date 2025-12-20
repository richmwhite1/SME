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
  protocolId: string;
  protocolSlug: string;
  productTitle?: string;
  initialReviews: Review[];
  user: any;
}

export default function ReviewSectionClient({
  protocolId,
  protocolSlug,
  productTitle,
  initialReviews,
  user,
}: ReviewSectionClientProps) {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  
  // Fetch fresh reviews function
  const fetchReviews = async () => {
    // Small delay to ensure database transaction has committed
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const supabase = createClient();
    const { data: freshReviews, error } = await supabase
      .from("reviews")
      .select("id, rating, content, created_at, profiles(id, full_name, username, avatar_url, contributor_score, is_verified_expert)")
      .eq("protocol_id", protocolId)
      .or("is_flagged.eq.false,is_flagged.is.null")
      .order("created_at", { ascending: false });
    
    if (!error && freshReviews) {
      setReviews(freshReviews as Review[]);
    } else {
      console.error("Error fetching fresh reviews:", error);
    }
  };

  return (
    <div>

      {/* Review Form */}
      {user ? (
        <ReviewForm 
          protocolId={protocolId} 
          protocolSlug={protocolSlug}
          onReviewAdded={(newReview) => {
            // Optimistic update: add review immediately
            setReviews((prev) => [newReview, ...prev]);
          }}
          onReviewError={() => {
            // On error, remove optimistic review and refetch
            setReviews(initialReviews);
            fetchReviews();
          }}
          onReviewSuccess={() => {
            // On success, fetch fresh reviews from server
            fetchReviews();
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
              productSlug={protocolSlug}
            />
          ))
        )}
      </div>
    </div>
  );
}



