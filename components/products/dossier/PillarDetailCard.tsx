'use client';

import React from 'react';
import { ExternalLink } from 'lucide-react';

interface PillarDetailCardProps {
    pillarKey: string;
    pillarName: string;
    pillarEmoji: string;
    definition: string;
    smeScore: number | null;
    reviewCount: number;
    aiSummary?: string | null;
    citations?: string[];
}

export default function PillarDetailCard({
    pillarKey,
    pillarName,
    pillarEmoji,
    definition,
    smeScore,
    reviewCount,
    aiSummary,
    citations = []
}: PillarDetailCardProps) {

    const hasScore = smeScore !== null && smeScore !== undefined;

    // Color coding based on score
    const getScoreColor = (score: number | null) => {
        if (!score) return 'text-bone-white/30';
        if (score >= 8) return 'text-emerald-400';
        if (score >= 6) return 'text-sme-gold';
        if (score >= 4) return 'text-orange-400';
        return 'text-red-400';
    };

    const getScoreBgColor = (score: number | null) => {
        if (!score) return 'bg-white/5';
        if (score >= 8) return 'bg-emerald-500/10';
        if (score >= 6) return 'bg-sme-gold/10';
        if (score >= 4) return 'bg-orange-500/10';
        return 'bg-red-500/10';
    };

    const getScoreBorderColor = (score: number | null) => {
        if (!score) return 'border-white/10';
        if (score >= 8) return 'border-emerald-500/30';
        if (score >= 6) return 'border-sme-gold/30';
        if (score >= 4) return 'border-orange-500/30';
        return 'border-red-500/30';
    };

    return (
        <div className={`p-5 rounded-xl border transition-all duration-300 hover:border-sme-gold/30 ${getScoreBgColor(smeScore)} ${getScoreBorderColor(smeScore)}`}>
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">{pillarEmoji}</span>
                    <div>
                        <h4 className="font-mono text-sm font-bold text-bone-white uppercase tracking-wider">
                            {pillarName}
                        </h4>
                        <p className="text-xs text-bone-white/50 mt-0.5">
                            {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
                        </p>
                    </div>
                </div>

                {/* Score Badge */}
                <div className={`flex flex-col items-end`}>
                    <div className={`text-2xl font-mono font-bold ${getScoreColor(smeScore)}`}>
                        {hasScore ? smeScore.toFixed(1) : 'N/A'}
                    </div>
                    <div className="text-xs text-bone-white/30 font-mono">/10</div>
                </div>
            </div>

            {/* Definition */}
            <div className="mb-4">
                <p className="text-sm text-bone-white/70 leading-relaxed">
                    {definition}
                </p>
            </div>

            {/* AI Summary */}
            {aiSummary && (
                <div className="mb-4 p-3 bg-pagemind-blue/10 border border-pagemind-blue/20 rounded-lg">
                    <div className="text-xs font-mono text-pagemind-blue uppercase tracking-wider mb-2">
                        AI Summary
                    </div>
                    <p className="text-sm text-bone-white/80 leading-relaxed">
                        {aiSummary}
                    </p>
                </div>
            )}

            {/* Evidence/Citations */}
            {citations && citations.length > 0 && (
                <div className="space-y-2">
                    <div className="text-xs font-mono text-bone-white/50 uppercase tracking-wider">
                        Evidence
                    </div>
                    {citations.map((citation, idx) => (
                        <a
                            key={idx}
                            href={citation}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs text-sme-gold hover:text-sme-gold/80 transition-colors group"
                        >
                            <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                            <span className="underline">Source {idx + 1}</span>
                        </a>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!hasScore && (
                <div className="text-center py-4 border-t border-white/5 mt-4">
                    <p className="text-xs text-bone-white/40 italic">
                        No SME reviews for this pillar yet
                    </p>
                </div>
            )}
        </div>
    );
}
