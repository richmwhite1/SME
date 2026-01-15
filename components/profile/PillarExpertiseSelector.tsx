"use client";

import React from 'react';
import { SME_PILLARS } from '@/lib/sme-constants';
import { cn } from '@/lib/utils';
import { ShieldCheck } from 'lucide-react';

interface PillarExpertiseSelectorProps {
    currentExpertise: string[];
    userId: string;
}

export function PillarExpertiseSelector({ currentExpertise, userId }: PillarExpertiseSelectorProps) {
    // Read-only display of earned expertise
    // We treat 'currentExpertise' as the SOURCE OF TRUTH (EARNED).

    return (
        <div className="border border-translucent-emerald bg-muted-moss p-6">
            <h3 className="mb-3 text-sm font-semibold text-bone-white font-mono uppercase tracking-wider flex items-center gap-2">
                Earned Expertise
                <ShieldCheck size={14} className="text-sme-gold" />
            </h3>
            <p className="mb-4 text-xs text-bone-white/60 font-mono">
                Pillars you have mastered through verified contributions. These are displayed on your profile.
            </p>

            {currentExpertise.length === 0 ? (
                <div className="text-xs text-bone-white/40 italic font-mono p-4 text-center border border-dashed border-translucent-emerald/30 rounded">
                    No specialized expertise earned yet. Contribute quality content to earn badges!
                </div>
            ) : (
                <div className="flex flex-wrap gap-2">
                    {currentExpertise.map(pillar => (
                        <div
                            key={pillar}
                            className="flex items-center gap-1.5 rounded bg-sme-gold/10 px-3 py-1.5 text-xs text-sme-gold border border-sme-gold/30 font-mono shadow-sm"
                        >
                            <ShieldCheck size={12} />
                            <span>{pillar}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
