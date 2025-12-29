"use client";

import { useState } from "react";
import { Star } from "lucide-react";

interface StarRatingInputProps {
    value: number | null;
    onChange: (rating: number | null) => void;
    size?: "sm" | "md" | "lg";
    disabled?: boolean;
}

export default function StarRatingInput({
    value,
    onChange,
    size = "md",
    disabled = false,
}: StarRatingInputProps) {
    const [hoverRating, setHoverRating] = useState<number | null>(null);

    const sizeClasses = {
        sm: "w-4 h-4",
        md: "w-6 h-6",
        lg: "w-8 h-8",
    };

    const starSize = sizeClasses[size];
    const displayRating = hoverRating ?? value ?? 0;

    const handleClick = (rating: number) => {
        if (disabled) return;
        // If clicking the same rating, clear it (make optional)
        if (value === rating) {
            onChange(null);
        } else {
            onChange(rating);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent, rating: number) => {
        if (disabled) return;
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick(rating);
        }
    };

    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((rating) => {
                const isFilled = rating <= displayRating;
                const isSelected = rating <= (value ?? 0);

                return (
                    <button
                        key={rating}
                        type="button"
                        onClick={() => handleClick(rating)}
                        onMouseEnter={() => !disabled && setHoverRating(rating)}
                        onMouseLeave={() => !disabled && setHoverRating(null)}
                        onKeyDown={(e) => handleKeyDown(e, rating)}
                        disabled={disabled}
                        className={`
              transition-all duration-150 ease-in-out
              ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:scale-110"}
              focus:outline-none focus:ring-2 focus:ring-sme-gold focus:ring-offset-2 focus:ring-offset-forest-obsidian
              rounded-sm
            `}
                        aria-label={`Rate ${rating} star${rating !== 1 ? "s" : ""}`}
                        aria-pressed={isSelected}
                    >
                        <Star
                            className={`
                ${starSize}
                transition-colors duration-150
                ${isFilled
                                    ? isSelected
                                        ? "fill-sme-gold text-sme-gold"
                                        : "fill-sme-gold/70 text-sme-gold/70"
                                    : "fill-none text-bone-white/30 hover:text-bone-white/50"
                                }
              `}
                        />
                    </button>
                );
            })}
            {value !== null && !disabled && (
                <button
                    type="button"
                    onClick={() => onChange(null)}
                    className="ml-2 text-xs text-bone-white/50 hover:text-bone-white/80 transition-colors font-mono"
                    aria-label="Clear rating"
                >
                    Clear
                </button>
            )}
        </div>
    );
}
