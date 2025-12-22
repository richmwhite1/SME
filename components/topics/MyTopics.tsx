"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Hash, X } from "lucide-react";
import { toggleTopicFollow } from "@/app/actions/topic-actions";
import Link from "next/link";

export default function MyTopics() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [followedTopics, setFollowedTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [unfollowing, setUnfollowing] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchFollowedTopics() {
      if (!isLoaded) return;

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: follows, error } = await supabase
        .from("topic_follows")
        .select("topic_name")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching followed topics:", error);
      } else {
        const topics = (follows || []).map((f: { topic_name: string }) => f.topic_name);
        setFollowedTopics(topics);
      }
      setLoading(false);
    }

    fetchFollowedTopics();
  }, [user, isLoaded]);

  const handleUnfollow = async (topicName: string) => {
    setUnfollowing((prev) => ({ ...prev, [topicName]: true }));

    try {
      const result = await toggleTopicFollow(topicName);
      if (!result.following) {
        // Successfully unfollowed
        setFollowedTopics((prev) => prev.filter((t) => t !== topicName));
        // Revalidate paths to update feeds
        router.refresh();
      }
    } catch (error) {
      console.error("Error unfollowing topic:", error);
    } finally {
      setUnfollowing((prev) => ({ ...prev, [topicName]: false }));
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl bg-white/50 p-6 backdrop-blur-sm">
        <h3 className="mb-4 text-lg font-semibold text-deep-stone">My Topics</h3>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 animate-pulse rounded-lg bg-soft-clay/30" />
          ))}
        </div>
      </div>
    );
  }

  if (followedTopics.length === 0) {
    return (
      <div className="rounded-xl bg-white/50 p-6 backdrop-blur-sm">
        <h3 className="mb-4 text-lg font-semibold text-deep-stone">My Topics</h3>
        <p className="text-sm text-deep-stone/60">
          Follow topics to see them here. Click on any tag to follow it!
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white/50 p-6 backdrop-blur-sm">
      <h3 className="mb-4 text-lg font-semibold text-deep-stone">My Topics</h3>
      <div className="space-y-2">
        {followedTopics.map((topic) => (
          <div
            key={topic}
            className="group flex items-center justify-between rounded-lg border border-soft-clay/20 bg-white/50 p-2 transition-all duration-200 hover:border-earth-green/30 hover:bg-white/70"
          >
            <Link
              href={`/topic/${encodeURIComponent(topic)}`}
              className="flex flex-1 items-center gap-2 text-sm text-deep-stone hover:text-earth-green"
            >
              <Hash size={14} className="text-earth-green" />
              <span className="font-medium">{topic}</span>
            </Link>
            <button
              onClick={() => handleUnfollow(topic)}
              disabled={unfollowing[topic]}
              className="ml-2 flex h-6 w-6 items-center justify-center rounded-full text-deep-stone/40 opacity-0 transition-all duration-200 hover:bg-red-100 hover:text-red-600 group-hover:opacity-100 disabled:opacity-50"
              title="Unfollow topic"
            >
              {unfollowing[topic] ? (
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <X size={14} />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}




