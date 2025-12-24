"use client";

import { useProductWizardStore, Step4Schema } from "@/lib/stores/product-wizard-store";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { AlertCircle, Shield, Beaker, Sprout, Gem, AlertTriangle } from "lucide-react";
import CloudinaryUploadWidget from "../CloudinaryUploadWidget";

const SIGNALS = [
    { id: "third_party_lab_verified", icon: Beaker, label: "Lab Tested", emoji: "🧪", lens: "scientific", desc: "Independent testing for purity/potency." },
    { id: "purity_tested", icon: Sprout, label: "Purity Tested", emoji: "🪵", lens: "alternative", desc: "Free from contaminants like heavy metals." },
    { id: "esoteric", icon: Gem, label: "Energetic Benefits", emoji: "👁️", lens: "esoteric", desc: "Energetic or spiritual processing verified." },
    { id: "safe", icon: Shield, label: "Safety Verified", emoji: "🛡️", lens: "scientific", desc: "Generally recognized as safe (GRAS)." },
    { id: "warning", icon: AlertTriangle, label: "Known Risks", emoji: "⚠️", lens: "scientific", desc: "Contains potent or regulated substances." },
];

export default function Step4TruthSignals() {
    const { data, updateData } = useProductWizardStore();

    const { register, watch, setValue, formState: { errors, isValid } } = useForm({
        resolver: zodResolver(Step4Schema),
        defaultValues: {
            sme_signals: data.sme_signals || {}
        },
        mode: "onChange"
    });

    const smeSignals = watch("sme_signals") || {};

    // Persist to store
    useEffect(() => {
        updateData({ sme_signals: smeSignals });
    }, [JSON.stringify(smeSignals), updateData]);

    const toggleSignal = (id: string) => {
        const newSignals = { ...smeSignals };
        if (newSignals[id]) {
            delete newSignals[id];
        } else {
            newSignals[id] = { verified: false, evidence: "" };
        }
        setValue("sme_signals", newSignals, { shouldValidate: true });
    };

    const handleEvidenceUpload = (id: string, url: string) => {
        const newSignals = { ...smeSignals };
        if (newSignals[id]) {
            newSignals[id].evidence = url;
            newSignals[id].verified = true; // Assume verified if evidence provided? Or just marked.
            setValue("sme_signals", newSignals, { shouldValidate: true });
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="mb-6 border-l-2 border-emerald-500 pl-4">
                <h2 className="text-xl font-semibold text-white uppercase tracking-wider">IV. Truth Signals</h2>
                <p className="text-gray-500 text-sm mt-1">Evidence — Substantiate your claims</p>
            </div>

            <div className="bg-emerald-900/10 border border-emerald-900/30 p-4 text-sm text-emerald-200 mb-6">
                Select applicable signals. You must provide evidence (PDF/Image) for each selected signal to proceed.
            </div>

            <div className="space-y-4">
                {SIGNALS.map((signal) => {
                    const isSelected = !!smeSignals[signal.id];
                    const evidence = smeSignals[signal.id]?.evidence;

                    return (
                        <div key={signal.id} className={`p-4 border rounded transition-colors ${isSelected ? 'border-emerald-500/50 bg-emerald-900/10' : 'border-[#333] bg-[#0a0a0a]'}`}>
                            <div className="flex items-start gap-4">
                                <div
                                    onClick={() => toggleSignal(signal.id)}
                                    className={`mt-1 w-5 h-5 flex items-center justify-center rounded border cursor-pointer ${isSelected ? 'bg-emerald-500 border-emerald-500 text-black' : 'border-gray-600 bg-transparent'}`}
                                >
                                    {isSelected && <div className="w-2 h-2 bg-black rounded-full" />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggleSignal(signal.id)}>
                                        <signal.icon className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-gray-500'}`} />
                                        <h3 className={`font-medium ${isSelected ? 'text-white' : 'text-gray-400'}`}>{signal.label}</h3>
                                        <span className="text-gray-600 text-xs ml-auto border border-[#333] px-2 py-0.5 rounded">{signal.lens}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">{signal.desc}</p>

                                    {isSelected && (
                                        <div className="mt-4 pl-4 border-l border-emerald-500/30">
                                            <label className="text-xs uppercase tracking-wider text-emerald-400/80 mb-2 block">
                                                Evidence Documentation <span className="text-red-500">*</span>
                                            </label>

                                            {evidence ? (
                                                <div className="flex items-center gap-2 bg-black/40 border border-emerald-500/30 p-2 rounded">
                                                    <span className="text-emerald-500 text-xs">✓ Documentation Uploaded</span>
                                                    <a href={evidence} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 underline hover:text-white truncate max-w-[150px]">
                                                        View
                                                    </a>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleEvidenceUpload(signal.id, "")}
                                                        className="text-xs text-red-500 hover:text-red-400 ml-auto"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            ) : (
                                                <div>
                                                    <CloudinaryUploadWidget
                                                        onUpload={(url) => handleEvidenceUpload(signal.id, url)}
                                                        maxPhotos={1}
                                                        currentCount={0}
                                                    />
                                                    {errors.sme_signals?.[signal.id]?.evidence && (
                                                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                                            <AlertCircle className="w-3 h-3" />
                                                            {errors.sme_signals[signal.id]?.evidence?.message}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Show general error if needed */}
            {Object.keys(smeSignals).length === 0 && (
                <p className="text-xs text-gray-500 italic mt-4 text-center">
                    Note: You can proceed without signals, but adding verifiable truth signals increases SME trust.
                </p>
            )}
        </div>
    );
}
