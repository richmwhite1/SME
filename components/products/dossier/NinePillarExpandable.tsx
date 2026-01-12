'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import PillarDetailCard from './PillarDetailCard';

interface NinePillarExpandableProps {
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
}

const PILLAR_CONFIG = [
    {
        key: 'purity',
        name: 'Purity',
        emoji: '🧪',
        definition: 'Verified absence of heavy metals, mold, and contaminants via third-party lab testing.'
    },
    {
        key: 'bioavailability',
        name: 'Bioavailability',
        emoji: '💊',
        definition: 'Assessment of absorption efficiency and delivery method for maximum uptake.'
    },
    {
        key: 'potency',
        name: 'Potency',
        emoji: '⚡',
        definition: 'Confirmation that active ingredients match label claims in actual dosage.'
    },
    {
        key: 'evidence',
        name: 'Evidence',
        emoji: '📊',
        definition: 'Strength of clinical research backing the claimed benefits and ingredients.'
    },
    {
        key: 'sustainability',
        name: 'Sustainability',
        emoji: '🌱',
        definition: 'Environmental impact of sourcing, packaging, and manufacturing processes.'
    },
    {
        key: 'experience',
        name: 'Experience',
        emoji: '✨',
        definition: 'Qualitative assessment of user experience, taste, and subjective effects.'
    },
    {
        key: 'safety',
        name: 'Safety',
        emoji: '🛡️',
        definition: 'Evaluation of side effect profile, contraindications, and long-term safety data.'
    },
    {
        key: 'transparency',
        name: 'Transparency',
        emoji: '🔍',
        definition: 'Disclosure of sourcing, testing results (COAs), and corporate practices.'
    },
    {
        key: 'synergy',
        name: 'Synergy',
        emoji: '🔗',
        definition: 'How well ingredients work together to enhance efficacy (the "entourage effect").'
    },
];

export default function NinePillarExpandable({ avgScores, reviewCount }: NinePillarExpandableProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Calculate overall stats
    const scores = Object.values(avgScores).filter((s): s is number => s !== null && s !== undefined);
    const overallScore = scores.length > 0
        ? (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1)
        : 'N/A';
    const reviewedPillars = scores.length;

    return (
        <div className="border border-translucent-emerald/30 rounded-xl overflow-hidden bg-black/20 backdrop-blur-sm">
            {/* Summary Header - Always Visible */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-all group"
            >
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-start">
                        <h3 className="font-mono text-sm uppercase tracking-wider text-sme-gold mb-1">
                            Detailed Pillar Breakdown
                        </h3>
                        <p className="text-bone-white/60 text-sm">
                            {reviewCount === 0
                                ? 'No expert reviews yet'
                                : `${reviewedPillars}/9 pillars reviewed • Overall: ${overallScore}/10`
                            }
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-bone-white/50 group-hover:text-bone-white/70 transition-colors">
                        {isExpanded ? 'Collapse' : 'Expand'}
                    </span>
                    {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-sme-gold" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-sme-gold" />
                    )}
                </div>
            </button>

            {/* Expandable Content */}
            {isExpanded && (
                <div className="border-t border-translucent-emerald/30 p-6 animate-in fade-in slide-in-from-top-2 duration-300">
                    {reviewCount === 0 ? (
                        <div className="text-center py-12 bg-white/5 rounded-lg border border-dashed border-white/10">
                            <div className="text-4xl mb-3">📊</div>
                            <p className="text-bone-white/50 font-mono text-sm">
                                No SME reviews available yet. Be the first to provide a comprehensive analysis.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {PILLAR_CONFIG.map((pillar) => (
                                <PillarDetailCard
                                    key={pillar.key}
                                    pillarKey={pillar.key}
                                    pillarName={pillar.name}
                                    pillarEmoji={pillar.emoji}
                                    definition={pillar.definition}
                                    smeScore={avgScores[pillar.key as keyof typeof avgScores]}
                                    reviewCount={reviewCount}
                                    aiSummary={null} // Placeholder for future AI summaries
                                    citations={[]} // Placeholder for future citations
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
