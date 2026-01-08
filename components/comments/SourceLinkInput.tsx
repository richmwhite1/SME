"use client";

import { useState } from "react";
import { Link2, X, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { isValidUrl, normalizeDoi } from "@/lib/url-metadata";
import { validateCitation } from "@/lib/citation-validator";

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
    const [validationMessage, setValidationMessage] = useState<string>("");
    const [showApprovedSources, setShowApprovedSources] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        onChange(newValue);

        // Validate URL if not empty
        if (newValue.trim()) {
            const basicValidation = isValidUrl(newValue.trim());
            setIsValid(basicValidation);

            // Perform full citation validation (format + domain)
            const citationValidation = validateCitation(newValue.trim());

            if (!citationValidation.isValid) {
                setValidationMessage(citationValidation.reason || "Invalid citation format");
            } else {
                setValidationMessage(`✓ Approved source: ${citationValidation.domain}`);
            }
        } else {
            setIsValid(true);
            setValidationMessage("");
        }
    };

    const handleClear = () => {
        onChange("");
        setIsValid(true);
        setValidationMessage("");
    };

    const approvedDomains = [
        "pubmed.ncbi.nlm.nih.gov",
        "nih.gov",
        "thelancet.com",
        "jamanetwork.com",
        "nejm.org",
        "bmj.com",
        "nature.com",
        "sciencedirect.com",
        "springer.com",
        "wiley.com",
        "plos.org",
        "doi.org (for DOI links)"
    ];

    return (
        <div className={`space-y-1 ${className}`}>
            <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-mono text-bone-white/70 uppercase tracking-wider">
                    <Link2 size={12} />
                    Attach Evidence (Link or DOI)
                </label>
                <button
                    type="button"
                    onClick={() => setShowApprovedSources(!showApprovedSources)}
                    className="flex items-center gap-1 text-xs text-bone-white/50 hover:text-bone-white/80 transition-colors"
                >
                    <Info size={12} />
                    Approved Sources
                </button>
            </div>

            {showApprovedSources && (
                <div className="bg-forest-obsidian/50 border border-translucent-emerald/30 p-3 text-xs text-bone-white/70 font-mono space-y-1">
                    <p className="text-bone-white/90 font-semibold mb-2">Pre-approved academic/medical sources:</p>
                    <ul className="space-y-0.5 pl-4">
                        {approvedDomains.map((domain) => (
                            <li key={domain} className="list-disc">{domain}</li>
                        ))}
                    </ul>
                    <p className="text-bone-white/60 mt-2 pt-2 border-t border-translucent-emerald/20">
                        Citations from other sources will be manually reviewed by SMEs.
                    </p>
                </div>
            )}

            <div className="relative">
                <input
                    type="text"
                    value={value}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className={`w-full bg-forest-obsidian border px-3 py-2 pr-8 text-sm text-bone-white placeholder-bone-white/40 focus:outline-none transition-colors font-mono ${!isValid
                            ? "border-red-500/50 focus:border-red-500"
                            : value && validationMessage.startsWith("✓")
                                ? "border-heart-green/50 focus:border-heart-green"
                                : "border-translucent-emerald focus:border-heart-green"
                        }`}
                />
                {value && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        {validationMessage.startsWith("✓") && (
                            <CheckCircle2 size={16} className="text-heart-green" />
                        )}
                        {!isValid && (
                            <AlertCircle size={16} className="text-red-400" />
                        )}
                        <button
                            type="button"
                            onClick={handleClear}
                            className="text-bone-white/40 hover:text-bone-white transition-colors"
                            aria-label="Clear link"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}
            </div>

            {validationMessage && (
                <p className={`text-xs font-mono ${validationMessage.startsWith("✓")
                        ? "text-heart-green"
                        : "text-yellow-400"
                    }`}>
                    {validationMessage}
                </p>
            )}

            {!isValid && (
                <p className="text-xs text-red-400 font-mono">
                    Please enter a valid URL (http:// or https://) or DOI (doi:)
                </p>
            )}
        </div>
    );
}
