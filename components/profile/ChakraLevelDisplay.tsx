"use client";

import React from 'react';
import { ChakraBadge } from '../sme/ChakraBadge';
import { ChakraProgressBar } from '../sme/ChakraProgressBar';
import { CHAKRA_LEVELS } from '@/lib/sme-constants';
import { Info } from 'lucide-react';

interface ChakraLevelDisplayProps {
    currentScore: number;
    currentLevel: number;
    scoreDetails?: any;
    className?: string;
}

export function ChakraLevelDisplay({
    currentScore,
    currentLevel,
    scoreDetails,
    className
}: ChakraLevelDisplayProps) {
    const chakra = CHAKRA_LEVELS.find(l => l.level === currentLevel) || CHAKRA_LEVELS[0];

    return (
        <div className={className}>
            <div className="border border-translucent-emerald bg-muted-moss p-6">
                <h3 className="mb-4 text-sm font-semibold text-bone-white font-mono uppercase tracking-wider flex items-center gap-2">
                    SME Chakra Level
                    <div className="group relative">
                        <Info size={14} className="text-bone-white/50 cursor-help" />
                        <div className="absolute left-0 top-6 hidden group-hover:block w-64 bg-forest-obsidian border border-translucent-emerald p-3 text-xs text-bone-white/80 font-normal normal-case tracking-normal z-10 rounded shadow-lg">
                            Your Chakra level is determined by your SME score, which is calculated from your contributions (discussions, comments, reviews), upvotes received, and expert status.
                        </div>
                    </div>
                </h3>

                {/* Current Level Badge */}
                <div className="mb-4 flex items-center gap-4">
                    <ChakraBadge level={currentLevel} showTitle={true} size="lg" />
                </div>

                {/* Score Display */}
                <div className="mb-4">
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-bone-white">{Math.round(currentScore)}</span>
                        <span className="text-sm text-bone-white/60 font-mono">SME Points</span>
                    </div>
                </div>

                {/* Progress Bar */}
                <ChakraProgressBar
                    currentScore={currentScore}
                    currentLevel={currentLevel}
                    className="mb-4"
                />

                {/* Score Breakdown */}
                {scoreDetails && Object.keys(scoreDetails).length > 0 && (
                    <div className="mt-4 border-t border-translucent-emerald pt-4">
                        <h4 className="mb-2 text-xs font-semibold text-bone-white/70 font-mono uppercase">Score Breakdown</h4>
                        <div className="space-y-1 text-xs font-mono">
                            {scoreDetails.discussions !== undefined && (
                                <div className="flex justify-between text-bone-white/60">
                                    <span>Discussions:</span>
                                    <span className="text-heart-green">+{scoreDetails.discussions}</span>
                                </div>
                            )}
                            {scoreDetails.comments !== undefined && (
                                <div className="flex justify-between text-bone-white/60">
                                    <span>Comments:</span>
                                    <span className="text-heart-green">+{scoreDetails.comments}</span>
                                </div>
                            )}
                            {scoreDetails.reviews !== undefined && (
                                <div className="flex justify-between text-bone-white/60">
                                    <span>Reviews:</span>
                                    <span className="text-heart-green">+{scoreDetails.reviews}</span>
                                </div>
                            )}
                            {scoreDetails.expert_bonus !== undefined && scoreDetails.expert_bonus > 0 && (
                                <div className="flex justify-between text-bone-white/60">
                                    <span>Expert Bonus:</span>
                                    <span className="text-sme-gold">+{scoreDetails.expert_bonus}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
