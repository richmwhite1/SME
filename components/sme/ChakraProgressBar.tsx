

import React from 'react';
import { cn } from '@/lib/utils';
import { CHAKRA_LEVELS, getNextChakraLevel } from '@/lib/sme-constants';

interface ChakraProgressBarProps {
    currentScore: number;
    currentLevel: number;
    className?: string;
}

export function ChakraProgressBar({ currentScore, currentLevel, className }: ChakraProgressBarProps) {
    const chakra = CHAKRA_LEVELS.find(l => l.level === currentLevel) || CHAKRA_LEVELS[0];
    const nextLevel = getNextChakraLevel(currentLevel);

    if (!nextLevel) {
        return (
            <div className={cn("w-full text-center text-sm font-medium text-violet-600", className)}>
                Max Level Achieved!
            </div>
        );
    }

    const prevThreshold = chakra.threshold;
    const nextThreshold = nextLevel.threshold;
    const progress = Math.min(100, Math.max(0, ((currentScore - prevThreshold) / (nextThreshold - prevThreshold)) * 100));

    return (
        <div className={cn("w-full space-y-1", className)}>
            <div className="flex justify-between text-xs text-muted-foreground">
                <span>{Math.round(currentScore)} Points</span>
                <span>Next: {nextLevel.name} ({nextLevel.threshold})</span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div
                    className={cn("h-full transition-all duration-500 rounded-full", chakra.color.replace('text-', 'bg-'))}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}
