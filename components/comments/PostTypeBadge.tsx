"use client";

import { BookOpen, MessageCircle, Sparkles } from "lucide-react";

interface PostTypeBadgeProps {
    postType: "verified_insight" | "community_experience";
    size?: "sm" | "md";
    className?: string;
}

export default function PostTypeBadge({
    postType,
    size = "md",
    className = "",
}: PostTypeBadgeProps) {
    const isVerified = postType === "verified_insight";

    const sizeClasses = {
        sm: "text-[10px] px-2 py-0.5 gap-1",
        md: "text-xs px-2.5 py-1 gap-1.5",
    };

    const iconSize = size === "sm" ? 10 : 12;

    return (
        <div
            className={`inline-flex items-center font-mono uppercase tracking-wider transition-all ${sizeClasses[size]
                } ${isVerified
                    ? "bg-emerald-900/30 border border-emerald-500/50 text-emerald-300"
                    : "bg-bone-white/5 border border-bone-white/20 text-bone-white/60"
                } ${className}`}
        >
            {isVerified ? (
                <>
                    <BookOpen size={iconSize} />
                    <span>Verified Insight</span>
                </>
            ) : (
                <>
                    <MessageCircle size={iconSize} />
                    <span>Community Experience</span>
                </>
            )}
        </div>
    );
}
