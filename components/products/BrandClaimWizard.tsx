"use client";

import { useState } from "react";
import { submitBrandClaim } from "@/app/actions/submit-brand-claim";
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
        founderComments: "",
        intentionStatement: "",
        labReportUrl: "",
    });

    const [validationErrors, setValidationErrors] = useState({
        workEmail: "",
        linkedinProfile: "",
        companyWebsite: "",
        founderComments: "",
        intentionStatement: "",
        labReportUrl: "",
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
        setValidationErrors({ workEmail: "", linkedinProfile: "", companyWebsite: "", founderComments: "", intentionStatement: "", labReportUrl: "" });

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
        } else if (step === 3) {
            if (!formData.companyWebsite) {
                setValidationErrors(prev => ({ ...prev, companyWebsite: "Company website is required" }));
                return;
            }
            if (!validateWebsite(formData.companyWebsite)) {
                setValidationErrors(prev => ({ ...prev, companyWebsite: "Please enter a valid website URL (e.g., https://example.com)" }));
                return;
            }
            setStep(4);
        } else if (step === 4) {
            // Founder comments are optional, just move to next step
            setStep(5);
        } else if (step === 5) {
            if (!formData.intentionStatement) {
                setValidationErrors(prev => ({ ...prev, intentionStatement: "Intention statement is required" }));
                return;
            }
            if (formData.intentionStatement.length < 50) {
                setValidationErrors(prev => ({ ...prev, intentionStatement: "Please provide at least 50 characters describing your brand's intention" }));
                return;
            }
            setStep(6);
        }
    };

    const handleBack = () => {
        setError(null);
        setValidationErrors({ workEmail: "", linkedinProfile: "", companyWebsite: "", founderComments: "", intentionStatement: "", labReportUrl: "" });
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const handleSubmit = async () => {
        setError(null);
        setValidationErrors({ workEmail: "", linkedinProfile: "", companyWebsite: "", founderComments: "", intentionStatement: "", labReportUrl: "" });

        // Validate lab report URL if provided
        if (formData.labReportUrl && !validateWebsite(formData.labReportUrl)) {
            setValidationErrors(prev => ({ ...prev, labReportUrl: "Please enter a valid URL (e.g., https://example.com/report.pdf)" }));
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await submitBrandClaim({
                productId,
                workEmail: formData.workEmail,
                linkedinProfile: formData.linkedinProfile,
                companyWebsite: formData.companyWebsite,
                founderComments: formData.founderComments,
                intentionStatement: formData.intentionStatement,
                labReportUrl: formData.labReportUrl,
            });

            if (result.success) {
                // Show success message - no Stripe redirect
                setStep(7); // Move to success step
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
                    {[1, 2, 3, 4, 5, 6].map((s) => (
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
                            {s < 6 && (
                                <div
                                    className={`h-0.5 flex-1 mx-2 ${step > s ? "bg-sme-gold" : "bg-bone-white/30"
                                        }`}
                                />
                            )}
                        </div>
                    ))}
                </div>
                <div className="flex justify-between text-xs text-bone-white/50 mt-2">
                    <span>Email</span>
                    <span>LinkedIn</span>
                    <span>Website</span>
                    <span>Comments</span>
                    <span>Intent</span>
                    <span>Lab Report</span>
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
                            We&apos;ll use this to verify your identity and send important updates.
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

            {/* Step 4: Founder Comments */}
            {step === 4 && (
                <div className="space-y-6">
                    <div>
                        <h2 className="text-xl font-bold text-bone-white mb-2">Founder Comments</h2>
                        <p className="text-sm text-bone-white/70">
                            Share any additional context or comments about your product (optional).
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-bone-white mb-2">
                            Comments <span className="text-bone-white/50">(Optional)</span>
                        </label>
                        <textarea
                            value={formData.founderComments}
                            onChange={(e) => setFormData({ ...formData, founderComments: e.target.value })}
                            className="w-full bg-black border border-bone-white/30 p-3 text-bone-white focus:border-sme-gold focus:outline-none rounded min-h-[120px]"
                            placeholder="Tell us about your product, your journey, or anything else you'd like to share..."
                        />
                        {validationErrors.founderComments && (
                            <p className="mt-2 text-sm text-red-400">{validationErrors.founderComments}</p>
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

            {/* Step 5: Intention Statement */}
            {step === 5 && (
                <div className="space-y-6">
                    <div>
                        <h2 className="text-xl font-bold text-bone-white mb-2">Brand Intention Statement</h2>
                        <p className="text-sm text-bone-white/70">
                            Describe your brand's mission, values, and what you aim to achieve with this product.
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-bone-white mb-2">
                            Intention Statement <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={formData.intentionStatement}
                            onChange={(e) => setFormData({ ...formData, intentionStatement: e.target.value })}
                            className="w-full bg-black border border-bone-white/30 p-3 text-bone-white focus:border-sme-gold focus:outline-none rounded min-h-[150px]"
                            placeholder="Our mission is to... We believe in... This product helps people..."
                        />
                        <p className="mt-1 text-xs text-bone-white/50">
                            Minimum 50 characters ({formData.intentionStatement.length}/50)
                        </p>
                        {validationErrors.intentionStatement && (
                            <p className="mt-2 text-sm text-red-400">{validationErrors.intentionStatement}</p>
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

            {/* Step 6: Lab Report URL */}
            {step === 6 && (
                <div className="space-y-6">
                    <div>
                        <h2 className="text-xl font-bold text-bone-white mb-2">Lab Report</h2>
                        <p className="text-sm text-bone-white/70">
                            Provide a link to your lab report or certificate of analysis (optional but recommended).
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-bone-white mb-2">
                            Lab Report URL <span className="text-bone-white/50">(Optional)</span>
                        </label>
                        <input
                            type="url"
                            value={formData.labReportUrl}
                            onChange={(e) => setFormData({ ...formData, labReportUrl: e.target.value })}
                            className="w-full bg-black border border-bone-white/30 p-3 text-bone-white focus:border-sme-gold focus:outline-none rounded"
                            placeholder="https://example.com/lab-report.pdf"
                        />
                        {validationErrors.labReportUrl && (
                            <p className="mt-2 text-sm text-red-400">{validationErrors.labReportUrl}</p>
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
                            <div className="flex justify-between">
                                <span className="text-bone-white/50">Website:</span>
                                <span className="text-bone-white truncate ml-4 max-w-xs">{formData.companyWebsite}</span>
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
                                    Submitting...
                                </>
                            ) : (
                                "Submit Application"
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Step 7: Success Message */}
            {step === 7 && (
                <div className="space-y-6 text-center">
                    <div className="flex justify-center mb-4">
                        <CheckCircle2 className="h-16 w-16 text-sme-gold" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-bone-white mb-2">Application Submitted!</h2>
                        <p className="text-bone-white/70 mb-4">
                            Thank you for submitting your brand verification application for <strong className="text-sme-gold">{productTitle}</strong>.
                        </p>
                    </div>
                    <div className="border border-bone-white/20 bg-bone-white/5 p-6 rounded-lg text-left">
                        <h3 className="text-lg font-bold text-bone-white mb-3">What Happens Next?</h3>
                        <ol className="space-y-3 text-sm text-bone-white/70">
                            <li className="flex items-start gap-2">
                                <span className="text-sme-gold font-bold">1.</span>
                                <span>Our team will review your application within 2-3 business days</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-sme-gold font-bold">2.</span>
                                <span>If approved, you'll receive a payment link via email</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-sme-gold font-bold">3.</span>
                                <span>After payment, you'll gain full access to your brand dashboard</span>
                            </li>
                        </ol>
                    </div>
                    <div className="pt-4">
                        <a
                            href={`/products/${productSlug}`}
                            className="inline-block bg-sme-gold hover:bg-sme-gold/90 text-black px-6 py-3 rounded font-bold transition-colors"
                        >
                            Return to Product Page
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}
