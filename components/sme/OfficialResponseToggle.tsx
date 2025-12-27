"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";

interface OfficialResponseToggleProps {
    value: boolean;
    onChange: (value: boolean) => void;
    isSME: boolean;
}

export default function OfficialResponseToggle({ value, onChange, isSME }: OfficialResponseToggleProps) {
    if (!isSME) {
        return null;
    }

    return (
        <div className="flex items-center gap-2 p-3 border border-sme-gold/20 bg-sme-gold/5 rounded">
            <label className="flex items-center gap-2 cursor-pointer group">
                <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => onChange(e.target.checked)}
                    className="w-4 h-4 rounded border-sme-gold/30 bg-forest-obsidian text-sme-gold focus:ring-sme-gold focus:ring-offset-0 cursor-pointer"
                />
                <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className={`transition-colors ${value ? 'text-sme-gold' : 'text-bone-white/40'}`} />
                    <span className={`text-sm font-mono uppercase tracking-wider transition-colors ${value ? 'text-sme-gold' : 'text-bone-white/60'}`}>
                        Mark as Official SME Insight
                    </span>
                </div>
            </label>

            {value && (
                <div className="ml-auto text-[10px] text-sme-gold/80 font-mono">
                    Will be pinned to top
                </div>
            )}
        </div>
    );
}
