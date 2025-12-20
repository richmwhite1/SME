"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useSignal } from "./SignalReceivedContainer";
import { createClient } from "@/lib/supabase/client";

/**
 * Listens for reputation updates and shows Signal Received toasts
 * This component should be placed in the layout to monitor for real-time updates
 */
export default function ReputationListener() {
  const { user, isLoaded } = useUser();
  const { showSignal } = useSignal();

  useEffect(() => {
    if (!isLoaded || !user) return;

    const supabase = createClient();

    // Subscribe to notifications for upvotes and citations
    const channel = supabase
      .channel("reputation-updates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notification = payload.new as any;
          
          // Show signal toast for upvotes
          if (notification.type === "upvote") {
            // Calculate points (e.g., 15 points per upvote)
            const points = 15;
            showSignal(points, "Comment upvoted");
          }
          
          // Show signal toast for citations
          if (notification.type === "citation") {
            // Calculate points (e.g., 20 points per citation)
            const points = 20;
            showSignal(points, "Evidence cited");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isLoaded, user, showSignal]);

  return null;
}



