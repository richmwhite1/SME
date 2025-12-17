"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface StarRatingProps {
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
}

export default function StarRating({
  value,
  onChange,
  disabled = false,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const isActive = hoverValue !== null ? star <= hoverValue : star <= value;
        return (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onClick={() => onChange(star)}
            onMouseEnter={() => !disabled && setHoverValue(star)}
            onMouseLeave={() => setHoverValue(null)}
            className={cn(
              "transition-all duration-200 hover:scale-110 active:scale-95",
              disabled && "cursor-not-allowed opacity-50"
            )}
          >
            <Star
              className={cn(
                "h-6 w-6 transition-colors duration-200",
                isActive
                  ? "fill-earth-green text-earth-green"
                  : "fill-none text-soft-clay"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

