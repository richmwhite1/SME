'use client';

import { useState } from 'react';
import { User, TrendingUp, CheckCircle, XCircle, ExternalLink, Sparkles } from 'lucide-react';
import { approveSMEApplication, rejectSMEApplication } from '@/app/actions/sme-review-actions';

interface SMECandidateCardProps {
    candidate: any;
}

export default function SMECandidateCard({ candidate }: SMECandidateCardProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<'approved' | 'rejected' | null>(null);

    const handleApprove = async () => {
        setIsProcessing(true);
        setError(null);

        try {
            await approveSMEApplication(candidate.application_id, candidate.user_id);
            setSuccess('approved');
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to approve application');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!confirm('Are you sure you want to reject this SME application?')) {
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            await rejectSMEApplication(candidate.application_id, candidate.user_id);
            setSuccess('rejected');
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to reject application');
        } finally {
            setIsProcessing(false);
        }
    };

    // Calculate total lens score
    const totalScore =
        (candidate.score_scientific || 0) +
        (candidate.score_alternative || 0) +
        (candidate.score_esoteric || 0);

    // Determine dominant lens
    const scores = {
        Scientific: candidate.score_scientific || 0,
        Alternative: candidate.score_alternative || 0,
        Esoteric: candidate.score_esoteric || 0,
    };
    const dominantLens = Object.entries(scores).reduce((a, b) => (a[1] > b[1] ? a : b))[0];

    return (
        <div className="group relative overflow-hidden rounded-lg border border-bone-white/20 bg-gradient-to-br from-bone-white/5 to-bone-white/[0.02] p-6 transition-all hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/10">
            {/* Reputation Badge */}
            <div className="absolute right-4 top-4">
                <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    <span className="font-mono text-sm font-bold text-emerald-400">
                        {candidate.reputation_score || 0}
                    </span>
                </div>
            </div>

            {/* Candidate Header */}
            <div className="mb-4">
                <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-bone-white/20 bg-bone-white/10">
                        <User className="h-6 w-6 text-bone-white/70" />
                    </div>
                    <div>
                        <h3 className="font-mono text-lg font-bold text-bone-white">
                            {candidate.display_name}
                        </h3>
                        <p className="font-mono text-xs text-bone-white/50">
                            Applied {new Date(candidate.created_at).toLocaleDateString()}
                        </p>
                    </div>
                </div>
            </div>

            {/* Lens Balance */}
            <div className="mb-4">
                <div className="mb-2 flex items-center justify-between">
                    <span className="font-mono text-xs uppercase tracking-wider text-bone-white/70">
                        Lens Balance
                    </span>
                    <span className="font-mono text-xs text-bone-white/50">
                        {candidate.expertise_lens || dominantLens}
                    </span>
                </div>
                <div className="space-y-2">
                    <LensBar
                        label="Scientific 🧬"
                        value={candidate.score_scientific || 0}
                        max={totalScore || 100}
                        color="blue"
                    />
                    <LensBar
                        label="Alternative 🪵"
                        value={candidate.score_alternative || 0}
                        max={totalScore || 100}
                        color="green"
                    />
                    <LensBar
                        label="Esoteric 👁️"
                        value={candidate.score_esoteric || 0}
                        max={totalScore || 100}
                        color="purple"
                    />
                </div>
            </div>

            {/* Preferred Topics */}
            {candidate.preferred_topics && candidate.preferred_topics.length > 0 && (
                <div className="mb-4">
                    <span className="mb-2 block font-mono text-xs uppercase tracking-wider text-bone-white/70">
                        Preferred Topics
                    </span>
                    <div className="flex flex-wrap gap-2">
                        {candidate.preferred_topics.map((topic: string, index: number) => (
                            <span
                                key={index}
                                className="rounded-full border border-bone-white/20 bg-bone-white/5 px-3 py-1 font-mono text-xs text-bone-white/80"
                            >
                                {topic}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* The Journey */}
            <div className="mb-4">
                <div className="mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-bone-white/70" />
                    <span className="font-mono text-xs uppercase tracking-wider text-bone-white/70">
                        The Journey
                    </span>
                </div>
                <p className="font-mono text-sm leading-relaxed text-bone-white/80">
                    {candidate.statement_of_intent}
                </p>
            </div>

            {/* Portfolio Link */}
            {candidate.portfolio_url && (
                <div className="mb-4">
                    <a
                        href={candidate.portfolio_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 font-mono text-sm text-emerald-400 transition-colors hover:text-emerald-300"
                    >
                        <ExternalLink className="h-4 w-4" />
                        View Portfolio
                    </a>
                </div>
            )}

            {/* Error/Success Messages */}
            {error && (
                <div className="mb-4 rounded border border-red-500/30 bg-red-500/10 p-3 font-mono text-sm text-red-400">
                    {error}
                </div>
            )}
            {success && (
                <div className="mb-4 rounded border border-emerald-500/30 bg-emerald-500/10 p-3 font-mono text-sm text-emerald-400">
                    {success === 'approved' ? '✓ Application approved!' : '✗ Application rejected'}
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
                <button
                    onClick={handleApprove}
                    disabled={isProcessing || success !== null}
                    className="flex flex-1 items-center justify-center gap-2 rounded bg-emerald-500 px-4 py-3 font-mono text-sm font-semibold uppercase tracking-wider text-black transition-all hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <CheckCircle className="h-4 w-4" />
                    {isProcessing && success === null ? 'Processing...' : 'Approve'}
                </button>
                <button
                    onClick={handleReject}
                    disabled={isProcessing || success !== null}
                    className="flex flex-1 items-center justify-center gap-2 rounded border border-red-500/50 bg-red-500/10 px-4 py-3 font-mono text-sm font-semibold uppercase tracking-wider text-red-400 transition-all hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <XCircle className="h-4 w-4" />
                    {isProcessing && success === null ? 'Processing...' : 'Reject'}
                </button>
            </div>
        </div>
    );
}

function LensBar({
    label,
    value,
    max,
    color,
}: {
    label: string;
    value: number;
    max: number;
    color: 'blue' | 'green' | 'purple';
}) {
    const percentage = max > 0 ? (value / max) * 100 : 0;

    const colorClasses = {
        blue: 'bg-blue-500',
        green: 'bg-green-500',
        purple: 'bg-purple-500',
    };

    return (
        <div>
            <div className="mb-1 flex items-center justify-between">
                <span className="font-mono text-xs text-bone-white/60">{label}</span>
                <span className="font-mono text-xs font-semibold text-bone-white/80">{value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-bone-white/10">
                <div
                    className={`h-full transition-all ${colorClasses[color]}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
