"use client";

import { useEffect } from "react";

export default function FeedVisitTracker() {
  useEffect(() => {
    // Set last visit timestamp when user visits the feed
    localStorage.setItem("feed_last_visit", new Date().toISOString());
  }, []);

  return null;
}



