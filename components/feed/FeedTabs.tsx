"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Users, Globe, Heart } from "lucide-react";

type TabType = "tribe" | "pulse" | "interests";

interface FeedTabsProps {
  activeTab: TabType;
}

export default function FeedTabs({ activeTab }: FeedTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleTabChange = (tab: TabType) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`/feed?${params.toString()}`);
  };

  const tabs = [
    { id: "tribe" as TabType, label: "My Tribe", icon: Users },
    { id: "pulse" as TabType, label: "Community Pulse", icon: Globe },
    { id: "interests" as TabType, label: "My Interests", icon: Heart },
  ];

  return (
    <div className="mb-6 flex gap-2 border-b border-soft-clay/20">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              isActive
                ? "border-earth-green text-earth-green"
                : "border-transparent text-deep-stone/60 hover:text-deep-stone hover:border-soft-clay/40"
            }`}
          >
            <Icon size={16} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

