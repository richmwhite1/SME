"use client";

import { useState } from "react";
import { HelpCircle, ChevronDown, ChevronUp, Lightbulb } from "lucide-react";

interface FormTip {
    title: string;
    content: string;
    example?: string;
}

interface FormTipsProps {
    tips: FormTip[];
    title?: string;
    defaultOpen?: boolean;
}

export default function FormTips({
    tips,
    title = "Tips for Success",
    defaultOpen = false,
}: FormTipsProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    if (tips.length === 0) return null;

    return (
        <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-lg overflow-hidden">
            {/* Header */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-emerald-500/10 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Lightbulb size={18} className="text-emerald-400" />
                    <span className="font-mono text-sm font-bold text-emerald-400">
                        {title}
                    </span>
                </div>
                {isOpen ? (
                    <ChevronUp size={18} className="text-emerald-400" />
                ) : (
                    <ChevronDown size={18} className="text-emerald-400" />
                )}
            </button>

            {/* Content */}
            {isOpen && (
                <div className="px-4 pb-4 space-y-3 animate-fadeIn">
                    {tips.map((tip, index) => (
                        <div key={index} className="border-l-2 border-emerald-500/30 pl-3">
                            <h4 className="text-xs font-mono font-bold text-bone-white/80 mb-1">
                                {tip.title}
                            </h4>
                            <p className="text-xs text-bone-white/60 leading-relaxed mb-2">
                                {tip.content}
                            </p>
                            {tip.example && (
                                <div className="bg-bone-white/5 border border-bone-white/10 rounded px-2 py-1.5 mt-2">
                                    <div className="text-[10px] text-bone-white/40 uppercase font-mono mb-1">
                                        Example:
                                    </div>
                                    <div className="text-xs text-bone-white/70 italic">
                                        &ldquo;{tip.example}&rdquo;
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
