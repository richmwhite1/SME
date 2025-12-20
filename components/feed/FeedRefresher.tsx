"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@/lib/supabase/client";
import { RefreshCw } from "lucide-react";

interface FeedRefresherProps {
  initialItemCount: number;
  initialTimestamp?: string; // ISO timestamp of initial load
  followedTopics?: string[]; // Topics the user follows
  checkInterval?: number; // milliseconds
}

export default function FeedRefresher({ 
  initialItemCount, 
  initialTimestamp,
  followedTopics = [],
  checkInterval = 30000 // Default 30 seconds
}: FeedRefresherProps) {
  const router = useRouter();
  const { user } = useUser();
  const [hasNewSignals, setHasNewSignals] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!user || followedTopics.length === 0) return;

    // Check for new signals periodically
    const checkForNewSignals = async () => {
      try {
        const supabase = createClient();
        const checkTime = initialTimestamp || new Date().toISOString();
        
        // Check for new discussions in followed topics since initial load
        const { count: newDiscussions } = await supabase
          .from("discussions")
          .select("*", { count: "exact", head: true })
          .eq("is_flagged", false)
          .contains("tags", followedTopics)
          .gt("created_at", checkTime);

        // Check for new products in followed topics since initial load
        const { count: newProducts } = await supabase
          .from("protocols")
          .select("*", { count: "exact", head: true })
          .eq("is_flagged", false)
          .contains("tags", followedTopics)
          .gt("created_at", checkTime);

        const totalNew = (newDiscussions || 0) + (newProducts || 0);

        if (totalNew > 0 && !hasNewSignals) {
          setHasNewSignals(true);
        } else if (totalNew === 0 && hasNewSignals) {
          setHasNewSignals(false);
        }
      } catch (error) {
        console.error("Error checking for new signals:", error);
      }
    };

    // Initial check after a delay
    const initialTimeout = setTimeout(checkForNewSignals, checkInterval);

    // Set up interval to check periodically
    const interval = setInterval(checkForNewSignals, checkInterval);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [user, initialTimestamp, checkInterval, hasNewSignals, followedTopics]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setHasNewSignals(false);
    
    // Refresh the page data without full reload
    router.refresh();
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Reset refreshing state after a brief delay
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  if (!hasNewSignals) {
    return null;
  }

  return (
    <div className="mb-6 flex justify-center">
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="flex items-center gap-2 border border-heart-green bg-heart-green/20 px-4 py-2 rounded-md text-sm font-mono uppercase tracking-wider text-heart-green hover:bg-heart-green/30 transition-all duration-200 active:scale-95 shadow-lg"
        style={{
          boxShadow: "0 0 16px rgba(16, 185, 129, 0.4), 0 0 32px rgba(16, 185, 129, 0.2)",
          animation: "pulse 2s ease-in-out infinite",
        }}
      >
        <RefreshCw 
          size={14} 
          className={isRefreshing ? "animate-spin" : ""} 
        />
        <span>New Signals Detected</span>
      </button>
    </div>
  );
}



