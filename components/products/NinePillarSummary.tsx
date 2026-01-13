'use client';

import React, { useState } from 'react';
import { Activity, ChevronDown, ChevronUp } from 'lucide-react';

interface NinePillarSummaryProps {
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
    scrollToId?: string;
}

const PILLAR_ICONS: Record<string, string> = {
    purity: '🧪',
    bioavailability: '💊',
    potency: '⚡',
    evidence: '📊',
    sustainability: '🌱',
    experience: '✨',
    safety: '🛡️',
    transparency: '🔍',
    synergy: '🔗'
};

export default function NinePillarSummary({ avgScores, reviewCount, scrollToId }: NinePillarSummaryProps) {
    const scores = Object.values(avgScores).filter((s): s is number => s !== null && s !== undefined);
    const overallScore = scores.length > 0
        ? (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1)
        : 'N/A';

    // Determine status color for overall score
    const getScoreColor = (scoreStr: string) => {
        if (scoreStr === 'N/A') return 'text-bone-white/40';
        const score = parseFloat(scoreStr);
        if (score >= 9) return 'text-sme-gold';
        if (score >= 7) return 'text-emerald-400';
        return 'text-bone-white/60';
    };

    const handleClick = () => {
        if (scrollToId) {
            const el = document.getElementById(scrollToId);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div
            onClick={handleClick}
            className="group cursor-pointer bg-forest-obsidian/30 border border-translucent-emerald/20 hover:border-sme-gold/30 rounded-lg p-3 backdrop-blur-sm transition-all duration-300"
        >
            <div className="flex items-center justify-between gap-4">
                {/* Left: Overall Score & Label */}
                <div className="flex items-center gap-3">
                    <div className={`flex flex-col items-center justify-center w-10 h-10 rounded-full bg-black/40 border border-white/10 ${getScoreColor(overallScore)}`}>
                        <span className="text-sm font-bold font-mono">{overallScore}</span>
                    </div>
                    <div>
                        <div className="text-xs font-mono text-sme-gold uppercase tracking-wider mb-0.5">
                            SME Core Score
                        </div>
                        <div className="text-xs text-bone-white/50">
                            Based on {reviewCount} expert {reviewCount === 1 ? 'review' : 'reviews'}
                        </div>
                    </div>
                </div>

                {/* Right: Micro Icons Row */}
                <div className="hidden sm:flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                    {Object.entries(avgScores).map(([key, score]) => {
                        const hasScore = score !== null && score !== undefined;
                        return (
                            <div
                                key={key}
                                className={`w-6 h-6 flex items-center justify-center rounded bg-white/5 border ${hasScore ? 'border-white/10' : 'border-white/5'} ${hasScore ? 'opacity-100' : 'opacity-30'}`}
                                title={`${key.charAt(0).toUpperCase() + key.slice(1)}: ${hasScore ? score : 'N/A'}`}
                            >
                                <span className="text-[10px]">{PILLAR_ICONS[key] || '•'}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
