"use client";

import { useState, useEffect } from "react";
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
    technical_docs_url: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
    target_audience: z.string().min(1, "Target audience is required"),
    core_value_proposition: z.string().min(1, "Core value proposition is required"),
    technical_specs: z.array(z.object({
        key: z.string(),
        value: z.string()
    })),
    // NEW: Active Ingredients & Technical Specs
    active_ingredients: z.array(z.object({
        name: z.string().min(1, "Ingredient name is required"),
        dosage: z.string().min(1, "Dosage is required")
    })),
    third_party_lab_link: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
    excipients: z.array(z.string()),
    // NEW: Benefits (Step 3.5)
    benefits: z.array(z.object({
        title: z.string().min(1, "Benefit title is required"),
        type: z.enum(["anecdotal", "evidence_based"]),
        citation: z.string().url("Must be a valid URL").optional().or(z.literal(""))
    })).max(5, "Maximum 5 benefits allowed").refine(
        (benefits) => benefits.every(b =>
            b.type === "anecdotal" || (b.type === "evidence_based" && b.citation && b.citation.trim() !== "")
        ),
        { message: "Evidence-based benefits require a citation URL" }
    ),
    sme_access_notes: z.string().optional(),
    sme_signals: z.record(z.string(), z.object({
        verified: z.boolean().optional(),
        evidence: z.string().min(1, "Evidence documentation is required for this signal"),
    })),
    // Step 6: Brand Verification (was Step 5)
    is_brand_owner: z.boolean().default(false),
    work_email: z.string().email("Valid work email required").optional().or(z.literal("")),
    linkedin_profile: z.string()
        .refine((val) => {
            if (!val || val.trim() === "") return true;
            return /^https?:\/\/(www\.)?linkedin\.com\/.+/.test(val);
        }, { message: "Must be a valid LinkedIn profile URL" })
        .optional(),
    company_website: z.string().url("Must be a valid URL").optional().or(z.literal(""))
});

type WizardFormValues = z.infer<typeof wizardSchema>;

import { useProductWizardStore } from "@/lib/stores/product-wizard-store";

export default function ProductWizardV2() {
    const router = useRouter();
    const { data: storedData, updateData, setHasHydrated } = useProductWizardStore();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const form = useForm<WizardFormValues>({
        resolver: zodResolver(wizardSchema),
        defaultValues: {
            name: storedData.name || "",
            category: storedData.category || "",
            company_blurb: storedData.company_blurb || "",
            product_photos: storedData.product_photos || [],
            youtube_link: storedData.video_url || "",
            technical_docs_url: storedData.technical_docs_url || "",
            target_audience: storedData.target_audience || "",
            core_value_proposition: storedData.core_value_proposition || "",
            technical_specs: storedData.technical_specs || [],
            active_ingredients: storedData.active_ingredients || [],
            third_party_lab_link: storedData.third_party_lab_link || "",
            excipients: storedData.excipients || [],
            benefits: storedData.benefits || [],
            sme_access_notes: storedData.sme_access_note || "",
            sme_signals: storedData.sme_signals || {},
            is_brand_owner: storedData.is_brand_owner || false,
            work_email: storedData.work_email || "",
            linkedin_profile: storedData.linkedin_profile || "",
            company_website: storedData.company_website || ""
        },
        mode: "onChange"
    });

    // Hydrate store on mount
    useEffect(() => {
        useProductWizardStore.persist.rehydrate();
        setHasHydrated(true);
    }, [setHasHydrated]);

    // Persist form changes
    const formValues = form.watch();
    useEffect(() => {
        const subscription = form.watch((value) => {
            updateData(value as any);
        });
        return () => subscription.unsubscribe();
    }, [form.watch, updateData]);

    const { register, trigger, setValue, watch, formState: { errors } } = form;

    // Watch complex values for rendering
    const photos = watch("product_photos");
    const smeSignals = watch("sme_signals");
    const technicalSpecs = watch("technical_specs");
    const activeIngredients = watch("active_ingredients");
    const excipients = watch("excipients");
    const benefits = watch("benefits");

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



    const handleNext = async () => {
        let fieldsToValidate: (keyof WizardFormValues)[] = [];

        switch (step) {
            case 1:
                fieldsToValidate = ["name", "category", "company_blurb"];
                break;
            case 2:
                fieldsToValidate = ["product_photos", "youtube_link", "technical_docs_url"];
                break;
            case 3:
                fieldsToValidate = ["target_audience", "core_value_proposition", "technical_specs", "active_ingredients", "third_party_lab_link", "excipients", "sme_access_notes"];
                break;
            case 4:
                // Benefits validation
                fieldsToValidate = ["benefits"];
                break;
            case 5:
                // Signals validation if any
                break;
            case 6:
                // Brand verification validation
                const isBrandOwner = watch("is_brand_owner");
                if (isBrandOwner) {
                    fieldsToValidate = ["work_email", "linkedin_profile", "company_website"];
                }
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
                technical_docs_url: data.technical_docs_url || null,
                target_audience: data.target_audience,
                core_value_proposition: data.core_value_proposition,
                technical_specs: specsObject,
                sme_access_notes: data.sme_access_notes || null,
                sme_signals: data.sme_signals,
                // Brand verification fields
                is_brand_owner: data.is_brand_owner,
                work_email: data.work_email || "",
                linkedin_profile: data.linkedin_profile || "",
                company_website: data.company_website || "",
            });

            if (result.success) {
                // If brand verification requires payment, redirect to Stripe
                if (result.requiresPayment && result.checkoutUrl) {
                    window.location.href = result.checkoutUrl;
                    return;
                }

                // Show warning if there was an issue with verification
                if (result.warning) {
                    setSubmitError(result.warning);
                    setTimeout(() => {
                        router.push("/products");
                        router.refresh();
                    }, 3000);
                } else {
                    router.push("/products");
                    router.refresh();
                }
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
                        <div className="text-xs text-gray-600">STEP {step} OF 6</div>
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

                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-wider text-gray-500">
                                        Technical Documentation Link (Optional)
                                    </label>
                                    <input
                                        {...register("technical_docs_url")}
                                        className="w-full bg-[#0a0a0a] border border-[#333] p-3 text-sm focus:border-emerald-500 focus:outline-none transition-colors placeholder:text-gray-700"
                                        placeholder="https://example.com/specs.pdf"
                                    />
                                    {errors.technical_docs_url && <p className="text-red-500 text-xs">{errors.technical_docs_url.message}</p>}
                                </div>
                            </div>
                        </div>

                        {/* STEP 3: TECHNICAL SPECS */}
                        <div className={step === 3 ? "block animate-in fade-in slide-in-from-right-4 duration-300" : "hidden"}>
                            <h2 className="text-xl font-semibold text-white uppercase tracking-wider mb-4 border-l-2 border-emerald-500 pl-4">
                                III. Technical Specifications
                            </h2>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-wider text-gray-500">
                                        Target Audience <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        {...register("target_audience")}
                                        className="w-full bg-[#0a0a0a] border border-[#333] p-3 text-sm focus:border-emerald-500 focus:outline-none transition-colors placeholder:text-gray-700"
                                        placeholder="Who is this product for?"
                                    />
                                    {errors.target_audience && <p className="text-red-500 text-xs">{errors.target_audience.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-wider text-gray-500">
                                        Core Value Proposition <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        {...register("core_value_proposition")}
                                        className="w-full bg-[#0a0a0a] border border-[#333] p-3 text-sm focus:border-emerald-500 focus:outline-none transition-colors placeholder:text-gray-700 min-h-[100px]"
                                        placeholder="What is the main benefit or promise?"
                                    />
                                    {errors.core_value_proposition && <p className="text-red-500 text-xs">{errors.core_value_proposition.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs uppercase tracking-wider text-gray-500">
                                            Technical Specifications
                                        </label>
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

                                {/* Active Ingredients */}
                                <div className="space-y-2 pt-4 border-t border-[#333]">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs uppercase tracking-wider text-gray-500">
                                            Active Ingredients
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setValue("active_ingredients", [...activeIngredients, { name: "", dosage: "" }])}
                                            className="text-emerald-400 text-xs hover:text-emerald-300"
                                        >
                                            + Add Ingredient
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-600">
                                        List active ingredients with dosages. This helps calculate your SME Radar Chart scores.
                                    </p>

                                    {activeIngredients.map((ingredient, index) => (
                                        <div key={index} className="flex gap-2">
                                            <input
                                                placeholder="Ingredient (e.g. Curcumin)"
                                                value={ingredient.name}
                                                onChange={(e) => {
                                                    const newIngredients = [...activeIngredients];
                                                    newIngredients[index].name = e.target.value;
                                                    setValue("active_ingredients", newIngredients);
                                                }}
                                                className="flex-1 bg-[#0a0a0a] border border-[#333] p-2 text-sm focus:border-emerald-500 focus:outline-none"
                                            />
                                            <input
                                                placeholder="Dosage (e.g. 500mg)"
                                                value={ingredient.dosage}
                                                onChange={(e) => {
                                                    const newIngredients = [...activeIngredients];
                                                    newIngredients[index].dosage = e.target.value;
                                                    setValue("active_ingredients", newIngredients);
                                                }}
                                                className="flex-1 bg-[#0a0a0a] border border-[#333] p-2 text-sm focus:border-emerald-500 focus:outline-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setValue("active_ingredients", activeIngredients.filter((_, i) => i !== index))}
                                                className="text-red-400 hover:text-red-300 px-2"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                    {activeIngredients.length === 0 && (
                                        <p className="text-gray-700 text-sm italic py-4">No active ingredients added yet.</p>
                                    )}
                                </div>

                                {/* Third-Party Lab Link */}
                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-wider text-gray-500">
                                        Third-Party Lab Testing Link (Optional)
                                    </label>
                                    <input
                                        {...register("third_party_lab_link")}
                                        className="w-full bg-[#0a0a0a] border border-[#333] p-3 text-sm focus:border-emerald-500 focus:outline-none transition-colors placeholder:text-gray-700"
                                        placeholder="https://example.com/lab-results.pdf"
                                    />
                                    {errors.third_party_lab_link && <p className="text-red-500 text-xs">{errors.third_party_lab_link.message}</p>}
                                    <p className="text-xs text-gray-600">
                                        Link to independent laboratory testing results (COA, purity tests, etc.)
                                    </p>
                                </div>

                                {/* Excipients (Fillers) */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs uppercase tracking-wider text-gray-500">
                                            Excipients / Fillers (Optional)
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newExcipient = prompt("Enter excipient/filler name:");
                                                if (newExcipient && newExcipient.trim()) {
                                                    setValue("excipients", [...excipients, newExcipient.trim()]);
                                                }
                                            }}
                                            className="text-emerald-400 text-xs hover:text-emerald-300"
                                        >
                                            + Add Excipient
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-600">
                                        List all inactive ingredients, fillers, and binders for transparency.
                                    </p>

                                    {excipients.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {excipients.map((excipient, index) => (
                                                <div key={index} className="flex items-center gap-2 bg-[#0a0a0a] border border-[#333] px-3 py-1 rounded">
                                                    <span className="text-sm text-gray-300">{excipient}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setValue("excipients", excipients.filter((_, i) => i !== index))}
                                                        className="text-red-400 hover:text-red-300 text-xs"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {excipients.length === 0 && (
                                        <p className="text-gray-700 text-sm italic py-4">No excipients added yet.</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-wider text-gray-500">
                                        SME Access Notes (Optional)
                                    </label>
                                    <textarea
                                        {...register("sme_access_notes")}
                                        className="w-full bg-[#0a0a0a] border border-[#333] p-3 text-sm focus:border-emerald-500 focus:outline-none transition-colors placeholder:text-gray-700 min-h-[100px]"
                                        placeholder="Notes for the Subject Matter Expert (hidden from public)..."
                                    />
                                </div>
                            </div>
                        </div>


                        {/* STEP 4: POTENTIAL BENEFITS */}
                        <div className={step === 4 ? "block animate-in fade-in slide-in-from-right-4 duration-300" : "hidden"}>
                            <h2 className="text-xl font-semibold text-white uppercase tracking-wider mb-4 border-l-2 border-emerald-500 pl-4">
                                IV. Potential Benefits
                            </h2>

                            <div className="mb-6 p-4 border border-blue-900/30 bg-blue-900/10 text-blue-100 text-sm">
                                <p>List up to 5 potential benefits. Evidence-based benefits require a citation (study, research paper, etc.).</p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs uppercase tracking-wider text-gray-500">
                                        Benefits ({benefits.length}/5)
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (benefits.length < 5) {
                                                setValue("benefits", [...benefits, { title: "", type: "anecdotal", citation: "" }]);
                                            }
                                        }}
                                        disabled={benefits.length >= 5}
                                        className="text-emerald-400 text-xs hover:text-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        + Add Benefit
                                    </button>
                                </div>

                                {benefits.map((benefit, index) => (
                                    <div key={index} className="p-4 border border-[#333] bg-[#0a0a0a] rounded space-y-3">
                                        <div className="flex justify-between items-start">
                                            <span className="text-xs text-gray-500">Benefit #{index + 1}</span>
                                            <button
                                                type="button"
                                                onClick={() => setValue("benefits", benefits.filter((_, i) => i !== index))}
                                                className="text-red-400 hover:text-red-300 text-xs"
                                            >
                                                Remove
                                            </button>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs uppercase tracking-wider text-gray-500">
                                                Benefit Title <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                placeholder="e.g., Reduces inflammation"
                                                value={benefit.title}
                                                onChange={(e) => {
                                                    const newBenefits = [...benefits];
                                                    newBenefits[index].title = e.target.value;
                                                    setValue("benefits", newBenefits);
                                                }}
                                                className="w-full bg-black border border-[#444] p-2 text-sm focus:border-emerald-500 focus:outline-none"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs uppercase tracking-wider text-gray-500">
                                                Type <span className="text-red-500">*</span>
                                            </label>
                                            <div className="flex gap-4">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        checked={benefit.type === "anecdotal"}
                                                        onChange={() => {
                                                            const newBenefits = [...benefits];
                                                            newBenefits[index].type = "anecdotal";
                                                            newBenefits[index].citation = ""; // Clear citation when switching to anecdotal
                                                            setValue("benefits", newBenefits);
                                                        }}
                                                        className="w-4 h-4"
                                                    />
                                                    <span className="text-sm text-gray-300">Anecdotal</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        checked={benefit.type === "evidence_based"}
                                                        onChange={() => {
                                                            const newBenefits = [...benefits];
                                                            newBenefits[index].type = "evidence_based";
                                                            setValue("benefits", newBenefits);
                                                        }}
                                                        className="w-4 h-4"
                                                    />
                                                    <span className="text-sm text-gray-300">Evidence-Based</span>
                                                </label>
                                            </div>
                                        </div>

                                        {benefit.type === "evidence_based" && (
                                            <div className="space-y-2 pl-4 border-l-2 border-emerald-500/30">
                                                <label className="text-xs uppercase tracking-wider text-emerald-400/80">
                                                    Citation URL <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    placeholder="https://pubmed.ncbi.nlm.nih.gov/12345678/"
                                                    value={benefit.citation || ""}
                                                    onChange={(e) => {
                                                        const newBenefits = [...benefits];
                                                        newBenefits[index].citation = e.target.value;
                                                        setValue("benefits", newBenefits);
                                                    }}
                                                    className="w-full bg-black border border-emerald-500/30 p-2 text-sm focus:border-emerald-500 focus:outline-none"
                                                />
                                                <p className="text-xs text-gray-600">
                                                    Link to research study, clinical trial, or scientific publication
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {benefits.length === 0 && (
                                    <p className="text-gray-700 text-sm italic py-4">No benefits added yet. Click &quot;+ Add Benefit&quot; to get started.</p>
                                )}

                                {errors.benefits && (
                                    <p className="text-red-500 text-xs">{errors.benefits.message}</p>
                                )}
                            </div>
                        </div>

                        {/* STEP 5: TRUTH SIGNALS */}
                        <div className={step === 5 ? "block animate-in fade-in slide-in-from-right-4 duration-300" : "hidden"}>
                            <h2 className="text-xl font-semibold text-white uppercase tracking-wider mb-4 border-l-2 border-emerald-500 pl-4">
                                V. Truth Signals
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
                                                            {errors.sme_signals?.[signal.key]?.evidence && (
                                                                <p className="text-red-500 text-xs mt-1">
                                                                    {errors.sme_signals[signal.key]?.evidence?.message}
                                                                </p>
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

                        {/* STEP 6: BRAND VERIFICATION */}
                        <div className={step === 6 ? "block animate-in fade-in slide-in-from-right-4 duration-300" : "hidden"}>
                            <h2 className="text-xl font-semibold text-white uppercase tracking-wider mb-4 border-l-2 border-emerald-500 pl-4">
                                VI. Is This Your Brand?
                            </h2>

                            <div className="mb-6 p-4 border border-blue-900/30 bg-blue-900/10 text-blue-100 text-sm">
                                <p>If you represent this brand, verify your ownership to unlock premium features:</p>
                                <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
                                    <li>&quot;Buy It Now&quot; button on your product page</li>
                                    <li>Custom discount codes</li>
                                    <li>Eligibility for SME Certification ($3,000)</li>
                                    <li>Priority support</li>
                                </ul>
                                <p className="mt-3 font-semibold">Base subscription: $100/month</p>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center gap-3 p-4 border border-[#333] bg-[#0a0a0a] rounded">
                                    <input
                                        type="checkbox"
                                        id="is_brand_owner"
                                        {...register("is_brand_owner")}
                                        className="w-5 h-5 rounded border-gray-600 text-emerald-500 focus:ring-emerald-500 bg-gray-900"
                                    />
                                    <label htmlFor="is_brand_owner" className="text-white font-medium select-none cursor-pointer">
                                        Yes, I represent this brand and want to verify ownership
                                    </label>
                                </div>

                                {watch("is_brand_owner") && (
                                    <div className="space-y-4 pl-4 border-l-2 border-emerald-500/30">
                                        <div className="space-y-2">
                                            <label className="text-xs uppercase tracking-wider text-gray-500">
                                                Work Email <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                {...register("work_email")}
                                                type="email"
                                                className="w-full bg-[#0a0a0a] border border-[#333] p-3 text-sm focus:border-emerald-500 focus:outline-none transition-colors placeholder:text-gray-700"
                                                placeholder="your.name@company.com"
                                            />
                                            {errors.work_email && <p className="text-red-500 text-xs">{errors.work_email.message}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs uppercase tracking-wider text-gray-500">
                                                LinkedIn Profile <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                {...register("linkedin_profile")}
                                                className="w-full bg-[#0a0a0a] border border-[#333] p-3 text-sm focus:border-emerald-500 focus:outline-none transition-colors placeholder:text-gray-700"
                                                placeholder="https://linkedin.com/in/yourprofile"
                                            />
                                            {errors.linkedin_profile && <p className="text-red-500 text-xs">{errors.linkedin_profile.message}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs uppercase tracking-wider text-gray-500">
                                                Company Website <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                {...register("company_website")}
                                                className="w-full bg-[#0a0a0a] border border-[#333] p-3 text-sm focus:border-emerald-500 focus:outline-none transition-colors placeholder:text-gray-700"
                                                placeholder="https://yourcompany.com"
                                            />
                                            {errors.company_website && <p className="text-red-500 text-xs">{errors.company_website.message}</p>}
                                        </div>

                                        <div className="p-4 border border-yellow-900/30 bg-yellow-900/10 text-yellow-100 text-xs">
                                            <p className="font-semibold mb-2">Next Steps:</p>
                                            <ol className="list-decimal list-inside space-y-1">
                                                <li>Submit this form to create your product listing</li>
                                                <li>Complete payment ($100/month subscription)</li>
                                                <li>Admin will review your verification request</li>
                                                <li>Once approved, premium features will be activated</li>
                                            </ol>
                                        </div>
                                    </div>
                                )}

                                {!watch("is_brand_owner") && (
                                    <div className="p-4 border border-gray-700 bg-gray-900/20 text-gray-400 text-sm">
                                        <p>No problem! Your product will still be listed in our directory. You can verify ownership later from your dashboard.</p>
                                    </div>
                                )}
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

                        {step < 6 ? (
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
