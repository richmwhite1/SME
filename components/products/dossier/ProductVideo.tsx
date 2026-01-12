"use client";

import { Video, Play } from "lucide-react";

interface ProductVideoProps {
    videoUrl?: string | null;
    productTitle: string;
}

/**
 * Detects video platform and converts URL to embeddable format
 */
function getEmbedUrl(url: string): { embedUrl: string; platform: 'youtube' | 'rumble' | 'unknown' } {
    // YouTube patterns
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        let videoId = '';

        // Extract video ID from various YouTube URL formats
        if (url.includes('watch?v=')) {
            videoId = url.split('watch?v=')[1]?.split('&')[0] || '';
        } else if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
        } else if (url.includes('embed/')) {
            // Already an embed URL
            return { embedUrl: url, platform: 'youtube' };
        }

        if (videoId) {
            return {
                embedUrl: `https://www.youtube.com/embed/${videoId}`,
                platform: 'youtube'
            };
        }
    }

    // Rumble patterns
    if (url.includes('rumble.com')) {
        // Extract video ID from Rumble URL
        // Rumble URLs are typically: rumble.com/VIDEO_SLUG or rumble.com/embed/VIDEO_ID
        if (url.includes('/embed/')) {
            // Already an embed URL
            return { embedUrl: url, platform: 'rumble' };
        }

        // Extract slug and convert to embed
        const slugMatch = url.match(/rumble\.com\/([^\/\?]+)/);
        if (slugMatch && slugMatch[1]) {
            const slug = slugMatch[1];
            return {
                embedUrl: `https://rumble.com/embed/${slug}`,
                platform: 'rumble'
            };
        }
    }

    return { embedUrl: url, platform: 'unknown' };
}

export default function ProductVideo({ videoUrl, productTitle }: ProductVideoProps) {
    if (!videoUrl) return null;

    const { embedUrl, platform } = getEmbedUrl(videoUrl);

    // Don't render if we couldn't parse the URL
    if (platform === 'unknown') {
        console.warn('Unknown video platform for URL:', videoUrl);
        return null;
    }

    return (
        <div className="mb-8 md:mb-12 border border-translucent-emerald bg-muted-moss rounded-lg overflow-hidden">
            {/* Header */}
            <div className="bg-forest-obsidian/50 border-b border-white/10 px-4 md:px-6 py-3 md:py-4">
                <div className="flex items-center gap-2">
                    <Video className="w-5 h-5 text-emerald-400" />
                    <h2 className="font-serif text-lg md:text-xl font-bold text-bone-white">
                        Product Video
                    </h2>
                    {platform === 'youtube' && (
                        <span className="ml-auto text-xs font-mono text-bone-white/50 bg-red-600/20 px-2 py-1 rounded">
                            YouTube
                        </span>
                    )}
                    {platform === 'rumble' && (
                        <span className="ml-auto text-xs font-mono text-bone-white/50 bg-green-600/20 px-2 py-1 rounded">
                            Rumble
                        </span>
                    )}
                </div>
            </div>

            {/* Video Embed */}
            <div className="relative aspect-video w-full bg-black">
                <iframe
                    className="absolute inset-0 w-full h-full"
                    src={embedUrl}
                    title={`${productTitle} - Product Video`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                />
            </div>
        </div>
    );
}
