'use client';

import { useState, useEffect } from 'react';
import { Award, CheckCircle } from 'lucide-react';
import { submitVouch, getVouchData } from '@/app/actions/vouch-actions';

interface VouchButtonProps {
    targetUserId: string;
    targetUserTier?: number;
    currentUserTier?: number;
    currentUserId?: string;
    size?: 'sm' | 'md';
}

export default function VouchButton({
    targetUserId,
    targetUserTier = 0,
    currentUserTier = 0,
    currentUserId,
    size = 'md',
}: VouchButtonProps) {
    const [vouchCount, setVouchCount] = useState(0);
    const [hasVouched, setHasVouched] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Load vouch data on mount
    useEffect(() => {
        async function loadVouchData() {
            const data = await getVouchData(targetUserId, currentUserId);
            setVouchCount(data.vouchCount);
            setHasVouched(data.hasVouched);
        }
        loadVouchData();
    }, [targetUserId, currentUserId]);

    // Visibility logic: only show if current user is tier 3 or 4
    if (currentUserTier < 3) {
        return null;
    }

    // Hide if target user is already tier 3 or 4
    if (targetUserTier >= 3) {
        return null;
    }

    // Don't show for self
    if (currentUserId === targetUserId) {
        return null;
    }

    const handleVouch = async () => {
        setIsSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            const result = await submitVouch(targetUserId);
            setVouchCount(result.vouchCount);
            setHasVouched(true);
            setSuccess(result.message);

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit vouch');
            setTimeout(() => setError(null), 3000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const vouchesNeeded = Math.max(0, 3 - vouchCount);

    const sizeClasses = {
        sm: 'px-3 py-1.5 text-xs gap-1.5',
        md: 'px-4 py-2 text-sm gap-2',
    };

    const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

    return (
        <div className="inline-flex flex-col items-start gap-1">
            <button
                onClick={handleVouch}
                disabled={hasVouched || isSubmitting}
                className={`inline-flex items-center rounded font-mono font-semibold uppercase tracking-wider transition-all ${sizeClasses[size]} ${hasVouched
                        ? 'cursor-not-allowed border border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                        : 'border border-purple-500/50 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 disabled:cursor-not-allowed disabled:opacity-50'
                    }`}
            >
                {hasVouched ? (
                    <>
                        <CheckCircle className={iconSize} />
                        Vouched
                    </>
                ) : (
                    <>
                        <Award className={iconSize} />
                        Vouch for SME
                    </>
                )}
            </button>

            {/* Vouch Counter */}
            <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-bone-white/50">
                    Vouches: {vouchCount}/3
                    {vouchesNeeded > 0 && ` (${vouchesNeeded} more needed)`}
                </span>
            </div>

            {/* Success/Error Messages */}
            {success && (
                <div className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 font-mono text-xs text-emerald-400">
                    {success}
                </div>
            )}
            {error && (
                <div className="rounded border border-red-500/30 bg-red-500/10 px-2 py-1 font-mono text-xs text-red-400">
                    {error}
                </div>
            )}
        </div>
    );
}
