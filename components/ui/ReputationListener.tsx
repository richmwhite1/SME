"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useSignal } from "./SignalReceivedContainer";

/**
 * Listens for reputation updates and shows Signal Received toasts
 * This component polls the reputation API to check for new notifications
 */
export default function ReputationListener() {
  const { user, isLoaded } = useUser();
  const { showSignal } = useSignal();
  const lastNotificationIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !user) return;

    const checkForNewNotifications = async () => {
      try {
        const response = await fetch('/api/notifications');
        if (!response.ok) return;

        const notifications = await response.json();
        if (!notifications || notifications.length === 0) return;

        // Get the most recent notification
        const latestNotification = notifications[0];
        
        // Check if this is a new notification we haven't seen
        if (lastNotificationIdRef.current === null) {
          // First load - just store the ID
          lastNotificationIdRef.current = latestNotification.id;
          return;
        }

        // Check if there's a new notification
        if (latestNotification.id !== lastNotificationIdRef.current) {
          // Find all new notifications since last check
          const newNotifications = notifications.filter(
            (n: any) => n.id !== lastNotificationIdRef.current
          );

          // Show toasts for new upvotes and citations
          newNotifications.forEach((notification: any) => {
            if (notification.type === "upvote") {
              const points = 15;
              showSignal(points, "Comment upvoted");
            } else if (notification.type === "citation") {
              const points = 20;
              showSignal(points, "Evidence cited");
            }
          });

          // Update the last seen notification ID
          lastNotificationIdRef.current = latestNotification.id;
        }
      } catch (error) {
        console.error('Error checking for notifications:', error);
      }
    };

    // Check immediately
    checkForNewNotifications();

    // Poll every 10 seconds for new notifications
    const interval = setInterval(checkForNewNotifications, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [isLoaded, user, showSignal]);

  return null;
}



