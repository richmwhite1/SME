"use client";

import { Leaf, Wheat, Milk, Star, Award } from "lucide-react";

interface DietaryBadgesProps {
    dietaryTags?: string[] | null;
}

// Icon mapping for dietary tags
const DIETARY_ICONS: Record<string, any> = {
    vegan: Leaf,
    vegetarian: Leaf,
    gluten_free: Wheat,
    dairy_free: Milk,
    kosher: Star,
    halal: Star,
    paleo: Award,
    keto: Award,
    non_gmo: Award,
};

// Color mapping for dietary tags
const DIETARY_COLORS: Record<string, string> = {
    vegan: "bg-green-500/20 border-green-500/50 text-green-300",
    vegetarian: "bg-green-500/20 border-green-500/50 text-green-300",
    gluten_free: "bg-orange-500/20 border-orange-500/50 text-orange-300",
    dairy_free: "bg-orange-500/20 border-orange-500/50 text-orange-300",
    kosher: "bg-purple-500/20 border-purple-500/50 text-purple-300",
    halal: "bg-purple-500/20 border-purple-500/50 text-purple-300",
    paleo: "bg-blue-500/20 border-blue-500/50 text-blue-300",
    keto: "bg-blue-500/20 border-blue-500/50 text-blue-300",
    non_gmo: "bg-emerald-500/20 border-emerald-500/50 text-emerald-300",
};

export default function DietaryBadges({ dietaryTags }: DietaryBadgesProps) {
    if (!dietaryTags || dietaryTags.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-wrap gap-2 mb-4">
            {dietaryTags.map((tag) => {
                const Icon = DIETARY_ICONS[tag] || Award;
                const colorClass = DIETARY_COLORS[tag] || "bg-gray-500/20 border-gray-500/50 text-gray-300";

                return (
                    <div
                        key={tag}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 font-semibold text-xs md:text-sm transition-all hover:scale-105 ${colorClass}`}
                    >
                        <Icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        <span className="capitalize">{tag.replace(/_/g, " ")}</span>
                    </div>
                );
            })}
        </div>
    );
}
