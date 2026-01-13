'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import SearchRadarChart from './SearchRadarChart';
import { LensSearchResult } from '@/app/actions/search-actions';

interface LensResultCardProps {
    product: LensSearchResult;
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

    // Job Function fallback
    const jobFunction = product.problem_solved || "Holistic Protocol";

    return (
        <Link href={`/products/${product.slug}`} className="block group h-full">
            <div className="relative flex flex-col h-full bg-forest-obsidian/40 border border-white/10 rounded-lg overflow-hidden transition-all duration-300 hover:border-sme-gold/40 hover:bg-forest-obsidian/60 hover:shadow-lg hover:shadow-sme-gold/5">

                {/* Top Section: Image & Radar */}
                <div className="flex h-36 border-b border-white/5">
                    {/* Image (Left 60%) */}
                    <div className="relative w-[60%] h-full bg-forest-obsidian overflow-hidden">
                        {imageUrl ? (
                            <Image
                                src={imageUrl}
                                alt={product.title}
                                fill
                                className="object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                            />
                        ) : (
                            <div className="relative w-full h-full bg-forest-obsidian">
                                <Image
                                    src={getPlaceholderImage(product.id)}
                                    alt={product.title}
                                    fill
                                    className="object-cover opacity-30 group-hover:opacity-40 transition-opacity"
                                />
                            </div>
                        )}
                        {product.is_sme_certified && (
                            <div className="absolute top-2 left-2 bg-sme-gold/90 backdrop-blur-md text-forest-obsidian text-[9px] px-1.5 py-0.5 font-bold uppercase tracking-wider shadow-sm">
                                Certified
                            </div>
                        )}
                    </div>

                    {/* Radar (Right 40%) */}
                    <div className="w-[40%] h-full bg-black/40 flex items-center justify-center p-1 backdrop-blur-sm border-l border-white/5">
                        <SearchRadarChart
                            data={{
                                scientific: product.score_scientific,
                                alternative: product.score_alternative,
                                esoteric: product.score_esoteric
                            }}
                            className="w-full h-full"
                        />
                    </div>
                </div>

                {/* Bottom Section: Details */}
                <div className="p-5 flex-1 flex flex-col gap-3">
                    {/* Job Function */}
                    <div>
                        <span className="inline-block text-[10px] uppercase tracking-widest text-sme-gold/90 bg-sme-gold/10 border border-sme-gold/20 px-2 py-1 rounded-sm">
                            {jobFunction}
                        </span>
                    </div>

                    <h3 className="text-bone-white font-serif text-xl leading-tight group-hover:text-sme-gold transition-colors">
                        {product.title}
                    </h3>

                    {/* Scores (Text fallback/Enhancement) */}
                    <div className="mt-auto pt-4 flex justify-between items-center text-[9px] text-white/40 font-mono border-t border-white/5">
                        <div className="flex gap-3">
                            <span title="Scientific Score">🧬 {product.score_scientific}%</span>
                            <span title="Ancestral Score">🪵 {product.score_alternative}%</span>
                            <span title="Esoteric Score">👁️ {product.score_esoteric}%</span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
