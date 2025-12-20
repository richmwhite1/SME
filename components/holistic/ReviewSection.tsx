import { createClient } from "@/lib/supabase/server";
import { currentUser } from "@clerk/nextjs/server";
import ReviewSectionClient from "./ReviewSectionClient";

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
      healer_score: number;
    } | null;
}

interface ReviewSectionProps {
  protocolId: string;
  protocolSlug: string;
  productTitle?: string;
}

export default async function ReviewSection({
  protocolId,
  protocolSlug,
  productTitle,
}: ReviewSectionProps) {
  const supabase = createClient();
  const user = await currentUser();

  // Fetch reviews with profile information
  // Filter by protocol_id (product ID) and exclude flagged reviews
  // Handle null is_flagged values (reviews created before flagging was added)
  const { data: reviews, error } = await supabase
    .from("reviews")
    .select("id, rating, content, created_at, profiles(id, full_name, username, avatar_url, contributor_score, is_verified_expert)")
    .eq("protocol_id", protocolId)
    .or("is_flagged.eq.false,is_flagged.is.null")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching reviews:", error);
  }

  // Serialize reviews data - convert Date objects to ISO strings
  const serializedReviews = (reviews || []).map((review: any) => ({
    ...review,
    created_at: review.created_at instanceof Date 
      ? review.created_at.toISOString() 
      : typeof review.created_at === 'string' 
        ? review.created_at 
        : new Date(review.created_at).toISOString(),
    profiles: review.profiles ? {
      ...review.profiles,
      id: String(review.profiles.id),
      contributor_score: review.profiles.contributor_score ?? 0,
      is_verified_expert: review.profiles.is_verified_expert ?? false,
    } : null,
  })) as Review[];

  // Serialize user object - only pass serializable data
  const serializedUser = user ? {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    emailAddresses: user.emailAddresses?.map((email: any) => ({
      emailAddress: email.emailAddress,
    })) || [],
    imageUrl: user.imageUrl,
  } : null;

  return (
    <ReviewSectionClient 
      protocolId={protocolId}
      protocolSlug={protocolSlug}
      productTitle={productTitle}
      initialReviews={serializedReviews}
      user={serializedUser}
    />
  );
}

