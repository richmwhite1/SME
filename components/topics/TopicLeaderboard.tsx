"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Hash, TrendingUp, Plus, Sparkles } from "lucide-react";
import { toggleTopicFollow, getMasterTopics, getTrendingTopics, getFollowedTopics } from "@/app/actions/topic-actions";
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
  const [signalConfirmed, setSignalConfirmed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch master topics
        const masterData = await getMasterTopics();
        setMasterTopics(masterData as MasterTopic[]);

        // Fetch trending topics
        const trendingData = await getTrendingTopics(5);
        if (trendingData && trendingData.length > 0) {
          setTopics(trendingData as TrendingTopic[]);
        } else {
          setShowMasterTopics(true);
        }

        // Fetch followed topics if user is logged in
        if (isLoaded && user) {
          const followed = await getFollowedTopics();
          setFollowedTopics(followed);

          // Initialize following states
          const states: Record<string, boolean> = {};
          followed.forEach((topic: string) => {
            states[topic] = true;
          });
          setFollowingStates(states);
        }
      } catch (error) {
        console.error("Error fetching leaderboard data:", error);
        setShowMasterTopics(true);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user, isLoaded]);

  const handleFollow = async (topicName: string) => {
    if (!user) {
      // Redirect to sign in or show message
      return;
    }

    // Optimistic update: immediately update UI
    const currentFollowing = followingStates[topicName] || false;
    const newFollowingState = !currentFollowing;

    // Immediately update state for instant UI feedback
    setLoadingStates((prev) => ({ ...prev, [topicName]: true }));
    setFollowingStates((prev) => ({ ...prev, [topicName]: newFollowingState }));

    if (newFollowingState) {
      setFollowedTopics((prev) => [...prev, topicName]);
      // Trigger Emerald Aura immediately on follow
      setSignalConfirmed((prev) => ({ ...prev, [topicName]: true }));
      setTimeout(() => {
        setSignalConfirmed((prev) => ({ ...prev, [topicName]: false }));
      }, 2000); // Longer pulse for better visibility
    } else {
      setFollowedTopics((prev) => prev.filter((t) => t !== topicName));
    }

    try {
      const result = await toggleTopicFollow(topicName);
      // Update with actual result (in case of error, revert)
      setFollowingStates((prev) => ({ ...prev, [topicName]: result.following }));

      if (result.following) {
        setFollowedTopics((prev) => {
          if (!prev.includes(topicName)) {
            return [...prev, topicName];
          }
          return prev;
        });

        // Keep the animation if it was already set optimistically
        if (!signalConfirmed[topicName]) {
          setSignalConfirmed((prev) => ({ ...prev, [topicName]: true }));
          setTimeout(() => {
            setSignalConfirmed((prev) => ({ ...prev, [topicName]: false }));
          }, 2000);
        }
      } else {
        setFollowedTopics((prev) => prev.filter((t) => t !== topicName));
      }

      // Revalidate the feed page to update My Interests tab immediately
      router.refresh();
      // Also trigger a path revalidation (this will be handled by the server action)
    } catch (error) {
      console.error("Error toggling topic follow:", error);
      // Revert optimistic update on error
      setFollowingStates((prev) => ({ ...prev, [topicName]: currentFollowing }));
      if (currentFollowing) {
        setFollowedTopics((prev) => {
          if (!prev.includes(topicName)) {
            return [...prev, topicName];
          }
          return prev;
        });
      } else {
        setFollowedTopics((prev) => prev.filter((t) => t !== topicName));
      }
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
                    className={`relative flex items-center gap-1.5 rounded-full border px-3 py-1.5 transition-all duration-200 active:scale-95 ${isFollowing
                      ? "border-heart-green bg-heart-green/20 text-heart-green hover:bg-heart-green/30"
                      : "border-translucent-emerald bg-forest-obsidian text-bone-white/70 hover:border-heart-green hover:text-bone-white"
                      } ${isLoading ? "opacity-50" : ""} ${signalConfirmed[topic.name] ? "ring-2 ring-heart-green ring-opacity-40" : ""
                      }`}
                    style={{
                      boxShadow: signalConfirmed[topic.name]
                        ? "0 0 16px rgba(16, 185, 129, 0.4), 0 0 24px rgba(16, 185, 129, 0.2)"
                        : "none",
                      transition: "all 0.3s ease-in-out",
                      animation: signalConfirmed[topic.name] ? "pulse 2s ease-in-out" : "none",
                    }}
                    title={isFollowing ? "Following" : "Follow"}
                  >
                    {isLoading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : isFollowing ? (
                      <>
                        <span className="text-xs font-mono opacity-0 animate-[fadeIn_0.2s_ease-in-out_forwards]">
                          Following
                        </span>
                        <span
                          className="relative flex h-1.5 w-1.5"
                          style={{
                            boxShadow: "0 0 8px rgba(16, 185, 129, 0.3)",
                          }}
                        >
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-heart-green opacity-75"></span>
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-heart-green"></span>
                        </span>
                      </>
                    ) : (
                      <Plus size={14} style={{ transition: "transform 0.2s" }} />
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
                          className={`h-1.5 w-1.5 rounded-full ${level <= topic.signal_score
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
                  className={`relative flex items-center gap-1.5 rounded-full border px-3 py-1.5 transition-all duration-200 ${isFollowing
                    ? "border-heart-green bg-heart-green/20 text-heart-green hover:bg-heart-green/30"
                    : "bg-soft-clay/30 text-deep-stone/60 hover:bg-earth-green/20 hover:text-earth-green"
                    } ${isLoading ? "opacity-50" : ""} ${signalConfirmed[topic.topic_name] ? "ring-2 ring-heart-green ring-opacity-40" : ""
                    }`}
                  style={{
                    boxShadow: signalConfirmed[topic.topic_name]
                      ? "0 0 16px rgba(16, 185, 129, 0.4), 0 0 24px rgba(16, 185, 129, 0.2)"
                      : "none",
                    transition: "all 0.3s ease-in-out",
                    animation: signalConfirmed[topic.topic_name] ? "pulse 2s ease-in-out" : "none",
                  }}
                  title={isFollowing ? "Following" : "Follow"}
                >
                  {isLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : isFollowing ? (
                    <>
                      <span className="text-xs font-mono opacity-0 animate-[fadeIn_0.2s_ease-in-out_forwards]">
                        Following
                      </span>
                      <span
                        className="relative flex h-1.5 w-1.5"
                        style={{
                          boxShadow: "0 0 8px rgba(16, 185, 129, 0.3)",
                        }}
                      >
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-heart-green opacity-75"></span>
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-heart-green"></span>
                      </span>
                    </>
                  ) : (
                    <Plus size={14} style={{ transition: "transform 0.2s" }} />
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

