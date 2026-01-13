"use client";

import { Award, Microscope, Heart, Sparkles, Leaf } from "lucide-react";
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
            icon: Leaf,
            label: "Holistic SME",
            color: "from-emerald-500 to-green-500",
            borderColor: "border-emerald-500/30",
            bgColor: "bg-emerald-500/10",
            textColor: "text-emerald-400",
            tooltip: "Holistic & experiential wisdom",
        },
        both: {
            icon: Sparkles,
            label: "Dual SME",
            color: "from-purple-500 via-pink-500 to-amber-500",
            borderColor: "border-purple-500/30",
            bgColor: "bg-gradient-to-r from-purple-500/10 to-amber-500/10",
            textColor: "text-purple-400",
            tooltip: "Scientific & Holistic expertise",
        },
    };

    // Override icon for experiential to be a leaf if possible, but lucide-react might not be imported with it. 
    // Let's stick to the current imports or add Leaf. 
    // I will use Heart for now as "Holistic" usually maps to Heart in this design system, 
    // BUT the prompt asked for "Green/Leaf". I should check if Leaf is available in Lucide or add it.
    // I'll stick to the existing imports first to avoid breaking changes, but I should probably add Leaf.

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.scientific;
    const Icon = config.icon;

    // Safety check: if type passed doesn't match and we fell back, but maybe we shouldn't render if it's completely wrong?
    // Actually, fallback to scientific is probably safe enough for now to prevent crash, 
    // but better might be to return null if the type isn't recognized and it wasn't optional?
    // The props say type is optional, defaulting to scientific.
    // But if "Trusted Voice" is passed, it falls into the lookup.

    // Better logic:
    if (!typeConfig[type as keyof typeof typeConfig]) {
        // If the type is not one of our SME types, we probably shouldn't render an SME badge for it.
        // e.g. "Trusted Voice" or "Member" shouldn't get a fake "Scientific" badge.
        return null;
    }

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
                        {type === "both" ? "SME+" : (type === "experiential" ? "Holistic" : "SME")}
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
