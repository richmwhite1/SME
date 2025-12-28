"use client";

import { ReactionType } from "@/app/actions/reaction-actions";
import { cn } from "@/lib/utils";

interface ReactionData {
    emoji_type: ReactionType;
    count: number;
}

interface SentimentSummaryProps {
    reactions: ReactionData[];
    totalCount?: number;
    className?: string;
}

export default function SentimentSummary({ reactions, className }: SentimentSummaryProps) {
    if (!reactions || reactions.length === 0) return null;

    // Take top 3
    const topReactions = reactions.slice(0, 3);

    return (
        <div className={cn("flex items-center gap-1.5", className)}>
            {topReactions.map((r, i) => (
                <div
                    key={r.emoji_type}
                    className="flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded-full border border-white/5 hover:border-emerald-500/30 transition-colors cursor-help group"
                    title={`${r.count} people reacted with ${r.emoji_type}`}
                >
                    <span className="text-sm">{r.emoji_type}</span>
                    <span className="text-[10px] font-mono text-bone-white/60 group-hover:text-emerald-400">{r.count}</span>
                </div>
            ))}
        </div>
    );
}
