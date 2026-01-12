"use client";

import { useState } from "react";
import { Plus, Check } from "lucide-react";

interface ComparisonButtonProps {
    productId: string;
    productName: string;
    isInComparison?: boolean;
    onToggle: (productId: string) => void;
    size?: "sm" | "md" | "lg";
}

export default function ComparisonButton({
    productId,
    productName,
    isInComparison = false,
    onToggle,
    size = "md",
}: ComparisonButtonProps) {
    const [isAnimating, setIsAnimating] = useState(false);
    const [justAdded, setJustAdded] = useState(false);

    const sizeClasses = {
        sm: "px-3 py-1.5 text-xs",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base",
    };

    const iconSizes = {
        sm: 14,
        md: 16,
        lg: 18,
    };

    const handleClick = () => {
        setIsAnimating(true);
        onToggle(productId);

        if (!isInComparison) {
            setJustAdded(true);
            setTimeout(() => setJustAdded(false), 2000);
        }

        setTimeout(() => setIsAnimating(false), 400);
    };

    return (
        <button
            onClick={handleClick}
            className={`
        ${sizeClasses[size]}
        font-mono
        rounded
        inline-flex items-center gap-2
        transition-all duration-300
        ${isInComparison
                    ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-600/30"
                    : "bg-bone-white/5 text-bone-white/70 border border-bone-white/20 hover:bg-bone-white/10 hover:border-bone-white/30"
                }
        ${isAnimating ? "scale-95" : "scale-100"}
        hover:scale-105
        active:scale-95
      `}
            aria-label={isInComparison ? `Remove ${productName} from comparison` : `Add ${productName} to comparison`}
        >
            {/* Icon with transition */}
            <div className="relative">
                <div
                    className={`
            transition-all duration-300
            ${isInComparison ? "opacity-0 scale-0 rotate-90" : "opacity-100 scale-100 rotate-0"}
          `}
                >
                    <Plus size={iconSizes[size]} strokeWidth={2} />
                </div>
                <div
                    className={`
            absolute inset-0
            transition-all duration-300
            ${isInComparison ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-0 -rotate-90"}
          `}
                >
                    <Check size={iconSizes[size]} strokeWidth={2.5} />
                </div>
            </div>

            {/* Text */}
            <span className="whitespace-nowrap">
                {isInComparison ? "In Comparison" : "Compare"}
            </span>

            {/* Success indicator */}
            {justAdded && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-600 text-white text-xs rounded shadow-lg animate-slide-check whitespace-nowrap">
                    Added to comparison!
                </div>
            )}
        </button>
    );
}
