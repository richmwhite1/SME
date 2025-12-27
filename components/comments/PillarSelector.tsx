"use client";

import { Info } from "lucide-react";
import { useState } from "react";

interface PillarOption {
    value: string;
    label: string;
    description: string;
}

const PILLAR_OPTIONS: PillarOption[] = [
    {
        value: "biochemistry",
        label: "Biochemistry",
        description: "Molecular mechanisms, cellular processes, and chemical interactions in biological systems"
    },
    {
        value: "sustainability",
        label: "Sustainability",
        description: "Environmental impact, ethical sourcing, and long-term ecological considerations"
    },
    {
        value: "bioavailability",
        label: "Bio-availability",
        description: "Absorption rates, delivery mechanisms, and physiological utilization efficiency"
    },
    {
        value: "clinical_efficacy",
        label: "Clinical Efficacy",
        description: "Evidence-based outcomes, clinical trials, and measurable health impacts"
    },
    {
        value: "safety_toxicology",
        label: "Safety & Toxicology",
        description: "Adverse effects, contraindications, dosage limits, and long-term safety data"
    }
];

interface PillarSelectorProps {
    value: string | null;
    onChange: (pillar: string) => void;
    required?: boolean;
    disabled?: boolean;
    className?: string;
}

export default function PillarSelector({
    value,
    onChange,
    required = false,
    disabled = false,
    className = ""
}: PillarSelectorProps) {
    const [hoveredPillar, setHoveredPillar] = useState<string | null>(null);

    const selectedPillar = PILLAR_OPTIONS.find(p => p.value === value);

    return (
        <div className={`space-y-2 ${className}`}>
            {/* Label */}
            <label className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-bone-white/80">
                <span>Pillar of Truth</span>
                {required && <span className="text-heart-green">*</span>}
                <div className="group relative">
                    <Info size={12} className="text-bone-white/50 cursor-help" />
                    <div className="absolute left-0 top-full mt-1 w-64 bg-forest-obsidian border border-translucent-emerald p-2 text-xs font-normal normal-case tracking-normal opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
                        Map your evidence to a specific domain of scientific truth. This helps organize insights by discipline.
                    </div>
                </div>
            </label>

            {/* Dropdown */}
            <div className="relative">
                <select
                    value={value || ""}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    required={required}
                    className="w-full bg-forest-obsidian border border-translucent-emerald px-3 py-2 text-sm text-bone-white focus:border-heart-green focus:outline-none transition-all font-mono disabled:opacity-50 disabled:cursor-not-allowed appearance-none pr-8"
                    onMouseEnter={() => value && setHoveredPillar(value)}
                    onMouseLeave={() => setHoveredPillar(null)}
                >
                    <option value="" disabled>
                        Select a pillar...
                    </option>
                    {PILLAR_OPTIONS.map((pillar) => (
                        <option key={pillar.value} value={pillar.value}>
                            {pillar.label}
                        </option>
                    ))}
                </select>

                {/* Dropdown Arrow */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className="text-bone-white/50">
                        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
            </div>

            {/* Selected Pillar Description */}
            {selectedPillar && (
                <div className="bg-emerald-900/20 border-l-2 border-emerald-500 p-2 rounded-r">
                    <p className="text-xs text-emerald-100/80 leading-relaxed font-mono">
                        {selectedPillar.description}
                    </p>
                </div>
            )}

            {/* Validation Message */}
            {required && !value && (
                <p className="text-xs text-bone-white/50 font-mono italic">
                    Required for Verified Insights
                </p>
            )}
        </div>
    );
}
