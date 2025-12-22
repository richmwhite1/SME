"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { toggleTopicFollow } from "@/app/actions/topic-actions";
import Button from "@/components/ui/Button";

interface TopicBadgeProps {
  topic: string;
  isFollowed?: boolean;
  clickable?: boolean;
  showFollowButton?: boolean;
}

const MASTER_TOPICS = [
  "Biohacking",
  "Longevity",
  "Research",
  "Supplements",
  "Nutrition",
  "Fitness",
  "Mental Health",
  "Sleep",
  "Recovery",
  "Wellness",
  "Science",
  "Health",
];

export default function TopicBadge({
  topic,
  isFollowed = false,
  clickable = true,
  showFollowButton = false,
}: TopicBadgeProps) {
  const { user } = useUser();
  const router = useRouter();
  const [following, setFollowing] = useState(isFollowed);
  const [loading, setLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [followerCount, setFollowerCount] = useState<number | null>(null);

  const isMasterTopic = MASTER_TOPICS.some(
    (mt) => mt.toLowerCase() === topic.toLowerCase()
  );

  // Fetch follower count
  useEffect(() => {
    async function fetchFollowerCount() {
      try {
        // TODO: Create API route for fetching follower count
        // const response = await fetch(`/api/topics/${encodeURIComponent(topic)}/followers`);
        // const data = await response.json();
        // setFollowerCount(data.count || 0);
        setFollowerCount(0); // Temporary: set to 0 until API route is created
      } catch (error) {
        console.error("Error fetching follower count:", error);
      }
    }

    if (clickable) {
      fetchFollowerCount();
    }
  }, [topic, clickable]);

  const handleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      alert("Please sign in to follow topics");
      return;
    }

    setLoading(true);

    try {
      const result = await toggleTopicFollow(topic);
      setFollowing(result.following);

      // Update follower count
      if (followerCount !== null) {
        setFollowerCount(result.following ? followerCount + 1 : followerCount - 1);
      }

      // Refresh feed to show updated content
      router.refresh();
    } catch (error: any) {
      console.error("Error toggling follow:", error);
      alert(`Failed to ${following ? "unfollow" : "follow"} topic: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const badgeContent = (
    <>
      <span>#{topic}</span>
      {isMasterTopic && (
        <span className="ml-1 text-[10px] font-mono uppercase tracking-wider text-slate-500">
          Core
        </span>
      )}
    </>
  );

  const handleBadgeClick = (e: React.MouseEvent) => {
    if (clickable) {
      e.preventDefault();
      e.stopPropagation();
      router.push(`/topic/${encodeURIComponent(topic)}`);
    }
  };

  return (
    <div className="relative inline-flex items-center gap-2">
      {clickable ? (
        <div
          onClick={handleBadgeClick}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className={`relative inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-mono uppercase tracking-wider text-slate-700 transition-colors hover:bg-slate-200 hover:border-slate-300 cursor-pointer ${isMasterTopic ? "border-slate-300" : ""
            }`}
        >
          {badgeContent}
        </div>
      ) : (
        <span
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className={`relative inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-mono uppercase tracking-wider text-slate-700 ${isMasterTopic ? "border-slate-300" : ""
            }`}
        >
          {badgeContent}
        </span>
      )}
      {showTooltip && followerCount !== null && (
        <div className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 shadow-lg font-mono">
          {followerCount} {followerCount === 1 ? "follower" : "followers"}
          <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-white" />
        </div>
      )}
      {showFollowButton && (
        <Button
          variant="outline"
          onClick={handleFollow}
          disabled={loading}
          className={`text-xs px-2 py-1 h-auto border transition-all ${following
              ? "border-sme-gold bg-muted-moss/50 text-sme-gold hover:bg-muted-moss"
              : "border-translucent-emerald bg-forest-obsidian text-bone-white/70 hover:border-heart-green hover:text-bone-white"
            }`}
        >
          {loading ? "..." : following ? "Following" : "Follow"}
        </Button>
      )}
    </div>
  );
}
