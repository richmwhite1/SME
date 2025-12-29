"use client";

import { useState } from "react";
import { CheckCircle, XCircle, ExternalLink, Mail, Linkedin, Globe } from "lucide-react";
import { approveBrandVerification, rejectBrandVerification } from "@/app/actions/brand-verification-actions";

interface BrandVerification {
    id: string;
    product_id: string;
    product_title: string;
    product_slug: string;
    user_id: string;
    user_name: string;
    user_email: string;
    work_email: string;
    linkedin_profile: string;
    company_website: string;
    subscription_status: string;
    created_at: string;
}

interface BrandIntakeTabProps {
    verifications: BrandVerification[];
}

export default function BrandIntakeTab({ verifications }: BrandIntakeTabProps) {
    const [processing, setProcessing] = useState<string | null>(null);
    const [rejecting, setRejecting] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");

    const handleApprove = async (verificationId: string) => {
        if (!confirm("Are you sure you want to approve this brand verification?")) {
            return;
        }

        setProcessing(verificationId);
        try {
            const result = await approveBrandVerification(verificationId);
            if (result.success) {
                alert("Brand verification approved successfully!");
                window.location.reload();
            } else {
                alert(`Error: ${result.error}`);
            }
        } catch (error) {
            console.error("Error approving verification:", error);
            alert("Failed to approve verification");
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async (verificationId: string) => {
        if (!rejectionReason.trim()) {
            alert("Please provide a rejection reason");
            return;
        }

        setProcessing(verificationId);
        try {
            const result = await rejectBrandVerification(verificationId, rejectionReason);
            if (result.success) {
                alert("Brand verification rejected");
                setRejecting(null);
                setRejectionReason("");
                window.location.reload();
            } else {
                alert(`Error: ${result.error}`);
            }
        } catch (error) {
            console.error("Error rejecting verification:", error);
            alert("Failed to reject verification");
        } finally {
            setProcessing(null);
        }
    };

    if (verifications.length === 0) {
        return (
            <div className="p-8 text-center text-gray-500">
                <p>No pending brand verifications</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="border-b border-[#333] pb-4">
                <h2 className="text-xl font-bold text-white">Brand Intake Queue</h2>
                <p className="text-sm text-gray-500 mt-1">
                    Review and approve brand verification applications
                </p>
            </div>

            <div className="space-y-4">
                {verifications.map((verification) => (
                    <div
                        key={verification.id}
                        className="border border-[#333] bg-[#0a0a0a] p-6 rounded-lg space-y-4"
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-white">
                                    {verification.product_title}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Submitted {new Date(verification.created_at).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span
                                    className={`px-3 py-1 text-xs font-semibold rounded ${verification.subscription_status === "active"
                                            ? "bg-emerald-900/30 text-emerald-400 border border-emerald-500/30"
                                            : "bg-yellow-900/30 text-yellow-400 border border-yellow-500/30"
                                        }`}
                                >
                                    {verification.subscription_status === "active"
                                        ? "✓ Subscription Active"
                                        : `Subscription: ${verification.subscription_status}`}
                                </span>
                            </div>
                        </div>

                        {/* Applicant Info */}
                        <div className="grid grid-cols-2 gap-4 p-4 bg-[#111] border border-[#222] rounded">
                            <div>
                                <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">
                                    Applicant
                                </p>
                                <p className="text-white font-medium">{verification.user_name}</p>
                                <p className="text-sm text-gray-400">{verification.user_email}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">
                                    Product
                                </p>
                                <a
                                    href={`/products/${verification.product_slug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                                >
                                    View Product <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                        </div>

                        {/* Verification Details */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-[#111] border border-[#222] rounded">
                                <Mail className="w-4 h-4 text-gray-500" />
                                <div className="flex-1">
                                    <p className="text-xs text-gray-600">Work Email</p>
                                    <a
                                        href={`mailto:${verification.work_email}`}
                                        className="text-white hover:text-emerald-400"
                                    >
                                        {verification.work_email}
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-[#111] border border-[#222] rounded">
                                <Linkedin className="w-4 h-4 text-gray-500" />
                                <div className="flex-1">
                                    <p className="text-xs text-gray-600">LinkedIn Profile</p>
                                    <a
                                        href={verification.linkedin_profile}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-white hover:text-emerald-400 flex items-center gap-1"
                                    >
                                        {verification.linkedin_profile} <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-[#111] border border-[#222] rounded">
                                <Globe className="w-4 h-4 text-gray-500" />
                                <div className="flex-1">
                                    <p className="text-xs text-gray-600">Company Website</p>
                                    <a
                                        href={verification.company_website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-white hover:text-emerald-400 flex items-center gap-1"
                                    >
                                        {verification.company_website} <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        {rejecting === verification.id ? (
                            <div className="space-y-3 p-4 bg-red-900/10 border border-red-500/30 rounded">
                                <label className="block text-sm text-white">
                                    Rejection Reason <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    className="w-full bg-[#0a0a0a] border border-[#333] p-3 text-sm text-white focus:border-red-500 focus:outline-none rounded min-h-[100px]"
                                    placeholder="Explain why this verification is being rejected..."
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleReject(verification.id)}
                                        disabled={processing === verification.id}
                                        className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded hover:bg-red-700 disabled:opacity-50"
                                    >
                                        {processing === verification.id ? "Rejecting..." : "Confirm Rejection"}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setRejecting(null);
                                            setRejectionReason("");
                                        }}
                                        className="px-4 py-2 bg-[#1a1a1a] text-gray-400 text-sm font-semibold rounded hover:bg-[#222]"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleApprove(verification.id)}
                                    disabled={
                                        processing === verification.id ||
                                        verification.subscription_status !== "active"
                                    }
                                    className="flex items-center gap-2 px-6 py-3 bg-emerald-600/20 border border-emerald-500/50 text-emerald-400 font-semibold rounded hover:bg-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    {processing === verification.id ? "Approving..." : "Approve Brand Account"}
                                </button>
                                <button
                                    onClick={() => setRejecting(verification.id)}
                                    disabled={processing === verification.id}
                                    className="flex items-center gap-2 px-6 py-3 bg-red-600/20 border border-red-500/50 text-red-400 font-semibold rounded hover:bg-red-600/30 disabled:opacity-50"
                                >
                                    <XCircle className="w-4 h-4" />
                                    Reject
                                </button>
                            </div>
                        )}

                        {verification.subscription_status !== "active" && (
                            <div className="p-3 bg-yellow-900/10 border border-yellow-500/30 rounded text-yellow-400 text-sm">
                                ⚠️ Cannot approve until subscription is active
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
