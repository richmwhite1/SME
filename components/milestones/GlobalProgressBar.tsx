"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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
        const supabase = createClient();
        
        // Count verified products (SME certified or with reviews)
        const { count: certifiedCount } = await supabase
          .from("protocols")
          .select("*", { count: "exact", head: true })
          .eq("is_sme_certified", true);

        const { count: reviewedCount } = await supabase
          .from("reviews")
          .select("*", { count: "exact", head: true })
          .or("is_flagged.eq.false,is_flagged.is.null");

        // Use certified count as primary, fallback to reviewed count
        const count = certifiedCount || reviewedCount || 0;
        setVerifiedCount(count);
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



