"use client";

import { useState, useEffect } from "react";
import { ExternalLink, Loader2, CheckCircle2 } from "lucide-react";

interface SourceMetadata {
    title?: string;
    favicon?: string;
    description?: string;
    siteName?: string;
}

interface SourcePreviewCardProps {
    url: string;
    metadata?: SourceMetadata;
    loading?: boolean;
    className?: string;
}

export default function SourcePreviewCard({
    url,
    metadata,
    loading = false,
    className = ""
}: SourcePreviewCardProps) {
    const [localMetadata, setLocalMetadata] = useState<SourceMetadata | null>(metadata || null);
    const [isLoading, setIsLoading] = useState(loading);
    const [error, setError] = useState(false);

    useEffect(() => {
        // If metadata is provided, use it
        if (metadata) {
            setLocalMetadata(metadata);
            setIsLoading(false);
            return;
        }

        // Otherwise, fetch metadata
        const fetchMetadata = async () => {
            setIsLoading(true);
            setError(false);

            try {
                const response = await fetch(`/api/metadata?url=${encodeURIComponent(url)}`);
                if (!response.ok) throw new Error('Failed to fetch metadata');

                const data = await response.json();
                setLocalMetadata(data);
            } catch (err) {
                console.error('Error fetching metadata:', err);
                setError(true);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMetadata();
    }, [url, metadata]);

    // Extract domain from URL for fallback display
    const getDomain = (url: string) => {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.replace('www.', '');
        } catch {
            return url;
        }
    };

    return (
        <div className={`border border-translucent-emerald bg-muted-moss/50 p-3 ${className}`}>
            {/* Truth Signal Badge */}
            <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-1.5 bg-emerald-900/40 border border-emerald-500/30 px-2 py-1 rounded">
                    <CheckCircle2 size={12} className="text-emerald-400" />
                    <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300">
                        Truth Signal Active
                    </span>
                </div>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center gap-2 text-bone-white/50">
                    <Loader2 size={14} className="animate-spin" />
                    <span className="text-xs font-mono">Loading source preview...</span>
                </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
                <div className="space-y-1">
                    <p className="text-xs text-bone-white/70 font-mono">
                        Unable to load preview
                    </p>
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-heart-green hover:text-heart-green/80 transition-colors font-mono"
                    >
                        <ExternalLink size={12} />
                        <span className="truncate">{getDomain(url)}</span>
                    </a>
                </div>
            )}

            {/* Success State with Metadata */}
            {!isLoading && !error && localMetadata && (
                <div className="flex items-start gap-3">
                    {/* Favicon */}
                    {localMetadata.favicon && (
                        <img
                            src={localMetadata.favicon}
                            alt=""
                            className="w-4 h-4 mt-0.5 flex-shrink-0"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        {/* Title */}
                        {localMetadata.title && (
                            <h4 className="text-sm font-medium text-bone-white mb-1 line-clamp-2">
                                {localMetadata.title}
                            </h4>
                        )}

                        {/* Description */}
                        {localMetadata.description && (
                            <p className="text-xs text-bone-white/60 mb-2 line-clamp-2 font-mono">
                                {localMetadata.description}
                            </p>
                        )}

                        {/* Site Name & Link */}
                        <div className="flex items-center gap-2">
                            {localMetadata.siteName && (
                                <span className="text-[10px] text-bone-white/50 font-mono uppercase">
                                    {localMetadata.siteName}
                                </span>
                            )}
                            <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-[10px] text-heart-green hover:text-heart-green/80 transition-colors font-mono"
                            >
                                <ExternalLink size={10} />
                                <span>View Source</span>
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* Fallback: Just show URL if no metadata */}
            {!isLoading && !error && !localMetadata && (
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-heart-green hover:text-heart-green/80 transition-colors font-mono"
                >
                    <ExternalLink size={12} />
                    <span className="truncate">{getDomain(url)}</span>
                </a>
            )}
        </div>
    );
}
