"use client";

import { Award, CheckCircle } from "lucide-react";

interface SMECertifiedBadgeProps {
    size?: "sm" | "md" | "lg";
    showTooltip?: boolean;
}

export default function SMECertifiedBadge({ size = "md", showTooltip = true }: SMECertifiedBadgeProps) {
    const sizeClasses = {
        sm: "px-2 py-1 text-xs",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base",
    };

    const iconSizes = {
        sm: "w-3 h-3",
        md: "w-4 h-4",
        lg: "w-5 h-5",
    };

    return (
        <div className="relative group">
            <div
                className={`
          inline-flex items-center gap-2
          bg-gradient-to-r from-emerald-900/40 to-emerald-800/40
          border-2 border-emerald-500/70
          ${sizeClasses[size]}
          rounded-lg
          font-bold uppercase tracking-wider
          text-emerald-300
          shadow-lg shadow-emerald-900/50
          hover:shadow-emerald-900/70
          transition-all duration-300
          hover:scale-105
        `}
            >
                <Award className={`${iconSizes[size]} text-emerald-400`} />
                <span>SME Certified</span>
                <CheckCircle className={`${iconSizes[size]} text-emerald-400`} />
            </div>

            {showTooltip && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-2 bg-[#0a0a0a] border border-emerald-500/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    <p className="text-xs text-emerald-300 font-semibold">
                        Verified by Subject Matter Experts
                    </p>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                        <div className="border-4 border-transparent border-t-emerald-500/50"></div>
                    </div>
                </div>
            )}
        </div>
    );
}
