"use client";

import { Star } from "lucide-react";

interface StarRatingDisplayProps {
    rating: number;
    reviewCount?: number;
    size?: "sm" | "md" | "lg";
    showCount?: boolean;
    className?: string;
}

export default function StarRatingDisplay({
    rating,
    reviewCount,
    size = "md",
    showCount = true,
    className = "",
}: StarRatingDisplayProps) {
    // Clamp rating between 0 and 5
    const clampedRating = Math.max(0, Math.min(5, rating));

    const sizeClasses = {
        sm: { star: "w-3 h-3", text: "text-xs" },
        md: { star: "w-4 h-4", text: "text-sm" },
        lg: { star: "w-5 h-5", text: "text-base" },
    };

    const { star: starSize, text: textSize } = sizeClasses[size];

    // Render stars with partial fill support
    const renderStars = () => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            const fillPercentage = Math.max(0, Math.min(1, clampedRating - (i - 1)));
            const isFilled = fillPercentage > 0;
            const isPartial = fillPercentage > 0 && fillPercentage < 1;

            stars.push(
                <div key={i} className="relative inline-block">
                    {isPartial ? (
                        <>
                            {/* Background empty star */}
                            <Star className={`${starSize} text-bone-white/30`} />
                            {/* Foreground filled star with clip-path */}
                            <div
                                className="absolute inset-0 overflow-hidden"
                                style={{ width: `${fillPercentage * 100}%` }}
                            >
                                <Star className={`${starSize} fill-sme-gold text-sme-gold`} />
                            </div>
                        </>
                    ) : (
                        <Star
                            className={`
                ${starSize}
                ${isFilled ? "fill-sme-gold text-sme-gold" : "fill-none text-bone-white/30"}
              `}
                        />
                    )}
                </div>
            );
        }
        return stars;
    };

    return (
        <div className={`flex items-center gap-1.5 ${className}`}>
            <div className="flex items-center gap-0.5" aria-label={`Rating: ${clampedRating.toFixed(1)} out of 5 stars`}>
                {renderStars()}
            </div>
            {showCount && (
                <span className={`${textSize} text-bone-white/70 font-mono`}>
                    {clampedRating.toFixed(1)}
                    {reviewCount !== undefined && reviewCount > 0 && (
                        <span className="text-bone-white/50">
                            {" "}({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
                        </span>
                    )}
                </span>
            )}
        </div>
    );
}
