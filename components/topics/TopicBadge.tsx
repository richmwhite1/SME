"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Hash } from "lucide-react";
import { toggleTopicFollow } from "@/app/actions/topic-actions";
import Button from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

interface TopicBadgeProps {
  topic: string;
  isFollowed?: boolean;
  clickable?: boolean;
  showFollowButton?: boolean;
}

export default function TopicBadge({
  topic,
  isFollowed = false,
  clickable = true,
  showFollowButton = false,
}: TopicBadgeProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [following, setFollowing] = useState(isFollowed);
  const [loading, setLoading] = useState(false);
  const [isMasterTopic, setIsMasterTopic] = useState(false);
  const [followerCount, setFollowerCount] = useState<number | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    async function checkMasterTopic() {
      const supabase = createClient();
      const { data } = await supabase
        .from("master_topics")
        .select("name")
        .eq("name", topic)
        .maybeSingle();
      setIsMasterTopic(!!data);
    }
    checkMasterTopic();
  }, [topic]);

  useEffect(() => {
    async function fetchFollowerCount() {
      const supabase = createClient();
      const { data } = await supabase
        .from("topic_stats")
        .select("follower_count")
        .eq("topic_name", topic)
        .maybeSingle();
      setFollowerCount(data?.follower_count || 0);
    }
    fetchFollowerCount();
  }, [topic]);

  const handleClick = () => {
    if (!clickable) return;

    // Navigate to topic view page (using /topic for cleaner URLs)
    router.push(`/topic/${encodeURIComponent(topic)}`);
  };

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);

    try {
      const result = await toggleTopicFollow(topic);
      setFollowing(result.following);
      router.refresh();
    } catch (error) {
      console.error("Error toggling topic follow:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative inline-flex items-center gap-2">
      <button
        onClick={handleClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        disabled={!clickable}
        className={`relative inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium transition-all duration-200 ${
          isMasterTopic
            ? clickable
              ? "bg-earth-green/30 text-earth-green hover:bg-earth-green/40 cursor-pointer border border-earth-green/40"
              : "bg-earth-green/30 text-earth-green cursor-default border border-earth-green/40"
            : clickable
              ? "bg-earth-green/20 text-earth-green hover:bg-earth-green/30 cursor-pointer"
              : "bg-earth-green/20 text-earth-green cursor-default"
        }`}
      >
        {isMasterTopic && (
          <span className="mr-0.5 text-xs" title="Core Topic">⭐</span>
        )}
        <Hash size={14} />
        {topic}
        {isMasterTopic && (
          <span className="ml-1 rounded-full bg-white/40 px-1 text-[10px] font-semibold uppercase">
            Core
          </span>
        )}
      </button>
      {showTooltip && followerCount !== null && (
        <div className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 rounded-lg bg-deep-stone px-3 py-2 text-xs text-sand-beige shadow-lg">
          {followerCount} {followerCount === 1 ? "follower" : "followers"}
          <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-deep-stone" />
        </div>
      )}
      {showFollowButton && (
        <Button
          variant="outline"
          onClick={handleFollow}
          disabled={loading}
          className="text-xs px-2 py-1 h-auto"
        >
          {loading ? "..." : following ? "Unfollow" : "Follow"}
        </Button>
      )}
    </div>
  );
}

