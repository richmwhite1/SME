'use client';

import React, { useState, useEffect } from 'react';
import { submitSMEReview, getUserSMEReview, type SMEReviewData } from '@/app/actions/product-sme-review-actions';
import { Send, Loader2 } from 'lucide-react';

interface SubmitExpertAuditProps {
    productId: string;
    isSME: boolean;
}

const PILLARS = [
    { key: 'purity', label: 'Purity', description: 'Product purity and contamination testing' },
    { key: 'bioavailability', label: 'Bioavailability', description: 'Absorption and bioavailability' },
    { key: 'potency', label: 'Potency', description: 'Active ingredient potency' },
    { key: 'evidence', label: 'Evidence', description: 'Scientific evidence and research' },
    { key: 'sustainability', label: 'Sustainability', description: 'Environmental and ethical sourcing' },
    { key: 'experience', label: 'Experience', description: 'User experience and efficacy' },
    { key: 'safety', label: 'Safety', description: 'Safety profile and contraindications' },
    { key: 'transparency', label: 'Transparency', description: 'Label accuracy and disclosure' },
    { key: 'synergy', label: 'Synergy', description: 'Ingredient synergy and formulation' },
] as const;

export default function SubmitExpertAudit({ productId, isSME }: SubmitExpertAuditProps) {
    const [scores, setScores] = useState<Record<string, number>>({
        purity: 0,
        bioavailability: 0,
        potency: 0,
        evidence: 0,
        sustainability: 0,
        experience: 0,
        safety: 0,
        transparency: 0,
        synergy: 0,
    });
    const [expertSummary, setExpertSummary] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    // Load existing review if any
    useEffect(() => {
        async function loadExistingReview() {
            if (!isSME) {
                setIsLoading(false);
                return;
            }

            try {
                const existingReview = await getUserSMEReview(productId);
                if (existingReview) {
                    setScores({
                        purity: existingReview.purity ?? 0,
                        bioavailability: existingReview.bioavailability ?? 0,
                        potency: existingReview.potency ?? 0,
                        evidence: existingReview.evidence ?? 0,
                        sustainability: existingReview.sustainability ?? 0,
                        experience: existingReview.experience ?? 0,
                        safety: existingReview.safety ?? 0,
                        transparency: existingReview.transparency ?? 0,
                        synergy: existingReview.synergy ?? 0,
                    });
                    setExpertSummary(existingReview.expert_summary || '');
                    setIsExpanded(true);
                }
            } catch (error) {
                console.error('Error loading existing review:', error);
            } finally {
                setIsLoading(false);
            }
        }

        loadExistingReview();
    }, [productId, isSME]);

    if (!isSME) {
        return null;
    }

    const handleScoreChange = (pillar: string, value: number) => {
        setScores(prev => ({ ...prev, [pillar]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage(null);

        try {
            const reviewData: SMEReviewData = {
                purity: scores.purity || null,
                bioavailability: scores.bioavailability || null,
                potency: scores.potency || null,
                evidence: scores.evidence || null,
                sustainability: scores.sustainability || null,
                experience: scores.experience || null,
                safety: scores.safety || null,
                transparency: scores.transparency || null,
                synergy: scores.synergy || null,
                expert_summary: expertSummary.trim() || undefined,
            };

            const result = await submitSMEReview(productId, reviewData);

            if (result.success) {
                setMessage({ type: 'success', text: 'Expert audit submitted successfully!' });
                setTimeout(() => {
                    window.location.reload(); // Reload to show updated review
                }, 1500);
            } else {
                setMessage({ type: 'error', text: result.error || 'Failed to submit audit' });
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            setMessage({ type: 'error', text: 'An unexpected error occurred' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="mb-12 border border-sme-gold/30 bg-black/40 backdrop-blur-sm rounded-lg p-8">
                <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-sme-gold" />
                    <span className="ml-2 text-bone-white/70">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="mb-12">
            {!isExpanded ? (
                <button
                    onClick={() => setIsExpanded(true)}
                    className="group flex items-center gap-3 px-6 py-3 bg-sme-gold/10 hover:bg-sme-gold/20 
                        border border-sme-gold/30 hover:border-sme-gold/50 rounded-full transition-all duration-300"
                >
                    <div className="h-6 w-6 rounded-full bg-sme-gold/20 flex items-center justify-center">
                        <span className="text-sme-gold text-xs">✓</span>
                    </div>
                    <span className="font-mono text-sm font-semibold text-sme-gold group-hover:text-amber-200">
                        Submit Expert Audit
                    </span>
                </button>
            ) : (
                <div className="border border-sme-gold/30 bg-black/40 backdrop-blur-sm rounded-lg overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="px-8 py-6 flex items-center justify-between border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-sme-gold/20 flex items-center justify-center">
                                <span className="text-sme-gold font-mono text-lg">✓</span>
                            </div>
                            <div>
                                <h2 className="font-serif text-xl font-bold text-sme-gold">
                                    Submit Expert Audit
                                </h2>
                                <p className="text-xs text-bone-white/60 font-mono">
                                    9-Pillar Review System
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsExpanded(false)}
                            className="text-bone-white/40 hover:text-bone-white transition-colors"
                        >
                            Close ✕
                        </button>
                    </div>

                    {/* Form */}
                    {isExpanded && (
                        <form onSubmit={handleSubmit} className="px-8 pb-8">
                            <div className="border-t border-white/10 pt-6 mb-6">
                                <p className="text-bone-white/70 text-sm mb-6">
                                    Rate each pillar from 1-10, or leave at 0 for N/A. Your expertise helps the community make informed decisions.
                                </p>

                                {/* Pillar Sliders */}
                                <div className="space-y-6">
                                    {PILLARS.map(pillar => (
                                        <div key={pillar.key} className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <label className="font-mono text-sm font-semibold text-bone-white">
                                                        {pillar.label}
                                                    </label>
                                                    <p className="text-xs text-bone-white/50">{pillar.description}</p>
                                                </div>
                                                <span className={`font-mono text-lg font-bold ${scores[pillar.key] === 0 ? 'text-bone-white/30' : 'text-sme-gold'
                                                    }`}>
                                                    {scores[pillar.key] === 0 ? 'N/A' : scores[pillar.key]}
                                                </span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="10"
                                                value={scores[pillar.key]}
                                                onChange={(e) => handleScoreChange(pillar.key, parseInt(e.target.value))}
                                                className="w-full h-2 bg-bone-white/10 rounded-lg appearance-none cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none
                      [&::-webkit-slider-thumb]:w-4
                      [&::-webkit-slider-thumb]:h-4
                      [&::-webkit-slider-thumb]:rounded-full
                      [&::-webkit-slider-thumb]:bg-sme-gold
                      [&::-webkit-slider-thumb]:cursor-pointer
                      [&::-moz-range-thumb]:w-4
                      [&::-moz-range-thumb]:h-4
                      [&::-moz-range-thumb]:rounded-full
                      [&::-moz-range-thumb]:bg-sme-gold
                      [&::-moz-range-thumb]:border-0
                      [&::-moz-range-thumb]:cursor-pointer"
                                            />
                                        </div>
                                    ))}
                                </div>

                                {/* Expert Summary */}
                                <div className="mt-8 space-y-2">
                                    <label className="font-mono text-sm font-semibold text-bone-white block">
                                        Expert Summary
                                    </label>
                                    <textarea
                                        value={expertSummary}
                                        onChange={(e) => setExpertSummary(e.target.value)}
                                        placeholder="Provide your expert analysis and recommendations..."
                                        rows={6}
                                        className="w-full px-4 py-3 bg-bone-white/5 border border-white/10 rounded-lg
                  text-bone-white placeholder-bone-white/30 focus:outline-none focus:border-sme-gold/50
                  focus:ring-1 focus:ring-sme-gold/30 transition-all resize-none"
                                    />
                                    <p className="text-xs text-bone-white/40">
                                        Optional: Share your professional insights and recommendations
                                    </p>
                                </div>
                            </div>

                            {/* Message */}
                            {message && (
                                <div className={`mb-4 p-4 rounded-lg ${message.type === 'success'
                                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                                    : 'bg-red-500/10 border border-red-500/30 text-red-400'
                                    }`}>
                                    {message.text}
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-4 bg-sme-gold hover:bg-sme-gold/90 disabled:bg-sme-gold/50
              text-forest-obsidian font-mono font-bold rounded-lg transition-all
              flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-5 w-5" />
                                        Submit Expert Audit
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            )}
        </div>
    );
}
