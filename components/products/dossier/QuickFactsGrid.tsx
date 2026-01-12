"use client";

import { DollarSign, Package, Target } from "lucide-react";

interface QuickFactsGridProps {
    price?: string | null;
    servingInfo?: string | null;
    targetAudience?: string | null;
}

export default function QuickFactsGrid({ price, servingInfo, targetAudience }: QuickFactsGridProps) {
    // Don't render if no facts available
    if (!price && !servingInfo && !targetAudience) {
        return null;
    }

    const facts = [
        {
            icon: DollarSign,
            label: "Price",
            value: price,
            show: !!price,
        },
        {
            icon: Package,
            label: "Servings",
            value: servingInfo,
            show: !!servingInfo,
        },
        {
            icon: Target,
            label: "Target Audience",
            value: targetAudience,
            show: !!targetAudience,
        },
    ].filter(fact => fact.show);

    if (facts.length === 0) return null;

    return (
        <div className={`grid gap-3 md:gap-4 mb-4 md:mb-6 ${facts.length === 1 ? 'grid-cols-1' :
                facts.length === 2 ? 'grid-cols-2' :
                    'grid-cols-1 sm:grid-cols-3'
            }`}>
            {facts.map((fact) => {
                const Icon = fact.icon;
                return (
                    <div
                        key={fact.label}
                        className="bg-white/5 border border-white/10 rounded-lg p-3 md:p-4 hover:bg-white/10 transition-colors"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <Icon className="w-4 h-4 text-emerald-400" />
                            <span className="text-[10px] md:text-xs font-mono uppercase tracking-wider text-bone-white/60">
                                {fact.label}
                            </span>
                        </div>
                        <div className="text-sm md:text-base font-semibold text-bone-white line-clamp-2">
                            {fact.value}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
