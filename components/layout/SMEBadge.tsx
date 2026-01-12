"use client";

import { Award, Microscope, Heart, Sparkles } from "lucide-react";
import { useState } from "react";

interface SMEBadgeProps {
    type?: "scientific" | "experiential" | "both";
    className?: string;
    showLabel?: boolean;
    showTooltip?: boolean;
}

export default function SMEBadge({
    type = "scientific",
    className = "",
    showLabel = true,
    showTooltip = true,
}: SMEBadgeProps) {
    const [isHovered, setIsHovered] = useState(false);

    const typeConfig = {
        scientific: {
            icon: Microscope,
            label: "Scientific SME",
            color: "from-blue-500 to-cyan-500",
            borderColor: "border-blue-500/30",
            bgColor: "bg-blue-500/10",
            textColor: "text-blue-400",
            tooltip: "Evidence-based research expertise",
        },
        experiential: {
            icon: Heart,
            label: "Experiential SME",
            color: "from-amber-500 to-orange-500",
            borderColor: "border-amber-500/30",
            bgColor: "bg-amber-500/10",
            textColor: "text-amber-400",
            tooltip: "Real-world experience and insights",
        },
        both: {
            icon: Sparkles,
            label: "Dual SME",
            color: "from-purple-500 via-pink-500 to-amber-500",
            borderColor: "border-purple-500/30",
            bgColor: "bg-gradient-to-r from-purple-500/10 to-amber-500/10",
            textColor: "text-purple-400",
            tooltip: "Scientific & Experiential expertise",
        },
    };

    const config = typeConfig[type];
    const Icon = config.icon;

    return (
        <div
            className="relative inline-block"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 border ${config.borderColor} ${config.bgColor} rounded transition-all duration-200 hover:scale-105 ${className}`}>
                <Icon size={12} className={config.textColor} strokeWidth={2.5} />
                {showLabel && (
                    <span className={`text-[10px] font-mono uppercase tracking-wider ${config.textColor} font-bold`}>
                        {type === "both" ? "SME+" : "SME"}
                    </span>
                )}
            </div>

            {/* Tooltip */}
            {showTooltip && isHovered && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-forest-obsidian border border-bone-white/20 rounded shadow-lg whitespace-nowrap z-50 animate-fadeIn">
                    <div className="text-xs font-mono text-bone-white/90 mb-1">
                        {config.label}
                    </div>
                    <div className="text-[10px] text-bone-white/60">
                        {config.tooltip}
                    </div>
                    {/* Arrow */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                        <div className="border-4 border-transparent border-t-bone-white/20" />
                    </div>
                </div>
            )}
        </div>
    );
}
