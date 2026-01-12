"use client";

import React, { useState } from "react";
import { FileText, Users, Activity, Microscope, ArrowRight, Download, ExternalLink, ShieldAlert, Award, ShieldCheck } from "lucide-react";
import DualTrackRadar from "@/components/sme/DualTrackRadar";
import ProductComments from "@/components/products/ProductComments";

interface TabbedDossierProps {
    productId: string;
    productSlug: string;
    isSME: boolean;
    smeReviews: any[];
    avgSMEScores: any;
    smeReviewCount: number;
    comments: any[];
    ingredients?: string | null;
    aiSummary?: string | null;
    isVerified: boolean;
    officialBenefits: any[];
    communityBenefits: any[];
    manufacturer?: string | null;
    price?: string | null;
    servingInfo?: string | null;
    targetAudience?: string | null;
    coreValueProposition?: string | null;
    technicalSpecs?: Record<string, string> | null;
    excipients?: string[] | null;
    certifications?: string[] | null;
    technicalDocsUrl?: string | null;
    allergens?: string[] | null;
    dietaryTags?: string[] | null;
    servingSize?: string | null;
    servingsPerContainer?: string | null;
    form?: string | null;
    recommendedDosage?: string | null;
    bestTimeTake?: string | null;
    storageInstructions?: string | null;
    coaUrl?: string | null;
    labReportUrl?: string | null;
    certificationVaultUrls?: string[] | null;
    brandOwnerId?: string | null;
    warnings?: string | null;
}

export default function TabbedDossier(props: TabbedDossierProps) {
    const [activeTab, setActiveTab] = useState<"expert_audits" | "evidence" | "community" | "specs">("expert_audits");

    const tabs = [
        { id: "expert_audits", label: "Expert Audits", icon: Microscope },
        { id: "evidence", label: "Evidence & Insights", icon: Activity },
        { id: "community", label: "Community Experience", icon: Users },
        { id: "specs", label: "Specs", icon: FileText },
    ] as const;

    return (
        <div className="bg-forest-obsidian/50 border border-translucent-emerald/30 rounded-xl overflow-hidden shadow-2xl backdrop-blur-sm">

            {/* Tab Navigation */}
            <div className="flex border-b border-translucent-emerald/30 overflow-x-auto scrollbar-hide">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-mono tracking-wide transition-all border-b-2 whitespace-nowrap ${isActive
                                ? "border-sme-gold text-sme-gold bg-sme-gold/5"
                                : "border-transparent text-bone-white/60 hover:text-bone-white hover:bg-white/5"
                                }`}
                        >
                            <Icon size={16} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div className="p-6 md:p-8 min-h-[400px]">

                {/* 1. EXPERT AUDITS TAB */}
                {activeTab === "expert_audits" && (
                    <div className="space-y-12">
                        <div className="text-center max-w-2xl mx-auto mb-8">
                            <h2 className="text-2xl font-serif text-bone-white mb-2">9-Pillar Analysis</h2>
                            <p className="text-bone-white/60">Comprehensive evaluation by verified Subject Matter Experts.</p>
                        </div>

                        {/* 9-Pillar Radar Chart (Moved from Hero) */}
                        <div className="max-w-3xl mx-auto mb-8">
                            <DualTrackRadar
                                smeScores={props.avgSMEScores}
                                smeReviewCount={props.smeReviewCount}
                            />
                        </div>

                        {/* SME Reviews List (Placeholder or Component) */}
                        <div className="border-t border-translucent-emerald/30 pt-8">
                            <h3 className="text-lg font-mono text-sme-gold mb-4">Expert Reviews ({props.smeReviewCount})</h3>
                            {props.smeReviewCount > 0 ? (
                                <div className="space-y-4">
                                    <p className="text-bone-white/60 italic">Detailed reviews available for authorized members.</p>
                                </div>
                            ) : (
                                <div className="text-center p-8 bg-white/5 rounded-lg border border-dashed border-white/10">
                                    <Microscope size={32} className="mx-auto text-bone-white/20 mb-3" />
                                    <p className="text-bone-white/50">No expert audits filed yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 2. EVIDENCE & INSIGHTS TAB */}
                {activeTab === "evidence" && (
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-2xl font-serif text-bone-white mb-6">Scientific & Clinical Evidence</h2>

                            {/* Official Benefits (Claims) */}
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
                                {props.officialBenefits.map((benefit: any, idx: number) => (
                                    <div key={idx} className="bg-white/5 p-4 rounded-lg border border-translucent-emerald/20">
                                        <div className="flex items-start justify-between mb-2">
                                            <h4 className="font-semibold text-emerald-400">{benefit.benefit_title}</h4>
                                            {benefit.is_verified && <CheckCircle size={14} className="text-emerald-500" />}
                                        </div>
                                        <p className="text-sm text-bone-white/70 mb-3">{benefit.content || "Verified efficacy claim."}</p>
                                        {benefit.citation_url && (
                                            <a href={benefit.citation_url} target="_blank" rel="noopener noreferrer" className="text-xs text-sme-gold hover:underline flex items-center gap-1">
                                                <ExternalLink size={10} /> Source
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* AI Summary */}
                            {props.aiSummary && (
                                <div className="bg-pagemind-blue/10 border border-pagemind-blue/30 p-6 rounded-xl">
                                    <h3 className="text-pagemind-blue font-mono text-sm uppercase mb-3 flex items-center gap-2">
                                        <Activity size={16} /> AI Research Synthesis
                                    </h3>
                                    <p className="text-bone-white/80 leading-relaxed text-sm md:text-base">
                                        {props.aiSummary}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 3. COMMUNITY EXPERIENCE TAB */}
                {activeTab === "community" && (
                    <div className="space-y-8">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-serif text-bone-white">Community Experience</h2>
                            <div className="text-sm font-mono text-sme-gold px-3 py-1 bg-sme-gold/10 rounded-full border border-sme-gold/20">
                                {props.comments.length} Contributions
                            </div>
                        </div>

                        {/* Comments Component */}
                        <div className="bg-black/20 rounded-xl p-4 md:p-6">
                            <ProductComments
                                productId={props.productId}
                                productSlug={props.productSlug}
                                initialComments={props.comments}
                            />
                        </div>
                    </div>
                )}

                {/* 4. SPECS TAB */}
                {activeTab === "specs" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
                        {/* Column 1: Technical & Formulation */}
                        <div className="space-y-6">
                            <h3 className="font-mono text-sme-gold flex items-center gap-2 border-b border-white/10 pb-2">
                                <FileText size={16} /> Formulation Details
                            </h3>

                            <dl className="space-y-4 text-sm">
                                <div className="grid grid-cols-3 gap-4">
                                    <dt className="text-bone-white/50">Form</dt>
                                    <dd className="col-span-2 text-bone-white">{props.form || "N/A"}</dd>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <dt className="text-bone-white/50">Ingredients</dt>
                                    <dd className="col-span-2 text-bone-white break-words">
                                        {props.ingredients || "See label"}
                                    </dd>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <dt className="text-bone-white/50">Excipients</dt>
                                    <dd className="col-span-2 text-bone-white">{props.excipients?.join(", ") || "None listed"}</dd>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <dt className="text-bone-white/50">Allergens</dt>
                                    <dd className="col-span-2 text-bone-white">{props.allergens?.join(", ") || "None listed"}</dd>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <dt className="text-bone-white/50">Dietary</dt>
                                    <dd className="col-span-2 text-bone-white">{props.dietaryTags?.join(", ").replace(/_/g, " ") || "N/A"}</dd>
                                </div>
                            </dl>
                        </div>

                        {/* Column 2: Usage & Verification */}
                        <div className="space-y-6">
                            <h3 className="font-mono text-sme-gold flex items-center gap-2 border-b border-white/10 pb-2">
                                <ShieldCheck size={16} /> Usage & Safety
                            </h3>

                            <dl className="space-y-4 text-sm">
                                <div className="grid grid-cols-3 gap-4">
                                    <dt className="text-bone-white/50">Serving Size</dt>
                                    <dd className="col-span-2 text-bone-white">{props.servingSize || "N/A"}</dd>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <dt className="text-bone-white/50">Dosage</dt>
                                    <dd className="col-span-2 text-bone-white">{props.recommendedDosage || "As directed"}</dd>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <dt className="text-bone-white/50">Best Time</dt>
                                    <dd className="col-span-2 text-bone-white">{props.bestTimeTake || "Anytime"}</dd>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <dt className="text-bone-white/50">Storage</dt>
                                    <dd className="col-span-2 text-bone-white">{props.storageInstructions || "Cool, dry place"}</dd>
                                </div>
                                {props.warnings && (
                                    <div className="grid grid-cols-3 gap-4 bg-red-900/10 p-2 rounded">
                                        <dt className="text-red-400">Warnings</dt>
                                        <dd className="col-span-2 text-red-200">{props.warnings}</dd>
                                    </div>
                                )}
                            </dl>

                            <div className="pt-4 space-y-3">
                                {props.technicalDocsUrl && (
                                    <a href={props.technicalDocsUrl} target="_blank" className="flex items-center gap-2 text-sme-gold hover:text-white transition-colors text-sm border border-sme-gold/30 p-2 rounded hover:bg-sme-gold/10">
                                        <FileText size={16} /> Technical Documentation
                                    </a>
                                )}
                                {props.labReportUrl && (
                                    <a href={props.labReportUrl} target="_blank" className="flex items-center gap-2 text-emerald-400 hover:text-white transition-colors text-sm border border-emerald-500/30 p-2 rounded hover:bg-emerald-500/10">
                                        <Microscope size={16} /> Lab Analysis Report
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

function CheckCircle({ size, className }: { size: number, className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    )
}
