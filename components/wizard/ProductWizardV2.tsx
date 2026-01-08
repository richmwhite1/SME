"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronRight, Check, Upload, Link as LinkIcon, Camera, Sparkles, FileText, FlaskConical, ShieldCheck, AlertCircle, ScanBarcode } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import CloudinaryUploadWidget from "./CloudinaryUploadWidget";
import PhotoGrid from "./PhotoGrid";
import { submitProductWizard } from "@/app/actions/submit-product-wizard";
import { analyzeProductLabel, analyzeProductUrl, lookupProductByBarcode } from "@/app/actions/analyze-product"; // NEW
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastContainer";

const CATEGORIES = [
    "Survivalist", "Detox", "Brain Fog", "Vitality", "Sleep", "Gut Health",
    "Hormones", "Performance", "Weight Loss", "Recovery"
];

const MAX_PHOTOS = 10;

// Reusing the same schema from V2
const wizardSchema = z.object({
    name: z.string().min(1, "Product name is required"),
    category: z.string().min(1, "Category is required"),
    company_blurb: z.string().min(10, "Company blurb must be at least 10 characters"),
    product_photos: z.array(z.string().url()).max(MAX_PHOTOS, "Maximum 10 photos allowed"),
    youtube_link: z.string().optional().or(z.literal("")),
    technical_docs_url: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
    target_audience: z.string().min(1, "Target audience is required"),
    core_value_proposition: z.string().min(1, "Core value proposition is required"),
    technical_specs: z.array(z.object({
        key: z.string(),
        value: z.string()
    })),
    active_ingredients: z.array(z.object({
        name: z.string().min(1, "Ingredient name is required"),
        dosage: z.string().min(1, "Dosage is required")
    })),
    third_party_lab_link: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
    excipients: z.array(z.string()),
    benefits: z.array(z.object({
        title: z.string().min(1, "Benefit title is required"),
        type: z.enum(["anecdotal", "evidence_based"]),
        citation: z.string().optional()
    })).max(5, "Maximum 5 benefits allowed"),
    sme_access_notes: z.string().optional(),
    sme_signals: z.record(z.string(), z.object({
        verified: z.boolean().optional(),
        evidence: z.string().min(1, "Evidence documentation is required"),
    })),
    is_brand_owner: z.boolean().default(false),
    work_email: z.string().optional().or(z.literal("")),
    linkedin_profile: z.string().optional().or(z.literal("")),
    company_website: z.string().optional().or(z.literal("")),
    barcode: z.string().optional(), // NEW
});

type WizardFormValues = z.infer<typeof wizardSchema>;

const SECTIONS = [
    { id: "narrative", label: "The Narrative", icon: FileText },
    { id: "media", label: "Media Assets", icon: Camera },
    { id: "specs", label: "Technical Specs", icon: FlaskConical },
    { id: "benefits", label: "Potential Benefits", icon: Sparkles },
    { id: "signals", label: "Truth Signals", icon: ShieldCheck },
    { id: "verification", label: "Brand Verification", icon: Check },
];

export default function ProductWizardV2() {
    const router = useRouter();
    const { showToast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [activeSection, setActiveSection] = useState("narrative");
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
    const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false); // NEW

    // Refs for scrolling
    const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

    const form = useForm<WizardFormValues>({
        resolver: zodResolver(wizardSchema),
        defaultValues: {
            name: "",
            category: "",
            company_blurb: "",
            product_photos: [],
            youtube_link: "",
            technical_docs_url: "",
            target_audience: "",
            core_value_proposition: "",
            technical_specs: [],
            active_ingredients: [],
            third_party_lab_link: "",
            excipients: [],
            benefits: [],
            sme_access_notes: "",
            sme_signals: {},
            is_brand_owner: false,
            work_email: "",
            linkedin_profile: "",
            company_website: "",
            barcode: "",
        },
        mode: "onChange"
    });

    const { register, setValue, watch, handleSubmit, formState: { errors } } = form;

    // ScrollSpy Logic
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setActiveSection(entry.target.id);
                }
            });
        }, { threshold: 0.3, rootMargin: "-20% 0px -50% 0px" });

        Object.values(sectionRefs.current).forEach(el => {
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, []);

    const scrollToSection = (id: string) => {
        sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
        setActiveSection(id);
    };

    // Helper to safely merge AI data
    const mergeAIResult = (data: Partial<WizardFormValues>) => {
        (Object.keys(data) as Array<keyof WizardFormValues>).forEach(key => {
            const val = data[key];
            if (!val) return;

            // 1. Data Cleaning: Technical Specs (Handle Object -> Array mismatch)
            if (key === 'technical_specs') {
                if (Array.isArray(val)) {
                    setValue(key, val as any, { shouldValidate: true });
                } else if (typeof val === 'object') {
                    const specsArray = Object.entries(val).map(([k, v]) => ({ key: k, value: String(v) }));
                    setValue(key, specsArray, { shouldValidate: true });
                }
                return;
            }

            // 2. Data Cleaning: Arrays (Ensure they are actually arrays)
            if (['product_photos', 'active_ingredients', 'excipients', 'benefits'].includes(key)) {
                if (Array.isArray(val)) {
                    setValue(key, val as any, { shouldValidate: true });
                }
                return;
            }

            // 3. Data Cleaning: SME Signals (Merge with existing)
            if (key === 'sme_signals' && typeof val === 'object') {
                const currentSignals = form.getValues('sme_signals') || {};
                setValue('sme_signals', { ...currentSignals, ...val as any }, { shouldValidate: true });
                return;
            }

            // 4. Default Primitives
            setValue(key, val as any, { shouldValidate: true });
        });
    };

    // AI Analysis Handlers
    const handleLabelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsAnalyzing(true);
        const formData = new FormData();
        formData.append("label", file);

        try {
            const result = await analyzeProductLabel(formData);
            if (result.success && result.data) {
                mergeAIResult(result.data);
                showToast("Product data extracted from label!", "success");
            } else {
                showToast(result.error || "Failed to analyze label", "error");
            }
        } catch (err) {
            console.error(err);
            showToast("Error analyzing label", "error");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleUrlImport = async (url: string) => {
        setIsSubmitting(false); // Reset submit state just in case
        setIsAnalyzing(true);
        try {
            showToast("Scraping URL & Extracting Data...", "info");
            const result = await analyzeProductUrl(url);

            if (result.success && result.data) {
                mergeAIResult(result.data);
                showToast("Product data extracted from URL!", "success");
                setIsUrlModalOpen(false);
            } else {
                showToast(result.error || "Failed to analyze URL", "error");
            }
        } catch (e) {
            console.error(e);
            showToast("Error analyzing URL", "error");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleBarcodeLookup = async (barcode: string) => {
        setIsSubmitting(false);
        setIsAnalyzing(true);
        try {
            showToast("Looking up Barcode...", "info");
            const result = await lookupProductByBarcode(barcode);

            if (result.success && result.data) {
                mergeAIResult(result.data);
                setValue('barcode', barcode);
                showToast("Product data found via Barcode!", "success");
                setIsBarcodeModalOpen(false);
            } else {
                showToast(result.error || "Barcode lookup failed", "error");
            }
        } catch (e) {
            console.error(e);
            showToast("Error looking up barcode", "error");
        } finally {
            setIsAnalyzing(false);
        }
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
                ...data,
                technical_specs: specsObject
            });

            if (result.success) {
                if (result.requiresPayment && result.checkoutUrl) {
                    window.location.href = result.checkoutUrl;
                } else {
                    router.push("/products");
                    router.refresh();
                }
            } else {
                setSubmitError(result.error || "Failed to submit product");
            }
        } catch (err) {
            console.error(err);
            setSubmitError("An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Watchers
    const photos = watch("product_photos");
    const activeIngredients = watch("active_ingredients");
    const technicalSpecs = watch("technical_specs");
    const benefits = watch("benefits");
    const excipients = watch("excipients");
    const smeSignals = watch("sme_signals");

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-[#e5e5e5] font-mono">

            {/* SMART START HERO */}
            <div className="bg-gradient-to-b from-emerald-900/30 to-[#0a0a0a] border-b border-[#333] pt-12 pb-8 px-6">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-end gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/40 text-emerald-400 text-xs font-semibold mb-4 border border-emerald-800">
                            <Sparkles className="w-3 h-3" /> AI-POWERED INTAKE
                        </div>
                        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Product Onboarding</h1>
                        <p className="text-gray-400 max-w-xl">
                            Auto-fill this form by uploading your product label or pasting a link.
                            Our AI extracts ingredients, benefits, and specs instantly.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <div className="relative group">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleLabelUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                disabled={isAnalyzing}
                            />
                            <button disabled={isAnalyzing} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 rounded font-semibold transition-all shadow-lg shadow-emerald-900/20">
                                {isAnalyzing ? <span className="animate-spin">⏳</span> : <Upload className="w-4 h-4" />}
                                {isAnalyzing ? "Analyzing..." : "Upload Label"}
                            </button>
                        </div>

                        {/* URL Import Modal */}
                        {isUrlModalOpen && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                                <div className="bg-[#111] border border-[#333] rounded-lg w-full max-w-lg shadow-2xl overflow-hidden">
                                    <div className="bg-[#0a0a0a] border-b border-[#333] px-6 py-4 flex justify-between items-center">
                                        <h3 className="text-white font-bold flex items-center gap-2">
                                            <LinkIcon className="w-4 h-4 text-emerald-500" />
                                            Import from URL
                                        </h3>
                                        <button onClick={() => setIsUrlModalOpen(false)} className="text-gray-500 hover:text-white transition-colors">×</button>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <p className="text-sm text-gray-400">
                                            Paste a product page URL (e.g. Amazon, Shopify, or Brand site). Our AI will scrape and extract key details.
                                        </p>
                                        <input
                                            autoFocus
                                            placeholder="https://example.com/products/neuro-vance"
                                            className="w-full bg-[#000] border border-[#333] p-3 text-white rounded focus:border-emerald-500 outline-none"
                                            onKeyDown={async (e) => {
                                                if (e.key === 'Enter') {
                                                    const target = e.target as HTMLInputElement;
                                                    if (target.value) handleUrlImport(target.value);
                                                }
                                            }}
                                            id="url-input-modal"
                                        />
                                        <div className="flex justify-end gap-3 pt-2">
                                            <button onClick={() => setIsUrlModalOpen(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
                                            <button
                                                onClick={() => {
                                                    const input = document.getElementById('url-input-modal') as HTMLInputElement;
                                                    if (input?.value) handleUrlImport(input.value);
                                                }}
                                                disabled={isAnalyzing}
                                                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded flex items-center gap-2"
                                            >
                                                {isAnalyzing ? "Scanning..." : "Import Product"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={() => setIsUrlModalOpen(true)}
                            className="flex items-center gap-2 bg-[#222] hover:bg-[#333] border border-[#444] text-gray-300 px-5 py-3 rounded font-semibold transition-all"
                        >
                            <LinkIcon className="w-4 h-4" />
                            Paste URL
                        </button>

                        {/* Barcode Modal */}
                        {isBarcodeModalOpen && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                                <div className="bg-[#111] border border-[#333] rounded-lg w-full max-w-lg shadow-2xl overflow-hidden">
                                    <div className="bg-[#0a0a0a] border-b border-[#333] px-6 py-4 flex justify-between items-center">
                                        <h3 className="text-white font-bold flex items-center gap-2">
                                            <ScanBarcode className="w-4 h-4 text-emerald-500" />
                                            Scan Barcode
                                        </h3>
                                        <button onClick={() => setIsBarcodeModalOpen(false)} className="text-gray-500 hover:text-white transition-colors">×</button>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <p className="text-sm text-gray-400">
                                            Enter the product barcode (UPC/EAN) to fetch verified data from standard databases.
                                        </p>
                                        <input
                                            autoFocus
                                            placeholder="e.g. 058449401018"
                                            className="w-full bg-[#000] border border-[#333] p-3 text-white rounded focus:border-emerald-500 outline-none font-mono tracking-wider"
                                            onKeyDown={async (e) => {
                                                if (e.key === 'Enter') {
                                                    const target = e.target as HTMLInputElement;
                                                    if (target.value) handleBarcodeLookup(target.value);
                                                }
                                            }}
                                            id="barcode-input-modal"
                                        />
                                        <div className="flex justify-end gap-3 pt-2">
                                            <button onClick={() => setIsBarcodeModalOpen(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
                                            <button
                                                onClick={() => {
                                                    const input = document.getElementById('barcode-input-modal') as HTMLInputElement;
                                                    if (input?.value) handleBarcodeLookup(input.value);
                                                }}
                                                disabled={isAnalyzing}
                                                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded flex items-center gap-2"
                                            >
                                                {isAnalyzing ? "Looking up..." : "Lookup Barcode"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={() => setIsBarcodeModalOpen(true)}
                            className="flex items-center gap-2 bg-[#222] hover:bg-[#333] border border-[#444] text-gray-300 px-5 py-3 rounded font-semibold transition-all"
                        >
                            <ScanBarcode className="w-4 h-4" />
                            Barcode
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-12 flex gap-12 relative">

                {/* STICKY SIDEBAR */}
                <div className="hidden lg:block w-64 h-fit sticky top-8 space-y-2">
                    <p className="text-xs uppercase tracking-wider text-gray-500 mb-4 pl-3">Table of Contents</p>
                    {SECTIONS.map((section) => {
                        const Icon = section.icon;
                        const isActive = activeSection === section.id;
                        return (
                            <button
                                key={section.id}
                                onClick={() => scrollToSection(section.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded text-sm transition-all text-left
                                    ${isActive
                                        ? "bg-emerald-900/20 text-emerald-400 border-l-2 border-emerald-500"
                                        : "text-gray-500 hover:text-gray-300 hover:bg-[#111]"
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {section.label}
                            </button>
                        );
                    })}

                    <div className="pt-8 border-t border-[#222] mt-8">
                        <button
                            onClick={handleSubmit(onSubmit)}
                            disabled={isSubmitting}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded font-bold shadow-lg shadow-emerald-900/20 disabled:opacity-50"
                        >
                            {isSubmitting ? "Submitting..." : "Submit Product"}
                        </button>
                        {submitError && (
                            <p className="text-red-400 text-xs mt-3 bg-red-900/10 p-2 rounded border border-red-900/30">
                                {submitError}
                            </p>
                        )}
                    </div>
                </div>

                {/* MAIN FORM CONTENT */}
                <div className="flex-1 space-y-16 pb-32">

                    {/* SECTION 1: NARRATIVE */}
                    <section id="narrative" ref={el => { if (el) sectionRefs.current['narrative'] = el }} className="scroll-mt-24 space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-[#222]">
                            <FileText className="w-6 h-6 text-emerald-500" />
                            <h2 className="text-xl font-bold text-white">The Narrative</h2>
                        </div>

                        <div className="grid gap-6">
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-wider text-gray-500">Product Name</label>
                                <input {...register("name")} className="w-full bg-[#111] border border-[#333] p-4 text-white focus:border-emerald-500 outline-none rounded" placeholder="e.g. Neuro-Vance" />
                                {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-wider text-gray-500">Category</label>
                                    <select {...register("category")} className="w-full bg-[#111] border border-[#333] p-4 text-white focus:border-emerald-500 outline-none rounded appearance-none">
                                        <option value="">Select Category</option>
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    {errors.category && <p className="text-red-500 text-xs">{errors.category.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-wider text-gray-500">Target Audience</label>
                                    <input {...register("target_audience")} className="w-full bg-[#111] border border-[#333] p-4 text-white focus:border-emerald-500 outline-none rounded" placeholder="e.g. High-performance athletes" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-wider text-gray-500">Company Blurb & Mission</label>
                                <textarea {...register("company_blurb")} className="w-full bg-[#111] border border-[#333] p-4 text-white focus:border-emerald-500 outline-none rounded min-h-[120px]" placeholder="Tell us about the company mission..." />
                                {errors.company_blurb && <p className="text-red-500 text-xs">{errors.company_blurb.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-wider text-gray-500">Core Value Proposition</label>
                                <textarea {...register("core_value_proposition")} className="w-full bg-[#111] border border-[#333] p-4 text-white focus:border-emerald-500 outline-none rounded min-h-[100px]" placeholder="Key promise to the consumer..." />
                            </div>

                            {/* Hidden Barcode Field */}
                            <input type="hidden" {...register("barcode")} />
                        </div>
                    </section>

                    {/* SECTION 2: MEDIA */}
                    <section id="media" ref={el => { if (el) sectionRefs.current['media'] = el }} className="scroll-mt-24 space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-[#222]">
                            <Camera className="w-6 h-6 text-emerald-500" />
                            <h2 className="text-xl font-bold text-white">Media Assets</h2>
                        </div>
                        {/* Reusing existing upload components */}
                        <div className="bg-[#111] p-6 rounded border border-[#222]">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-semibold text-gray-300">Product Gallery</h3>
                                <CloudinaryUploadWidget onUpload={(url) => setValue("product_photos", [...photos, url])} maxPhotos={MAX_PHOTOS} currentCount={photos.length} />
                            </div>
                            <PhotoGrid photos={photos} onDelete={(idx) => setValue("product_photos", photos.filter((_, i) => i !== idx))} onReorder={() => { }} />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-wider text-gray-500">YouTube Review Link</label>
                            <div className="flex items-center gap-2 bg-[#111] border border-[#333] rounded px-3">
                                <span className="text-gray-500">youtube.com/</span>
                                <input {...register("youtube_link")} className="flex-1 bg-transparent p-4 text-white outline-none" placeholder="watch?v=..." />
                            </div>
                        </div>
                    </section>

                    {/* SECTION 3: SPECS */}
                    <section id="specs" ref={el => { if (el) sectionRefs.current['specs'] = el }} className="scroll-mt-24 space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-[#222]">
                            <FlaskConical className="w-6 h-6 text-emerald-500" />
                            <h2 className="text-xl font-bold text-white">Ingredients & Specs</h2>
                        </div>

                        {/* Ingredients Builder */}
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <label className="text-xs uppercase tracking-wider text-gray-500">Active Ingredients</label>
                                <button type="button" onClick={() => setValue("active_ingredients", [...activeIngredients, { name: "", dosage: "" }])} className="text-emerald-400 text-xs font-bold hover:text-emerald-300">+ ADD INGREDIENT</button>
                            </div>
                            {activeIngredients.map((ing, i) => (
                                <div key={i} className="flex gap-2">
                                    <input placeholder="Ingredient Name" value={ing.name} onChange={e => {
                                        const n = [...activeIngredients]; n[i].name = e.target.value; setValue("active_ingredients", n);
                                    }} className="flex-[2] bg-[#111] border border-[#333] p-3 rounded text-sm text-white" />
                                    <input placeholder="Dosage" value={ing.dosage} onChange={e => {
                                        const n = [...activeIngredients]; n[i].dosage = e.target.value; setValue("active_ingredients", n);
                                    }} className="flex-1 bg-[#111] border border-[#333] p-3 rounded text-sm text-white" />
                                    <button type="button" onClick={() => setValue("active_ingredients", activeIngredients.filter((_, idx) => idx !== i))} className="px-3 text-red-500 hover:bg-red-900/20 rounded">×</button>
                                </div>
                            ))}
                            {activeIngredients.length === 0 && <div className="p-4 bg-[#111] border border-[#333] text-gray-600 text-sm text-center rounded border-dashed">No ingredients added yet.</div>}
                        </div>

                        {/* Generic Specs */}
                        <div className="space-y-4 pt-4">
                            <div className="flex justify-between">
                                <label className="text-xs uppercase tracking-wider text-gray-500">Technical Specs (Serving Size, etc)</label>
                                <button type="button" onClick={() => setValue("technical_specs", [...technicalSpecs, { key: "", value: "" }])} className="text-emerald-400 text-xs font-bold hover:text-emerald-300">+ ADD SPEC</button>
                            </div>
                            {technicalSpecs.map((spec, i) => (
                                <div key={i} className="flex gap-2">
                                    <input placeholder="Spec Name" value={spec.key} onChange={e => {
                                        const n = [...technicalSpecs]; n[i].key = e.target.value; setValue("technical_specs", n);
                                    }} className="flex-[2] bg-[#111] border border-[#333] p-3 rounded text-sm text-white" />
                                    <input placeholder="Value" value={spec.value} onChange={e => {
                                        const n = [...technicalSpecs]; n[i].value = e.target.value; setValue("technical_specs", n);
                                    }} className="flex-1 bg-[#111] border border-[#333] p-3 rounded text-sm text-white" />
                                    <button type="button" onClick={() => setValue("technical_specs", technicalSpecs.filter((_, idx) => idx !== i))} className="px-3 text-red-500 hover:bg-red-900/20 rounded">×</button>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* SECTION 4: BENEFITS */}
                    <section id="benefits" ref={el => { if (el) sectionRefs.current['benefits'] = el }} className="scroll-mt-24 space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-[#222]">
                            <Sparkles className="w-6 h-6 text-emerald-500" />
                            <h2 className="text-xl font-bold text-white">Potential Benefits</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-end">
                                <button type="button" onClick={() => setValue("benefits", [...benefits, { title: "", type: "anecdotal" }])} className="text-emerald-400 text-xs font-bold hover:text-emerald-300">+ ADD BENEFIT</button>
                            </div>
                            {benefits.map((benefit, i) => (
                                <div key={i} className="bg-[#111] p-4 rounded border border-[#333] space-y-3">
                                    <div className="flex justify-between">
                                        <input value={benefit.title} onChange={e => {
                                            const b = [...benefits]; b[i].title = e.target.value; setValue("benefits", b);
                                        }} placeholder="Benefit Title (e.g. Reduces Inflammation)" className="w-full bg-transparent text-white font-medium border-b border-[#333] focus:border-emerald-500 outline-none pb-2" />
                                        <button type="button" onClick={() => setValue("benefits", benefits.filter((_, idx) => idx !== i))} className="ml-2 text-red-500 text-xs">Remove</button>
                                    </div>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 text-sm text-gray-400">
                                            <input type="radio" checked={benefit.type === 'anecdotal'} onChange={() => {
                                                const b = [...benefits]; b[i].type = 'anecdotal'; setValue("benefits", b);
                                            }} /> Anecdotal
                                        </label>
                                        <label className="flex items-center gap-2 text-sm text-gray-400">
                                            <input type="radio" checked={benefit.type === 'evidence_based'} onChange={() => {
                                                const b = [...benefits]; b[i].type = 'evidence_based'; setValue("benefits", b);
                                            }} /> Evidence-Based
                                        </label>
                                    </div>
                                    {benefit.type === 'evidence_based' && (
                                        <input value={benefit.citation} onChange={e => {
                                            const b = [...benefits]; b[i].citation = e.target.value; setValue("benefits", b);
                                        }} placeholder="Citation URL" className="w-full bg-[#000] border border-[#333] p-2 text-xs text-gray-300 rounded" />
                                    )}
                                </div>
                            ))}
                            {benefits.length === 0 && <div className="p-4 bg-[#111] border border-[#333] text-gray-600 text-sm text-center rounded border-dashed">No benefits listed.</div>}
                        </div>
                    </section>

                    {/* SECTION 5: SIGNALS */}
                    <section id="signals" ref={el => { if (el) sectionRefs.current['signals'] = el }} className="scroll-mt-24 space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-[#222]">
                            <ShieldCheck className="w-6 h-6 text-emerald-500" />
                            <h2 className="text-xl font-bold text-white">Truth Signals & Verification</h2>
                        </div>
                        <div className="bg-[#111] p-6 rounded border border-[#222]">
                            <p className="text-gray-400 text-sm mb-4">Select signals to verify (upload proof required for each).</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {['third_party_lab_verified', 'purity_tested', 'source_transparency', 'potency_verified', 'excipient_audit', 'operational_legitimacy'].map(key => {
                                    const isSelected = !!smeSignals[key];
                                    const evidence = smeSignals[key]?.evidence;

                                    return (
                                        <div key={key} className={`p-4 border rounded transition-colors ${isSelected ? 'border-emerald-500 bg-emerald-900/10' : 'border-[#333]'}`}>
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input type="checkbox" checked={isSelected} onChange={() => {
                                                    const s = { ...smeSignals };
                                                    if (s[key]) delete s[key];
                                                    else s[key] = { verified: false, evidence: "" };
                                                    setValue("sme_signals", s);
                                                }} className="w-4 h-4 accent-emerald-500" />
                                                <span className="capitalize font-medium text-gray-200">{key.replace(/_/g, ' ')}</span>
                                            </label>

                                            {isSelected && (
                                                <div className="mt-4 pl-7 space-y-2">
                                                    <p className="text-xs text-emerald-400">Proof Required via Upload/Link:</p>
                                                    {evidence ? (
                                                        <div className="flex items-center justify-between p-2 bg-black/40 border border-emerald-500/30 rounded">
                                                            <a href={evidence} target="_blank" className="text-xs text-blue-400 hover:underline truncate max-w-[150px]">View Proof</a>
                                                            <button type="button" onClick={() => {
                                                                const s = { ...smeSignals }; s[key].evidence = ""; setValue("sme_signals", s);
                                                            }} className="text-red-500 text-xs">Remove</button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex gap-2">
                                                            <CloudinaryUploadWidget
                                                                maxPhotos={1}
                                                                currentCount={0}
                                                                onUpload={(url) => {
                                                                    const s = { ...smeSignals };
                                                                    s[key].evidence = url;
                                                                    setValue("sme_signals", s);
                                                                }}
                                                            />
                                                            <button type="button" onClick={() => {
                                                                const url = prompt("Paste evidence link (PDF/Doc):");
                                                                if (url) {
                                                                    const s = { ...smeSignals };
                                                                    s[key].evidence = url;
                                                                    setValue("sme_signals", s);
                                                                }
                                                            }} className="text-xs bg-[#222] border border-[#444] px-2 py-1 rounded text-gray-300">Link</button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>

                    <section id="verification" ref={el => { if (el) sectionRefs.current['verification'] = el }} className="scroll-mt-24 space-y-6 pb-24">
                        <div className="flex items-center gap-3 pb-4 border-b border-[#222]">
                            <Check className="w-6 h-6 text-emerald-500" />
                            <h2 className="text-xl font-bold text-white">Final Verification</h2>
                        </div>
                        <div className="flex items-center gap-3 mb-4">
                            <input type="checkbox" {...register("is_brand_owner")} className="w-5 h-5 accent-emerald-500" />
                            <label className="text-white">I am the brand owner or authorized representative.</label>
                        </div>

                        {watch("is_brand_owner") && (
                            <div className="grid md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                <input {...register("work_email")} placeholder="Work Email" className="bg-[#111] border border-[#333] p-3 text-white rounded" />
                                <input {...register("company_website")} placeholder="Company Website" className="bg-[#111] border border-[#333] p-3 text-white rounded" />
                            </div>
                        )}

                        <div className="lg:hidden mt-8">
                            <button onClick={handleSubmit(onSubmit)} disabled={isSubmitting} className="w-full bg-emerald-600 text-white py-4 rounded font-bold text-lg">
                                {isSubmitting ? "Submitting..." : "Submit Product"}
                            </button>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
