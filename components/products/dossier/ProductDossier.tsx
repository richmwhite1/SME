"use client";

import React from "react";
import { FileText, Users, Activity, Microscope, ExternalLink, ShieldCheck } from "lucide-react";
import ProductComments from "@/components/products/ProductComments";
import NinePillarDetail from "@/components/products/NinePillarDetail";
import EmptyState from "@/components/ui/EmptyState";

interface ProductDossierProps {
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

export default function ProductDossier(props: ProductDossierProps) {
    return (
        <div className="space-y-0 pb-16">

            {/* 1. COMMUNITY EXPERIENCE (Prominent) */}
            <section id="community-experience" className="bg-forest-obsidian py-12 scroll-mt-24 border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 md:px-0">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-serif text-bone-white flex items-center gap-2">
                            <Users className="text-sme-gold" size={24} />
                            Community Experience
                        </h2>
                        <div className="text-sm font-mono text-sme-gold px-3 py-1 bg-sme-gold/10 rounded-full border border-sme-gold/20">
                            {props.comments.length} Contributions
                        </div>
                    </div>

                    <div className="bg-forest-obsidian/50 border border-translucent-emerald/30 rounded-xl p-4 md:p-8 shadow-lg backdrop-blur-sm">
                        <ProductComments
                            productId={props.productId}
                            productSlug={props.productSlug}
                            initialComments={props.comments}
                        />
                    </div>
                </div>
            </section>


            {/* 2. EVIDENCE & INSIGHTS */}
            <section id="evidence-insights" className="bg-white/5 py-12 scroll-mt-24 border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 md:px-0">
                    <div className="mb-8">
                        <h2 className="text-2xl font-serif text-bone-white flex items-center gap-2 mb-2">
                            <Activity className="text-emerald-400" size={24} />
                            Evidence & Insights
                        </h2>
                        <p className="text-bone-white/60">Scientific validation and verified claims.</p>
                    </div>

                    {/* AI Summary */}
                    {props.aiSummary && (
                        <div className="mb-8 bg-pagemind-blue/10 border border-pagemind-blue/30 p-6 rounded-xl">
                            <h3 className="text-pagemind-blue font-mono text-sm uppercase mb-3 flex items-center gap-2">
                                <Activity size={16} /> AI Research Synthesis
                            </h3>
                            <p className="text-bone-white/80 leading-relaxed text-sm md:text-base">
                                {props.aiSummary}
                            </p>
                        </div>
                    )}

                    {/* Official Benefits (Claims) */}
                    {props.officialBenefits.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {props.officialBenefits.map((benefit: any, idx: number) => (
                                <div key={idx} className="bg-forest-obsidian/50 p-4 rounded-lg border border-translucent-emerald/20 hover:border-emerald-400/30 transition-colors">
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
                    ) : (
                        <EmptyState
                            icon={Activity}
                            title="No Scientific Evidence Yet"
                            description="Help build the evidence base for this product! Share peer-reviewed studies, clinical trials, or verified research that supports or questions this product's claims."
                            variant="encouraging"
                            primaryCTA={{
                                label: "Submit Evidence",
                                href: `/products/${props.productSlug}?action=add-evidence`
                            }}
                        />
                    )}
                </div>
            </section>

            {/* 3. EXPERT AUDITS */}
            <section id="sme-deep-dive" className="bg-forest-obsidian py-12 scroll-mt-24 border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 md:px-0">
                    <div className="text-center max-w-2xl mx-auto mb-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sme-gold/10 border border-sme-gold/20 text-sme-gold text-xs font-mono uppercase tracking-wider mb-4">
                            <Microscope size={12} />
                            SME Analysis
                        </div>
                        <h2 className="text-3xl font-serif text-bone-white mb-2">Expert Audits</h2>
                        <p className="text-bone-white/60">Comprehensive evaluation by verified Subject Matter Experts.</p>
                    </div>

                    <div className="bg-white/5 border border-translucent-emerald/20 rounded-xl p-6 md:p-8">
                        <NinePillarDetail
                            avgScores={props.avgSMEScores}
                            reviewCount={props.smeReviewCount}
                            initiallyExpanded={false}
                        />

                        {/* SME Reviews List Placeholder */}
                        <div className="border-t border-white/10 mt-8 pt-8">
                            <h3 className="text-lg font-mono text-sme-gold mb-4">Expert Reviews ({props.smeReviewCount})</h3>
                            {props.smeReviewCount > 0 ? (
                                <div className="space-y-4">
                                    <p className="text-bone-white/60 italic">Detailed reviews available for authorized members.</p>
                                </div>
                            ) : (
                                <EmptyState
                                    icon={Microscope}
                                    title="No Expert Audits Yet"
                                    description="Be the first to share your professional analysis of this product! Expert audits help the community make informed decisions based on scientific evidence and real-world experience."
                                    variant="encouraging"
                                    primaryCTA={{
                                        label: "Become an SME",
                                        href: "/settings?tab=sme"
                                    }}
                                    secondaryCTA={{
                                        label: "Learn About SME Status",
                                        href: "/how-it-works#sme"
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. SPECS */}
            <section id="specs" className="bg-white/5 py-12 scroll-mt-24">
                <div className="max-w-7xl mx-auto px-4 md:px-0">
                    <div className="mb-8">
                        <h2 className="text-2xl font-serif text-bone-white flex items-center gap-2">
                            <FileText className="text-bone-white/70" size={24} />
                            Detailed Specifications
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 bg-forest-obsidian rounded-xl p-6 md:p-8 border border-white/10">
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
                                    <dd className="col-span-2 text-bone-white">
                                        {Array.isArray(props.excipients) ? props.excipients.join(", ") : (props.excipients || "None listed")}
                                    </dd>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <dt className="text-bone-white/50">Allergens</dt>
                                    <dd className="col-span-2 text-bone-white">
                                        {Array.isArray(props.allergens) ? props.allergens.join(", ") : (props.allergens || "None listed")}
                                    </dd>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <dt className="text-bone-white/50">Dietary</dt>
                                    <dd className="col-span-2 text-bone-white">
                                        {Array.isArray(props.dietaryTags) ? props.dietaryTags.join(", ").replace(/_/g, " ") : (props.dietaryTags ? String(props.dietaryTags).replace(/_/g, " ") : "N/A")}
                                    </dd>
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
                </div>
            </section>

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
