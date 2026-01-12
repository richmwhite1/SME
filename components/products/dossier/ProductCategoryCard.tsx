"use client";

import { Target, Lightbulb, Users } from "lucide-react";

interface ProductCategoryCardProps {
    category: string | null;
    problemSolved?: string | null;
    aiSummary?: string | null;
    targetAudience?: string | null;
}

// Map categories to icons and colors
const CATEGORY_CONFIG: Record<string, { icon: any; color: string; emoji: string }> = {
    "Brain Fog": { icon: Lightbulb, color: "text-purple-400", emoji: "🧠" },
    "Survivalist": { icon: Target, color: "text-orange-400", emoji: "🏔️" },
    "Detox": { icon: Target, color: "text-green-400", emoji: "🌿" },
    "Vitality": { icon: Target, color: "text-yellow-400", emoji: "⚡" },
    "Sleep": { icon: Target, color: "text-blue-400", emoji: "😴" },
    "Gut Health": { icon: Target, color: "text-emerald-400", emoji: "🦠" },
    "Hormones": { icon: Target, color: "text-pink-400", emoji: "⚖️" },
    "Performance": { icon: Target, color: "text-red-400", emoji: "💪" },
    "Weight Loss": { icon: Target, color: "text-amber-400", emoji: "⚖️" },
    "Recovery": { icon: Target, color: "text-cyan-400", emoji: "🔄" },
    "Mental Health": { icon: Lightbulb, color: "text-indigo-400", emoji: "🧘" },
    "Fitness": { icon: Target, color: "text-red-400", emoji: "🏋️" },
};

export default function ProductCategoryCard({
    category,
    problemSolved,
    aiSummary,
    targetAudience
}: ProductCategoryCardProps) {
    // Don't render if no category or description
    if (!category && !problemSolved && !aiSummary) return null;

    const config = category ? CATEGORY_CONFIG[category] || CATEGORY_CONFIG["Performance"] : CATEGORY_CONFIG["Performance"];
    const Icon = config.icon;

    // Use problemSolved first, then aiSummary as fallback
    const description = problemSolved || aiSummary || "";

    return (
        <div className="border border-translucent-emerald bg-muted-moss p-6 md:p-8 rounded-lg mb-8">
            <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                <Icon className={`w-6 h-6 ${config.color}`} />
                <h2 className="font-serif text-2xl md:text-3xl font-bold text-bone-white">
                    Intended Use
                </h2>
            </div>

            {/* Category Badge */}
            {category && (
                <div className="mb-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/20 rounded-full">
                        <span className="text-2xl">{config.emoji}</span>
                        <span className={`font-mono text-sm uppercase tracking-wider ${config.color}`}>
                            {category}
                        </span>
                    </div>
                </div>
            )}

            {/* Description */}
            {description && (
                <div className="mb-6">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-400 mb-3">
                        Problem Solved
                    </h3>
                    <p className="text-bone-white/90 text-base md:text-lg leading-relaxed">
                        {description}
                    </p>
                </div>
            )}

            {/* Target Audience */}
            {targetAudience && (
                <div className="pt-6 border-t border-white/10">
                    <div className="flex items-start gap-3">
                        <Users className="w-5 h-5 text-emerald-400 mt-1 flex-shrink-0" />
                        <div>
                            <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-400 mb-2">
                                Best For
                            </h3>
                            <p className="text-bone-white/80 text-sm md:text-base">
                                {targetAudience}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
