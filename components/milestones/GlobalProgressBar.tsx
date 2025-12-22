"use client";

import { useEffect, useState } from "react";

interface GlobalProgressBarProps {
  className?: string;
}

export default function GlobalProgressBar({ className = "" }: GlobalProgressBarProps) {
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const targetCount = 1000;

  useEffect(() => {
    async function fetchVerifiedCount() {
      try {
        // Fetch verified product count from API
        const response = await fetch('/api/stats/verified-count');
        if (!response.ok) {
          throw new Error('Failed to fetch verified count');
        }
        const data = await response.json();
        setVerifiedCount(data.count || 0);
      } catch (error) {
        // Silently fail - don't crash the page if fetch fails
        console.error("Error fetching verified count:", error);
        setVerifiedCount(0);
      } finally {
        setLoading(false);
      }
    }

    fetchVerifiedCount();
  }, []);

  const progress = Math.min((verifiedCount / targetCount) * 100, 100);

  return (
    <div className={`border-b border-translucent-emerald bg-forest-obsidian px-4 py-2 ${className}`}>
      <div className="flex items-center justify-between gap-4">
        <label className="text-xs font-mono uppercase tracking-wider text-bone-white/70 whitespace-nowrap">
          Global Knowledge Depth:
        </label>
        <div className="flex-1 flex items-center gap-3">
          {/* Progress Bar */}
          <div className="flex-1 h-1.5 bg-translucent-emerald rounded-full overflow-hidden">
            <div
              className="h-full bg-sme-gold transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          {/* Count Display */}
          <span className="text-xs font-mono text-sme-gold whitespace-nowrap">
            {loading ? "..." : `${verifiedCount}`}/1,000 Verified Audits
          </span>
        </div>
      </div>
    </div>
  );
}



