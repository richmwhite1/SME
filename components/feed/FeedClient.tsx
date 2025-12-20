"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import FeedCalibration from "./FeedCalibration";
import { useRouter } from "next/navigation";

interface FeedClientProps {
  initialFollowedTopics: string[];
  children: React.ReactNode;
}

export default function FeedClient({ initialFollowedTopics, children }: FeedClientProps) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [followedTopics, setFollowedTopics] = useState<string[]>(initialFollowedTopics);
  const [showSignalLock, setShowSignalLock] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    async function fetchFollowedTopics() {
      if (!isLoaded || !user) {
        return;
      }

      const supabase = createClient();
      const { data: follows } = await supabase
        .from("topic_follows")
        .select("topic_name")
        .eq("user_id", user.id);

      const followed = (follows || []).map((f: { topic_name: string }) => f.topic_name);
      
      // If we transition from 0 to >= 3 topics, trigger Signal Lock animation
      if (followedTopics.length < 3 && followed.length >= 3 && !isTransitioning) {
        setIsTransitioning(true);
        setShowSignalLock(true);
        
        // Hide animation after fade completes
        setTimeout(() => {
          setShowSignalLock(false);
          setIsTransitioning(false);
        }, 1000);
      }
      
      // Only update if changed to avoid unnecessary re-renders
      if (JSON.stringify(followed.sort()) !== JSON.stringify(followedTopics.sort())) {
        setFollowedTopics(followed);
      }
    }

    fetchFollowedTopics();
    
    // Poll for updates more frequently during initial load, then less frequently
    const pollInterval = initialFollowedTopics.length === 0 ? 500 : 2000;
    const interval = setInterval(() => {
      fetchFollowedTopics();
    }, pollInterval);
    
    return () => clearInterval(interval);
  }, [user, isLoaded, initialFollowedTopics.length]);

  // Refresh router when topics change from < 3 to >= 3 (after animation)
  useEffect(() => {
    if (followedTopics.length >= 3 && initialFollowedTopics.length < 3) {
      // Refresh after Signal Lock animation completes to get fresh server data
      const timeout = setTimeout(() => {
        router.refresh();
      }, 1200); // Slightly after animation completes
      
      return () => clearTimeout(timeout);
    }
  }, [followedTopics.length, initialFollowedTopics.length, router]);

  return (
    <>
      {/* Signal Lock Animation */}
      {showSignalLock && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-forest-obsidian/95"
          style={{
            animation: "signalLockFade 1s ease-in-out",
          }}
        >
          <div className="text-center">
            <div
              className="mb-4 inline-block rounded-full border-2 border-heart-green p-6"
              style={{
                boxShadow: "0 0 32px rgba(16, 185, 129, 0.6), 0 0 64px rgba(16, 185, 129, 0.3)",
                animation: "pulse 1s ease-in-out",
              }}
            >
              <svg
                className="h-12 w-12 text-heart-green"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="font-mono text-sm uppercase tracking-wider text-heart-green">
              Signal Lock
            </p>
            <p className="mt-2 font-mono text-xs text-bone-white/70">
              Laboratory calibrated to your interests
            </p>
          </div>
        </div>
      )}

      {/* Feed Calibration - Only show when less than threshold topics followed and not transitioning */}
      {/* Show feed immediately if user already has followed >= 3 topics */}
      {(initialFollowedTopics.length >= 3 || followedTopics.length >= 3) ? (
        <div style={{ opacity: isTransitioning ? 0.5 : 1, transition: "opacity 0.3s" }}>
          {children}
        </div>
      ) : (
        !isTransitioning && (
          <section className="mb-8">
            <FeedCalibration />
          </section>
        )
      )}
    </>
  );
}



