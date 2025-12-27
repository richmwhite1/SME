'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import SearchRadarChart from './SearchRadarChart';
import { LensSearchResult } from '@/app/actions/search-actions';

// Extended type to handle generic search results
interface ExtendedLensSearchResult extends LensSearchResult {
    result_type?: "Product" | "Discussion" | "Resource" | "Evidence" | "Review";
}

interface LensResultCardProps {
    product: ExtendedLensSearchResult;
}

export default function LensResultCard({ product }: LensResultCardProps) {
    // Safe image handling - checking for string or array
    let imageUrl: string | null = null;
    const rawImages = product.images as any;

    if (Array.isArray(rawImages) && rawImages.length > 0) {
        imageUrl = rawImages[0];
    } else if (typeof rawImages === 'string') {
        // Handle potential string serialization of array
        if (rawImages.startsWith('{')) {
            // Basic postgres array parse attempt
            const clean = rawImages.replace(/^{|}$/g, '').split(',')[0];
            imageUrl = clean.replace(/"/g, '');
        } else {
            imageUrl = rawImages;
        }
    }

    // Determine Result Type Badge
    const resultType = product.result_type || 'Product';
    const isProduct = resultType === 'Product';
    const isReview = resultType === 'Review';
    const isDiscussion = resultType === 'Discussion';

    // Job Function / Subtitle
    let subtitle = product.problem_solved;
    if (isReview) subtitle = "Community Review";
    else if (isDiscussion) subtitle = "Discussion Thread";
    else if (!subtitle) subtitle = product.result_type || "Product"; // Fallback to type instead of mock text

    // Determine Link URL
    let href = `/products/${product.slug}`;
    if (isDiscussion) href = `/community/${product.id}`;
    else if (isReview) href = `/products/${product.slug}`; // Reviews usually live on product pages, might need specific anchor later

    return (
        <Link href={href} className="block group h-full">
            <div className="relative flex flex-col h-full bg-forest-obsidian/40 border border-white/10 rounded-lg overflow-hidden transition-all duration-300 hover:border-sme-gold/40 hover:bg-forest-obsidian/60 hover:shadow-lg hover:shadow-sme-gold/5">

                {/* Top Section: Image or Default Placeholder */}
                <div className={`flex h-36 border-b border-white/5 relative bg-forest-obsidian overflow-hidden`}>
                    {imageUrl ? (
                        <Image
                            src={imageUrl}
                            alt={product.title}
                            fill
                            className="object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                        />
                    ) : (
                        <div className="w-full h-full bg-white/5 flex flex-col items-center justify-center p-4">
                            <span className="text-3xl mb-2 opacity-30">
                                {isReview ? '⭐' : isDiscussion ? '💬' : '📦'}
                            </span>
                        </div>
                    )}

                    {/* Certified Badge */}
                    {product.is_sme_certified && (
                        <div className="absolute top-2 left-2 bg-sme-gold/90 backdrop-blur-md text-forest-obsidian text-[9px] px-1.5 py-0.5 font-bold uppercase tracking-wider shadow-sm z-10">
                            Certified
                        </div>
                    )}

                    {/* Radar Chart (Overlay or Side) - Only for products with scores */}
                    {isProduct && (product.score_scientific > 0 || product.score_alternative > 0 || product.score_esoteric > 0) && (
                        <div className="absolute right-0 top-0 h-full w-[40%] bg-black/60 backdrop-blur-sm border-l border-white/5 p-1 flex items-center justify-center">
                            <SearchRadarChart
                                data={{
                                    scientific: product.score_scientific,
                                    alternative: product.score_alternative,
                                    esoteric: product.score_esoteric
                                }}
                                className="w-full h-full"
                            />
                        </div>
                    )}
                </div>

                {/* Bottom Section: Details */}
                <div className="p-5 flex-1 flex flex-col gap-3">
                    {/* Badge / Type */}
                    <div>
                        <span className={`inline-block text-[10px] uppercase tracking-widest px-2 py-1 rounded-sm border ${isReview ? 'text-blue-400 bg-blue-400/10 border-blue-400/20' :
                            isDiscussion ? 'text-purple-400 bg-purple-400/10 border-purple-400/20' :
                                'text-sme-gold/90 bg-sme-gold/10 border-sme-gold/20'
                            }`}>
                            {subtitle}
                        </span>
                    </div>

                    <h3 className="text-bone-white font-serif text-xl leading-tight group-hover:text-sme-gold transition-colors line-clamp-2">
                        {product.title}
                    </h3>

                    {/* Scores or Snippet */}
                    <div className="mt-auto pt-4 border-t border-white/5 text-white/40">
                        {isProduct ? (
                            <div className="flex justify-between items-center text-[9px] font-mono">
                                <div className="flex gap-3">
                                    <span title="Scientific Score">🧬 {product.score_scientific}%</span>
                                    <span title="Ancestral Score">🪵 {product.score_alternative}%</span>
                                    <span title="Esoteric Score">👁️ {product.score_esoteric}%</span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-[11px] font-mono leading-relaxed line-clamp-2 opacity-70">
                                {product.problem_solved}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}
