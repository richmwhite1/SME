"use client";

import { useState } from "react";
import { approveProductOnboarding, rejectProductOnboarding, sendPaymentLinkForOnboarding } from "@/app/actions/onboarding-review-actions";
import { Check, X, Loader2, Send, DollarSign, CreditCard } from "lucide-react";

interface ComparisonViewProps {
    claim: {
        id: string;
        product_id: string;
        submission_type: string;
        proposed_data: any;
        current_data: any;
        user_name: string;
        user_email: string;
        created_at: string;
        verification_status?: string;
        payment_link_sent_at?: string | null;
        subscription_status?: string | null;
    };
}

export default function ComparisonView({ claim }: ComparisonViewProps) {
    const [isApproving, setIsApproving] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [isSendingPayment, setIsSendingPayment] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleApprove = async () => {
        setIsApproving(true);
        setError(null);
        setSuccess(null);

        try {
            const result = await approveProductOnboarding(claim.id);
            setSuccess(result.message);
            // Refresh the page after a short delay
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to approve submission");
        } finally {
            setIsApproving(false);
        }
    };

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            setError("Please provide a rejection reason");
            return;
        }

        setIsRejecting(true);
        setError(null);
        setSuccess(null);

        try {
            const result = await rejectProductOnboarding(claim.id, rejectionReason);
            setSuccess(result.message);
            setShowRejectModal(false);
            // Refresh the page after a short delay
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to reject submission");
        } finally {
            setIsRejecting(false);
        }
    };

    const handleSendPaymentLink = async () => {
        if (!confirm("Send payment link to the applicant?")) {
            return;
        }

        setIsSendingPayment(true);
        setError(null);
        setSuccess(null);

        try {
            const result = await sendPaymentLinkForOnboarding(claim.id);
            if (result.success && result.checkoutUrl) {
                // Copy to clipboard
                await navigator.clipboard.writeText(result.checkoutUrl);
                setSuccess(`Payment link copied to clipboard! Send this to ${claim.user_email}`);
                // Refresh after delay
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } else {
                setError("Failed to generate payment link");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to send payment link");
        } finally {
            setIsSendingPayment(false);
        }
    };

    const renderFieldComparison = (fieldName: string, currentValue: any, proposedValue: any) => {
        const hasChange = JSON.stringify(currentValue) !== JSON.stringify(proposedValue);

        return (
            <div className="mb-4">
                <h4 className="font-mono text-xs text-bone-white/50 uppercase tracking-wider mb-2">
                    {fieldName}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                    {/* Current Data */}
                    <div className="border border-bone-white/20 bg-bone-white/5 p-3 rounded">
                        <p className="text-xs text-bone-white/50 mb-1 font-mono">Current</p>
                        <div className="text-sm text-bone-white/90 font-mono">
                            {currentValue ? (
                                typeof currentValue === "object" ? (
                                    <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(currentValue, null, 2)}</pre>
                                ) : (
                                    <span>{String(currentValue)}</span>
                                )
                            ) : (
                                <span className="text-bone-white/40 italic">Not set</span>
                            )}
                        </div>
                    </div>

                    {/* Proposed Data */}
                    <div className={`border p-3 rounded ${hasChange ? "border-emerald-400/50 bg-emerald-400/10" : "border-bone-white/20 bg-bone-white/5"}`}>
                        <p className="text-xs text-bone-white/50 mb-1 font-mono">
                            Proposed {hasChange && <span className="text-emerald-400">●</span>}
                        </p>
                        <div className="text-sm text-bone-white/90 font-mono">
                            {proposedValue ? (
                                typeof proposedValue === "object" ? (
                                    <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(proposedValue, null, 2)}</pre>
                                ) : (
                                    <span>{String(proposedValue)}</span>
                                )
                            ) : (
                                <span className="text-bone-white/40 italic">Not set</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Extract all unique keys from both current and proposed data
    const allKeys = new Set([
        ...Object.keys(claim.current_data || {}),
        ...Object.keys(claim.proposed_data || {}),
    ]);

    return (
        <div className="p-6">
            {/* Submission Info */}
            <div className="mb-6 pb-4 border-b border-bone-white/20">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <p className="font-mono text-sm text-bone-white/70">
                            Submitted by: <span className="text-bone-white">{claim.user_name}</span>
                        </p>
                        <p className="font-mono text-xs text-bone-white/50">{claim.user_email}</p>
                    </div>
                    <div className="text-right">
                        <p className="font-mono text-xs text-bone-white/50">
                            {new Date(claim.created_at).toLocaleString()}
                        </p>
                    </div>
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap gap-2">
                    {/* Verification Status */}
                    {claim.verification_status && (
                        <span className={`px-3 py-1 text-xs font-mono rounded ${claim.verification_status === 'verified'
                            ? 'bg-emerald-400/20 text-emerald-400 border border-emerald-400/50'
                            : claim.verification_status === 'rejected'
                                ? 'bg-red-400/20 text-red-400 border border-red-400/50'
                                : 'bg-amber-400/20 text-amber-400 border border-amber-400/50'
                            }`}>
                            {claim.verification_status === 'verified' ? '✓ Verified' :
                                claim.verification_status === 'rejected' ? '✗ Rejected' :
                                    '⏳ Pending'}
                        </span>
                    )}

                    {/* Payment Link Status */}
                    {claim.payment_link_sent_at && (
                        <span className="px-3 py-1 text-xs font-mono bg-blue-400/20 text-blue-400 border border-blue-400/50 rounded flex items-center gap-1">
                            <Send className="h-3 w-3" />
                            Payment Link Sent {new Date(claim.payment_link_sent_at).toLocaleDateString()}
                        </span>
                    )}

                    {/* Subscription Status */}
                    {claim.subscription_status && (
                        <span className={`px-3 py-1 text-xs font-mono rounded flex items-center gap-1 ${claim.subscription_status === 'active'
                            ? 'bg-emerald-400/20 text-emerald-400 border border-emerald-400/50'
                            : 'bg-amber-400/20 text-amber-400 border border-amber-400/50'
                            }`}>
                            <CreditCard className="h-3 w-3" />
                            {claim.subscription_status === 'active' ? '✓ Payment Complete' : `Subscription: ${claim.subscription_status}`}
                        </span>
                    )}
                </div>
            </div>

            {/* Field Comparisons */}
            <div className="mb-6">
                <h3 className="font-mono text-lg text-bone-white mb-4 flex items-center gap-2">
                    <span className="text-bone-white/50">Current Data</span>
                    <span className="text-bone-white/30">vs</span>
                    <span className="text-emerald-400">Proposed Brand Edits</span>
                </h3>

                {Array.from(allKeys).map((key) => (
                    <div key={key}>
                        {renderFieldComparison(
                            key,
                            claim.current_data?.[key],
                            claim.proposed_data?.[key]
                        )}
                    </div>
                ))}
            </div>

            {/* Status Messages */}
            {error && (
                <div className="mb-4 p-3 border border-red-400/50 bg-red-400/10 rounded">
                    <p className="font-mono text-sm text-red-400">{error}</p>
                </div>
            )}

            {success && (
                <div className="mb-4 p-3 border border-emerald-400/50 bg-emerald-400/10 rounded">
                    <p className="font-mono text-sm text-emerald-400">{success}</p>
                </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
                {/* Show approve/reject for pending claims */}
                {(!claim.verification_status || claim.verification_status === 'pending') && (
                    <div className="flex gap-3">
                        <button
                            onClick={handleApprove}
                            disabled={isApproving || isRejecting}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-400 text-forest-obsidian font-mono font-semibold hover:bg-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isApproving ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Approving...
                                </>
                            ) : (
                                <>
                                    <Check className="h-5 w-5" />
                                    Approve
                                </>
                            )}
                        </button>

                        <button
                            onClick={() => setShowRejectModal(true)}
                            disabled={isApproving || isRejecting}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-red-400 text-red-400 font-mono font-semibold hover:bg-red-400/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <X className="h-5 w-5" />
                            Reject
                        </button>
                    </div>
                )}

                {/* Show payment link button for verified brand claims without payment */}
                {claim.verification_status === 'verified' &&
                    claim.submission_type === 'brand_claim' &&
                    claim.subscription_status !== 'active' && (
                        <button
                            onClick={handleSendPaymentLink}
                            disabled={isSendingPayment}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-400 text-forest-obsidian font-mono font-semibold hover:bg-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isSendingPayment ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Generating Payment Link...
                                </>
                            ) : (
                                <>
                                    <Send className="h-5 w-5" />
                                    Send Payment Link
                                </>
                            )}
                        </button>
                    )}

                {/* Show completion status for paid claims */}
                {claim.subscription_status === 'active' && (
                    <div className="p-4 border border-emerald-400/50 bg-emerald-400/10 rounded">
                        <div className="flex items-center gap-2 text-emerald-400 font-mono">
                            <Check className="h-5 w-5" />
                            <span className="font-semibold">Brand Claim Complete</span>
                        </div>
                        <p className="text-xs text-emerald-400/70 mt-1 font-mono">
                            Payment received. Product ownership has been assigned.
                        </p>
                    </div>
                )}
            </div>

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-forest-obsidian border border-bone-white/20 p-6 max-w-md w-full">
                        <h3 className="font-mono text-xl text-bone-white mb-4">Reject Submission</h3>
                        <p className="font-mono text-sm text-bone-white/70 mb-4">
                            Please provide a reason for rejecting this submission:
                        </p>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="w-full p-3 bg-bone-white/5 border border-bone-white/20 text-bone-white font-mono text-sm mb-4 min-h-[100px] focus:outline-none focus:border-emerald-400"
                            placeholder="Enter rejection reason..."
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={handleReject}
                                disabled={isRejecting}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-400 text-forest-obsidian font-mono font-semibold hover:bg-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isRejecting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Rejecting...
                                    </>
                                ) : (
                                    "Confirm Rejection"
                                )}
                            </button>
                            <button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectionReason("");
                                }}
                                disabled={isRejecting}
                                className="flex-1 px-4 py-2 border border-bone-white/20 text-bone-white font-mono hover:bg-bone-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
