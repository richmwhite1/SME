"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { X } from "lucide-react";
import Button from "@/components/ui/Button";
import { toggleTopicFollow } from "@/app/actions/topic-actions";
import { useState } from "react";

interface TopicFilterProps {
  topic: string;
  isFollowed?: boolean;
}

export default function TopicFilter({ topic, isFollowed = false }: TopicFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [following, setFollowing] = useState(isFollowed);
  const [loading, setLoading] = useState(false);

  const handleClearFilter = () => {
    // If on topic view page, go back to discussions
    if (pathname.startsWith("/topics/") || pathname.startsWith("/topic/")) {
      router.push("/discussions");
    } else {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("topic");
      router.push(`${pathname}?${params.toString()}`);
    }
  };

  const handleFollow = async () => {
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

  // If on topic view page, show a simpler header format
  const isTopicPage = pathname.startsWith("/topics/") || pathname.startsWith("/topic/");

  if (isTopicPage) {
    return (
      <div className="mb-6 flex items-center justify-between rounded-lg border border-earth-green/30 bg-earth-green/10 p-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-deep-stone">
            {following ? "You're following this topic" : "Follow to see more content"}
          </span>
        </div>
        <Button
          variant={following ? "secondary" : "primary"}
          onClick={handleFollow}
          disabled={loading}
          className="text-sm px-4 py-2"
        >
          {loading ? "..." : following ? "Unfollow" : "Follow"}
        </Button>
      </div>
    );
  }

  return (
    <div className="mb-6 flex items-center justify-between rounded-lg border border-earth-green/30 bg-earth-green/10 p-4">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-deep-stone">
          Filtering by: <span className="text-earth-green">#{topic}</span>
        </span>
        <button
          onClick={handleClearFilter}
          className="text-deep-stone/60 hover:text-deep-stone"
        >
          <X size={16} />
        </button>
      </div>
      <Button
        variant={following ? "secondary" : "primary"}
        onClick={handleFollow}
        disabled={loading}
        className="text-sm px-4 py-2"
      >
        {loading ? "..." : following ? "Following #" + topic : "Follow #" + topic}
      </Button>
    </div>
  );
}

