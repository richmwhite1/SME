"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { FileText, User, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import ComparisonView from "./ComparisonView";

interface PendingClaim {
    id: string;
    product_id: string;
    user_id: string;
    submission_type: string;
    proposed_data: any;
    current_data: any;
    verification_status: string;
    created_at: string;
    product_title: string;
    product_slug: string;
    user_name: string;
    user_email: string;
    user_username: string;
}

interface ReviewDashboardClientProps {
    pendingClaims: PendingClaim[];
}

export default function ReviewDashboardClient({ pendingClaims }: ReviewDashboardClientProps) {
    const [expandedClaim, setExpandedClaim] = useState<string | null>(null);
    const [filter, setFilter] = useState<"all" | "brand_claim" | "product_edit">("all");

    const filteredClaims = pendingClaims.filter((claim) => {
        if (filter === "all") return true;
        return claim.submission_type === filter;
    });

    const toggleExpand = (claimId: string) => {
        setExpandedClaim(expandedClaim === claimId ? null : claimId);
    };

    return (
        <div className="space-y-6">
            {/* Filter Tabs */}
            <div className="flex gap-2 border-b border-bone-white/20">
                <button
                    onClick={() => setFilter("all")}
                    className={`px-4 py-2 font-mono text-sm transition-colors ${filter === "all"
                            ? "border-b-2 border-emerald-400 text-emerald-400"
                            : "text-bone-white/70 hover:text-bone-white"
                        }`}
                >
                    All ({pendingClaims.length})
                </button>
                <button
                    onClick={() => setFilter("brand_claim")}
                    className={`px-4 py-2 font-mono text-sm transition-colors ${filter === "brand_claim"
                            ? "border-b-2 border-emerald-400 text-emerald-400"
                            : "text-bone-white/70 hover:text-bone-white"
                        }`}
                >
                    Brand Claims ({pendingClaims.filter((c) => c.submission_type === "brand_claim").length})
                </button>
                <button
                    onClick={() => setFilter("product_edit")}
                    className={`px-4 py-2 font-mono text-sm transition-colors ${filter === "product_edit"
                            ? "border-b-2 border-emerald-400 text-emerald-400"
                            : "text-bone-white/70 hover:text-bone-white"
                        }`}
                >
                    Product Edits ({pendingClaims.filter((c) => c.submission_type === "product_edit").length})
                </button>
            </div>

            {/* Claims List */}
            {filteredClaims.length === 0 ? (
                <div className="border border-bone-white/20 bg-bone-white/5 p-8 text-center">
                    <FileText className="mx-auto h-12 w-12 text-bone-white/30 mb-4" />
                    <p className="font-mono text-bone-white/70">No pending {filter === "all" ? "submissions" : filter.replace("_", " ")} to review</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredClaims.map((claim) => (
                        <div
                            key={claim.id}
                            className="border border-bone-white/20 bg-bone-white/5 overflow-hidden"
                        >
                            {/* Claim Header */}
                            <button
                                onClick={() => toggleExpand(claim.id)}
                                className="w-full p-4 flex items-center justify-between hover:bg-bone-white/10 transition-colors"
                            >
                                <div className="flex items-center gap-4 flex-1 text-left">
                                    <div className="flex-shrink-0">
                                        {claim.submission_type === "brand_claim" ? (
                                            <div className="w-10 h-10 rounded-full bg-emerald-400/20 flex items-center justify-center">
                                                <FileText className="h-5 w-5 text-emerald-400" />
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-blue-400/20 flex items-center justify-center">
                                                <FileText className="h-5 w-5 text-blue-400" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-mono text-bone-white font-semibold truncate">
                                                {claim.product_title || "Untitled Product"}
                                            </h3>
                                            <span className="px-2 py-0.5 text-xs font-mono bg-amber-400/20 text-amber-400 rounded">
                                                {claim.submission_type === "brand_claim" ? "Brand Claim" : "Product Edit"}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-bone-white/60 font-mono">
                                            <span className="flex items-center gap-1">
                                                <User className="h-3 w-3" />
                                                {claim.user_name || claim.user_email}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {formatDistanceToNow(new Date(claim.created_at), { addSuffix: true })}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {expandedClaim === claim.id ? (
                                    <ChevronUp className="h-5 w-5 text-bone-white/70 flex-shrink-0" />
                                ) : (
                                    <ChevronDown className="h-5 w-5 text-bone-white/70 flex-shrink-0" />
                                )}
                            </button>

                            {/* Expanded Comparison View */}
                            {expandedClaim === claim.id && (
                                <div className="border-t border-bone-white/20">
                                    <ComparisonView claim={claim} />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
