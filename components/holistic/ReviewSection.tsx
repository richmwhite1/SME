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
    contributor_score: number | null;
    is_verified_expert: boolean | null;
  } | null;
}

interface ReviewSectionProps {
  productId: string;
  productSlug: string;
  productTitle?: string;
}

import { getDb } from "@/lib/db";

export default async function ReviewSection({
  productId,
  productSlug,
  productTitle,
}: ReviewSectionProps) {
  const user = await currentUser();
  const sql = getDb();
  let serializedReviews: Review[] = [];

  try {
    const rows = await sql`
      SELECT
        r.id, r.rating, r.content, r.created_at,
        p.id as profile_id, p.full_name, p.username, p.avatar_url, p.contributor_score, p.is_verified_expert
      FROM reviews r
      LEFT JOIN profiles p ON r.user_id = p.id
      WHERE r.product_id = ${productId}
        AND ((r.is_flagged = false) OR (r.is_flagged IS NULL))
      ORDER BY r.created_at DESC
    `;

    // Serialize reviews data
    serializedReviews = rows.map((row: any) => ({
      id: row.id,
      rating: row.rating,
      content: row.content,
      created_at: new Date(row.created_at).toISOString(),
      profiles: row.profile_id ? {
        id: String(row.profile_id),
        full_name: row.full_name,
        username: row.username,
        avatar_url: row.avatar_url,
        contributor_score: row.contributor_score || 0,
        is_verified_expert: row.is_verified_expert || false,
      } : null,
    }));
  } catch (error) {
    console.error("Error fetching reviews:", error);
  }

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
      productId={productId}
      productSlug={productSlug}
      productTitle={productTitle}
      initialReviews={serializedReviews}
      user={serializedUser}
    />
  );
}

