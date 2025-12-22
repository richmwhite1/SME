"use client";

import { useEffect, useState } from "react";
import { Award, X, Image } from "lucide-react";
import SocialCard from "@/components/social/SocialCard";
import { useShareCard } from "@/components/social/useShareCard";

interface Milestone {
  id: string;
  title: string;
  description: string;
  milestone_type: string;
  achieved_at: string;
}

export default function MilestoneBanner() {
  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const { isOpen, shareData, openShareCard, closeShareCard, handleExport } = useShareCard();

  useEffect(() => {
    async function fetchMilestone() {
      try {
        // Fetch the most recent displayed milestone from API
        const response = await fetch('/api/milestones/latest');
        if (!response.ok) {
          throw new Error('Failed to fetch milestone');
        }
        const data = await response.json();

        if (data.milestone) {
          // Check if this milestone was already dismissed
          const dismissedIds = JSON.parse(
            localStorage.getItem("dismissedMilestones") || "[]"
          );

          if (!dismissedIds.includes(data.milestone.id)) {
            setMilestone(data.milestone as Milestone);
          }
        }
      } catch (error) {
        // Silently fail - don't crash the page if milestone fetch fails
        console.error("Error fetching milestone:", error);
        return null;
      }
    }

    fetchMilestone();

    // Refresh every 30 seconds to check for new milestones
    const interval = setInterval(fetchMilestone, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleDismiss = () => {
    if (milestone) {
      const dismissedIds = JSON.parse(
        localStorage.getItem("dismissedMilestones") || "[]"
      );
      dismissedIds.push(milestone.id);
      localStorage.setItem("dismissedMilestones", JSON.stringify(dismissedIds));
      setDismissed([...dismissed, milestone.id]);
      setMilestone(null);
    }
  };

  const handleShareMilestone = () => {
    if (!milestone) return;

    const milestoneUrl = typeof window !== "undefined"
      ? `${window.location.origin}/`
      : "/";

    openShareCard({
      type: "achievement",
      content: milestone.description,
      authorName: "Health SME Community",
      milestoneTitle: milestone.title,
      milestoneType: milestone.milestone_type,
      url: milestoneUrl,
    });
  };

  if (!milestone || dismissed.includes(milestone.id)) {
    return null;
  }

  return (
    <>
      <div className="border border-sme-gold/50 bg-sme-gold/10 px-4 py-3 mb-4 relative">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-bone-white/70 hover:text-bone-white transition-colors"
          aria-label="Dismiss milestone"
        >
          <X size={16} />
        </button>

        <div className="flex items-start gap-3 pr-6">
          <div className="flex-shrink-0 mt-0.5">
            <Award className="h-5 w-5 text-sme-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-mono font-semibold uppercase tracking-wider text-bone-white mb-1">
              Milestone Achieved
            </h3>
            <p className="text-xs font-mono text-bone-white/90 leading-relaxed">
              {milestone.description}
            </p>
            <button
              onClick={handleShareMilestone}
              className="mt-2 flex items-center gap-1.5 text-xs text-sme-gold hover:text-[#9A7209] font-mono transition-colors"
            >
              <Image size={12} />
              <span>Share Achievement</span>
            </button>
          </div>
        </div>
      </div>

      {/* Share Card Modal */}
      {isOpen && shareData && (
        <SocialCard
          type={shareData.type as "insight" | "audit" | "achievement"}
          content={shareData.content}
          authorName={shareData.authorName}
          milestoneTitle={shareData.milestoneTitle}
          milestoneType={shareData.milestoneType}
          onClose={closeShareCard}
          onExport={handleExport}
        />
      )}
    </>
  );
}



