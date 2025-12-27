"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Hand, MessageCircle, AlertTriangle } from "lucide-react";

interface SignaledItem {
    id: string;
    content: string;
    type: 'discussion' | 'product';
    raise_hand_count: number;
    created_at: string;
    author_name: string | null;
    author_username: string | null;
    discussion_slug?: string;
    discussion_title?: string;
    product_slug?: string;
    product_title?: string;
    has_sme_reply: boolean;
}

interface SMEPriorityQueueProps {
    items: SignaledItem[];
}

export default function SMEPriorityQueue({ items }: SMEPriorityQueueProps) {
    const [needsExpertOnly, setNeedsExpertOnly] = useState(false);

    const filteredItems = needsExpertOnly
        ? items.filter(item => !item.has_sme_reply)
        : items;

    const getUrgencyColor = (count: number) => {
        if (count >= 10) return "text-red-400 border-red-400/30 bg-red-400/10";
        if (count >= 5) return "text-yellow-400 border-yellow-400/30 bg-yellow-400/10";
        return "text-sme-gold border-sme-gold/30 bg-sme-gold/10";
    };

    const getUrgencyLabel = (count: number) => {
        if (count >= 10) return "URGENT";
        if (count >= 5) return "TRENDING";
        return "SIGNAL";
    };

    return (
        <div className="space-y-4">
            {/* Filter Toggle */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h2 className="text-xl font-serif text-bone-white">Priority Queue</h2>
                <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                        type="checkbox"
                        checked={needsExpertOnly}
                        onChange={(e) => setNeedsExpertOnly(e.target.checked)}
                        className="w-4 h-4 rounded border-heart-green/30 bg-forest-obsidian text-heart-green focus:ring-heart-green focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="text-sm font-mono uppercase tracking-wider text-bone-white/60 group-hover:text-bone-white transition-colors">
                        Needs Expert Only
                    </span>
                </label>
            </div>

            {/* Queue Items */}
            {filteredItems.length === 0 ? (
                <div className="text-center py-12 text-bone-white/40 font-mono">
                    {needsExpertOnly ? "No items need expert attention" : "No signaled items"}
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredItems.map((item) => {
                        const link = item.type === 'discussion'
                            ? `/discussions/${item.discussion_slug}?commentId=${item.id}`
                            : `/products/${item.product_slug}?commentId=${item.id}`;

                        const title = item.type === 'discussion' ? item.discussion_title : item.product_title;
                        const isUrgent = item.raise_hand_count >= 10;

                        return (
                            <Link
                                key={item.id}
                                href={link}
                                className={`block border border-translucent-emerald bg-muted-moss p-4 transition-all hover:border-heart-green hover:shadow-[0_0_15px_-5px_rgba(16,185,129,0.1)] ${isUrgent ? 'animate-pulse-slow' : ''}`}
                            >
                                <div className="flex items-start gap-4">
                                    {/* Signal Count Badge */}
                                    <div className={`flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 border rounded ${getUrgencyColor(item.raise_hand_count)}`}>
                                        <Hand size={20} className="mb-1" />
                                        <span className="text-xs font-mono font-bold">{item.raise_hand_count}</span>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 border rounded ${getUrgencyColor(item.raise_hand_count)}`}>
                                                {getUrgencyLabel(item.raise_hand_count)}
                                            </span>
                                            <span className="text-[10px] font-mono uppercase tracking-wider text-bone-white/50">
                                                {item.type}
                                            </span>
                                            {item.has_sme_reply && (
                                                <span className="text-[10px] font-mono uppercase tracking-wider text-heart-green/80 border border-heart-green/30 bg-heart-green/10 px-2 py-0.5 rounded">
                                                    Has SME Reply
                                                </span>
                                            )}
                                            <span className="text-[10px] font-mono text-bone-white/40">
                                                • Raised {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                                            </span>
                                        </div>

                                        <h3 className="text-sm font-semibold text-bone-white mb-1 truncate">
                                            {title || "Untitled"}
                                        </h3>

                                        <p className="text-sm text-bone-white/70 font-mono line-clamp-2 mb-2">
                                            {item.content}
                                        </p>

                                        <div className="flex items-center gap-3 text-[10px] text-bone-white/50 font-mono">
                                            <span>by {item.author_name || item.author_username || "Anonymous"}</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
