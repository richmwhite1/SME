"use client";

import { Star, Image } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import AvatarLink from "@/components/profile/AvatarLink";
import SocialCard from "@/components/social/SocialCard";
import { useShareCard } from "@/components/social/useShareCard";
import UserBadge from "@/components/UserBadge";

interface ReviewCardProps {
  review: {
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
  };
  productTitle?: string;
  productSlug?: string;
}

export default function ReviewCard({ review, productTitle, productSlug }: ReviewCardProps) {
  const profile = review.profiles;
  const { isOpen, shareData, openShareCard, closeShareCard, handleExport } = useShareCard();
  const timeAgo = formatDistanceToNow(new Date(review.created_at), {
    addSuffix: true,
  });

  const handleGenerateShareCard = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const reviewUrl = typeof window !== "undefined" && productSlug
      ? `${window.location.origin}/products/${productSlug}#review-${review.id}`
      : `#review-${review.id}`;

    openShareCard({
      type: "audit",
      content: review.content,
      authorName: profile?.full_name || "Anonymous",
      authorUsername: profile?.username || null,
      trustWeight: profile?.contributor_score || null,
      contributorScore: profile?.contributor_score || null,
      rating: review.rating,
      productTitle: productTitle || "Product",
      url: reviewUrl,
    });
  };

  return (
    <>
      <div className="border border-translucent-emerald bg-muted-moss p-6 transition-colors hover:border-heart-green">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            {profile && (
              <AvatarLink
                userId={profile.id}
                username={profile.username}
                avatarUrl={profile.avatar_url}
                fullName={profile.full_name}
                size={40}
              />
            )}

            {/* Name and Badge */}
            <div className="flex items-center gap-2">
              {profile ? (
                <Link
                  href={profile.username ? `/u/${profile.username}` : `/profile/${profile.id}`}
                  className="font-semibold text-bone-white hover:text-heart-green transition-colors"
                >
                  {profile.full_name || "Anonymous"}
                </Link>
              ) : (
                <div className="font-semibold text-bone-white">Anonymous</div>
              )}
              <UserBadge profile={profile} />
            </div>
          </div>

          {/* Time */}
          <div className="text-sm text-bone-white/70 font-mono">{timeAgo}</div>
        </div>

        {/* Rating */}
        <div className="mb-3 flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-4 w-4 ${
                star <= review.rating
                  ? "fill-heart-green text-heart-green"
                  : "fill-none text-bone-white/30"
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <p className="leading-relaxed text-bone-white/90 font-mono">{review.content}</p>

        {/* Action Buttons */}
        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={handleGenerateShareCard}
            className="flex items-center gap-1 text-xs text-sme-gold hover:text-[#9A7209] font-mono transition-colors"
            title="Generate share card image"
          >
            <Image size={12} />
            <span>Generate Share Card</span>
          </button>
        </div>
      </div>

      {/* Share Card Modal */}
      {isOpen && shareData && (
        <SocialCard
          type={shareData.type}
          content={shareData.content}
          authorName={shareData.authorName}
          authorUsername={shareData.authorUsername}
          trustWeight={shareData.trustWeight}
          contributorScore={shareData.contributorScore}
          rating={shareData.rating}
          productTitle={shareData.productTitle}
          onClose={closeShareCard}
          onExport={handleExport}
        />
      )}
    </>
  );
}

