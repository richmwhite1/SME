"use client";

import { useState } from "react";
import { Link2, X } from "lucide-react";
import { isValidUrl, normalizeDoi } from "@/lib/url-metadata";

interface SourceLinkInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export default function SourceLinkInput({
    value,
    onChange,
    placeholder = "Paste URL or DOI (e.g., https://pubmed.ncbi.nlm.nih.gov/... or doi:10.1234/...)",
    className = "",
}: SourceLinkInputProps) {
    const [isValid, setIsValid] = useState(true);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        onChange(newValue);

        // Validate URL if not empty
        if (newValue.trim()) {
            setIsValid(isValidUrl(newValue.trim()));
        } else {
            setIsValid(true);
        }
    };

    const handleClear = () => {
        onChange("");
        setIsValid(true);
    };

    return (
        <div className={`space-y-1 ${className}`}>
            <label className="flex items-center gap-2 text-xs font-mono text-bone-white/70 uppercase tracking-wider">
                <Link2 size={12} />
                Attach Evidence (Link or DOI)
            </label>
            <div className="relative">
                <input
                    type="text"
                    value={value}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className={`w-full bg-forest-obsidian border px-3 py-2 pr-8 text-sm text-bone-white placeholder-bone-white/40 focus:outline-none transition-colors font-mono ${!isValid
                            ? "border-red-500/50 focus:border-red-500"
                            : "border-translucent-emerald focus:border-heart-green"
                        }`}
                />
                {value && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-bone-white/40 hover:text-bone-white transition-colors"
                        aria-label="Clear link"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>
            {!isValid && (
                <p className="text-xs text-red-400 font-mono">
                    Please enter a valid URL or DOI
                </p>
            )}
        </div>
    );
}
