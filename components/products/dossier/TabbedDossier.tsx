"use client";

import { useState } from "react";
import { BookOpen, MessageCircle, FileText, Beaker } from "lucide-react";
import SMEAuditsList from "@/components/sme/SMEAuditsList";
import ProductComments from "@/components/products/ProductComments";
import SubmitExpertAudit from "@/components/sme/SubmitExpertAudit";
import BenefitsEditor from "@/components/products/BenefitsEditor";
import CommunityBenefits from "@/components/products/CommunityBenefits";
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
                        {/* Ingredients */}
                        {ingredients && (
                            <div className="border border-translucent-emerald bg-muted-moss p-8 rounded-lg">
                                <h3 className="mb-4 font-serif text-2xl font-bold text-bone-white border-b border-white/10 pb-4">
                                    Active Ingredients
                                </h3>
                                <p className="text-bone-white/80 leading-relaxed whitespace-pre-wrap">
                                    {ingredients}
                                </p>
                            </div>
                        )}

                        {/* Benefits Section */}
                        <div className="space-y-6">
                            <h3 className="font-serif text-2xl font-bold text-bone-white border-b border-white/10 pb-4">
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
                            <div className="border border-translucent-emerald bg-muted-moss p-8 rounded-lg">
                                <h3 className="mb-4 font-serif text-2xl font-bold text-bone-white border-b border-white/10 pb-4">
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
                        {!ingredients && !aiSummary && officialBenefits.length === 0 && communityBenefits.length === 0 && (
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
