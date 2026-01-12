"use client";

import { Clock, Pill, Package, Thermometer, AlertCircle } from "lucide-react";

interface DosageUsageSectionProps {
    servingSize?: string | null;
    servingsPerContainer?: string | null;
    form?: string | null;
    recommendedDosage?: string | null;
    bestTimeTake?: string | null;
    storageInstructions?: string | null;
}

export default function DosageUsageSection({
    servingSize,
    servingsPerContainer,
    form,
    recommendedDosage,
    bestTimeTake,
    storageInstructions
}: DosageUsageSectionProps) {
    // Don't render if no data
    const hasData = servingSize || servingsPerContainer || form || recommendedDosage || bestTimeTake || storageInstructions;
    if (!hasData) return null;

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-bone-white mb-4 flex items-center gap-2">
                    <Pill className="w-5 h-5 text-emerald-400" />
                    Dosage & Usage
                </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Serving Size */}
                {servingSize && (
                    <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <Package className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-mono uppercase tracking-wider text-bone-white/60">
                                Serving Size
                            </span>
                        </div>
                        <p className="text-bone-white font-medium">{servingSize}</p>
                    </div>
                )}

                {/* Servings Per Container */}
                {servingsPerContainer && (
                    <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <Package className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-mono uppercase tracking-wider text-bone-white/60">
                                Servings Per Container
                            </span>
                        </div>
                        <p className="text-bone-white font-medium">{servingsPerContainer}</p>
                    </div>
                )}

                {/* Form */}
                {form && (
                    <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <Pill className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-mono uppercase tracking-wider text-bone-white/60">
                                Form
                            </span>
                        </div>
                        <p className="text-bone-white font-medium">{form}</p>
                    </div>
                )}

                {/* Recommended Dosage */}
                {recommendedDosage && (
                    <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-mono uppercase tracking-wider text-bone-white/60">
                                Recommended Dosage
                            </span>
                        </div>
                        <p className="text-bone-white font-medium">{recommendedDosage}</p>
                    </div>
                )}

                {/* Best Time to Take */}
                {bestTimeTake && (
                    <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-mono uppercase tracking-wider text-bone-white/60">
                                Best Time to Take
                            </span>
                        </div>
                        <p className="text-bone-white font-medium">{bestTimeTake}</p>
                    </div>
                )}

                {/* Storage Instructions */}
                {storageInstructions && (
                    <div className="p-4 bg-white/5 border border-white/10 rounded-lg md:col-span-2">
                        <div className="flex items-center gap-2 mb-2">
                            <Thermometer className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-mono uppercase tracking-wider text-bone-white/60">
                                Storage Instructions
                            </span>
                        </div>
                        <p className="text-bone-white font-medium">{storageInstructions}</p>
                    </div>
                )}
            </div>

            {/* Disclaimer */}
            <div className="pt-4 border-t border-white/10">
                <p className="text-xs text-bone-white/50 font-mono italic">
                    * Always consult with a healthcare professional before starting any new supplement regimen. Follow the recommended dosage unless otherwise directed by your healthcare provider.
                </p>
            </div>
        </div>
    );
}
