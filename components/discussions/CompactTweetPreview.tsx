"use client";

import { useState } from "react";
import { Tweet } from "react-tweet";
import { ChevronDown, ChevronUp, AlertCircle, ExternalLink } from "lucide-react";

interface CompactTweetPreviewProps {
    xPostUrl: string;
    context?: string;
}

export default function CompactTweetPreview({ xPostUrl, context }: CompactTweetPreviewProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [hasError, setHasError] = useState(false);

    // Extract tweet ID from URL
    const tweetId = xPostUrl.split('/status/')[1]?.split('?')[0];

    if (!tweetId) {
        return (
            <div className="mt-4 border border-red-500/30 rounded-lg p-4 bg-red-500/5 flex items-center gap-3">
                <AlertCircle className="text-red-400" size={18} />
                <div className="flex-1">
                    <p className="text-xs text-red-400 font-mono">Invalid X URL detected.</p>
                    <a href={xPostUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-bone-white/60 hover:text-bone-white flex items-center gap-1 font-mono break-all mt-1">
                        {xPostUrl} <ExternalLink size={12} />
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-4 border border-white/10 rounded-lg overflow-hidden bg-black/20 shadow-lg">
            {/* Context Header if provided */}
            {context && (
                <div className="px-4 py-2 border-b border-white/5 bg-white/5">
                    <p className="text-[11px] text-bone-white/60 italic font-mono leading-relaxed">
                        <span className="text-sme-gold not-italic mr-1">Context:</span>
                        {context}
                    </p>
                </div>
            )}

            {/* Compact Header - Always Visible */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-all duration-200 group"
            >
                <div className="flex items-center gap-2 text-xs text-bone-white/70 font-mono group-hover:text-bone-white">
                    <svg className="w-4 h-4 text-[#1DA1F2] group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    <span>{isExpanded ? "Minimize Referenced Post" : "View Referenced X Post"}</span>
                </div>
                <div className="flex items-center gap-2">
                    {!isExpanded && (
                        <span className="text-[10px] text-bone-white/30 font-mono hidden sm:inline uppercase tracking-widest">Expand Protocol</span>
                    )}
                    {isExpanded ? (
                        <ChevronUp size={16} className="text-sme-gold animate-bounce" />
                    ) : (
                        <ChevronDown size={16} className="text-bone-white/30 group-hover:text-bone-white/60" />
                    )}
                </div>
            </button>

            {/* Expanded Tweet - Collapsible */}
            {isExpanded && (
                <div className="px-4 pb-4 max-w-[500px] animate-in slide-in-from-top-2 duration-300">
                    {hasError ? (
                        <div className="py-4 flex flex-col items-center gap-3 text-center border border-white/5 rounded-lg bg-white/5">
                            <AlertCircle className="text-bone-white/30" size={24} />
                            <div>
                                <p className="text-xs text-bone-white/70 font-mono">Failed to load X embed.</p>
                                <a href={xPostUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-sme-gold hover:underline flex items-center justify-center gap-1 font-mono mt-1">
                                    View raw post on X <ExternalLink size={12} />
                                </a>
                            </div>
                        </div>
                    ) : (
                        <div className="tweet-container">
                            <Tweet id={tweetId} onError={() => setHasError(true)} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
