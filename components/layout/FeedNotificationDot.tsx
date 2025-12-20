"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@/lib/supabase/client";

export default function FeedNotificationDot() {
  const { user, isLoaded } = useUser();
  const [hasNewDiscussions, setHasNewDiscussions] = useState(false);

  useEffect(() => {
    async function checkNewDiscussions() {
      if (!isLoaded || !user) {
        return;
      }

      try {
        const supabase = createClient();
        
        // Get followed topics directly from database
        const { data: follows } = await supabase
          .from("topic_follows")
          .select("topic_name")
          .eq("user_id", user.id);
        
        const followedTopics = (follows || []).map((f: { topic_name: string }) => f.topic_name);
        
        if (followedTopics.length === 0) {
          setHasNewDiscussions(false);
          return;
        }

        // Get last visit timestamp from localStorage
        const lastVisit = localStorage.getItem("feed_last_visit");
        const lastVisitTime = lastVisit ? new Date(lastVisit).toISOString() : null;

        // Check for new discussions in followed topics since last visit
        if (lastVisitTime) {
          // Get discussions created after last visit
          const { data: newDiscussions } = await supabase
            .from("discussions")
            .select("id, tags")
            .gt("created_at", lastVisitTime)
            .eq("is_flagged", false)
            .limit(50);

          if (newDiscussions && newDiscussions.length > 0) {
            // Check if any discussions match followed topics
            const hasMatchingTopic = newDiscussions.some((d: any) => {
              if (!d.tags || d.tags.length === 0) return false;
              return d.tags.some((tag: string) => followedTopics.includes(tag));
            });

            setHasNewDiscussions(hasMatchingTopic);
          } else {
            setHasNewDiscussions(false);
          }
        } else {
          // First visit - don't show notification
          setHasNewDiscussions(false);
        }
      } catch (error) {
        console.error("Error checking for new discussions:", error);
        setHasNewDiscussions(false);
      }
    }

    checkNewDiscussions();
    
    // Check every 30 seconds
    const interval = setInterval(checkNewDiscussions, 30000);
    return () => clearInterval(interval);
  }, [user, isLoaded]);

  if (!hasNewDiscussions) {
    return null;
  }

  return (
    <span className="absolute -right-1 -top-1 flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-heart-green opacity-75"></span>
      <span className="relative inline-flex h-2 w-2 rounded-full bg-heart-green"></span>
    </span>
  );
}



