"use client";

import { useState } from "react";
import { submitBrandVerification } from "@/app/actions/brand-verification-actions";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface BrandClaimWizardProps {
    productId: string;
    productTitle: string;
    productSlug: string;
    userEmail: string;
}

export default function BrandClaimWizard({
    productId,
    productTitle,
    productSlug,
    userEmail,
}: BrandClaimWizardProps) {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        workEmail: userEmail,
        linkedinProfile: "",
        companyWebsite: "",
    });

    const [validationErrors, setValidationErrors] = useState({
        workEmail: "",
        linkedinProfile: "",
        companyWebsite: "",
    });

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validateLinkedIn = (url: string): boolean => {
        const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\/.+/;
        return linkedinRegex.test(url);
    };

    const validateWebsite = (url: string): boolean => {
        const urlRegex = /^https?:\/\/.+\..+/;
        return urlRegex.test(url);
    };

    const handleNext = () => {
        setValidationErrors({ workEmail: "", linkedinProfile: "", companyWebsite: "" });

        if (step === 1) {
            if (!formData.workEmail) {
                setValidationErrors(prev => ({ ...prev, workEmail: "Work email is required" }));
                return;
            }
            if (!validateEmail(formData.workEmail)) {
                setValidationErrors(prev => ({ ...prev, workEmail: "Please enter a valid email address" }));
                return;
            }
            setStep(2);
        } else if (step === 2) {
            if (!formData.linkedinProfile) {
                setValidationErrors(prev => ({ ...prev, linkedinProfile: "LinkedIn profile is required" }));
                return;
            }
            if (!validateLinkedIn(formData.linkedinProfile)) {
                setValidationErrors(prev => ({ ...prev, linkedinProfile: "Please enter a valid LinkedIn profile URL (e.g., https://linkedin.com/in/yourname)" }));
                return;
            }
            setStep(3);
        }
    };

    const handleBack = () => {
        setError(null);
        setValidationErrors({ workEmail: "", linkedinProfile: "", companyWebsite: "" });
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const handleSubmit = async () => {
        setError(null);
        setValidationErrors({ workEmail: "", linkedinProfile: "", companyWebsite: "" });

        if (!formData.companyWebsite) {
            setValidationErrors(prev => ({ ...prev, companyWebsite: "Company website is required" }));
            return;
        }

        if (!validateWebsite(formData.companyWebsite)) {
            setValidationErrors(prev => ({ ...prev, companyWebsite: "Please enter a valid website URL (e.g., https://example.com)" }));
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await submitBrandVerification({
                productId,
                workEmail: formData.workEmail,
                linkedinProfile: formData.linkedinProfile,
                companyWebsite: formData.companyWebsite,
            });

            if (result.success && result.checkoutUrl) {
                // Redirect to Stripe checkout
                window.location.href = result.checkoutUrl;
            } else {
                setError(result.error || "Failed to submit verification. Please try again.");
                setIsSubmitting(false);
            }
        } catch (err) {
            setError("An unexpected error occurred. Please try again.");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="border border-bone-white/20 bg-bone-white/5 p-8 rounded-lg font-mono">
            {/* Progress Indicator */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center flex-1">
                            <div
                                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${step >= s
                                        ? "border-sme-gold bg-sme-gold/10 text-sme-gold"
                                        : "border-bone-white/30 bg-transparent text-bone-white/30"
                                    }`}
                            >
                                {step > s ? (
                                    <CheckCircle2 className="h-5 w-5" />
                                ) : (
                                    <span className="text-sm font-bold">{s}</span>
                                )}
                            </div>
                            {s < 3 && (
                                <div
                                    className={`h-0.5 flex-1 mx-2 ${step > s ? "bg-sme-gold" : "bg-bone-white/30"
                                        }`}
                                />
                            )}
                        </div>
                    ))}
                </div>
                <div className="flex justify-between text-xs text-bone-white/50 mt-2">
                    <span>Work Email</span>
                    <span>LinkedIn</span>
                    <span>Website</span>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 border border-red-500/30 bg-red-900/20 p-4 rounded flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-400">{error}</p>
                </div>
            )}

            {/* Step 1: Work Email */}
            {step === 1 && (
                <div className="space-y-6">
                    <div>
                        <h2 className="text-xl font-bold text-bone-white mb-2">Verify Your Work Email</h2>
                        <p className="text-sm text-bone-white/70">
                            We'll use this to verify your identity and send important updates.
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-bone-white mb-2">
                            Work Email <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            value={formData.workEmail}
                            onChange={(e) => setFormData({ ...formData, workEmail: e.target.value })}
                            className="w-full bg-black border border-bone-white/30 p-3 text-bone-white focus:border-sme-gold focus:outline-none rounded"
                            placeholder="you@company.com"
                        />
                        {validationErrors.workEmail && (
                            <p className="mt-2 text-sm text-red-400">{validationErrors.workEmail}</p>
                        )}
                    </div>
                    <div className="flex justify-end">
                        <button
                            onClick={handleNext}
                            className="bg-sme-gold hover:bg-sme-gold/90 text-black px-6 py-3 rounded font-bold transition-colors"
                        >
                            Continue
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: LinkedIn Profile */}
            {step === 2 && (
                <div className="space-y-6">
                    <div>
                        <h2 className="text-xl font-bold text-bone-white mb-2">LinkedIn Profile</h2>
                        <p className="text-sm text-bone-white/70">
                            This helps us verify your identity and connection to the brand.
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-bone-white mb-2">
                            LinkedIn Profile URL <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="url"
                            value={formData.linkedinProfile}
                            onChange={(e) => setFormData({ ...formData, linkedinProfile: e.target.value })}
                            className="w-full bg-black border border-bone-white/30 p-3 text-bone-white focus:border-sme-gold focus:outline-none rounded"
                            placeholder="https://linkedin.com/in/yourname"
                        />
                        {validationErrors.linkedinProfile && (
                            <p className="mt-2 text-sm text-red-400">{validationErrors.linkedinProfile}</p>
                        )}
                    </div>
                    <div className="flex justify-between">
                        <button
                            onClick={handleBack}
                            className="bg-bone-white/10 hover:bg-bone-white/20 text-bone-white px-6 py-3 rounded font-bold transition-colors"
                        >
                            Back
                        </button>
                        <button
                            onClick={handleNext}
                            className="bg-sme-gold hover:bg-sme-gold/90 text-black px-6 py-3 rounded font-bold transition-colors"
                        >
                            Continue
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Company Website */}
            {step === 3 && (
                <div className="space-y-6">
                    <div>
                        <h2 className="text-xl font-bold text-bone-white mb-2">Company Website</h2>
                        <p className="text-sm text-bone-white/70">
                            The official website for your brand or company.
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-bone-white mb-2">
                            Company Website <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="url"
                            value={formData.companyWebsite}
                            onChange={(e) => setFormData({ ...formData, companyWebsite: e.target.value })}
                            className="w-full bg-black border border-bone-white/30 p-3 text-bone-white focus:border-sme-gold focus:outline-none rounded"
                            placeholder="https://yourcompany.com"
                        />
                        {validationErrors.companyWebsite && (
                            <p className="mt-2 text-sm text-red-400">{validationErrors.companyWebsite}</p>
                        )}
                    </div>

                    <div className="border-t border-bone-white/10 pt-6">
                        <h3 className="text-sm font-bold text-bone-white mb-3">Review Your Information:</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-bone-white/50">Work Email:</span>
                                <span className="text-bone-white">{formData.workEmail}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-bone-white/50">LinkedIn:</span>
                                <span className="text-bone-white truncate ml-4 max-w-xs">{formData.linkedinProfile}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between">
                        <button
                            onClick={handleBack}
                            disabled={isSubmitting}
                            className="bg-bone-white/10 hover:bg-bone-white/20 text-bone-white px-6 py-3 rounded font-bold transition-colors disabled:opacity-50"
                        >
                            Back
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="bg-sme-gold hover:bg-sme-gold/90 text-black px-6 py-3 rounded font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                "Submit & Continue to Payment"
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
