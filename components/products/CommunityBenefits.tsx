"use client";

import { useState } from "react";
import { addCommunityBenefit, voteBenefit } from "@/app/actions/benefit-actions";
import { useAuth } from "@clerk/nextjs";

interface Benefit {
    id: string;
    benefit_title: string;
    benefit_type: "anecdotal" | "evidence_based";
    citation_url: string | null;
    upvote_count: number;
    downvote_count: number;
    submitted_by: string;
    created_at: string;
}

interface CommunityBenefitsProps {
    productId: string;
    initialBenefits: Benefit[];
}

export default function CommunityBenefits({
    productId,
    initialBenefits,
}: CommunityBenefitsProps) {
    const { isSignedIn } = useAuth();
    const [benefits, setBenefits] = useState<Benefit[]>(initialBenefits);
    const [isAdding, setIsAdding] = useState(false);
    const [newBenefit, setNewBenefit] = useState({
        title: "",
        type: "anecdotal" as "anecdotal" | "evidence_based",
        citation: "",
    });
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleVote = async (benefitId: string, voteType: "upvote" | "downvote") => {
        if (!isSignedIn) {
            setError("Please sign in to vote");
            return;
        }

        const result = await voteBenefit(benefitId, voteType);
        if (result.success) {
            // Update local state
            setBenefits(
                benefits.map((b) =>
                    b.id === benefitId
                        ? {
                            ...b,
                            upvote_count: result.upvoteCount || b.upvote_count,
                            downvote_count: result.downvoteCount || b.downvote_count,
                        }
                        : b
                )
            );
        } else {
            setError(result.error || "Failed to vote");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!isSignedIn) {
            setError("Please sign in to suggest benefits");
            return;
        }

        if (!newBenefit.title.trim()) {
            setError("Benefit title is required");
            return;
        }

        if (newBenefit.type === "evidence_based" && !newBenefit.citation.trim()) {
            setError("Evidence-based benefits require a citation URL");
            return;
        }

        setIsSubmitting(true);

        const result = await addCommunityBenefit(productId, {
            title: newBenefit.title,
            type: newBenefit.type,
            citation: newBenefit.citation || undefined,
        });

        setIsSubmitting(false);

        if (result.success) {
            // Reset form
            setNewBenefit({ title: "", type: "anecdotal", citation: "" });
            setIsAdding(false);
            // Refresh page to show new benefit
            window.location.reload();
        } else {
            setError(result.error || "Failed to add benefit");
        }
    };

    if (benefits.length === 0 && !isAdding) {
        return (
            <div className="bg-[#0a0a0a] border border-[#333] p-6 rounded">
                <h3 className="text-lg font-semibold text-white mb-4">
                    Community-Suggested Benefits
                </h3>
                <p className="text-gray-500 text-sm mb-4">
                    No community benefits yet. Be the first to suggest one!
                </p>
                {isSignedIn && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="text-emerald-400 text-sm hover:text-emerald-300"
                    >
                        + Suggest a Benefit
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="bg-[#0a0a0a] border border-[#333] p-6 rounded space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">
                    Community-Suggested Benefits
                </h3>
                {isSignedIn && !isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="text-emerald-400 text-sm hover:text-emerald-300"
                    >
                        + Suggest a Benefit
                    </button>
                )}
            </div>

            {error && (
                <div className="bg-red-900/20 border border-red-500/30 p-3 rounded">
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            )}

            {/* Add Benefit Form */}
            {isAdding && (
                <form onSubmit={handleSubmit} className="border border-emerald-500/30 p-4 rounded space-y-3">
                    <div>
                        <label className="text-xs uppercase tracking-wider text-gray-500 block mb-2">
                            Benefit Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={newBenefit.title}
                            onChange={(e) => setNewBenefit({ ...newBenefit, title: e.target.value })}
                            placeholder="e.g., Improves focus and concentration"
                            className="w-full bg-black border border-[#444] p-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="text-xs uppercase tracking-wider text-gray-500 block mb-2">
                            Type <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    checked={newBenefit.type === "anecdotal"}
                                    onChange={() => setNewBenefit({ ...newBenefit, type: "anecdotal", citation: "" })}
                                    className="w-4 h-4"
                                />
                                <span className="text-sm text-gray-300">Anecdotal</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    checked={newBenefit.type === "evidence_based"}
                                    onChange={() => setNewBenefit({ ...newBenefit, type: "evidence_based" })}
                                    className="w-4 h-4"
                                />
                                <span className="text-sm text-gray-300">Evidence-Based</span>
                            </label>
                        </div>
                    </div>

                    {newBenefit.type === "evidence_based" && (
                        <div>
                            <label className="text-xs uppercase tracking-wider text-emerald-400/80 block mb-2">
                                Citation URL <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="url"
                                value={newBenefit.citation}
                                onChange={(e) => setNewBenefit({ ...newBenefit, citation: e.target.value })}
                                placeholder="https://pubmed.ncbi.nlm.nih.gov/..."
                                className="w-full bg-black border border-emerald-500/30 p-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                            />
                        </div>
                    )}

                    <div className="flex gap-2">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-sm rounded disabled:opacity-50"
                        >
                            {isSubmitting ? "Submitting..." : "Submit Benefit"}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setIsAdding(false);
                                setError(null);
                            }}
                            className="bg-[#1a1a1a] hover:bg-[#222] text-white px-4 py-2 text-sm rounded"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {/* Benefits List */}
            <div className="space-y-3">
                {benefits.map((benefit) => (
                    <div
                        key={benefit.id}
                        className="border border-[#444] p-4 rounded bg-black/50 space-y-2"
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <h4 className="text-white font-medium">{benefit.benefit_title}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span
                                        className={`text-xs px-2 py-0.5 rounded ${benefit.benefit_type === "evidence_based"
                                                ? "bg-emerald-900/30 text-emerald-400"
                                                : "bg-blue-900/30 text-blue-400"
                                            }`}
                                    >
                                        {benefit.benefit_type === "evidence_based" ? "Evidence-Based" : "Anecdotal"}
                                    </span>
                                    {benefit.citation_url && (
                                        <a
                                            href={benefit.citation_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-emerald-400 hover:text-emerald-300 underline"
                                        >
                                            View Citation
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Voting Buttons */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleVote(benefit.id, "upvote")}
                                    disabled={!isSignedIn}
                                    className="flex items-center gap-1 text-gray-400 hover:text-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title={isSignedIn ? "Upvote" : "Sign in to vote"}
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M10 3l6 6H4l6-6z" />
                                    </svg>
                                    <span className="text-sm">{benefit.upvote_count}</span>
                                </button>
                                <button
                                    onClick={() => handleVote(benefit.id, "downvote")}
                                    disabled={!isSignedIn}
                                    className="flex items-center gap-1 text-gray-400 hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title={isSignedIn ? "Downvote" : "Sign in to vote"}
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M10 17l-6-6h12l-6 6z" />
                                    </svg>
                                    <span className="text-sm">{benefit.downvote_count}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
