"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useFormState, useFormStatus } from "react-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AlertCircle, Check, ChevronRight, Upload, Beaker, Gem, Sprout, Shield, Lock, FileText, AlertTriangle } from "lucide-react";
import { onboardProduct } from "@/app/actions/product-onboarding";
import { useRouter } from "next/navigation";

// Define Signals with Lens Type (Emoji-to-Lens Mapping)
const SIGNALS = [
    { id: "tested", icon: Beaker, label: "Lab Tested", emoji: "🧪", lens: "scientific" },
    { id: "organic", icon: Sprout, label: "Ancestral/Natural", emoji: "🪵", lens: "alternative" },
    { id: "esoteric", icon: Gem, label: "Energetic Benefits", emoji: "👁️", lens: "esoteric" },
    { id: "safe", icon: Shield, label: "Safety Verified", emoji: "🛡️", lens: "scientific" },
    { id: "warning", icon: AlertTriangle, label: "Known Risks", emoji: "⚠️", lens: "scientific" },
];

const JOB_FUNCTIONS = [
    "Survivalist",
    "Detox",
    "Brain Fog",
    "Vitality",
    "Sleep",
    "Gut Health",
    "Hormones",
    "Performance",
    "Weight Loss",
    "Recovery"
];

// Initial State for Server Action
const initialState = {
    message: "",
    success: false,
    errors: undefined
};

function SubmitButton({ disabled = false }: { disabled?: boolean }) {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending || disabled}
            className="flex items-center gap-2 bg-emerald-600/10 border border-emerald-500/50 px-8 py-2 text-xs uppercase tracking-wider text-emerald-400 hover:bg-emerald-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {pending ? "Processing..." : "Submit for Review"} <Check className="w-3 h-3" />
        </button>
    );
}

export default function ProductOnboardingWizard() {
    const [step, setStep] = useState(1);
    const [selectedSignals, setSelectedSignals] = useState<Record<string, string>>({});
    const [state, formAction] = useFormState(onboardProduct, initialState);
    const router = useRouter();

    // Serialize signals for partial submission
    const signalsPayload = Object.entries(selectedSignals).map(([id, reason]) => {
        const def = SIGNALS.find(s => s.id === id);
        return {
            signal: def?.label || id,
            lens_type: def?.lens || "scientific",
            reason: reason
        };
    });

    useEffect(() => {
        if (state.success) {
            router.refresh();
            // Optional: reset form or redirect
            // router.push("/products");
        }
    }, [state.success, router]);

    const toggleSignal = (id: string) => {
        setSelectedSignals((prev) => {
            const newSignals = { ...prev };
            if (newSignals[id] !== undefined) {
                delete newSignals[id];
            } else {
                newSignals[id] = ""; // Initialize with empty reason
            }
            return newSignals;
        });
    };

    const updateSignalReason = (id: string, reason: string) => {
        setSelectedSignals((prev) => ({
            ...prev,
            [id]: reason,
        }));
    };

    const handleNext = (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent form submission
        setStep(prev => prev + 1);
    };

    const handleBack = (e: React.MouseEvent) => {
        e.preventDefault();
        setStep(prev => prev - 1);
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-[#e5e5e5] font-mono p-4 md:p-8 flex items-center justify-center">
            <div className="w-full max-w-4xl border border-[#333] bg-[#111] shadow-2xl relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-4 right-4 border border-red-900/30 text-red-900/30 px-2 py-1 text-xs rotate-12 pointer-events-none select-none">
                    CONFIDENTIAL
                </div>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-900/50 via-emerald-500/50 to-emerald-900/50" />

                <div className="p-8">
                    <header className="mb-8 border-b border-[#333] pb-4 flex justify-between items-end">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-emerald-500 uppercase">Product Dossier</h1>
                            <p className="text-sm text-gray-500 mt-1">Initiating New Product Sequence</p>
                        </div>
                        <div className="text-xs text-gray-600">
                            STEP {step} OF 4
                        </div>
                    </header>

                    {state.message && (
                        <div className={`mb-6 p-4 border ${state.success ? 'border-emerald-500/50 bg-emerald-900/10 text-emerald-400' : 'border-red-500/50 bg-red-900/10 text-red-400'}`}>
                            {state.message}
                        </div>
                    )}

                    <form action={formAction} className="space-y-8">

                        {/* Hidden Input for Signals JSON */}
                        <input type="hidden" name="signals" value={JSON.stringify(signalsPayload)} />

                        {/* STEP 1: IDENTITY */}
                        <div className={step === 1 ? "block animate-in fade-in slide-in-from-right-4 duration-300" : "hidden"}>
                            <h2 className="text-xl font-semibold text-white uppercase tracking-wider mb-4 border-l-2 border-emerald-500 pl-4">I. Identity</h2>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-wider text-gray-500">Product Name <span className="text-red-500">*</span></label>
                                    <input
                                        name="name"
                                        required
                                        className="w-full bg-[#0a0a0a] border border-[#333] p-3 text-sm focus:border-emerald-500 focus:outline-none transition-colors placeholder:text-gray-700"
                                        placeholder="e.g. Neuro-Stack Alpha"
                                    />
                                    {state.errors?.name && <p className="text-red-500 text-xs">{state.errors.name[0]}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-wider text-gray-500">Brand / Manufacturer <span className="text-red-500">*</span></label>
                                    <input
                                        name="brand"
                                        required
                                        className="w-full bg-[#0a0a0a] border border-[#333] p-3 text-sm focus:border-emerald-500 focus:outline-none transition-colors placeholder:text-gray-700"
                                        placeholder="e.g. Apex Labs"
                                    />
                                    {state.errors?.brand && <p className="text-red-500 text-xs">{state.errors.brand[0]}</p>}
                                </div>
                            </div>
                            <div className="space-y-2 mt-6">
                                <label className="text-xs uppercase tracking-wider text-gray-500">Founder Intent Video URL (Optional)</label>
                                <input
                                    name="founder_video_url"
                                    className="w-full bg-[#0a0a0a] border border-[#333] p-3 text-sm focus:border-emerald-500 focus:outline-none transition-colors placeholder:text-gray-700"
                                    placeholder="https://youtube.com/..."
                                />
                                {state.errors?.founder_video_url && <p className="text-red-500 text-xs">{state.errors.founder_video_url[0]}</p>}
                            </div>
                        </div>

                        {/* STEP 2: THE JOB */}
                        <div className={step === 2 ? "block animate-in fade-in slide-in-from-right-4 duration-300" : "hidden"}>
                            <h2 className="text-xl font-semibold text-white uppercase tracking-wider mb-4 border-l-2 border-emerald-500 pl-4">II. The Job</h2>
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-wider text-gray-500">Job Function <span className="text-red-500">*</span></label>
                                <select
                                    name="category"
                                    required
                                    className="w-full bg-[#0a0a0a] border border-[#333] p-3 text-sm focus:border-emerald-500 focus:outline-none transition-colors text-gray-300"
                                >
                                    <option value="">Select Primary Function...</option>
                                    {JOB_FUNCTIONS.map((func) => (
                                        <option key={func} value={func}>{func}</option>
                                    ))}
                                </select>
                                {state.errors?.job_function && <p className="text-red-500 text-xs">{state.errors.job_function[0]}</p>}
                            </div>
                            <div className="space-y-2 mt-6">
                                <label className="text-xs uppercase tracking-wider text-gray-500">Primary Active Ingredients (Optional)</label>
                                <textarea
                                    name="ingredients"
                                    className="w-full bg-[#0a0a0a] border border-[#333] p-3 text-sm focus:border-emerald-500 focus:outline-none transition-colors placeholder:text-gray-700 min-h-[120px]"
                                    placeholder="List key ingredients (e.g., L-Theanine, Caffeine, Ashwagandha)..."
                                />
                            </div>
                        </div>

                        {/* STEP 3: THE EVIDENCE */}
                        <div className={step === 3 ? "block animate-in fade-in slide-in-from-right-4 duration-300" : "hidden"}>
                            <h2 className="text-xl font-semibold text-white uppercase tracking-wider mb-4 border-l-2 border-emerald-500 pl-4">III. The Evidence</h2>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-wider text-gray-500">Certificate of Analysis (COA)</label>
                                    <div className="flex gap-2">
                                        <input
                                            name="coa_url"
                                            className="flex-1 bg-[#0a0a0a] border border-[#333] p-3 text-sm focus:border-emerald-500 focus:outline-none transition-colors placeholder:text-gray-700"
                                            placeholder="URL to COA Document..."
                                        />
                                        <div className="bg-[#1a1a1a] border border-[#333] p-3 text-gray-500 flex items-center justify-center">
                                            <FileText className="w-4 h-4" />
                                        </div>
                                    </div>
                                    {state.errors?.coa_url && <p className="text-red-500 text-xs">{state.errors.coa_url[0]}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-wider text-gray-500">Lab Reports / Clinical Studies</label>
                                    <div className="flex gap-2">
                                        <input
                                            name="lab_report_url"
                                            className="flex-1 bg-[#0a0a0a] border border-[#333] p-3 text-sm focus:border-emerald-500 focus:outline-none transition-colors placeholder:text-gray-700"
                                            placeholder="URL to Lab Report or Study..."
                                        />
                                        <div className="bg-[#1a1a1a] border border-[#333] p-3 text-gray-500 flex items-center justify-center">
                                            <Beaker className="w-4 h-4" />
                                        </div>
                                    </div>
                                    {state.errors?.lab_report_url && <p className="text-red-500 text-xs">{state.errors.lab_report_url[0]}</p>}
                                </div>
                            </div>
                        </div>

                        {/* STEP 4: SME SIGNALS */}
                        <div className={step === 4 ? "block animate-in fade-in slide-in-from-right-4 duration-300" : "hidden"}>
                            <h2 className="text-xl font-semibold text-white uppercase tracking-wider mb-4 border-l-2 border-emerald-500 pl-4">IV. Truth Signals <span className="text-red-500">*</span></h2>
                            <div className="mb-4">
                                <p className="text-xs text-gray-600 mb-4">Select at least one truth signal. Tag the product&apos;s strengths and weaknesses objectively.</p>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                {SIGNALS.map((signal) => {
                                    const isSelected = selectedSignals[signal.id] !== undefined;
                                    return (
                                        <div
                                            key={signal.id}
                                            onClick={() => toggleSignal(signal.id)}
                                            className={`
                                                cursor-pointer border p-3 flex flex-col items-center gap-2 transition-all duration-200
                                                ${isSelected
                                                    ? signal.id === 'warning'
                                                        ? "border-red-500 bg-red-900/10 text-red-500"
                                                        : "border-emerald-500 bg-emerald-900/10 text-emerald-400"
                                                    : "border-[#333] hover:border-gray-500 text-gray-500"}
                                            `}
                                        >
                                            <span className="text-3xl">{signal.emoji}</span>
                                        </div>
                                    );
                                })}
                            </div>
                            {Object.keys(selectedSignals).length > 0 && (
                                <div className="space-y-4 mt-6 border-t border-[#333] pt-6">
                                    <h3 className="text-xs uppercase tracking-wider text-emerald-500 mb-4">Signal Justification</h3>
                                    {Object.entries(selectedSignals).map(([id, reason]) => {
                                        const signal = SIGNALS.find(s => s.id === id);
                                        if (!signal) return null;
                                        return (
                                            <div key={id} className="space-y-2">
                                                <label className={`text-xs flex items-center gap-2 ${id === 'warning' ? 'text-red-400' : 'text-emerald-400'}`}>
                                                    <span>{signal.emoji}</span>
                                                    {signal.label} ({signal.lens})
                                                </label>
                                                <textarea
                                                    value={reason}
                                                    onChange={(e) => updateSignalReason(id, e.target.value)}
                                                    className="w-full bg-[#0a0a0a] border border-[#333] p-3 text-sm focus:border-emerald-500 focus:outline-none transition-colors placeholder:text-gray-700 min-h-[80px]"
                                                    placeholder={id === 'warning' ? "Explain the risk or concern..." : "Cite evidence for this claim..."}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* NAVIGATION */}
                        <div className="flex justify-between pt-6 border-t border-[#333] mt-8">
                            {step > 1 ? (
                                <button
                                    onClick={handleBack}
                                    className="px-6 py-2 text-xs uppercase tracking-wider text-gray-500 hover:text-white transition-colors"
                                >
                                    Back
                                </button>
                            ) : <div />}

                            {step < 4 ? (
                                <button
                                    onClick={handleNext}
                                    className="flex items-center gap-2 bg-[#1a1a1a] border border-[#333] px-6 py-2 text-xs uppercase tracking-wider text-white hover:bg-emerald-900/20 hover:border-emerald-500/50 transition-all"
                                >
                                    Next Step <ChevronRight className="w-3 h-3" />
                                </button>
                            ) : (
                                <div className="flex flex-col items-end gap-2">
                                    {Object.keys(selectedSignals).length === 0 && (
                                        <p className="text-xs text-red-400">⚠️ At least one truth signal is required</p>
                                    )}
                                    <div className={Object.keys(selectedSignals).length === 0 ? "opacity-50 cursor-not-allowed" : ""}>
                                        <SubmitButton disabled={Object.keys(selectedSignals).length === 0} />
                                    </div>
                                </div>
                            )}
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}
