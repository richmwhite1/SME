'use client';

import React, { useState } from 'react';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import { Info, X } from 'lucide-react';

interface DualTrackRadarProps {
    smeScores: {
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
    communityScores?: {
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
    smeReviewCount: number;
}

const PILLAR_LABELS = [
    { key: 'purity', label: 'Purity 🧪', description: 'Verified absence of heavy metals, mold, and contaminants via third-party lab testing.' },
    { key: 'bioavailability', label: 'Bioavailability 💊', description: 'Assessment of absorption efficiency and delivery method for maximum uptake.' },
    { key: 'potency', label: 'Potency ⚡', description: 'Confirmation that active ingredients match label claims in actual dosage.' },
    { key: 'evidence', label: 'Evidence 📊', description: 'Strength of clinical research backing the claimed benefits and ingredients.' },
    { key: 'sustainability', label: 'Sustainability 🌱', description: 'Environmental impact of sourcing, packaging, and manufacturing processes.' },
    { key: 'experience', label: 'Experience ✨', description: 'Qualitative assessment of user experience, taste, and subjective effects.' },
    { key: 'safety', label: 'Safety 🛡️', description: 'Evaluation of side effect profile, contraindications, and long-term safety data.' },
    { key: 'transparency', label: 'Transparency 🔍', description: 'Disclosure of sourcing, testing results (COAs), and corporate practices.' },
    { key: 'synergy', label: 'Synergy 🔗', description: 'How well ingredients work together to enhance efficacy (the "entourage effect").' },
];

const PILLAR_DEFINITIONS = {
    purity: 'Absence of contaminants, heavy metals, and unnecessary fillers.',
    bioavailability: 'How well the body absorbs and utilizes the nutrients.',
    potency: 'Strength and concentration of active ingredients vs. clinical standards.',
    evidence: 'Strength of scientific research backing the claims.',
    sustainability: 'Environmental impact of sourcing and packaging.',
    experience: 'Sensory profile (taste, texture) and ease of use.',
    safety: 'Risk profile, allergen control, and manufacturing standards.',
    transparency: 'Clarity of labeling, sourcing disclosure, and third-party testing.',
    synergy: 'How well ingredients work together or stack with others.',
};

export default function DualTrackRadar({
    smeScores,
    communityScores,
    smeReviewCount,
}: DualTrackRadarProps) {
    const [showExplanation, setShowExplanation] = useState(false);

    // Transform data for Recharts
    const chartData = PILLAR_LABELS.map(pillar => ({
        subject: pillar.label,
        SME: smeScores[pillar.key as keyof typeof smeScores] || 0,
        Community: communityScores?.[pillar.key as keyof typeof communityScores] || 0,
        fullMark: 10,
    }));

    // Check if we have any SME data
    const hasSMEData = smeReviewCount > 0;

    return (
        <div className="mb-8 md:mb-12 border border-sme-gold/20 bg-black/20 backdrop-blur-sm rounded-lg p-4 md:p-8 relative">
            <div className="mb-4 md:mb-6 text-center relative z-10">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <h2 className="font-serif text-2xl md:text-3xl font-bold text-bone-white">
                        9-Pillar Analysis
                    </h2>
                    <button
                        onClick={() => setShowExplanation(!showExplanation)}
                        className="p-1 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                        title="What do these scores mean?"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                    </button>
                </div>
                <p className="text-xs md:text-sm text-bone-white/60 font-mono">
                    {hasSMEData
                        ? `Expert vs. Community Scores • ${smeReviewCount} SME ${smeReviewCount === 1 ? 'Review' : 'Reviews'}`
                        : 'Awaiting Expert Reviews'}
                </p>

                {/* Definitions Dropdown */}
                {showExplanation && (
                    <div className="mt-4 text-left bg-forest-black/90 border border-white/10 rounded-lg p-4 max-w-2xl mx-auto shadow-xl animate-in fade-in zoom-in-95 duration-200">
                        <h4 className="text-sme-gold font-mono text-xs uppercase tracking-wider mb-3">Scoring Methodology (0-10)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                            {Object.entries(PILLAR_DEFINITIONS).map(([key, def]) => {
                                const label = PILLAR_LABELS.find(p => p.key === key)?.label.split(' ')[0];
                                return (
                                    <div key={key} className="text-sm">
                                        <span className="text-emerald-400 font-bold">{label}:</span> <span className="text-white/70">{def}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {hasSMEData ? (
                <>
                    <div className="h-[400px] md:h-[500px] w-full -mt-4 md:-mt-8">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                                <PolarGrid stroke="#ffffff20" />
                                <PolarAngleAxis
                                    dataKey="subject"
                                    tick={{
                                        fill: '#E2E8F0',
                                        fontSize: typeof window !== 'undefined' && window.innerWidth < 768 ? 10 : 12,
                                        fontWeight: 600,
                                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                                    }}
                                />
                                <PolarRadiusAxis
                                    angle={30}
                                    domain={[0, 10]}
                                    tick={{ fill: '#ffffff40', fontSize: 10 }}
                                    axisLine={false}
                                />

                                {/* SME Scores */}
                                <Radar
                                    name="SME Experts"
                                    dataKey="SME"
                                    stroke="#D4AF37"
                                    strokeWidth={3}
                                    fill="#D4AF37"
                                    fillOpacity={0.3}
                                />

                                {/* Community Scores (if available) */}
                                {communityScores && (
                                    <Radar
                                        name="Community"
                                        dataKey="Community"
                                        stroke="#22C55E"
                                        strokeWidth={2}
                                        fill="#22C55E"
                                        fillOpacity={0.2}
                                    />
                                )}

                                <Legend
                                    wrapperStyle={{
                                        paddingTop: '20px',
                                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                                        fontSize: '12px',
                                    }}
                                    iconType="circle"
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Score Summary */}
                    <div className="mt-4 md:mt-2 grid grid-cols-2 gap-3 md:gap-4 relative z-10">
                        <div className="bg-sme-gold/10 border border-sme-gold/30 rounded-lg p-3 md:p-4 transition-all hover:bg-sme-gold/20">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="h-2.5 w-2.5 md:h-3 md:w-3 rounded-full bg-sme-gold"></div>
                                <span className="text-[10px] md:text-xs font-mono font-semibold text-sme-gold">SME EXPERTS</span>
                            </div>
                            <p className="text-xl md:text-2xl font-bold text-bone-white font-mono">
                                {calculateAverage(Object.values(smeScores))}
                            </p>
                            <p className="text-[10px] md:text-xs text-bone-white/50 mt-1">Average Score</p>
                        </div>

                        {communityScores && (
                            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 md:p-4 transition-all hover:bg-emerald-500/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-2.5 w-2.5 md:h-3 md:w-3 rounded-full bg-emerald-400"></div>
                                    <span className="text-[10px] md:text-xs font-mono font-semibold text-emerald-400">COMMUNITY</span>
                                </div>
                                <p className="text-xl md:text-2xl font-bold text-bone-white font-mono">
                                    {calculateAverage(Object.values(communityScores))}
                                </p>
                                <p className="text-[10px] md:text-xs text-bone-white/50 mt-1">Average Score</p>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="text-center py-16">
                    <div className="h-32 w-32 rounded-full bg-sme-gold/10 border-2 border-sme-gold/30 flex items-center justify-center mx-auto mb-6">
                        <span className="text-6xl">📊</span>
                    </div>
                    <h3 className="text-xl font-serif font-bold text-bone-white mb-2">
                        Expert Review Pending
                    </h3>
                    <p className="text-bone-white/60 font-mono text-sm mb-6 max-w-md mx-auto">
                        No expert reviews yet. Be the first SME to provide a comprehensive 9-pillar analysis.
                    </p>
                    <button
                        onClick={() => {
                            const auditForm = document.getElementById('expert-audit-form');
                            if (auditForm) {
                                auditForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                        }}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-sme-gold text-forest-black font-bold font-mono uppercase tracking-wide rounded-lg hover:bg-sme-gold/90 transition-all shadow-lg hover:shadow-xl"
                    >
                        <span>Are you an SME?</span>
                        <span className="text-lg">→</span>
                        <span>Audit this Product</span>
                    </button>
                </div>
            )}
        </div>
    );
}

function calculateAverage(scores: (number | null)[]): string {
    const validScores = scores.filter((s): s is number => s !== null && s > 0);
    if (validScores.length === 0) return 'N/A';

    const avg = validScores.reduce((sum, score) => sum + score, 0) / validScores.length;
    return avg.toFixed(1);
}
