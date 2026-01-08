'use client';

import React from 'react';
import { type SMEReview } from '@/app/actions/product-sme-review-actions';
import { Award, User } from 'lucide-react';

interface SMEAuditsListProps {
    reviews: SMEReview[];
}

const PILLARS = [
    { key: 'purity', label: 'Purity', emoji: '🧪' },
    { key: 'bioavailability', label: 'Bioavailability', emoji: '💊' },
    { key: 'potency', label: 'Potency', emoji: '⚡' },
    { key: 'evidence', label: 'Evidence', emoji: '📊' },
    { key: 'sustainability', label: 'Sustainability', emoji: '🌱' },
    { key: 'experience', label: 'Experience', emoji: '✨' },
    { key: 'safety', label: 'Safety', emoji: '🛡️' },
    { key: 'transparency', label: 'Transparency', emoji: '🔍' },
    { key: 'synergy', label: 'Synergy', emoji: '🔗' },
] as const;

function getBadgeColor(badgeType: string): string {
    switch (badgeType?.toLowerCase()) {
        case 'trusted voice':
            return 'text-sme-gold';
        case 'verified expert':
            return 'text-emerald-400';
        case 'contributor':
            return 'text-blue-400';
        default:
            return 'text-bone-white/60';
    }
}

function getScoreColor(score: number | null): string {
    if (score === null) return 'text-bone-white/30';
    if (score >= 8) return 'text-emerald-400';
    if (score >= 6) return 'text-yellow-400';
    if (score >= 4) return 'text-orange-400';
    return 'text-red-400';
}

export default function SMEAuditsList({ reviews }: SMEAuditsListProps) {
    if (reviews.length === 0) {
        return (
            <div className="mb-12 border border-white/10 bg-black/20 backdrop-blur-sm rounded-lg p-8">
                <h2 className="font-serif text-2xl font-bold text-bone-white mb-4 border-b border-white/10 pb-4">
                    Expert Audits
                </h2>
                <div className="text-center py-12">
                    <Award className="h-12 w-12 text-bone-white/20 mx-auto mb-4" />
                    <p className="text-bone-white/50 font-mono text-sm">
                        No expert audits yet. Be the first SME to review this product!
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="mb-12 border border-sme-gold/20 bg-black/20 backdrop-blur-sm rounded-lg overflow-hidden">
            <div className="px-8 py-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                    <h2 className="font-serif text-2xl font-bold text-sme-gold">
                        Expert Audits
                    </h2>
                    <div className="flex items-center gap-2 text-sm font-mono text-bone-white/60">
                        <Award className="h-4 w-4" />
                        <span>{reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}</span>
                    </div>
                </div>
                <p className="text-sm text-bone-white/60 mt-2 font-mono">
                    Independent expert analysis from verified SMEs
                </p>
            </div>

            <div className="p-6 space-y-6 max-h-[800px] overflow-y-auto">
                {reviews.map((review) => (
                    <div
                        key={review.id}
                        className="border border-white/10 bg-forest-obsidian/50 rounded-lg p-6 hover:border-sme-gold/30 transition-all"
                    >
                        {/* SME Header */}
                        <div className="flex items-start gap-4 mb-6 pb-4 border-b border-white/10">
                            <div className="flex-shrink-0">
                                {review.sme_profile?.avatar_url ? (
                                    <img
                                        src={review.sme_profile.avatar_url}
                                        alt={review.sme_profile.full_name || 'SME'}
                                        className="h-12 w-12 rounded-full border-2 border-sme-gold/50"
                                    />
                                ) : (
                                    <div className="h-12 w-12 rounded-full bg-sme-gold/20 border-2 border-sme-gold/50 flex items-center justify-center">
                                        <User className="h-6 w-6 text-sme-gold" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold text-bone-white truncate">
                                        {review.sme_profile?.full_name || 'Anonymous SME'}
                                    </h3>
                                    {review.sme_profile?.badge_type && (
                                        <span className={`flex items-center gap-1 text-xs font-mono ${getBadgeColor(review.sme_profile.badge_type)}`}>
                                            <Award className="h-3 w-3" />
                                            {review.sme_profile.badge_type}
                                        </span>
                                    )}
                                </div>
                                {review.sme_profile?.profession && (
                                    <p className="text-sm text-bone-white/60 font-mono">
                                        {review.sme_profile.profession}
                                    </p>
                                )}
                                {review.sme_profile?.credentials && (
                                    <p className="text-xs text-bone-white/50 mt-1 line-clamp-1">
                                        {review.sme_profile.credentials}
                                    </p>
                                )}
                                <p className="text-xs text-bone-white/40 mt-2 font-mono">
                                    {new Date(review.created_at).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>

                        {/* Pillar Scores Grid - Only show filled pillars */}
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            {PILLARS.map(pillar => {
                                const score = review[pillar.key as keyof typeof review] as number | null;
                                // Hide N/A pillars completely
                                if (score === null || score === 0) return null;

                                return (
                                    <div
                                        key={pillar.key}
                                        className="bg-black/30 rounded-lg p-3 border border-white/5"
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-mono text-bone-white/60">
                                                {pillar.emoji} {pillar.label}
                                            </span>
                                        </div>
                                        <div className={`text-2xl font-bold font-mono ${getScoreColor(score)}`}>
                                            {score}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Expert Summary */}
                        {review.expert_summary && (
                            <div className="bg-black/20 rounded-lg p-4 border border-white/5">
                                <h4 className="text-sm font-mono font-semibold text-sme-gold mb-2">
                                    Expert Summary
                                </h4>
                                <p className="text-bone-white/80 text-sm leading-relaxed whitespace-pre-wrap">
                                    {review.expert_summary}
                                </p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
