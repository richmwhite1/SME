'use client';

import React, { useState } from 'react';
import { Activity } from 'lucide-react';

interface PillarProgressBarProps {
    avgScores: {
        purity: number | null;
        bioavailability: number | null;
        potency: number | null;
        evidence: number | null;
        sustainability: number | null;
        experience: number | null;
        safety: number | null;
        transparency: number | null;
        synergy: number | null;
    };
    reviewCount: number;
    compact?: boolean;
}

const PILLAR_NAMES = [
    'Purity',
    'Bioavailability',
    'Potency',
    'Evidence',
    'Sustainability',
    'Experience',
    'Safety',
    'Transparency',
    'Synergy'
];

export default function PillarProgressBar({ avgScores, reviewCount, compact = false }: PillarProgressBarProps) {
    const [showTooltip, setShowTooltip] = useState(false);

    // Calculate overall average score (only from non-null pillars)
    const scores = Object.values(avgScores).filter((s): s is number => s !== null && s !== undefined);
    const overallScore = scores.length > 0
        ? (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1)
        : null;

    // Calculate completion (how many pillars have been reviewed)
    const totalPillars = 9;
    const reviewedPillars = scores.length;
    const completionPercentage = (reviewedPillars / totalPillars) * 100;

    // Determine status color
    const getStatusColor = () => {
        if (reviewCount === 0) return 'text-bone-white/40';
        if (reviewedPillars >= 7) return 'text-sme-gold';
        if (reviewedPillars >= 4) return 'text-emerald-400';
        return 'text-bone-white/60';
    };

    const getBarColor = () => {
        if (reviewCount === 0) return 'bg-white/10';
        if (reviewedPillars >= 7) return 'bg-sme-gold';
        if (reviewedPillars >= 4) return 'bg-emerald-400';
        return 'bg-bone-white/40';
    };

    if (reviewCount === 0) {
        return (
            <div className={`flex items-center gap-2 ${compact ? 'text-xs' : 'text-sm'} text-bone-white/40 font-mono`}>
                <Activity className={compact ? 'w-3 h-3' : 'w-4 h-4'} />
                <span>Expert Analysis Pending</span>
            </div>
        );
    }

    return (
        <div
            className="relative"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            <div className={`flex items-center gap-3 ${compact ? 'text-xs' : 'text-sm'}`}>
                {/* Overall Score */}
                <div className={`flex items-center gap-1.5 font-mono font-bold ${getStatusColor()}`}>
                    <Activity className={compact ? 'w-3 h-3' : 'w-4 h-4'} />
                    <span className={compact ? 'text-sm' : 'text-base'}>{overallScore}</span>
                    <span className="text-bone-white/30">/10</span>
                </div>

                {/* Progress Bar */}
                <div className="flex-1 min-w-[60px] max-w-[120px]">
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
                        <div
                            className={`h-full ${getBarColor()} transition-all duration-500 ease-out`}
                            style={{ width: `${completionPercentage}%` }}
                        />
                    </div>
                </div>

                {/* Completion Count */}
                <span className="text-bone-white/50 font-mono text-xs">
                    {reviewedPillars}/{totalPillars}
                </span>
            </div>

            {/* Tooltip */}
            {showTooltip && (
                <div className="absolute z-50 bottom-full left-0 mb-2 p-3 bg-forest-black/95 border border-sme-gold/30 rounded-lg shadow-xl backdrop-blur-sm min-w-[200px] animate-in fade-in zoom-in-95 duration-200">
                    <div className="text-xs font-mono mb-2 text-sme-gold uppercase tracking-wider">
                        9-Pillar Analysis
                    </div>
                    <div className="space-y-1 text-xs">
                        {PILLAR_NAMES.map((pillarName, idx) => {
                            const key = pillarName.toLowerCase() as keyof typeof avgScores;
                            const score = avgScores[key];
                            const hasScore = score !== null && score !== undefined;

                            return (
                                <div key={pillarName} className="flex items-center justify-between gap-3">
                                    <span className={hasScore ? 'text-bone-white/80' : 'text-bone-white/30'}>
                                        {pillarName}
                                    </span>
                                    <span className={`font-mono ${hasScore ? 'text-emerald-400' : 'text-bone-white/20'}`}>
                                        {hasScore ? score.toFixed(1) : 'N/A'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-2 pt-2 border-t border-white/10 text-xs text-bone-white/50">
                        {reviewCount} SME {reviewCount === 1 ? 'Review' : 'Reviews'}
                    </div>
                </div>
            )}
        </div>
    );
}
