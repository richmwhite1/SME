"use client";

import { useProductWizardStore, ProductWizardSchema } from "@/lib/stores/product-wizard-store";
import { ChevronRight, Check, AlertTriangle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import Step1Foundation from "./steps/Step1Foundation";
import Step2Configuration from "./steps/Step2Configuration";
import Step3Integration from "./steps/Step3Integration";
import Step4TruthSignals from "./steps/Step4TruthSignals";
import { Step1Schema, Step2Schema, Step3Schema, Step4Schema } from "@/lib/stores/product-wizard-store";

export default function ProductWizardContainer() {
    const { currentStep, setStep, data, isSubmitting, setSubmitting, setError, submissionError, resetWizard, _hasHydrated } = useProductWizardStore();
    const router = useRouter();

    const handleNext = () => {
        // Step-specific validation against store data
        let schema;
        switch (currentStep) {
            case 1: schema = Step1Schema; break;
            case 2: schema = Step2Schema; break;
            case 3: schema = Step3Schema; break;
            case 4: schema = Step4Schema; break;
        }

        // Filter empty specs before validation to avoid "ghost" errors
        const cleanData = { ...data };
        if (cleanData.technical_specs) {
            cleanData.technical_specs = cleanData.technical_specs.filter(
                s => s.key?.trim() !== "" || s.value?.trim() !== ""
            );
        }

        // Sanitize optional URLs
        if (typeof cleanData.technical_docs_url === 'string') {
            cleanData.technical_docs_url = cleanData.technical_docs_url.trim();
        }
        if (typeof cleanData.video_url === 'string') {
            cleanData.video_url = cleanData.video_url.trim();
        }

        if (schema) {
            const result = schema.safeParse(cleanData);
            if (!result.success) {
                console.error("Validation failed for step", currentStep, result.error);
                setError("Please correct the errors in the current step before proceeding.");
                return;
            }
        }

        setError(null);
        setStep(currentStep + 1);
    };

    const handleBack = () => {
        setError(null);
        setStep(currentStep - 1);
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        setError(null);

        // 1. Final Validation with cleanup
        const cleanData = { ...data };
        if (cleanData.technical_specs) {
            cleanData.technical_specs = cleanData.technical_specs.filter(
                s => s.key?.trim() !== "" || s.value?.trim() !== ""
            );
        }

        // Sanitize optional URLs
        if (typeof cleanData.technical_docs_url === 'string') {
            cleanData.technical_docs_url = cleanData.technical_docs_url.trim();
        }
        if (typeof cleanData.video_url === 'string') {
            cleanData.video_url = cleanData.video_url.trim();
        }

        const result = ProductWizardSchema.safeParse(cleanData);
        if (!result.success) {
            console.error("Validation errors:", result.error.errors);
            setError("Please correct the errors in previous steps before submitting.");
            setSubmitting(false);
            return;
        }

        // 2. Prepare FormData
        const formData = new FormData();
        formData.append("name", cleanData.name || "");
        formData.append("category", cleanData.category || "");
        formData.append("tagline", cleanData.tagline || "");
        formData.append("company_blurb", cleanData.company_blurb || "");
        formData.append("product_photos", JSON.stringify(cleanData.product_photos || []));
        formData.append("video_url", cleanData.video_url || "");
        formData.append("technical_docs_url", cleanData.technical_docs_url || "");
        formData.append("target_audience", cleanData.target_audience || "");
        formData.append("core_value_proposition", cleanData.core_value_proposition || "");
        formData.append("technical_specs", JSON.stringify(cleanData.technical_specs || []));
        formData.append("sme_access_note", cleanData.sme_access_note || "");
        formData.append("sme_signals", JSON.stringify(cleanData.sme_signals || {}));

        try {
            // Dynamic import to avoid build-time issues if action file isn't ready
            const { submitProductWizard } = await import("@/app/actions/product-wizard-submit");

            const response = await submitProductWizard(formData);

            if (response.success) {
                resetWizard();
                router.push(`/products/${response.slug}`);
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (!_hasHydrated) {
        // Show loading skeleton with same structure to prevent hydration mismatch
        return (
            <div className="min-h-screen bg-[#0a0a0a] text-[#e5e5e5] font-mono p-4 md:p-8 flex items-center justify-center">
                <div className="w-full max-w-4xl border border-[#333] bg-[#111] shadow-2xl relative overflow-hidden min-h-[600px] flex flex-col">
                    <div className="p-8 border-b border-[#333] flex justify-between items-end bg-[#0f0f0f]">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-emerald-500 uppercase">Product Onboarding</h1>
                            <p className="text-sm text-gray-500 mt-1">Wizard v2.0 // Initializing...</p>
                        </div>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4].map(s => (
                                <div key={s} className="h-2 w-8 rounded-full bg-[#333]" />
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 p-8 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-[#e5e5e5] font-mono p-4 md:p-8 flex items-center justify-center">
            <div className="w-full max-w-4xl border border-[#333] bg-[#111] shadow-2xl relative overflow-hidden min-h-[600px] flex flex-col">

                {/* Header */}
                <div className="p-8 border-b border-[#333] flex justify-between items-end bg-[#0f0f0f]">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-emerald-500 uppercase">Product Onboarding</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            {currentStep === 1 && "Step 1: The Foundation (Marketing & Core)"}
                            {currentStep === 2 && "Step 2: Visuals & Media (Show, Don't Tell)"}
                            {currentStep === 3 && "Step 3: SME Assessment Prep (Technical)"}
                            {currentStep === 4 && "Step 4: Truth Signals (Evidence)"}
                        </p>
                    </div>
                    <div className="flex gap-1">
                        {[1, 2, 3, 4].map(s => (
                            <div key={s} className={`h-2 w-8 rounded-full transition-all ${s <= currentStep ? 'bg-emerald-500' : 'bg-[#333]'}`} />
                        ))}
                    </div>
                </div>

                {/* Error Banner */}
                {submissionError && (
                    <div className="bg-red-900/20 border-b border-red-500/30 p-4 text-red-500 flex items-center gap-2 text-sm">
                        <AlertTriangle className="w-4 h-4" /> {submissionError}
                    </div>
                )}

                {/* Content Area */}
                <div className="flex-1 p-8">
                    {currentStep === 1 && <Step1Foundation />}
                    {currentStep === 2 && <Step2Configuration />}
                    {currentStep === 3 && <Step3Integration />}
                    {currentStep === 4 && <Step4TruthSignals />}
                </div>

                {/* Footer Navigation */}
                <div className="p-8 border-t border-[#333] flex justify-between bg-[#0f0f0f]">
                    <button
                        onClick={handleBack}
                        disabled={currentStep === 1}
                        className="px-6 py-2 text-xs uppercase tracking-wider text-gray-500 hover:text-white transition-colors disabled:opacity-30 disabled:hover:text-gray-500"
                    >
                        Back
                    </button>

                    {currentStep < 4 ? (
                        <button
                            onClick={handleNext}
                            className="flex items-center gap-2 bg-[#1a1a1a] border border-[#333] px-6 py-2 text-xs uppercase tracking-wider text-white hover:bg-emerald-900/20 hover:border-emerald-500/50 transition-all"
                        >
                            Next Step <ChevronRight className="w-3 h-3" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="flex items-center gap-2 bg-emerald-600/10 border border-emerald-500/50 px-8 py-2 text-xs uppercase tracking-wider text-emerald-400 hover:bg-emerald-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                            {isSubmitting ? "Processing..." : "Submit Product for Approval"}
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
}
