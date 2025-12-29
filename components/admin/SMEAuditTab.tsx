"use client";

import { useState } from "react";
import { CheckCircle, XCircle, AlertCircle, ExternalLink, FileText } from "lucide-react";
import {
    approveSMECertification,
    rejectSMECertification,
    requestMoreInfoSMECertification,
} from "@/app/actions/sme-certification-actions";

interface SMECertification {
    id: string;
    product_id: string;
    product_title: string;
    product_slug: string;
    brand_owner_id: string;
    brand_owner_name: string;
    lab_report_urls: string[];
    purity_data_urls: string[];
    payment_status: string;
    status: string;
    created_at: string;
}

interface SMEAuditTabProps {
    certifications: SMECertification[];
}

export default function SMEAuditTab({ certifications }: SMEAuditTabProps) {
    const [processing, setProcessing] = useState<string | null>(null);
    const [actionType, setActionType] = useState<string | null>(null);
    const [notes, setNotes] = useState("");
    const [rejectionReason, setRejectionReason] = useState("");

    const handleApprove = async (certificationId: string) => {
        if (!confirm("Are you sure you want to approve this SME certification?")) {
            return;
        }

        setProcessing(certificationId);
        try {
            const result = await approveSMECertification(certificationId, notes);
            if (result.success) {
                alert("SME certification approved successfully!");
                window.location.reload();
            } else {
                alert(`Error: ${result.error}`);
            }
        } catch (error) {
            console.error("Error approving certification:", error);
            alert("Failed to approve certification");
        } finally {
            setProcessing(null);
            setNotes("");
        }
    };

    const handleReject = async (certificationId: string) => {
        if (!rejectionReason.trim()) {
            alert("Please provide a rejection reason");
            return;
        }

        setProcessing(certificationId);
        try {
            const result = await rejectSMECertification(certificationId, rejectionReason);
            if (result.success) {
                alert("SME certification rejected");
                setActionType(null);
                setRejectionReason("");
                window.location.reload();
            } else {
                alert(`Error: ${result.error}`);
            }
        } catch (error) {
            console.error("Error rejecting certification:", error);
            alert("Failed to reject certification");
        } finally {
            setProcessing(null);
        }
    };

    const handleRequestMoreInfo = async (certificationId: string) => {
        if (!notes.trim()) {
            alert("Please provide notes about what information is needed");
            return;
        }

        setProcessing(certificationId);
        try {
            const result = await requestMoreInfoSMECertification(certificationId, notes);
            if (result.success) {
                alert("More information requested");
                setActionType(null);
                setNotes("");
                window.location.reload();
            } else {
                alert(`Error: ${result.error}`);
            }
        } catch (error) {
            console.error("Error requesting more info:", error);
            alert("Failed to request more information");
        } finally {
            setProcessing(null);
        }
    };

    if (certifications.length === 0) {
        return (
            <div className="p-8 text-center text-gray-500">
                <p>No pending SME certification applications</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="border-b border-[#333] pb-4">
                <h2 className="text-xl font-bold text-white">SME Audit Queue</h2>
                <p className="text-sm text-gray-500 mt-1">
                    Review and approve SME certification applications
                </p>
            </div>

            <div className="space-y-6">
                {certifications.map((cert) => (
                    <div
                        key={cert.id}
                        className="border border-[#333] bg-[#0a0a0a] p-6 rounded-lg space-y-4"
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-white">
                                    {cert.product_title}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Submitted {new Date(cert.created_at).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span
                                    className={`px-3 py-1 text-xs font-semibold rounded ${cert.payment_status === "paid"
                                            ? "bg-emerald-900/30 text-emerald-400 border border-emerald-500/30"
                                            : "bg-yellow-900/30 text-yellow-400 border border-yellow-500/30"
                                        }`}
                                >
                                    {cert.payment_status === "paid" ? "✓ Payment Complete" : `Payment: ${cert.payment_status}`}
                                </span>
                            </div>
                        </div>

                        {/* Brand Info */}
                        <div className="grid grid-cols-2 gap-4 p-4 bg-[#111] border border-[#222] rounded">
                            <div>
                                <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">
                                    Brand Representative
                                </p>
                                <p className="text-white font-medium">{cert.brand_owner_name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">
                                    Product
                                </p>
                                <a
                                    href={`/products/${cert.product_slug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                                >
                                    View Product <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                        </div>

                        {/* Documents */}
                        <div className="space-y-4">
                            {/* Lab Reports */}
                            {cert.lab_report_urls.length > 0 && (
                                <div>
                                    <p className="text-sm font-semibold text-white uppercase tracking-wider mb-2">
                                        Lab Reports ({cert.lab_report_urls.length})
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {cert.lab_report_urls.map((url, index) => (
                                            <a
                                                key={index}
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 p-3 bg-[#111] border border-[#222] rounded hover:border-emerald-500/50 transition-colors"
                                            >
                                                <FileText className="w-4 h-4 text-emerald-400" />
                                                <span className="text-sm text-white">Lab Report {index + 1}</span>
                                                <ExternalLink className="w-3 h-3 text-gray-500 ml-auto" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Purity Data */}
                            {cert.purity_data_urls.length > 0 && (
                                <div>
                                    <p className="text-sm font-semibold text-white uppercase tracking-wider mb-2">
                                        Purity & Quality Data ({cert.purity_data_urls.length})
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {cert.purity_data_urls.map((url, index) => (
                                            <a
                                                key={index}
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 p-3 bg-[#111] border border-[#222] rounded hover:border-emerald-500/50 transition-colors"
                                            >
                                                <FileText className="w-4 h-4 text-emerald-400" />
                                                <span className="text-sm text-white">Purity Data {index + 1}</span>
                                                <ExternalLink className="w-3 h-3 text-gray-500 ml-auto" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        {actionType === `reject-${cert.id}` ? (
                            <div className="space-y-3 p-4 bg-red-900/10 border border-red-500/30 rounded">
                                <label className="block text-sm text-white">
                                    Rejection Reason <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    className="w-full bg-[#0a0a0a] border border-[#333] p-3 text-sm text-white focus:border-red-500 focus:outline-none rounded min-h-[100px]"
                                    placeholder="Explain why this certification is being rejected..."
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleReject(cert.id)}
                                        disabled={processing === cert.id}
                                        className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded hover:bg-red-700 disabled:opacity-50"
                                    >
                                        {processing === cert.id ? "Rejecting..." : "Confirm Rejection"}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setActionType(null);
                                            setRejectionReason("");
                                        }}
                                        className="px-4 py-2 bg-[#1a1a1a] text-gray-400 text-sm font-semibold rounded hover:bg-[#222]"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : actionType === `more-info-${cert.id}` ? (
                            <div className="space-y-3 p-4 bg-yellow-900/10 border border-yellow-500/30 rounded">
                                <label className="block text-sm text-white">
                                    What information is needed? <span className="text-yellow-500">*</span>
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full bg-[#0a0a0a] border border-[#333] p-3 text-sm text-white focus:border-yellow-500 focus:outline-none rounded min-h-[100px]"
                                    placeholder="Describe what additional information or documentation is required..."
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleRequestMoreInfo(cert.id)}
                                        disabled={processing === cert.id}
                                        className="px-4 py-2 bg-yellow-600 text-white text-sm font-semibold rounded hover:bg-yellow-700 disabled:opacity-50"
                                    >
                                        {processing === cert.id ? "Requesting..." : "Request More Info"}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setActionType(null);
                                            setNotes("");
                                        }}
                                        className="px-4 py-2 bg-[#1a1a1a] text-gray-400 text-sm font-semibold rounded hover:bg-[#222]"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {/* Optional Notes */}
                                <div>
                                    <label className="block text-sm text-gray-500 mb-2">
                                        Reviewer Notes (Optional)
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="w-full bg-[#0a0a0a] border border-[#333] p-3 text-sm text-white focus:border-emerald-500 focus:outline-none rounded min-h-[80px]"
                                        placeholder="Add any notes about your review..."
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleApprove(cert.id)}
                                        disabled={
                                            processing === cert.id ||
                                            cert.payment_status !== "paid"
                                        }
                                        className="flex items-center gap-2 px-6 py-3 bg-emerald-600/20 border border-emerald-500/50 text-emerald-400 font-semibold rounded hover:bg-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        {processing === cert.id ? "Approving..." : "Approve Certification"}
                                    </button>
                                    <button
                                        onClick={() => setActionType(`more-info-${cert.id}`)}
                                        disabled={processing === cert.id}
                                        className="flex items-center gap-2 px-6 py-3 bg-yellow-600/20 border border-yellow-500/50 text-yellow-400 font-semibold rounded hover:bg-yellow-600/30 disabled:opacity-50"
                                    >
                                        <AlertCircle className="w-4 h-4" />
                                        Request More Info
                                    </button>
                                    <button
                                        onClick={() => setActionType(`reject-${cert.id}`)}
                                        disabled={processing === cert.id}
                                        className="flex items-center gap-2 px-6 py-3 bg-red-600/20 border border-red-500/50 text-red-400 font-semibold rounded hover:bg-red-600/30 disabled:opacity-50"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        Reject
                                    </button>
                                </div>
                            </div>
                        )}

                        {cert.payment_status !== "paid" && (
                            <div className="p-3 bg-yellow-900/10 border border-yellow-500/30 rounded text-yellow-400 text-sm">
                                ⚠️ Cannot approve until payment is complete
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
