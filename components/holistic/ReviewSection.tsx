import { createClient } from "@/lib/supabase/server";
import { currentUser } from "@clerk/nextjs/server";
import ReviewForm from "./ReviewForm";
import ReviewCard from "./ReviewCard";
import ReviewFormPrompt from "./ReviewFormPrompt";

interface Review {
  id: string;
  rating: number;
  content: string;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url: string | null;
    healer_score: number;
  } | null;
}

interface ReviewSectionProps {
  protocolId: string;
  protocolSlug: string;
}

export default async function ReviewSection({
  protocolId,
  protocolSlug,
}: ReviewSectionProps) {
  const supabase = createClient();
  const user = await currentUser();

  // Fetch reviews with profile information
  // Filter by protocol_id (product ID) and exclude flagged reviews
  // Handle null is_flagged values (reviews created before flagging was added)
  const { data: reviews, error } = await supabase
    .from("reviews")
    .select("id, rating, content, created_at, profiles(full_name, avatar_url, healer_score)")
    .eq("protocol_id", protocolId)
    .or("is_flagged.eq.false,is_flagged.is.null")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching reviews:", error);
  }

  const typedReviews = (reviews || []) as Review[];

  return (
    <div className="mt-16 border-t border-soft-clay/20 pt-12">
      <h2 className="mb-8 text-3xl font-semibold text-deep-stone">
        Community Reviews
      </h2>

      {/* Review Form */}
      {user ? (
        <ReviewForm protocolId={protocolId} protocolSlug={protocolSlug} />
      ) : (
        <ReviewFormPrompt />
      )}

      {/* Reviews List */}
      <div className="mt-12 space-y-6">
        {typedReviews.length === 0 ? (
          <div className="rounded-xl bg-white/50 p-8 text-center backdrop-blur-sm">
            <p className="text-deep-stone/70">
              No reviews yet. Be the first to share your experience!
            </p>
          </div>
        ) : (
          typedReviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))
        )}
      </div>
    </div>
  );
}

