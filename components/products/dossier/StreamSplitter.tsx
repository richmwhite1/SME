"use client";

import { useState } from "react";
import ProductComments, { Comment } from "@/components/products/ProductComments";
import { BookOpen, MessageCircle } from "lucide-react";

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
    const [activeTab, setActiveTab] = useState<'empirical' | 'anecdotal'>('empirical');

    // Filter comments based on tab
    const filteredComments = comments.filter(c => {
        if (activeTab === 'empirical') {
            return c.has_citation === true;
        } else {
            // Anecdotal: default to everything else (no citation)
            // Or should it be EVERYTHING? "Anecdotal Tab: Filters comments where has_citation = false."
            return !c.has_citation;
        }
    });

    return (
        <div className="mt-12">
            {/* Tab Switcher */}
            <div className="flex items-center justify-center mb-8">
                <div className="flex bg-white/5 border border-white/10 rounded-full p-1">
                    <button
                        onClick={() => setActiveTab('empirical')}
                        className={`
              flex items-center gap-2 px-6 py-2 rounded-full text-sm font-mono uppercase tracking-wide transition-all
              ${activeTab === 'empirical'
                                ? 'bg-emerald-900/40 text-emerald-200 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                                : 'text-white/40 hover:text-white/60'}
            `}
                    >
                        <BookOpen size={14} />
                        <span className="font-bold">Empirical</span>
                        <span className="ml-1 text-xs opacity-60">
                            ({comments.filter(c => c.has_citation).length})
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab('anecdotal')}
                        className={`
              flex items-center gap-2 px-6 py-2 rounded-full text-sm font-mono uppercase tracking-wide transition-all
              ${activeTab === 'anecdotal'
                                ? 'bg-purple-900/40 text-purple-200 border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                                : 'text-white/40 hover:text-white/60'}
            `}
                    >
                        <MessageCircle size={14} />
                        <span className="font-bold">Anecdotal</span>
                        <span className="ml-1 text-xs opacity-60">
                            ({comments.filter(c => !c.has_citation).length})
                        </span>
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
