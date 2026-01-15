
import React from 'react';
import { cn } from '@/lib/utils';
import { CHAKRA_LEVELS } from '@/lib/sme-constants';

interface ChakraBadgeProps {
    level: number;
    showTitle?: boolean;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

export function ChakraBadge({ level, showTitle = false, className, size = 'md' }: ChakraBadgeProps) {
    const chakra = CHAKRA_LEVELS.find(l => l.level === level) || CHAKRA_LEVELS[0];

    const sizeClasses = {
        sm: 'w-4 h-4 text-xs',
        md: 'w-6 h-6 text-sm',
        lg: 'w-10 h-10 text-base',
    };

    const iconSizeClasses = {
        sm: 'w-3 h-3',
        md: 'w-4 h-4',
        lg: 'w-6 h-6',
    };

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <div
                className={cn(
                    "rounded-full flex items-center justify-center border shadow-sm",
                    sizeClasses[size],
                    chakra.color.replace('text-', 'bg-').replace('-500', '-100'), // light bg
                    chakra.color.replace('text-', 'border-').replace('-500', '-200'),
                    "relative"
                )}
                title={`${chakra.name}: ${chakra.title}`}
            >
                <div className={cn("rounded-full", iconSizeClasses[size], chakra.color.replace('text-', 'bg-'))} />
            </div>

            {showTitle && (
                <div className="flex flex-col leading-none">
                    <span className={cn("font-medium", chakra.color)}>{chakra.name}</span>
                    <span className="text-xs text-muted-foreground">{chakra.title}</span>
                </div>
            )}
        </div>
    );
}
