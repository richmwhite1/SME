"use client";

import React, { useState, useTransition } from 'react';
import { SME_PILLARS } from '@/lib/sme-constants';
import { updatePillarExpertise } from '@/app/actions/sme-scoring-actions';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PillarExpertiseSelectorProps {
    currentExpertise: string[];
    userId: string;
}

export function PillarExpertiseSelector({ currentExpertise, userId }: PillarExpertiseSelectorProps) {
    const [selected, setSelected] = useState<string[]>(currentExpertise || []);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleToggle = (pillar: string) => {
        let newSelected: string[];

        if (selected.includes(pillar)) {
            newSelected = selected.filter(p => p !== pillar);
        } else {
            // Limit to 5 pillars
            if (selected.length >= 5) {
                return;
            }
            newSelected = [...selected, pillar];
        }

        setSelected(newSelected);

        // Save to backend
        startTransition(async () => {
            try {
                await updatePillarExpertise(newSelected);
                router.refresh();
            } catch (error) {
                console.error("Failed to update pillar expertise:", error);
                // Revert on error
                setSelected(selected);
            }
        });
    };

    return (
        <div className="border border-translucent-emerald bg-muted-moss p-6">
            <h3 className="mb-3 text-sm font-semibold text-bone-white font-mono uppercase tracking-wider">
                Pillar Expertise
            </h3>
            <p className="mb-4 text-xs text-bone-white/60 font-mono">
                Select up to 5 pillars where you have expertise. This helps the community find you for specific topics.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SME_PILLARS.map(pillar => {
                    const isSelected = selected.includes(pillar);
                    const isDisabled = !isSelected && selected.length >= 5;

                    return (
                        <button
                            key={pillar}
                            onClick={() => handleToggle(pillar)}
                            disabled={isDisabled || isPending}
                            className={cn(
                                "flex items-center justify-between rounded px-3 py-2 text-left text-xs font-mono transition-colors border",
                                isSelected
                                    ? "bg-sme-gold/20 text-sme-gold border-sme-gold/50"
                                    : isDisabled
                                        ? "bg-forest-obsidian/30 text-bone-white/30 border-translucent-emerald/30 cursor-not-allowed"
                                        : "bg-forest-obsidian text-bone-white/70 border-translucent-emerald hover:bg-muted-moss hover:text-bone-white"
                            )}
                        >
                            <span>{pillar}</span>
                            {isSelected && <Check size={14} />}
                        </button>
                    );
                })}
            </div>

            <div className="mt-3 text-xs text-bone-white/50 font-mono">
                {selected.length}/5 pillars selected
            </div>
        </div>
    );
}
