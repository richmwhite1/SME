"use client";

import { useState } from "react";
import { ChevronRight, Check } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import CloudinaryUploadWidget from "./CloudinaryUploadWidget";
import PhotoGrid from "./PhotoGrid";
import { submitProductWizard } from "@/app/actions/submit-product-wizard";
import { useRouter } from "next/navigation";

const CATEGORIES = [
    "Survivalist",
    "Detox",
    "Brain Fog",
    "Vitality",
    "Sleep",
    "Gut Health",
    "Hormones",
    "Performance",
    "Weight Loss",
    "Recovery",
];

const MAX_PHOTOS = 10;

// Schema Definition matching Server Action but optimized for Form State
const wizardSchema = z.object({
    name: z.string().min(1, "Product name is required"),
    category: z.string().min(1, "Category is required"),
    company_blurb: z.string().min(10, "Company blurb must be at least 10 characters"),
    product_photos: z.array(z.string().url()).max(MAX_PHOTOS, "Maximum 10 photos allowed"),
    youtube_link: z.string()
        .refine((val) => {
            if (!val || val.trim() === "") return true;
            return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/.test(val);
        }, { message: "Must be a valid YouTube URL" })
        .optional(),
    tech_docs: z.array(z.string()).max(10), // simplified for UI state
    technical_specs: z.array(z.object({
        key: z.string(),
        value: z.string()
    })),
    sme_signals: z.record(z.string(), z.any())
});

type WizardFormValues = z.infer<typeof wizardSchema>;

export default function ProductWizardV2() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const form = useForm<WizardFormValues>({
        resolver: zodResolver(wizardSchema),
        defaultValues: {
            name: "",
            category: "",
            company_blurb: "",
            product_photos: [],
            youtube_link: "",
            tech_docs: [],
            technical_specs: [],
            sme_signals: {}
        },
        mode: "onChange"
    });

    const { register, trigger, setValue, watch, formState: { errors } } = form;

    // Watch complex values for rendering
    const photos = watch("product_photos");
    const techDocs = watch("tech_docs");
    const smeSignals = watch("sme_signals");
    const technicalSpecs = watch("technical_specs");

    const handlePhotoUpload = (url: string) => {
        if (photos.length < MAX_PHOTOS) {
            setValue("product_photos", [...photos, url], { shouldValidate: true });
        }
    };

    const handlePhotoDelete = (index: number) => {
        setValue("product_photos", photos.filter((_, i) => i !== index));
    };

    const handlePhotoReorder = (fromIndex: number, toIndex: number) => {
        const updated = [...photos];
        const [moved] = updated.splice(fromIndex, 1);
        updated.splice(toIndex, 0, moved);
        setValue("product_photos", updated);
    };

    const handleAddTechDoc = () => {
        if (techDocs.length < 10) {
            setValue("tech_docs", [...techDocs, ""]);
        }
    };

    const handleUpdateTechDoc = (index: number, value: string) => {
        const updated = [...techDocs];
        updated[index] = value;
        setValue("tech_docs", updated);
    };

    const handleRemoveTechDoc = (index: number) => {
        setValue("tech_docs", techDocs.filter((_, i) => i !== index));
    };

    const handleNext = async () => {
        let fieldsToValidate: (keyof WizardFormValues)[] = [];

        switch (step) {
            case 1:
                fieldsToValidate = ["name", "category", "company_blurb"];
                break;
            case 2:
                fieldsToValidate = ["product_photos", "youtube_link", "tech_docs"];
                break;
            case 3:
                // Tech specs are optional in previous code, but let's validate struct if needed
                fieldsToValidate = ["technical_specs"];
                break;
            case 4:
                // Signals validation if any
                break;
        }

        const isValid = await trigger(fieldsToValidate);

        if (isValid) {
            setSubmitError(null);
            setStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        setSubmitError(null);
        setStep(prev => prev - 1);
    };

    const onSubmit = async (data: WizardFormValues) => {
        setIsSubmitting(true);
        setSubmitError(null);

        try {
            // Transform specs array to record
            const specsObject = data.technical_specs.reduce((acc, spec) => {
                if (spec.key.trim() && spec.value.trim()) {
                    acc[spec.key.trim()] = spec.value.trim();
                }
                return acc;
            }, {} as Record<string, string>);

            const result = await submitProductWizard({
                name: data.name,
                category: data.category,
                company_blurb: data.company_blurb,
                product_photos: data.product_photos,
                youtube_link: data.youtube_link || null,
                tech_docs: data.tech_docs.filter(doc => doc.trim() !== ""),
                technical_specs: specsObject,
                sme_signals: data.sme_signals,
            });

            if (result.success) {
                router.push("/products");
                router.refresh();
            } else {
                setSubmitError(result.error || "Failed to submit product");
            }
        } catch (err) {
            setSubmitError("An unexpected error occurred");
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-[#e5e5e5] font-mono p-4 md:p-8 flex items-center justify-center">
            <div className="w-full max-w-4xl border border-[#333] bg-[#111] shadow-2xl relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-4 right-4 border border-emerald-900/30 text-emerald-900/30 px-2 py-1 text-xs rotate-12 pointer-events-none select-none">
                    PRODUCT INTAKE
                </div>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-900/50 via-emerald-500/50 to-emerald-900/50" />

                <div className="p-8">
                    <header className="mb-8 border-b border-[#333] pb-4 flex justify-between items-end">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-emerald-500 uppercase">
                                Product Onboarding
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Submit Your Product for SME Review
                            </p>
                        </div>
                        <div className="text-xs text-gray-600">STEP {step} OF 4</div>
                    </header>

                    {submitError && (
                        <div className="mb-6 p-4 border border-red-500/50 bg-red-900/10 text-red-400">
                            {submitError}
                        </div>
                    )}

                    {/* We submit via handleSubmit(onSubmit) but triggered by button */}
                    <form onSubmit={(e) => e.preventDefault()} className="space-y-6">

                        {/* STEP 1: THE NARRATIVE */}
                        <div className={step === 1 ? "block animate-in fade-in slide-in-from-right-4 duration-300" : "hidden"}>
                            <h2 className="text-xl font-semibold text-white uppercase tracking-wider mb-4 border-l-2 border-emerald-500 pl-4">
                                I. The Narrative
                            </h2>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-wider text-gray-500">
                                        Product Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        {...register("name")}
                                        className="w-full bg-[#0a0a0a] border border-[#333] p-3 text-sm focus:border-emerald-500 focus:outline-none transition-colors placeholder:text-gray-700"
                                        placeholder="e.g., Neuro-Stack Alpha"
                                    />
                                    {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-wider text-gray-500">
                                        Primary Category <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        {...register("category")}
                                        className="w-full bg-[#0a0a0a] border border-[#333] p-3 text-sm focus:border-emerald-500 focus:outline-none transition-colors text-gray-300"
                                    >
                                        <option value="">Select Category...</option>
                                        {CATEGORIES.map((cat) => (
                                            <option key={cat} value={cat}>
                                                {cat}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.category && <p className="text-red-500 text-xs">{errors.category.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-wider text-gray-500">
                                        Company Blurb: Mission & Story{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        {...register("company_blurb")}
                                        className="w-full bg-[#0a0a0a] border border-[#333] p-3 text-sm focus:border-emerald-500 focus:outline-none transition-colors placeholder:text-gray-700 min-h-[200px]"
                                        placeholder="Tell us about your product's mission, story, and what makes it unique..."
                                    />
                                    <div className="flex justify-between">
                                        <p className="text-red-500 text-xs">{errors.company_blurb?.message}</p>
                                        <p className="text-xs text-gray-600">
                                            {watch("company_blurb")?.length || 0} characters
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* STEP 2: MEDIA ASSETS */}
                        <div className={step === 2 ? "block animate-in fade-in slide-in-from-right-4 duration-300" : "hidden"}>
                            <h2 className="text-xl font-semibold text-white uppercase tracking-wider mb-4 border-l-2 border-emerald-500 pl-4">
                                II. Media Assets
                            </h2>
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs uppercase tracking-wider text-gray-500">
                                            Product Photos ({photos.length}/{MAX_PHOTOS})
                                        </label>
                                        <CloudinaryUploadWidget
                                            onUpload={handlePhotoUpload}
                                            maxPhotos={MAX_PHOTOS}
                                            currentCount={photos.length}
                                        />
                                    </div>
                                    <PhotoGrid
                                        photos={photos}
                                        onDelete={handlePhotoDelete}
                                        onReorder={handlePhotoReorder}
                                    />
                                    {errors.product_photos && <p className="text-red-500 text-xs">{errors.product_photos.message}</p>}
                                    <p className="text-xs text-gray-600">
                                        Photos will be automatically resized to 1200px width. Drag to reorder.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-wider text-gray-500">
                                        YouTube Link (Optional)
                                    </label>
                                    <input
                                        {...register("youtube_link")}
                                        className="w-full bg-[#0a0a0a] border border-[#333] p-3 text-sm focus:border-emerald-500 focus:outline-none transition-colors placeholder:text-gray-700"
                                        placeholder="https://youtube.com/... or https://youtu.be/..."
                                    />
                                    {errors.youtube_link && <p className="text-red-500 text-xs">{errors.youtube_link.message}</p>}
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs uppercase tracking-wider text-gray-500">
                                            Technical Documentation Links ({techDocs.length}/10)
                                        </label>
                                        {techDocs.length < 10 && (
                                            <button
                                                type="button"
                                                onClick={handleAddTechDoc}
                                                className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                                            >
                                                + Add Link
                                            </button>
                                        )}
                                    </div>
                                    {techDocs.length > 0 && (
                                        <div className="space-y-2">
                                            {techDocs.map((doc, index) => (
                                                <div key={index} className="flex gap-2">
                                                    <input
                                                        value={doc}
                                                        onChange={(e) => handleUpdateTechDoc(index, e.target.value)}
                                                        className="flex-1 bg-[#0a0a0a] border border-[#333] p-2 text-sm focus:border-emerald-500 focus:outline-none transition-colors placeholder:text-gray-700"
                                                        placeholder="https://example.com/documentation.pdf"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveTechDoc(index)}
                                                        className="bg-red-900/20 border border-red-500/50 px-3 text-red-400 hover:bg-red-900/40 transition-colors text-xs"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <p className="text-xs text-gray-600">
                                        Add links to PDFs, specs sheets, lab reports, or other technical documentation
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* STEP 3: TECHNICAL SPECS */}
                        <div className={step === 3 ? "block animate-in fade-in slide-in-from-right-4 duration-300" : "hidden"}>
                            <h2 className="text-xl font-semibold text-white uppercase tracking-wider mb-4 border-l-2 border-emerald-500 pl-4">
                                III. Technical Specifications
                            </h2>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <p className="text-xs text-gray-500">Key-Value specifications for comparison.</p>
                                    <button
                                        type="button"
                                        onClick={() => setValue("technical_specs", [...technicalSpecs, { key: "", value: "" }])}
                                        className="text-emerald-400 text-xs hover:text-emerald-300"
                                    >
                                        + Add Specification
                                    </button>
                                </div>

                                {technicalSpecs.map((spec, index) => (
                                    <div key={index} className="flex gap-2">
                                        <input
                                            placeholder="Spec Name (e.g. Weight)"
                                            value={spec.key}
                                            onChange={(e) => {
                                                const newSpecs = [...technicalSpecs];
                                                newSpecs[index].key = e.target.value;
                                                setValue("technical_specs", newSpecs);
                                            }}
                                            className="flex-1 bg-[#0a0a0a] border border-[#333] p-2 text-sm focus:border-emerald-500 focus:outline-none"
                                        />
                                        <input
                                            placeholder="Value (e.g. 50g)"
                                            value={spec.value}
                                            onChange={(e) => {
                                                const newSpecs = [...technicalSpecs];
                                                newSpecs[index].value = e.target.value;
                                                setValue("technical_specs", newSpecs);
                                            }}
                                            className="flex-1 bg-[#0a0a0a] border border-[#333] p-2 text-sm focus:border-emerald-500 focus:outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setValue("technical_specs", technicalSpecs.filter((_, i) => i !== index))}
                                            className="text-red-400 hover:text-red-300 px-2"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                                {technicalSpecs.length === 0 && (
                                    <p className="text-gray-700 text-sm italic py-4">No specifications added yet.</p>
                                )}
                            </div>
                        </div>

                        {/* STEP 4: TRUTH SIGNALS */}
                        <div className={step === 4 ? "block animate-in fade-in slide-in-from-right-4 duration-300" : "hidden"}>
                            <h2 className="text-xl font-semibold text-white uppercase tracking-wider mb-4 border-l-2 border-emerald-500 pl-4">
                                IV. Truth Signals
                            </h2>

                            <div className="mb-6 p-4 border border-emerald-900/30 bg-emerald-900/10 text-emerald-100 text-sm">
                                <p>Select applicable signals and provide evidence (PDF/Image) for verification.</p>
                            </div>

                            <div className="space-y-4">
                                {[
                                    { key: 'third_party_lab_verified', label: 'Third-Party Lab Verified', desc: 'Independent testing for purity/potency.' },
                                    { key: 'purity_tested', label: 'Purity Tested', desc: 'Free from contaminants like heavy metals.' },
                                    { key: 'source_transparency', label: 'Source Transparency', desc: 'Clear origin of ingredients.' },
                                    { key: 'potency_verified', label: 'Potency Verified', desc: 'Active ingredients match label claims.' },
                                    { key: 'excipient_audit', label: 'Excipient Audit', desc: 'All fillers/binders are clean and disclosed.' },
                                    { key: 'operational_legitimacy', label: 'Operational Legitimacy', desc: 'Company has verified business address/support.' },
                                ].map((signal) => {
                                    const isSelected = !!smeSignals[signal.key];
                                    const evidence = smeSignals[signal.key]?.evidence || '';

                                    return (
                                        <div key={signal.key} className={`p-4 border rounded transition-colors ${isSelected ? 'border-emerald-500/50 bg-emerald-900/10' : 'border-[#333] bg-[#0a0a0a]'}`}>
                                            <div className="flex items-start gap-3">
                                                <input
                                                    type="checkbox"
                                                    id={signal.key}
                                                    checked={isSelected}
                                                    onChange={() => {
                                                        const newSignals = { ...smeSignals };
                                                        if (isSelected) {
                                                            delete newSignals[signal.key];
                                                        } else {
                                                            newSignals[signal.key] = { verified: false, evidence: '' };
                                                        }
                                                        setValue("sme_signals", newSignals);
                                                    }}
                                                    className="mt-1 w-4 h-4 rounded border-gray-600 text-emerald-500 focus:ring-emerald-500 bg-gray-900"
                                                />
                                                <div className="flex-1">
                                                    <label htmlFor={signal.key} className="block font-medium text-white select-none">
                                                        {signal.label}
                                                    </label>
                                                    <p className="text-xs text-gray-400 mb-2">{signal.desc}</p>

                                                    {isSelected && (
                                                        <div className="mt-3 pl-4 border-l border-emerald-500/30">
                                                            <label className="text-xs uppercase tracking-wider text-emerald-400/80 mb-2 block">
                                                                Evidence Upload <span className="text-red-500">*</span>
                                                            </label>

                                                            {evidence ? (
                                                                <div className="flex items-center justify-between p-2 bg-black/40 border border-emerald-500/30 rounded">
                                                                    <a href={evidence} target="_blank" className="text-xs text-emerald-400 hover:underline truncate max-w-[200px]">
                                                                        View Documentation
                                                                    </a>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const newSignals = { ...smeSignals };
                                                                            newSignals[signal.key].evidence = '';
                                                                            setValue("sme_signals", newSignals);
                                                                        }}
                                                                        className="text-xs text-red-400 hover:text-red-300 ml-2"
                                                                    >
                                                                        Change
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <CloudinaryUploadWidget
                                                                    onUpload={(url) => {
                                                                        const newSignals = { ...smeSignals };
                                                                        newSignals[signal.key].evidence = url;
                                                                        setValue("sme_signals", newSignals);
                                                                    }}
                                                                    maxPhotos={1}
                                                                    currentCount={0}
                                                                />
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                    </form>

                    {/* NAVIGATION */}
                    <div className="flex justify-between pt-6 border-t border-[#333] mt-8">
                        {step > 1 ? (
                            <button
                                onClick={handleBack}
                                disabled={isSubmitting}
                                className="px-6 py-2 text-xs uppercase tracking-wider text-gray-500 hover:text-white transition-colors disabled:opacity-50"
                            >
                                Back
                            </button>
                        ) : (
                            <div />
                        )}

                        {step < 4 ? (
                            <button
                                onClick={handleNext}
                                className="flex items-center gap-2 bg-[#1a1a1a] border border-[#333] px-6 py-2 text-xs uppercase tracking-wider text-white hover:bg-emerald-900/20 hover:border-emerald-500/50 transition-all"
                            >
                                Next Step <ChevronRight className="w-3 h-3" />
                            </button>
                        ) : (
                            <button
                                onClick={form.handleSubmit(onSubmit)}
                                disabled={isSubmitting}
                                className="flex items-center gap-2 bg-emerald-600/10 border border-emerald-500/50 px-8 py-2 text-xs uppercase tracking-wider text-emerald-400 hover:bg-emerald-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? "Submitting..." : "Submit Product for Approval"}{" "}
                                <Check className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
