"use client";

import { useState, useEffect, useRef } from "react";
import { Check, Plus } from "lucide-react";
import { toggleTopicFollow, getFollowedTopics, getMasterTopics } from "@/app/actions/topic-actions";

interface Topic {
  name: string;
  description: string | null;
  icon: string | null;
}

const CALIBRATION_THRESHOLD = 3;

export default function FeedCalibration() {
  const [masterTopics, setMasterTopics] = useState<Topic[]>([]);
  const [followedTopics, setFollowedTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [errorStates, setErrorStates] = useState<Record<string, boolean>>({});
  const [showConfetti, setShowConfetti] = useState(false);
  const [signalConfirmed, setSignalConfirmed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchData() {
      try {
        const [topics, followed] = await Promise.all([
          getMasterTopics(),
          getFollowedTopics()
        ]);
        setMasterTopics(topics as Topic[]);
        setFollowedTopics(followed);
      } catch (error) {
        console.error("Error fetching calibration data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const hasCelebratedRef = useRef(false);

  useEffect(() => {
    if (followedTopics.length >= CALIBRATION_THRESHOLD && !hasCelebratedRef.current) {
      setShowConfetti(true);
      hasCelebratedRef.current = true;
      setTimeout(() => setShowConfetti(false), 5000);
    }
  }, [followedTopics.length]);

  const handleFollow = async (topicName: string) => {
    setLoadingStates((prev) => ({ ...prev, [topicName]: true }));
    setErrorStates((prev) => ({ ...prev, [topicName]: false }));

    try {
      const result = await toggleTopicFollow(topicName);

      if (result.success) {
        if (result.following) {
          setFollowedTopics((prev) => [...prev, topicName]);
          setSignalConfirmed((prev) => ({ ...prev, [topicName]: true }));
          setTimeout(() => {
            setSignalConfirmed((prev) => ({ ...prev, [topicName]: false }));
          }, 2000);
        } else {
          setFollowedTopics((prev) => prev.filter((t) => t !== topicName));
        }
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      setErrorStates((prev) => ({ ...prev, [topicName]: true }));
      setTimeout(() => {
        setErrorStates((prev) => ({ ...prev, [topicName]: false }));
      }, 2000);
    } finally {
      setLoadingStates((prev) => ({ ...prev, [topicName]: false }));
    }
  };

  if (loading) {
    return (
      <div className="border border-translucent-emerald bg-muted-moss p-12 text-center">
        <div className="text-xs text-bone-white/70 font-mono">Loading topics...</div>
      </div>
    );
  }

  const progress = Math.min((followedTopics.length / CALIBRATION_THRESHOLD) * 100, 100);
  const remaining = Math.max(CALIBRATION_THRESHOLD - followedTopics.length, 0);
  const isUnlocked = followedTopics.length >= CALIBRATION_THRESHOLD;

  // Create a map for faster lookup
  const followingStates = followedTopics.reduce((acc, topic) => {
    acc[topic] = true;
    return acc;
  }, {} as Record<string, boolean>);

  return (
    <div className="border border-translucent-emerald bg-muted-moss p-8">
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10px',
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
                color: i % 2 === 0 ? '#10B981' : '#B8860B',
              }}
            >
              {i % 2 === 0 ? '✓' : '★'}
            </div>
          ))}
        </div>
      )}

      <div className="mb-6 text-center">
        <h2 className="mb-2 font-serif text-2xl font-semibold text-bone-white">
          Feed Calibration
        </h2>
        <p className="text-sm text-bone-white/70 font-mono">
          Select topics to personalize your research intelligence feed
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-bone-white/70">
            {isUnlocked
              ? "Signal Lock: Calibrated"
              : `Feed Calibration: Select ${remaining} Topic${remaining !== 1 ? 's' : ''} to Initialize Signal`}
          </span>
          <span className="text-xs font-mono text-bone-white">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="relative h-2 w-full border border-translucent-emerald bg-forest-obsidian overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${isUnlocked
              ? "bg-sme-gold"
              : "bg-heart-green"
              }`}
            style={{
              width: `${progress}%`,
              boxShadow: isUnlocked
                ? "0 0 16px rgba(184, 134, 11, 0.6), 0 0 32px rgba(184, 134, 11, 0.3)"
                : "none",
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {masterTopics.map((topic) => {
          const isFollowing = followingStates[topic.name] || false;
          const isLoading = loadingStates[topic.name] || false;
          const isConfirmed = signalConfirmed[topic.name] || false;
          const hasError = errorStates[topic.name] || false;

          return (
            <div
              key={topic.name}
              className={`group relative border bg-forest-obsidian p-4 transition-all duration-200 active:scale-95 ${isFollowing
                ? "border-heart-green bg-heart-green/10"
                : hasError
                  ? "border-amber-600/50 bg-amber-900/10"
                  : "border-translucent-emerald hover:border-heart-green"
                } ${isConfirmed ? "ring-2 ring-heart-green ring-opacity-40" : ""} ${hasError ? "animate-shake" : ""
                }`}
              style={{
                boxShadow: isFollowing
                  ? "0 0 12px rgba(16, 185, 129, 0.3), 0 0 24px rgba(16, 185, 129, 0.15)"
                  : isConfirmed
                    ? "0 0 16px rgba(16, 185, 129, 0.4), 0 0 24px rgba(16, 185, 129, 0.2)"
                    : hasError
                      ? "0 0 12px rgba(217, 119, 6, 0.3), 0 0 24px rgba(217, 119, 6, 0.15)"
                      : "none",
                transition: "all 0.3s ease-in-out, transform 0.1s ease-out",
                animation: isConfirmed ? "pulse 2s ease-in-out" : hasError ? "shake 0.5s ease-in-out" : "none",
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-0.5 flex-shrink-0">{topic.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="mb-1 font-serif text-base font-semibold text-bone-white">
                      {topic.name}
                    </h3>
                    {topic.description && (
                      <p className="text-xs text-bone-white/60 font-mono leading-relaxed">
                        {topic.description}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleFollow(topic.name)}
                  disabled={isLoading}
                  className={`relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border transition-all duration-200 active:scale-95 ${hasError
                    ? "border-amber-600/50 bg-amber-900/20 text-amber-500"
                    : isFollowing
                      ? "border-heart-green bg-heart-green/20 text-heart-green hover:bg-heart-green/30"
                      : "border-translucent-emerald bg-forest-obsidian text-bone-white/70 hover:border-heart-green hover:text-bone-white"
                    } ${isLoading ? "opacity-50" : ""} ${isConfirmed ? "ring-2 ring-heart-green ring-opacity-40" : ""
                    } ${hasError ? "animate-shake" : ""}`}
                  style={{
                    boxShadow: isConfirmed
                      ? "0 0 16px rgba(16, 185, 129, 0.4), 0 0 24px rgba(16, 185, 129, 0.2)"
                      : hasError
                        ? "0 0 12px rgba(217, 119, 6, 0.3), 0 0 24px rgba(217, 119, 6, 0.15)"
                        : "none",
                    transition: "all 0.3s ease-in-out",
                    animation: isConfirmed ? "pulse 2s ease-in-out" : hasError ? "shake 0.5s ease-in-out" : "none",
                  }}
                  title={hasError ? "Connection lost - try again" : isFollowing ? "Unfollow" : "Follow"}
                >
                  {isLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : isFollowing ? (
                    <Check size={16} />
                  ) : (
                    <Plus size={16} />
                  )}
                </button>
              </div>
              {isFollowing && (
                <div
                  className="mt-2 flex items-center gap-1.5"
                  style={{
                    boxShadow: "0 0 8px rgba(16, 185, 129, 0.3)",
                  }}
                >
                  <span className="text-[10px] font-mono uppercase tracking-wider text-heart-green">
                    Following
                  </span>
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-heart-green opacity-75"></span>
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-heart-green"></span>
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {followedTopics.length > 0 && (
        <div className="mt-6 text-center">
          <p className="text-xs text-bone-white/70 font-mono">
            Following {followedTopics.length} topic{followedTopics.length !== 1 ? "s" : ""}. Your feed will update shortly.
          </p>
        </div>
      )}
    </div>
  );
}
