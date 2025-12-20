"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";

export default function FeedNotificationDot() {
  const { user, isLoaded } = useUser();
  const [hasNewDiscussions, setHasNewDiscussions] = useState(false);

  useEffect(() => {
    async function checkNewDiscussions() {
      if (!isLoaded || !user) {
        return;
      }

      try {
        const response = await fetch('/api/feed/notifications');
        if (!response.ok) {
          setHasNewDiscussions(false);
          return;
        }

        const data = await response.json();
        setHasNewDiscussions(data.hasNewDiscussions || false);
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



