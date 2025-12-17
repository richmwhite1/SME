import { Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";

interface ReviewCardProps {
  review: {
    id: string;
    rating: number;
    content: string;
    created_at: string;
    profiles: {
      full_name: string;
      avatar_url: string | null;
      healer_score: number;
    } | null;
  };
}

export default function ReviewCard({ review }: ReviewCardProps) {
  const profile = review.profiles;
  const timeAgo = formatDistanceToNow(new Date(review.created_at), {
    addSuffix: true,
  });

  return (
    <div className="rounded-xl bg-white/50 p-6 backdrop-blur-sm transition-all duration-300 hover:shadow-lg">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-soft-clay">
            {profile?.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.full_name || "User"}
                width={40}
                height={40}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-lg font-semibold text-deep-stone">
                {profile?.full_name?.charAt(0).toUpperCase() || "U"}
              </span>
            )}
          </div>

          {/* Name and Healer Score */}
          <div>
            <div className="font-semibold text-deep-stone">
              {profile?.full_name || "Anonymous"}
            </div>
            {profile && profile.healer_score !== null && (
              <div className="text-sm text-earth-green">
                Healer Score: {profile.healer_score}
              </div>
            )}
          </div>
        </div>

        {/* Time */}
        <div className="text-sm text-deep-stone/60">{timeAgo}</div>
      </div>

      {/* Rating */}
      <div className="mb-3 flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= review.rating
                ? "fill-earth-green text-earth-green"
                : "fill-none text-soft-clay"
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <p className="leading-relaxed text-deep-stone/80">{review.content}</p>
    </div>
  );
}

