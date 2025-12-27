"use client";

import { Award } from "lucide-react";

interface SMEBadgeProps {
    className?: string;
    showLabel?: boolean;
}

export default function SMEBadge({ className = "", showLabel = true }: SMEBadgeProps) {
    return (
        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 border border-sme-gold/30 bg-sme-gold/10 rounded ${className}`}>
            <Award size={12} className="text-sme-gold" />
            {showLabel && (
                <span className="text-[10px] font-mono uppercase tracking-wider text-sme-gold font-bold">
                    SME
                </span>
            )}
        </div>
    );
}
