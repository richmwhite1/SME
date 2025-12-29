"use client";

import { useState } from "react";
import { updateOfficialBenefit, deleteOfficialBenefit } from "@/app/actions/benefit-actions";
import Link from "next/link";

interface Benefit {
    id: string;
    benefit_title: string;
    benefit_type: "anecdotal" | "evidence_based";
    citation_url: string | null;
}

interface BenefitsEditorProps {
    productId: string;
    isVerified: boolean;
    initialBenefits: Benefit[];
}

export default function BenefitsEditor({
    productId,
    isVerified,
    initialBenefits,
}: BenefitsEditorProps) {
    const [benefits, setBenefits] = useState<Benefit[]>(initialBenefits);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({
        title: "",
        type: "anecdotal" as "anecdotal" | "evidence_based",
        citation: "",
    });
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // If not verified, show claim message
    if (!isVerified) {
        return (
            <div className="bg-blue-900/10 border border-blue-500/30 p-6 rounded">
                <h3 className="text-lg font-semibold text-white mb-2">Official Benefits</h3>
                <p className="text-blue-300 text-sm mb-4">
                    Claim this brand to list official benefits and verify them with evidence.
                </p>
                <Link
                    href={`/products/${productId}/claim`}
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm rounded"
                >
                    Claim This Brand
                </Link>
            </div>
        );
    }

    const handleEdit = (benefit: Benefit) => {
        setEditingId(benefit.id);
        setEditForm({
            title: benefit.benefit_title,
            type: benefit.benefit_type,
            citation: benefit.citation_url || "",
        });
        setError(null);
    };

    const handleSave = async (benefitId: string) => {
        setError(null);

        if (!editForm.title.trim()) {
            setError("Benefit title is required");
            return;
        }

        if (editForm.type === "evidence_based" && !editForm.citation.trim()) {
            setError("Evidence-based benefits require a citation URL");
            return;
        }

        setIsSubmitting(true);

        const result = await updateOfficialBenefit(benefitId, productId, {
            title: editForm.title,
            type: editForm.type,
            citation: editForm.citation || undefined,
        });

        setIsSubmitting(false);

        if (result.success) {
            // Update local state
            setBenefits(
                benefits.map((b) =>
                    b.id === benefitId
                        ? {
                            ...b,
                            benefit_title: editForm.title,
                            benefit_type: editForm.type,
                            citation_url: editForm.citation || null,
                        }
                        : b
                )
            );
            setEditingId(null);
        } else {
            setError(result.error || "Failed to update benefit");
        }
    };

    const handleDelete = async (benefitId: string) => {
        if (!confirm("Are you sure you want to delete this benefit?")) {
            return;
        }

        const result = await deleteOfficialBenefit(benefitId, productId);

        if (result.success) {
            setBenefits(benefits.filter((b) => b.id !== benefitId));
        } else {
            setError(result.error || "Failed to delete benefit");
        }
    };

    return (
        <div className="bg-[#0a0a0a] border border-[#333] p-6 rounded space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">Official Benefits</h3>
                <span className="text-xs bg-emerald-900/30 text-emerald-400 px-2 py-1 rounded">
                    Verified Brand
                </span>
            </div>

            {error && (
                <div className="bg-red-900/20 border border-red-500/30 p-3 rounded">
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            )}

            {benefits.length === 0 ? (
                <p className="text-gray-500 text-sm">
                    No official benefits listed yet. Benefits added during product submission will appear here.
                </p>
            ) : (
                <div className="space-y-3">
                    {benefits.map((benefit) => (
                        <div
                            key={benefit.id}
                            className="border border-emerald-500/30 p-4 rounded bg-emerald-900/5 space-y-3"
                        >
                            {editingId === benefit.id ? (
                                // Edit Mode
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs uppercase tracking-wider text-gray-500 block mb-2">
                                            Benefit Title <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={editForm.title}
                                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
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
                                                    checked={editForm.type === "anecdotal"}
                                                    onChange={() => setEditForm({ ...editForm, type: "anecdotal", citation: "" })}
                                                    className="w-4 h-4"
                                                />
                                                <span className="text-sm text-gray-300">Anecdotal</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    checked={editForm.type === "evidence_based"}
                                                    onChange={() => setEditForm({ ...editForm, type: "evidence_based" })}
                                                    className="w-4 h-4"
                                                />
                                                <span className="text-sm text-gray-300">Evidence-Based</span>
                                            </label>
                                        </div>
                                    </div>

                                    {editForm.type === "evidence_based" && (
                                        <div>
                                            <label className="text-xs uppercase tracking-wider text-emerald-400/80 block mb-2">
                                                Citation URL <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="url"
                                                value={editForm.citation}
                                                onChange={(e) => setEditForm({ ...editForm, citation: e.target.value })}
                                                className="w-full bg-black border border-emerald-500/30 p-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                                            />
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleSave(benefit.id)}
                                            disabled={isSubmitting}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-sm rounded disabled:opacity-50"
                                        >
                                            {isSubmitting ? "Saving..." : "Save"}
                                        </button>
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="bg-[#1a1a1a] hover:bg-[#222] text-white px-4 py-2 text-sm rounded"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                // View Mode
                                <>
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

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEdit(benefit)}
                                                className="text-blue-400 hover:text-blue-300 text-xs"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(benefit.id)}
                                                className="text-red-400 hover:text-red-300 text-xs"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
