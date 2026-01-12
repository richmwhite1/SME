"use client";

import React from "react";
import { Info, AlertTriangle, CheckCircle, Leaf, Factory, DollarSign, Pill, Wheat, ShieldCheck, Award } from "lucide-react";
import Tooltip from "@/components/ui/Tooltip";

interface ProductQuadrantGridProps {
    activeIngredients: any[];
    servingSize?: string | null;
    servingsPerContainer?: string | null;
    form?: string | null;
    price?: string | null;
    coreValueProposition?: string | null;
    officialBenefits: any[];
    allergens?: string[] | null;
    dietaryTags?: string[] | null;
    warnings?: string | null;
    manufacturer?: string | null;
    certifications?: string[] | null;
    labTested?: boolean;
    isVerified?: boolean;
}

export default function ProductQuadrantGrid({
    activeIngredients = [],
    servingSize,
    servingsPerContainer,
    form,
    price,
    coreValueProposition,
    officialBenefits = [],
    allergens = [],
    dietaryTags = [],
    warnings,
    manufacturer,
    certifications = [],
    labTested = false,
    isVerified = false
}: ProductQuadrantGridProps) {

    // Calculate price per serving
    let pricePerServing = "N/A";
    if (price && servingsPerContainer) {
        const priceNum = parseFloat(price.replace(/[^0-9.]/g, ''));
        const servingsNum = parseInt(servingsPerContainer.replace(/[^0-9]/g, ''));
        if (!isNaN(priceNum) && !isNaN(servingsNum) && servingsNum > 0) {
            pricePerServing = `$${(priceNum / servingsNum).toFixed(2)}`;
        }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Quadrant 1: Formula & Dosage */}
            <div className="bg-white/5 border border-translucent-emerald/30 rounded-xl p-5 hover:border-sme-gold/30 transition-colors">
                <div className="flex items-center gap-2 mb-4 text-sme-gold border-b border-translucent-emerald/20 pb-2">
                    <Pill size={18} />
                    <h3 className="font-serif font-semibold tracking-wide">Formula & Dosage</h3>
                </div>

                <div className="space-y-4">
                    {/* Active Ingredients List */}
                    <div>
                        <div className="text-xs uppercase tracking-wider text-bone-white/50 mb-2">Key Actives</div>
                        {activeIngredients.length > 0 ? (
                            <ul className="space-y-2">
                                {activeIngredients.slice(0, 3).map((ing, i) => (
                                    <li key={i} className="flex justify-between items-center text-sm bg-black/20 p-2 rounded">
                                        <span className="font-medium text-bone-white">{ing.name || ing.key}</span>
                                        <span className="font-mono text-sme-gold/80">{ing.dosage || ing.value}</span>
                                    </li>
                                ))}
                                {activeIngredients.length > 3 && (
                                    <li className="text-xs text-center text-bone-white/40 pt-1">
                                        + {activeIngredients.length - 3} more ingredients
                                    </li>
                                )}
                            </ul>
                        ) : (
                            <p className="text-sm text-bone-white/40 italic">No ingredients listed</p>
                        )}
                    </div>

                    {/* Form & Serving */}
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div className="bg-black/20 p-2 rounded">
                            <span className="text-bone-white/50 block mb-1">Form</span>
                            <span className="text-bone-white">{form || "N/A"}</span>
                        </div>
                        <div className="bg-black/20 p-2 rounded">
                            <span className="text-bone-white/50 block mb-1">Serving Size</span>
                            <span className="text-bone-white">{servingSize || "N/A"}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quadrant 2: Value Proposition */}
            <div className="bg-white/5 border border-translucent-emerald/30 rounded-xl p-5 hover:border-sme-gold/30 transition-colors">
                <div className="flex items-center gap-2 mb-4 text-heart-green border-b border-translucent-emerald/20 pb-2">
                    <DollarSign size={18} />
                    <h3 className="font-serif font-semibold tracking-wide">Value Proposition</h3>
                </div>

                <div className="space-y-4">
                    {/* Core Promise */}
                    <div>
                        <div className="text-xs uppercase tracking-wider text-bone-white/50 mb-2">Core Promise</div>
                        <p className="text-sm text-bone-white/90 leading-relaxed italic border-l-2 border-heart-green pl-3">
                            "{coreValueProposition || 'Provides standard nutritional support.'}"
                        </p>
                    </div>

                    {/* Economics */}
                    <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="bg-black/20 p-2 rounded flex flex-col justify-center text-center">
                            <span className="text-xs text-bone-white/50 uppercase">Cost/Serving</span>
                            <span className="text-lg font-mono text-heart-green">{pricePerServing}</span>
                        </div>
                        <div className="bg-black/20 p-2 rounded flex flex-col justify-center text-center">
                            <span className="text-xs text-bone-white/50 uppercase">Servings</span>
                            <span className="text-lg font-mono text-white">{servingsPerContainer || "N/A"}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quadrant 3: Safety & Diet */}
            <div className="bg-white/5 border border-translucent-emerald/30 rounded-xl p-5 hover:border-sme-gold/30 transition-colors">
                <div className="flex items-center gap-2 mb-4 text-third-eye-indigo border-b border-translucent-emerald/20 pb-2">
                    <ShieldCheck size={18} />
                    <h3 className="font-serif font-semibold tracking-wide">Safety & Diet</h3>
                </div>

                <div className="space-y-4">
                    {/* Badges */}
                    <div className="flex flex-wrap gap-2">
                        {allergens && allergens.includes('none') && (
                            <span className="text-xs bg-third-eye-indigo/20 text-third-eye-indigo px-2 py-1 rounded border border-third-eye-indigo/30 flex items-center gap-1">
                                <CheckCircle size={10} /> Hypoallergenic
                            </span>
                        )}
                        {dietaryTags && dietaryTags.slice(0, 3).map(tag => (
                            <span key={tag} className="text-xs bg-white/10 text-bone-white px-2 py-1 rounded border border-white/10 capitalize">
                                {tag.replace('_', ' ')}
                            </span>
                        ))}
                    </div>

                    {/* Warnings */}
                    {warnings && (
                        <div className="bg-red-900/10 border border-red-500/20 p-2 rounded flex gap-2 items-start">
                            <AlertTriangle size={14} className="text-red-400 mt-0.5 shrink-0" />
                            <p className="text-xs text-red-200/80 leading-tight">{warnings}</p>
                        </div>
                    )}

                    {!warnings && (
                        <div className="flex items-center gap-2 text-xs text-emerald-400/80 bg-emerald-900/10 p-2 rounded border border-emerald-500/20">
                            <CheckCircle size={14} />
                            <span>No specific warnings listed.</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Quadrant 4: Maker Profile */}
            <div className="bg-white/5 border border-translucent-emerald/30 rounded-xl p-5 hover:border-sme-gold/30 transition-colors">
                <div className="flex items-center gap-2 mb-4 text-blue-400 border-b border-translucent-emerald/20 pb-2">
                    <Factory size={18} />
                    <h3 className="font-serif font-semibold tracking-wide">Maker Profile</h3>
                </div>

                <div className="space-y-4">
                    <div>
                        <div className="text-xs uppercase tracking-wider text-bone-white/50 mb-1">Manufacturer</div>
                        <div className="text-lg font-serif text-bone-white">{manufacturer || "Unknown"}</div>
                    </div>

                    {/* Certifications - Show top 3 */}
                    <div>
                        <div className="text-xs uppercase tracking-wider text-bone-white/50 mb-2">Certifications</div>
                        {certifications && certifications.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {certifications.slice(0, 3).map(cert => (
                                    <Tooltip key={cert} content={cert}>
                                        <div className="bg-blue-900/20 text-blue-300 border border-blue-500/20 px-2 py-1 rounded text-xs flex items-center gap-1 cursor-help">
                                            <Award size={10} />
                                            <span className="truncate max-w-[80px]">{cert}</span>
                                        </div>
                                    </Tooltip>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-bone-white/30">No certifications listed</p>
                        )}
                    </div>

                    {/* Lab Test Status */}
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-white/10">
                        <span className="text-bone-white/60">Lab Testing</span>
                        {labTested ? (
                            <span className="text-emerald-400 flex items-center gap-1 font-bold"><CheckCircle size={12} /> Verified</span>
                        ) : (
                            <span className="text-bone-white/40">Not verified</span>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
}
