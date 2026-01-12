"use client";

import { useState } from "react";
import { BookOpen, MessageCircle, FileText, Beaker, ShieldCheck } from "lucide-react";
import SMEAuditsList from "@/components/sme/SMEAuditsList";
import ProductComments from "@/components/products/ProductComments";
import SubmitExpertAudit from "@/components/sme/SubmitExpertAudit";
import BenefitsEditor from "@/components/products/BenefitsEditor";
import CommunityBenefits from "@/components/products/CommunityBenefits";
import DosageUsageSection from "@/components/products/dossier/DosageUsageSection";
import VerificationDocuments from "@/components/products/dossier/VerificationDocuments";
import { type SMEReview } from "@/app/actions/product-sme-review-actions";
import { Comment } from "@/types/comment";

interface TabbedDossierProps {
    productId: string;
    productSlug: string;
    isSME: boolean;
    // Tab 1: Expert Audits
    smeReviews: SMEReview[];
    // Tab 2 & 3: Comments (split by has_citation)
    comments: Comment[];
    // Tab 4: Specs
    ingredients?: string | null;
    aiSummary?: string | null;
    isVerified?: boolean;
    officialBenefits?: any[];
    communityBenefits?: any[];
    // New fields for enhanced specs display
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
    // Phase 2: Dosage & Usage fields
    servingSize?: string | null;
    servingsPerContainer?: string | null;
    form?: string | null;
    recommendedDosage?: string | null;
    bestTimeTake?: string | null;
    storageInstructions?: string | null;
    // Phase 2: Verification documents
    coaUrl?: string | null;
    labReportUrl?: string | null;
    certificationVaultUrls?: string[] | null;
}

type TabType = "expert_audits" | "evidence_insights" | "community_experience" | "specs";

export default function TabbedDossier({
    productId,
    productSlug,
    isSME,
    smeReviews,
    comments,
    ingredients,
    aiSummary,
    isVerified = false,
    officialBenefits = [],
    communityBenefits = [],
    manufacturer,
    price,
    servingInfo,
    targetAudience,
    coreValueProposition,
    technicalSpecs,
    excipients,
    certifications,
    technicalDocsUrl,
    allergens,
    dietaryTags,
    // Phase 2 props
    servingSize,
    servingsPerContainer,
    form,
    recommendedDosage,
    bestTimeTake,
    storageInstructions,
    coaUrl,
    labReportUrl,
    certificationVaultUrls,
}: TabbedDossierProps) {
    const [activeTab, setActiveTab] = useState<TabType>("expert_audits");

    // Filter comments by citation
    const verifiedInsights = comments.filter((c) => c.has_citation === true);
    const communityExperience = comments.filter((c) => !c.has_citation);

    const tabs = [
        {
            id: "expert_audits" as TabType,
            label: "Expert Audits",
            icon: BookOpen,
            count: smeReviews.length,
            color: "sme-gold",
        },
        {
            id: "evidence_insights" as TabType,
            label: "Evidence & Insights",
            icon: Beaker,
            count: verifiedInsights.length,
            color: "emerald-400",
        },
        {
            id: "community_experience" as TabType,
            label: "Community Experience",
            icon: MessageCircle,
            count: communityExperience.length,
            color: "purple-400",
        },
        {
            id: "specs" as TabType,
            label: "Specs",
            icon: FileText,
            count: null,
            color: "blue-400",
        },
    ];

    return (
        <div className="mb-8 md:mb-12">
            {/* Tab Switcher */}
            <div className="border-b border-white/10 mb-6 md:mb-8">
                {/* Scrollable container for mobile */}
                <div className="overflow-x-auto scrollbar-hide -mb-px">
                    <div className="flex gap-2 min-w-max md:min-w-0 md:flex-wrap snap-x snap-mandatory">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        snap-start
                                        flex items-center gap-2 px-4 md:px-6 py-3 md:py-3.5 
                                        font-mono text-xs md:text-sm uppercase tracking-wide 
                                        transition-all border-b-2 whitespace-nowrap
                                        min-h-[44px]
                                        ${isActive
                                            ? `border-${tab.color} text-${tab.color} bg-white/5`
                                            : "border-transparent text-bone-white/50 hover:text-bone-white/80 hover:bg-white/5"
                                        }
                                    `}
                                >
                                    <Icon size={16} className="flex-shrink-0" />
                                    <span className="font-semibold">{tab.label}</span>
                                    {tab.count !== null && (
                                        <span className="text-xs opacity-60">({tab.count})</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {/* Tab 1: Expert Audits */}
                {activeTab === "expert_audits" && (
                    <div className="space-y-8">
                        {/* Submit Expert Audit Form (for SMEs) */}
                        <SubmitExpertAudit productId={productId} isSME={isSME} />

                        {/* SME Audits List */}
                        <SMEAuditsList reviews={smeReviews} />
                    </div>
                )}

                {/* Tab 2: Evidence & Insights (Verified Insight stream) */}
                {activeTab === "evidence_insights" && (
                    <div>
                        <div className="mb-6 p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <Beaker className="w-5 h-5 text-emerald-400" />
                                <h3 className="font-serif text-lg font-bold text-emerald-300">
                                    Verified Insight Stream
                                </h3>
                            </div>
                            <p className="text-sm text-bone-white/70 font-mono">
                                Posts backed by citations, research, or documented evidence from the SME Evidence Vault
                            </p>
                        </div>
                        <ProductComments
                            productId={productId}
                            productSlug={productSlug}
                            initialComments={verifiedInsights}
                        />
                    </div>
                )}

                {/* Tab 3: Community Experience */}
                {activeTab === "community_experience" && (
                    <div>
                        <div className="mb-6 p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <MessageCircle className="w-5 h-5 text-purple-400" />
                                <h3 className="font-serif text-lg font-bold text-purple-300">
                                    Community Experience
                                </h3>
                            </div>
                            <p className="text-sm text-bone-white/70 font-mono">
                                Personal experiences, anecdotal reports, and subjective observations from the community
                            </p>
                        </div>
                        <ProductComments
                            productId={productId}
                            productSlug={productSlug}
                            initialComments={communityExperience}
                        />
                    </div>
                )}

                {/* Tab 4: Specs */}
                {activeTab === "specs" && (
                    <div className="space-y-8">
                        {/* Dosage & Usage Section (NEW - Phase 2) */}
                        <div className="border border-translucent-emerald bg-muted-moss p-6 md:p-8 rounded-lg">
                            <DosageUsageSection
                                servingSize={servingSize}
                                servingsPerContainer={servingsPerContainer}
                                form={form}
                                recommendedDosage={recommendedDosage}
                                bestTimeTake={bestTimeTake}
                                storageInstructions={storageInstructions}
                            />
                        </div>

                        {/* Verification Documents (NEW - Phase 2) */}
                        <VerificationDocuments
                            coaUrl={coaUrl}
                            labReportUrl={labReportUrl}
                            technicalDocsUrl={technicalDocsUrl}
                            certificationVaultUrls={certificationVaultUrls}
                        />

                        {/* Product Overview */}
                        {(manufacturer || price || servingInfo || targetAudience || coreValueProposition) && (
                            <div className="border border-translucent-emerald bg-muted-moss p-6 md:p-8 rounded-lg">
                                <h3 className="mb-6 font-serif text-xl md:text-2xl font-bold text-bone-white border-b border-white/10 pb-4">
                                    Product Overview
                                </h3>
                                <div className="grid gap-4 md:gap-6">
                                    {manufacturer && (
                                        <div>
                                            <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 block mb-2">Manufacturer</span>
                                            <p className="text-bone-white/90 text-sm md:text-base">{manufacturer}</p>
                                        </div>
                                    )}
                                    {targetAudience && (
                                        <div>
                                            <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 block mb-2">Target Audience</span>
                                            <p className="text-bone-white/90 text-sm md:text-base">{targetAudience}</p>
                                        </div>
                                    )}
                                    {coreValueProposition && (
                                        <div>
                                            <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 block mb-2">Core Value Proposition</span>
                                            <p className="text-bone-white/90 text-sm md:text-base leading-relaxed">{coreValueProposition}</p>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                        {price && (
                                            <div>
                                                <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 block mb-2">Price</span>
                                                <p className="text-bone-white/90 font-semibold text-sm md:text-base">{price}</p>
                                            </div>
                                        )}
                                        {servingInfo && (
                                            <div>
                                                <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 block mb-2">Serving Information</span>
                                                <p className="text-bone-white/90 text-sm md:text-base">{servingInfo}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Active Ingredients */}
                        {ingredients && (
                            <div className="border border-translucent-emerald bg-muted-moss p-6 md:p-8 rounded-lg">
                                <h3 className="mb-4 font-serif text-xl md:text-2xl font-bold text-bone-white border-b border-white/10 pb-4">
                                    Active Ingredients
                                </h3>
                                <p className="text-bone-white/80 leading-relaxed whitespace-pre-wrap text-sm md:text-base">
                                    {ingredients}
                                </p>
                            </div>
                        )}

                        {/* Excipients & Inactive Ingredients */}
                        {excipients && Array.isArray(excipients) && excipients.length > 0 && (
                            <div className="border border-translucent-emerald bg-muted-moss p-6 md:p-8 rounded-lg">
                                <h3 className="mb-4 font-serif text-xl md:text-2xl font-bold text-bone-white border-b border-white/10 pb-4">
                                    Excipients & Inactive Ingredients
                                </h3>
                                <p className="text-xs md:text-sm text-bone-white/60 mb-4 font-mono">
                                    Inactive ingredients that may be important for sensitive users
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {excipients.map((excipient, index) => (
                                        <span
                                            key={index}
                                            className="px-3 py-1.5 bg-white/5 border border-white/20 text-bone-white/80 text-xs md:text-sm rounded-full"
                                        >
                                            {excipient}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Technical Specifications */}
                        {technicalSpecs && Object.keys(technicalSpecs).length > 0 && (
                            <div className="border border-translucent-emerald bg-muted-moss p-6 md:p-8 rounded-lg">
                                <h3 className="mb-4 font-serif text-xl md:text-2xl font-bold text-bone-white border-b border-white/10 pb-4">
                                    Technical Specifications
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Object.entries(technicalSpecs).map(([key, value]) => (
                                        <div key={key} className="bg-white/5 border border-white/10 p-4 rounded">
                                            <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 block mb-1">
                                                {key}
                                            </span>
                                            <p className="text-bone-white/90 text-sm md:text-base">{value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Allergens & Dietary Compliance */}
                        {((allergens && Array.isArray(allergens) && allergens.filter(a => a !== "none").length > 0) || (dietaryTags && Array.isArray(dietaryTags) && dietaryTags.length > 0)) && (
                            <div className="border border-translucent-emerald bg-muted-moss p-6 md:p-8 rounded-lg">
                                <h3 className="mb-6 font-serif text-xl md:text-2xl font-bold text-bone-white border-b border-white/10 pb-4">
                                    Allergens & Dietary Compliance
                                </h3>

                                {allergens && Array.isArray(allergens) && allergens.filter(a => a !== "none").length > 0 && (
                                    <div className="mb-6">
                                        <span className="text-xs font-mono uppercase tracking-wider text-orange-400 block mb-3">
                                            ⚠️ Contains Allergens
                                        </span>
                                        <div className="flex flex-wrap gap-2">
                                            {allergens.filter(a => a !== "none").map((allergen) => (
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

                                {dietaryTags && Array.isArray(dietaryTags) && dietaryTags.length > 0 && (
                                    <div>
                                        <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 block mb-3">
                                            ✓ Dietary Compliance
                                        </span>
                                        <div className="flex flex-wrap gap-2">
                                            {dietaryTags.map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs md:text-sm font-semibold rounded-full capitalize"
                                                >
                                                    {tag.replace(/_/g, " ")}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Certifications */}
                        {certifications && Array.isArray(certifications) && certifications.length > 0 && (
                            <div className="border border-translucent-emerald bg-muted-moss p-6 md:p-8 rounded-lg">
                                <h3 className="mb-4 font-serif text-xl md:text-2xl font-bold text-bone-white border-b border-white/10 pb-4">
                                    Certifications
                                </h3>
                                <div className="flex flex-wrap gap-3">
                                    {certifications.map((cert, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-2 px-4 py-2 bg-sme-gold/10 border border-sme-gold/30 rounded-lg"
                                        >
                                            <ShieldCheck className="w-4 h-4 text-sme-gold" />
                                            <span className="text-bone-white/90 text-sm md:text-base font-semibold">{cert}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Technical Documentation */}
                        {technicalDocsUrl && (
                            <div className="border border-blue-500/30 bg-blue-900/10 p-6 md:p-8 rounded-lg">
                                <h3 className="mb-4 font-serif text-xl md:text-2xl font-bold text-bone-white border-b border-white/10 pb-4">
                                    📄 Technical Documentation
                                </h3>
                                <p className="text-bone-white/70 text-sm md:text-base mb-4">
                                    View detailed white papers, studies, and technical specifications
                                </p>
                                <a
                                    href={technicalDocsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors"
                                >
                                    <FileText className="w-4 h-4" />
                                    Download Technical Docs
                                </a>
                            </div>
                        )}

                        {/* Benefits Section */}
                        <div className="space-y-6">
                            <h3 className="font-serif text-xl md:text-2xl font-bold text-bone-white border-b border-white/10 pb-4">
                                Benefits & Evidence
                            </h3>

                            {/* Official Benefits (Verified Brands Only) */}
                            <BenefitsEditor
                                productId={productId}
                                isVerified={isVerified}
                                initialBenefits={officialBenefits}
                            />

                            {/* Community-Suggested Benefits */}
                            <CommunityBenefits
                                productId={productId}
                                initialBenefits={communityBenefits}
                            />
                        </div>

                        {/* AI Summary / Expert Notebook */}
                        {aiSummary && (
                            <div className="border border-translucent-emerald bg-muted-moss p-6 md:p-8 rounded-lg">
                                <h3 className="mb-4 font-serif text-xl md:text-2xl font-bold text-bone-white border-b border-white/10 pb-4">
                                    Expert Notebook
                                </h3>
                                <div className="prose prose-slate max-w-none 
                  prose-headings:font-serif prose-headings:text-bone-white prose-headings:font-bold
                  prose-p:text-bone-white/80 prose-p:leading-relaxed prose-p:mb-4
                  prose-strong:text-bone-white prose-strong:font-semibold
                  prose-ul:text-bone-white/80 prose-ul:leading-relaxed
                  prose-li:text-bone-white/80 prose-li:my-2
                  prose-a:text-heart-green hover:prose-a:text-emerald-300 transition-colors
                  prose-code:text-emerald-200 prose-code:bg-emerald-950/30 prose-code:px-1 prose-code:rounded
                  prose-blockquote:border-l-emerald-500/50 prose-blockquote:text-white/60">
                                    <div dangerouslySetInnerHTML={{ __html: aiSummary }} />
                                </div>
                            </div>
                        )}

                        {/* Empty State */}
                        {!ingredients && !aiSummary && officialBenefits.length === 0 && communityBenefits.length === 0 &&
                            !manufacturer && !technicalSpecs && !excipients && !certifications && (
                                <div className="text-center py-16 bg-white/5 border border-white/10 rounded-lg">
                                    <FileText className="w-12 h-12 text-bone-white/20 mx-auto mb-4" />
                                    <p className="text-bone-white/60 font-mono text-sm">
                                        No specifications available yet.
                                    </p>
                                </div>
                            )}
                    </div>
                )}
            </div>
        </div>
    );
}
