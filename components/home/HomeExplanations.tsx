"use client";

import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";
import Tooltip from "@/components/ui/Tooltip";
import { TERMINOLOGY } from "@/lib/terminology";

const PILLARS = [
    { label: "Purity", icon: "🧪" },
    { label: "Bioavailability", icon: "💊" },
    { label: "Potency", icon: "⚡" },
    { label: "Evidence", icon: "📊" },
    { label: "Sustainability", icon: "🌱" },
    { label: "Experience", icon: "✨" },
    { label: "Safety", icon: "🛡️" },
    { label: "Transparency", icon: "🔍" },
    { label: "Synergy", icon: "🔗" },
];

export default function HomeExplanations() {
    return (
        <div className="space-y-16">
            {/* Signal vs. Noise Explanation */}
            <section>
                <div className="border border-translucent-emerald/40 bg-muted-moss/20 rounded-lg p-6 md:p-8">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-heart-green shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            <h3 className="text-xl md:text-2xl font-serif font-semibold text-bone-white">Understanding Signal vs. Noise</h3>
                        </div>
                        <Tooltip content={TERMINOLOGY.SIGNAL} className="text-sme-gold text-xs font-mono">
                            <span className="flex items-center gap-1 cursor-help">
                                <Info size={14} /> What is a Signal?
                            </span>
                        </Tooltip>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="group">
                            <h4 className="text-heart-green font-semibold mb-2 flex items-center gap-2">
                                Signal
                                <Tooltip content={TERMINOLOGY.SIGNAL} />
                            </h4>
                            <p className="text-sm text-bone-white/70 font-mono leading-relaxed">
                                {TERMINOLOGY.SIGNAL} When you see products with strong community signals, it means real users and experts have verified their quality.
                            </p>
                        </div>
                        <div className="group">
                            <h4 className="text-red-400 font-semibold mb-2 flex items-center gap-2">
                                Noise
                                <Tooltip content={TERMINOLOGY.NOISE} />
                            </h4>
                            <p className="text-sm text-bone-white/70 font-mono leading-relaxed">
                                {TERMINOLOGY.NOISE} Our community-driven approach filters out the noise so you can focus on what actually works.
                            </p>
                        </div>
                    </div>
                    <Link href="/how-it-works" className="inline-flex items-center gap-2 text-xs font-mono text-sme-gold hover:text-white transition-colors mt-6">
                        Learn more about our methodology <ArrowRight size={12} />
                    </Link>
                </div>
            </section>

            {/* 9-Pillar Score Explanation */}
            <section>
                <div className="border border-translucent-emerald/40 bg-forest-obsidian/50 rounded-lg p-6 md:p-8">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-sme-gold shadow-[0_0_8px_rgba(212,175,55,0.5)]" />
                            <h3 className="text-xl md:text-2xl font-serif font-semibold text-bone-white">The 9-Pillar Analysis</h3>
                        </div>
                        <Tooltip content={TERMINOLOGY.NINE_PILLAR_ANALYSIS} className="text-sme-gold text-xs font-mono">
                            <span className="flex items-center gap-1 cursor-help">
                                <Info size={14} /> View Methodology
                            </span>
                        </Tooltip>
                    </div>
                    <p className="text-sm text-bone-white/70 font-mono leading-relaxed mb-8 max-w-3xl">
                        Every product is evaluated across nine critical dimensions of quality and transparency. Our <span className="text-sme-gold">Subject Matter Experts (SMEs)</span> conduct deep-dive audits to ensure each pillar meets our rigorous standards.
                    </p>

                    <div className="grid grid-cols-3 md:grid-cols-9 gap-3 mb-8">
                        {PILLARS.map((pillar) => (
                            <div key={pillar.label} className="flex flex-col items-center text-center p-3 bg-muted-moss/30 rounded border border-translucent-emerald/20 hover:border-sme-gold/30 transition-colors">
                                <span className="text-2xl mb-2">{pillar.icon}</span>
                                <span className="text-[10px] font-mono text-bone-white/80 uppercase">{pillar.label}</span>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-6">
                        <div className="flex-1">
                            <h4 className="text-xs font-mono text-sme-gold uppercase tracking-widest mb-2 flex items-center gap-2">
                                SME Reviews
                                <Tooltip content={TERMINOLOGY.SME_REVIEWS} />
                            </h4>
                            <p className="text-xs text-bone-white/60 font-mono leading-relaxed">
                                {TERMINOLOGY.SME_REVIEWS}
                            </p>
                        </div>
                        <div className="flex-1">
                            <h4 className="text-xs font-mono text-heart-green uppercase tracking-widest mb-2 flex items-center gap-2">
                                Community Signals
                                <Tooltip content={TERMINOLOGY.COMMUNITY_SIGNALS} />
                            </h4>
                            <p className="text-xs text-bone-white/60 font-mono leading-relaxed">
                                {TERMINOLOGY.COMMUNITY_SIGNALS}
                            </p>
                        </div>
                    </div>

                    <div className="mt-8">
                        <Link href="/standards" className="inline-flex items-center gap-2 text-xs font-mono text-sme-gold hover:text-white transition-colors">
                            View detailed SME Standards <ArrowRight size={12} />
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
