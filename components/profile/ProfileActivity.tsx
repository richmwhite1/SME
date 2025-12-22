import Link from "next/link";
import { Star, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ProfileActivityProps {
  userId: string;
}

import { getDb } from "@/lib/db";

export default async function ProfileActivity({ userId }: ProfileActivityProps) {
  const sql = getDb();
  let reviews = [];
  let discussions = [];

  // Fetch recent reviews
  try {
    const reviewsData = await sql`
      SELECT
        r.id,
        r.content,
        r.rating,
        r.created_at,
        p.id as product_id,
        p.title as product_title,
        p.slug as product_slug
      FROM reviews r
      LEFT JOIN products p ON r.product_id = p.id
      WHERE r.user_id = ${userId}
        AND r.is_flagged = false
      ORDER BY r.created_at DESC
      LIMIT 10
    `;

    reviews = reviewsData.map((r: any) => ({
      ...r,
      protocols: r.product_id ? {
        id: r.product_id,
        title: r.product_title,
        slug: r.product_slug
      } : null
    }));
  } catch (error) {
    console.error("Error fetching reviews:", error);
  }

  // Fetch recent discussions
  try {
    discussions = await sql`
      SELECT
        id,
        title,
        content,
        slug,
        created_at
      FROM discussions
      WHERE author_id = ${userId}
        AND is_flagged = false
      ORDER BY created_at DESC
      LIMIT 10
    `;
  } catch (error) {
    console.error("Error fetching discussions:", error);
  }

  const hasActivity = (reviews && reviews.length > 0) || (discussions && discussions.length > 0);

  return (
    <div className="rounded-xl bg-white/50 p-8 backdrop-blur-sm">
      <h2 className="mb-6 text-2xl font-bold text-deep-stone">Activity</h2>

      {!hasActivity ? (
        <div className="py-12 text-center">
          <p className="text-deep-stone/70">No activity yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Reviews */}
          {reviews && reviews.length > 0 && (
            <div>
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-deep-stone">
                <Star className="h-5 w-5 text-earth-green" />
                Reviews
              </h3>
              <div className="space-y-4">
                {reviews.map((review: any) => (
                  <div
                    key={review.id}
                    className="rounded-lg border border-soft-clay/20 bg-white/50 p-4"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < review.rating
                              ? "fill-earth-green text-earth-green"
                              : "text-soft-clay"
                              }`}
                          />
                        ))}
                      </div>
                      {review.protocols && (
                        <Link
                          href={`/products/${review.protocols.slug}`}
                          className="text-sm font-medium text-earth-green hover:underline"
                        >
                          on {review.protocols.title}
                        </Link>
                      )}
                      <span className="text-xs text-deep-stone/60">
                        {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-deep-stone/80">{review.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Discussions */}
          {discussions && discussions.length > 0 && (
            <div>
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-deep-stone">
                <MessageSquare className="h-5 w-5 text-earth-green" />
                Discussions
              </h3>
              <div className="space-y-4">
                {discussions.map((discussion: any) => (
                  <Link
                    key={discussion.id}
                    href={`/discussions/${discussion.id}`}
                    className="block rounded-lg border border-soft-clay/20 bg-white/50 p-4 transition-all duration-300 hover:shadow-md"
                  >
                    <h4 className="mb-2 font-semibold text-deep-stone">{discussion.title}</h4>
                    <p className="mb-2 line-clamp-2 text-sm text-deep-stone/80">
                      {discussion.content}
                    </p>
                    <span className="text-xs text-deep-stone/60">
                      {formatDistanceToNow(new Date(discussion.created_at), { addSuffix: true })}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

