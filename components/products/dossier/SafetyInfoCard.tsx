"use client";

import { AlertTriangle, ShieldAlert } from "lucide-react";

interface SafetyInfoCardProps {
    allergens?: string[] | null;
    warnings?: string | null;
}

export default function SafetyInfoCard({ allergens, warnings }: SafetyInfoCardProps) {
    // Don't render if no safety info
    if ((!allergens || allergens.length === 0) && !warnings) {
        return null;
    }

    // Filter out "none" from allergens
    const actualAllergens = allergens?.filter(a => a !== "none") || [];

    return (
        <div className="mb-6 border-2 border-orange-500/50 bg-orange-900/10 rounded-lg overflow-hidden">
            <div className="bg-orange-900/30 border-b border-orange-500/30 px-4 md:px-6 py-3">
                <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-orange-400 flex-shrink-0" />
                    <h3 className="font-mono text-sm md:text-base font-bold text-orange-300 uppercase tracking-wide">
                        Safety Information
                    </h3>
                </div>
            </div>

            <div className="px-4 md:px-6 py-4 space-y-4">
                {/* Allergens */}
                {actualAllergens.length > 0 && (
                    <div>
                        <div className="flex items-start gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                            <span className="text-xs md:text-sm font-mono font-bold text-orange-300 uppercase tracking-wider">
                                Contains Allergens:
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-2 ml-6">
                            {actualAllergens.map((allergen) => (
                                <span
                                    key={allergen}
                                    className="px-3 py-1.5 bg-orange-500/20 border border-orange-500/40 text-orange-200 text-xs md:text-sm font-semibold rounded-full capitalize"
                                >
                                    {allergen.replace(/_/g, " ")}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Warnings */}
                {warnings && (
                    <div>
                        <div className="flex items-start gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                            <span className="text-xs md:text-sm font-mono font-bold text-yellow-300 uppercase tracking-wider">
                                Warnings:
                            </span>
                        </div>
                        <p className="text-sm md:text-base text-bone-white/80 leading-relaxed ml-6 whitespace-pre-wrap">
                            {warnings}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
