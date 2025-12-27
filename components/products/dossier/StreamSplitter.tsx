"use client";

import { useState } from "react";
import ProductComments from "@/components/products/ProductComments";
import { Comment } from "@/types/comment";
import { BookOpen, MessageCircle, Info } from "lucide-react";

interface StreamSplitterProps {
    productId: string;
    productSlug: string;
    comments: Comment[];
}

export default function StreamSplitter({
    productId,
    productSlug,
    comments
}: StreamSplitterProps) {
    const [activeTab, setActiveTab] = useState<'verified_insight' | 'community_experience'>('verified_insight');

    // Filter comments based on tab
    const filteredComments = comments.filter(c => {
        if (activeTab === 'verified_insight') {
            return c.has_citation === true;
        } else {
            // Community Experience: comments without citations
            return !c.has_citation;
        }
    });

    return (
        <div className="mt-12">
            {/* Tab Switcher */}
            <div className="flex items-center justify-center mb-8">
                <div className="flex bg-white/5 border border-white/10 rounded-full p-1">
                    <button
                        onClick={() => setActiveTab('verified_insight')}
                        className={`
              flex items-center gap-2 px-6 py-2 rounded-full text-sm font-mono uppercase tracking-wide transition-all group relative
              ${activeTab === 'verified_insight'
                                ? 'bg-emerald-900/40 text-emerald-200 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                                : 'text-white/40 hover:text-white/60'}
            `}
                    >
                        <BookOpen size={14} />
                        <div className="flex flex-col items-start">
                            <span className="font-bold">Verified Insight</span>
                            <span className="text-[10px] opacity-60 normal-case">(Evidence Provided)</span>
                        </div>
                        <span className="ml-1 text-xs opacity-60">
                            ({comments.filter(c => c.has_citation).length})
                        </span>

                        {/* Tooltip */}
                        <div className="absolute left-0 top-full mt-2 w-64 bg-forest-obsidian border border-translucent-emerald p-2 text-xs font-normal normal-case tracking-normal opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
                            Posts backed by citations, research, or documented evidence from the SME Evidence Vault
                        </div>
                    </button>

                    <button
                        onClick={() => setActiveTab('community_experience')}
                        className={`
              flex items-center gap-2 px-6 py-2 rounded-full text-sm font-mono uppercase tracking-wide transition-all group relative
              ${activeTab === 'community_experience'
                                ? 'bg-purple-900/40 text-purple-200 border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                                : 'text-white/40 hover:text-white/60'}
            `}
                    >
                        <MessageCircle size={14} />
                        <div className="flex flex-col items-start">
                            <span className="font-bold">Community Experience</span>
                            <span className="text-[10px] opacity-60 normal-case">(Personal Observation)</span>
                        </div>
                        <span className="ml-1 text-xs opacity-60">
                            ({comments.filter(c => !c.has_citation).length})
                        </span>

                        {/* Tooltip */}
                        <div className="absolute left-0 top-full mt-2 w-64 bg-forest-obsidian border border-translucent-emerald p-2 text-xs font-normal normal-case tracking-normal opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
                            Personal experiences, anecdotal reports, and subjective observations from the community
                        </div>
                    </button>
                </div>
            </div>

            {/* Render Filtered Comments */}
            {/* We key it to force remount/reset state if needed, or rely on ProductComments implementation */}
            <ProductComments
                key={activeTab}
                productId={productId}
                productSlug={productSlug}
                initialComments={filteredComments}
            />
        </div>
    );
}
