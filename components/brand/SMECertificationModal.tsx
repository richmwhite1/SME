"use client";

import { useState } from "react";
import { Award, Upload, X, FileText } from "lucide-react";
import { submitSMECertification } from "@/app/actions/sme-certification-actions";
import CloudinaryUploadWidget from "../wizard/CloudinaryUploadWidget";

interface SMECertificationModalProps {
    productId: string;
    productTitle: string;
}

export default function SMECertificationModal({ productId, productTitle }: SMECertificationModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [labReportUrls, setLabReportUrls] = useState<string[]>([]);
    const [purityDataUrls, setPurityDataUrls] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (labReportUrls.length === 0 && purityDataUrls.length === 0) {
            setError("Please upload at least one document");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const result = await submitSMECertification({
                productId,
                labReportUrls,
                purityDataUrls,
            });

            if (result.success && result.checkoutUrl) {
                // Redirect to Stripe checkout
                window.location.href = result.checkoutUrl;
            } else {
                setError(result.error || "Failed to submit certification");
                setIsSubmitting(false);
            }
        } catch (err) {
            setError("An unexpected error occurred");
            setIsSubmitting(false);
        }
    };

    const removeLabReport = (index: number) => {
        setLabReportUrls(labReportUrls.filter((_, i) => i !== index));
    };

    const removePurityData = (index: number) => {
        setPurityDataUrls(purityDataUrls.filter((_, i) => i !== index));
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="px-4 py-2 bg-emerald-600/20 border border-emerald-500/50 text-emerald-400 text-sm font-semibold rounded hover:bg-emerald-600/30 flex items-center gap-2"
            >
                <Award className="w-4 h-4" />
                Apply for SME Certification
            </button>
        );
    }

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/80 z-40"
                onClick={() => !isSubmitting && setIsOpen(false)}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="bg-[#0a0a0a] border border-[#333] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="border-b border-[#333] p-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-white uppercase tracking-wider flex items-center gap-3">
                                <Award className="w-6 h-6 text-emerald-500" />
                                SME Certification Application
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">{productTitle}</p>
                        </div>
                        <button
                            onClick={() => !isSubmitting && setIsOpen(false)}
                            className="text-gray-500 hover:text-white"
                            disabled={isSubmitting}
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Info Box */}
                        <div className="p-4 border border-emerald-900/30 bg-emerald-900/10 text-emerald-100 text-sm rounded">
                            <p className="font-semibold mb-2">What is SME Certification?</p>
                            <p className="mb-3">
                                SME (Subject Matter Expert) Certification is our highest level of product verification.
                                Your product will be reviewed by qualified experts who will verify:
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-xs">
                                <li>Third-party lab test results</li>
                                <li>Purity and potency claims</li>
                                <li>Source transparency</li>
                                <li>Manufacturing standards</li>
                            </ul>
                            <p className="mt-3 font-semibold">Cost: $3,000 one-time payment</p>
                        </div>

                        {error && (
                            <div className="p-4 border border-red-500/50 bg-red-900/10 text-red-400 text-sm rounded">
                                {error}
                            </div>
                        )}

                        {/* Lab Reports Upload */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-semibold text-white uppercase tracking-wider">
                                    Lab Reports
                                </label>
                                <CloudinaryUploadWidget
                                    onUpload={(url) => setLabReportUrls([...labReportUrls, url])}
                                    maxPhotos={5}
                                    currentCount={labReportUrls.length}
                                />
                            </div>
                            <p className="text-xs text-gray-500">
                                Upload third-party lab test results (PDF, JPG, PNG)
                            </p>

                            {labReportUrls.length > 0 && (
                                <div className="space-y-2">
                                    {labReportUrls.map((url, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-3 bg-[#111] border border-[#333] rounded"
                                        >
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-emerald-400" />
                                                <a
                                                    href={url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-white hover:text-emerald-400 truncate max-w-[300px]"
                                                >
                                                    Lab Report {index + 1}
                                                </a>
                                            </div>
                                            <button
                                                onClick={() => removeLabReport(index)}
                                                className="text-red-400 hover:text-red-300"
                                                disabled={isSubmitting}
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Purity Data Upload */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-semibold text-white uppercase tracking-wider">
                                    Purity & Quality Data
                                </label>
                                <CloudinaryUploadWidget
                                    onUpload={(url) => setPurityDataUrls([...purityDataUrls, url])}
                                    maxPhotos={5}
                                    currentCount={purityDataUrls.length}
                                />
                            </div>
                            <p className="text-xs text-gray-500">
                                Upload certificates of analysis (COA), purity tests, or quality documentation
                            </p>

                            {purityDataUrls.length > 0 && (
                                <div className="space-y-2">
                                    {purityDataUrls.map((url, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-3 bg-[#111] border border-[#333] rounded"
                                        >
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-emerald-400" />
                                                <a
                                                    href={url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-white hover:text-emerald-400 truncate max-w-[300px]"
                                                >
                                                    Purity Data {index + 1}
                                                </a>
                                            </div>
                                            <button
                                                onClick={() => removePurityData(index)}
                                                className="text-red-400 hover:text-red-300"
                                                disabled={isSubmitting}
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Next Steps */}
                        <div className="p-4 border border-yellow-900/30 bg-yellow-900/10 text-yellow-100 text-xs rounded">
                            <p className="font-semibold mb-2">Next Steps:</p>
                            <ol className="list-decimal list-inside space-y-1">
                                <li>Upload your documentation above</li>
                                <li>Click &quot;Proceed to Payment&quot; to pay the $3,000 certification fee</li>
                                <li>Our SME team will review your submission (typically 3-5 business days)</li>
                                <li>You&apos;ll be notified via email when the review is complete</li>
                                <li>Once approved, your product will display the &quot;SME Certified&quot; badge</li>
                            </ol>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-[#333] p-6 flex gap-3 justify-end">
                        <button
                            onClick={() => setIsOpen(false)}
                            disabled={isSubmitting}
                            className="px-6 py-3 bg-[#1a1a1a] border border-[#333] text-gray-400 font-semibold rounded hover:bg-[#222] disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || (labReportUrls.length === 0 && purityDataUrls.length === 0)}
                            className="px-6 py-3 bg-emerald-600/20 border border-emerald-500/50 text-emerald-400 font-semibold rounded hover:bg-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                <>Processing...</>
                            ) : (
                                <>
                                    <Award className="w-4 h-4" />
                                    Proceed to Payment ($3,000)
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
