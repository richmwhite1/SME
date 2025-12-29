'use client';

import React from 'react';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Legend,
} from 'recharts';

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
    { key: 'purity', label: 'Purity 🧪' },
    { key: 'bioavailability', label: 'Bioavailability 💊' },
    { key: 'potency', label: 'Potency ⚡' },
    { key: 'evidence', label: 'Evidence 📊' },
    { key: 'sustainability', label: 'Sustainability 🌱' },
    { key: 'experience', label: 'Experience ✨' },
    { key: 'safety', label: 'Safety 🛡️' },
    { key: 'transparency', label: 'Transparency 🔍' },
    { key: 'synergy', label: 'Synergy 🔗' },
];

export default function DualTrackRadar({
    smeScores,
    communityScores,
    smeReviewCount,
}: DualTrackRadarProps) {
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
        <div className="mb-12 border border-sme-gold/20 bg-black/20 backdrop-blur-sm rounded-lg p-8">
            <div className="mb-6 text-center">
                <h2 className="font-serif text-3xl font-bold text-bone-white mb-2">
                    9-Pillar Analysis
                </h2>
                <p className="text-sm text-bone-white/60 font-mono">
                    {hasSMEData
                        ? `Expert vs. Community Scores • ${smeReviewCount} SME ${smeReviewCount === 1 ? 'Review' : 'Reviews'}`
                        : 'Awaiting Expert Reviews'}
                </p>
            </div>

            {hasSMEData ? (
                <>
                    <div className="h-[500px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                                <PolarGrid stroke="#ffffff20" />
                                <PolarAngleAxis
                                    dataKey="subject"
                                    tick={{
                                        fill: '#E2E8F0',
                                        fontSize: 11,
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
                    <div className="mt-6 grid grid-cols-2 gap-4">
                        <div className="bg-sme-gold/10 border border-sme-gold/30 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="h-3 w-3 rounded-full bg-sme-gold"></div>
                                <span className="text-xs font-mono font-semibold text-sme-gold">SME EXPERTS</span>
                            </div>
                            <p className="text-2xl font-bold text-bone-white font-mono">
                                {calculateAverage(Object.values(smeScores))}
                            </p>
                            <p className="text-xs text-bone-white/50 mt-1">Average Score</p>
                        </div>

                        {communityScores && (
                            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-3 w-3 rounded-full bg-emerald-400"></div>
                                    <span className="text-xs font-mono font-semibold text-emerald-400">COMMUNITY</span>
                                </div>
                                <p className="text-2xl font-bold text-bone-white font-mono">
                                    {calculateAverage(Object.values(communityScores))}
                                </p>
                                <p className="text-xs text-bone-white/50 mt-1">Average Score</p>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="text-center py-16">
                    <div className="h-24 w-24 rounded-full bg-sme-gold/10 border-2 border-sme-gold/30 flex items-center justify-center mx-auto mb-4">
                        <span className="text-4xl">📊</span>
                    </div>
                    <p className="text-bone-white/60 font-mono text-sm">
                        No expert reviews yet. SMEs can submit the first audit above.
                    </p>
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
