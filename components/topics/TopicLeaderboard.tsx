"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@clerk/nextjs";
import { Hash, TrendingUp, Plus, Sparkles } from "lucide-react";
import { toggleTopicFollow } from "@/app/actions/topic-actions";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface TrendingTopic {
  topic_name: string;
  post_count: number;
  signal_score: number;
}

interface MasterTopic {
  name: string;
  description: string | null;
}

export default function TopicLeaderboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [topics, setTopics] = useState<TrendingTopic[]>([]);
  const [masterTopics, setMasterTopics] = useState<MasterTopic[]>([]);
  const [followedTopics, setFollowedTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [showMasterTopics, setShowMasterTopics] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      // Fetch trending topics
      const { data: trendingData, error } = await supabase.rpc("get_trending_topics", {
        limit_count: 5,
      } as any);

      if (error) {
        console.error("Error fetching trending topics:", error);
        // If RPC fails, fetch master topics as fallback
        setShowMasterTopics(true);
      } else {
        const trendingTopics = (trendingData || []) as TrendingTopic[];
        setTopics(trendingTopics);
        
        // If no trending topics, show master topics instead
        if (trendingTopics.length === 0) {
          setShowMasterTopics(true);
        }
      }

      // Fetch master topics (always fetch in case we need them)
      const { data: masterData, error: masterError } = await supabase
        .from("master_topics")
        .select("name, description")
        .order("display_order", { ascending: true })
        .limit(12);

      if (!masterError && masterData) {
        setMasterTopics(masterData as MasterTopic[]);
      }

      // Fetch followed topics if user is logged in
      if (isLoaded && user) {
        const { data: follows } = await supabase
          .from("topic_follows")
          .select("topic_name")
          .eq("user_id", user.id);

        const followed = (follows || []).map((f: { topic_name: string }) => f.topic_name);
        setFollowedTopics(followed);

        // Initialize following states
        const states: Record<string, boolean> = {};
        followed.forEach((topic: string) => {
          states[topic] = true;
        });
        setFollowingStates(states);
      }

      setLoading(false);
    }

    fetchData();
  }, [user, isLoaded]);

  const handleFollow = async (topicName: string) => {
    if (!user) {
      // Redirect to sign in or show message
      return;
    }

    setLoadingStates((prev) => ({ ...prev, [topicName]: true }));

    try {
      const result = await toggleTopicFollow(topicName);
      setFollowingStates((prev) => ({ ...prev, [topicName]: result.following }));

      if (result.following) {
        setFollowedTopics((prev) => [...prev, topicName]);
      } else {
        setFollowedTopics((prev) => prev.filter((t) => t !== topicName));
      }

      // Revalidate the feed page to update My Interests tab immediately
      router.refresh();
      // Also trigger a path revalidation (this will be handled by the server action)
    } catch (error) {
      console.error("Error toggling topic follow:", error);
    } finally {
      setLoadingStates((prev) => ({ ...prev, [topicName]: false }));
    }
  };

  const getSignalColor = (score: number) => {
    if (score >= 4) return "bg-earth-green";
    if (score >= 3) return "bg-earth-green/70";
    if (score >= 2) return "bg-earth-green/50";
    return "bg-earth-green/30";
  };

  if (loading) {
    return (
      <div className="rounded-xl bg-white/50 p-6 backdrop-blur-sm">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-deep-stone">
          <TrendingUp size={20} className="text-earth-green" />
          Trending Topics
        </h3>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-soft-clay/30" />
          ))}
        </div>
      </div>
    );
  }

  // Show master topics if no trending topics
  if (showMasterTopics || topics.length === 0) {
    return (
      <div className="rounded-xl bg-white/50 p-6 backdrop-blur-sm">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-deep-stone">
          <Sparkles size={20} className="text-earth-green" />
          Discover Topics
        </h3>
        <p className="mb-4 text-xs text-deep-stone/60">
          Explore our core topics to get started
        </p>
        <div className="space-y-2">
          {masterTopics.map((topic, index) => {
            const isFollowing = followingStates[topic.name] || false;
            const isLoading = loadingStates[topic.name] || false;

            return (
              <div
                key={topic.name}
                className="flex items-center justify-between rounded-lg border border-soft-clay/20 bg-white/50 p-3 transition-all duration-200 hover:border-earth-green/30 hover:bg-white/70"
              >
                <Link
                  href={`/topic/${encodeURIComponent(topic.name)}`}
                  className="flex flex-1 items-center gap-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-earth-green/20 text-sm font-semibold text-earth-green">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Hash size={14} className="text-earth-green" />
                      <span className="font-medium text-deep-stone">{topic.name}</span>
                    </div>
                    {topic.description && (
                      <p className="mt-1 text-xs text-deep-stone/60">{topic.description}</p>
                    )}
                  </div>
                </Link>
                {user && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleFollow(topic.name);
                    }}
                    disabled={isLoading}
                    className={`ml-2 flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 ${
                      isFollowing
                        ? "bg-earth-green/20 text-earth-green hover:bg-earth-green/30"
                        : "bg-soft-clay/30 text-deep-stone/60 hover:bg-earth-green/20 hover:text-earth-green"
                    } ${isLoading ? "opacity-50" : ""}`}
                    title={isFollowing ? "Unfollow" : "Follow"}
                  >
                    {isLoading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <Plus
                        size={16}
                        className={isFollowing ? "rotate-45" : ""}
                        style={{ transition: "transform 0.2s" }}
                      />
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white/50 p-6 backdrop-blur-sm">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-deep-stone">
        <TrendingUp size={20} className="text-earth-green" />
        Trending Topics
      </h3>
      <p className="mb-4 text-xs text-deep-stone/60">
        Top topics from Trusted Voices this week
      </p>
      <div className="space-y-3">
        {topics.map((topic, index) => {
          const isFollowing = followingStates[topic.topic_name] || false;
          const isLoading = loadingStates[topic.topic_name] || false;

          return (
            <div
              key={topic.topic_name}
              className="flex items-center justify-between rounded-lg border border-soft-clay/20 bg-white/50 p-3 transition-all duration-200 hover:border-earth-green/30 hover:bg-white/70"
            >
              <Link
                href={`/topics/${encodeURIComponent(topic.topic_name)}`}
                className="flex flex-1 items-center gap-3"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-earth-green/20 text-sm font-semibold text-earth-green">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Hash size={14} className="text-earth-green" />
                    <span className="font-medium text-deep-stone">{topic.topic_name}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-1.5 w-1.5 rounded-full ${
                            level <= topic.signal_score
                              ? getSignalColor(topic.signal_score)
                              : "bg-soft-clay/20"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-deep-stone/60">
                      {topic.post_count} post{topic.post_count !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </Link>
              {user && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleFollow(topic.topic_name);
                  }}
                  disabled={isLoading}
                  className={`ml-2 flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 ${
                    isFollowing
                      ? "bg-earth-green/20 text-earth-green hover:bg-earth-green/30"
                      : "bg-soft-clay/30 text-deep-stone/60 hover:bg-earth-green/20 hover:text-earth-green"
                  } ${isLoading ? "opacity-50" : ""}`}
                  title={isFollowing ? "Unfollow" : "Follow"}
                >
                  {isLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Plus
                      size={16}
                      className={isFollowing ? "rotate-45" : ""}
                      style={{ transition: "transform 0.2s" }}
                    />
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

