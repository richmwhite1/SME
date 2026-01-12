"use client";

import React from "react";
import Image from "next/image";
import { ArrowUp, Award, CheckCircle, Info, ShieldCheck, Heart, User, Share2, ThumbsUp } from "lucide-react";
import VoteControl from "@/components/ui/VoteControl";
import StarRatingDisplay from "@/components/products/StarRatingDisplay";
import BuyNowButton from "@/components/products/BuyNowButton";
import Tooltip from "@/components/ui/Tooltip";
import ProductQuadrantGrid from "@/components/products/dossier/ProductQuadrantGrid";

interface HeroSectionProps {
    title: string;
    brand: string;
    images: string[];
    productId: string;
    upvoteCount: number;
    aggregateStarRating?: number | null;
    totalStarReviews?: number;
    isSMECertified: boolean;
    isVerified: boolean;
    buyUrl?: string | null;
    discountCode?: string | null;
    smeTrustScore?: number | null;
    communitySentiment?: number;
    activeIngredients?: any[];
    servingSize?: string | null;
    servingsPerContainer?: string | null;
    form?: string | null;
    price?: string | null;
    coreValueProposition?: string | null;
    officialBenefits?: any[];
    allergens?: string[] | null;
    dietaryTags?: string[] | null;
    warnings?: string | null;
    manufacturer?: string | null;
    certifications?: string[] | null;
    labTested?: boolean;
    servingInfo?: string | null;
    targetAudience?: string | null;
}

export default function HeroSection({
    title,
    brand,
    images,
    productId,
    upvoteCount,
    aggregateStarRating,
    totalStarReviews = 0,
    isSMECertified,
    isVerified,
    buyUrl,
    discountCode,
    smeTrustScore,
    communitySentiment,
    activeIngredients = [],
    servingSize,
    servingsPerContainer,
    form,
    price,
    coreValueProposition,
    officialBenefits = [],
    allergens,
    dietaryTags,
    warnings,
    manufacturer,
    certifications,
    labTested,
    servingInfo,
    targetAudience
}: HeroSectionProps) {
    const [activeImageIndex, setActiveImageIndex] = React.useState(0);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12">
            {/* LEFT COLUMN: Images */}
            <div className="space-y-4">
                {/* Main Image */}
                <div className="aspect-square bg-white rounded-2xl overflow-hidden relative border border-translucent-emerald/30 shadow-xl group">
                    {images.length > 0 ? (
                        <Image
                            src={images[activeImageIndex]}
                            alt={title}
                            fill
                            className="object-contain p-8 group-hover:scale-105 transition-transform duration-500"
                            priority
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-bone-white/30 bg-white/5">
                            <Info size={48} className="mb-2" />
                            <p className="font-mono text-sm">No image available</p>
                        </div>
                    )}

                    {/* Floating Badges */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                        {isSMECertified && (
                            <Tooltip content="Verified by Subject Matter Experts">
                                <div className="bg-sme-gold text-forest-obsidian px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-1.5">
                                    <Award size={14} /> SME Certified
                                </div>
                            </Tooltip>
                        )}
                        {isVerified && !isSMECertified && (
                            <div className="bg-emerald-500 text-white px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-1.5">
                                <CheckCircle size={14} /> Validated
                            </div>
                        )}
                    </div>
                </div>

                {/* Thumbnails */}
                {images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {images.map((img, idx) => (
                            <button
                                key={idx}
                                onClick={() => setActiveImageIndex(idx)}
                                className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-all shrink-0 bg-white ${activeImageIndex === idx ? 'border-sme-gold shadow-md scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                                    }`}
                            >
                                <Image
                                    src={img}
                                    alt={`${title} view ${idx + 1}`}
                                    fill
                                    className="object-contain p-2"
                                />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* RIGHT COLUMN: Info & Actions */}
            <div className="flex flex-col">
                {/* Header Info */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-sm font-mono text-sme-gold/80 uppercase tracking-widest">
                            {brand}
                            {isVerified && <CheckCircle size={14} className="text-emerald-400" />}
                        </div>
                        {/* Upvote & Share */}
                        <div className="flex items-center gap-3">
                            <button className="text-bone-white/60 hover:text-white transition-colors">
                                <Share2 size={18} />
                            </button>
                        </div>
                    </div>

                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-bone-white mb-4 leading-tight">
                        {title}
                    </h1>

                    {/* Ratings & Scores */}
                    <div className="flex flex-wrap items-center gap-6 text-sm">
                        {/* Community Score */}
                        <div className="flex items-center gap-2">
                            <div className="flex bg-black/30 rounded-full p-1 pl-3 pr-3 items-center gap-2 border border-white/10">
                                <Heart size={14} className="text-red-400 fill-red-400" />
                                <span className="font-bold text-white">{communitySentiment || 0}%</span>
                                <span className="text-white/50 text-xs">Community Score</span>
                            </div>
                        </div>

                        {/* Star Rating */}
                        <div className="flex items-center gap-2">
                            <StarRatingDisplay rating={aggregateStarRating || 0} />
                            <span className="text-bone-white/60 underline decoration-white/30 underline-offset-4 hover:text-white cursor-pointer">
                                {totalStarReviews} reviews
                            </span>
                        </div>
                    </div>
                </div>

                {/* MAIN QUADRANT GRID */}
                <div className="mb-6">
                    <ProductQuadrantGrid
                        activeIngredients={activeIngredients}
                        servingSize={servingSize}
                        servingsPerContainer={servingsPerContainer}
                        form={form}
                        price={price}
                        coreValueProposition={coreValueProposition}
                        officialBenefits={officialBenefits}
                        allergens={allergens}
                        dietaryTags={dietaryTags}
                        warnings={warnings}
                        manufacturer={manufacturer}
                        certifications={certifications}
                        labTested={labTested}
                        isVerified={isVerified}
                    />
                </div>

                {/* Primary Actions */}
                <div className="mt-auto pt-6 border-t border-translucent-emerald/20 flex flex-col sm:flex-row gap-4 items-center">
                    {buyUrl ? (
                        <div className="w-full sm:flex-1">
                            <BuyNowButton
                                productId={productId}
                                productTitle={title}
                                buyUrl={buyUrl}
                                discountCode={discountCode}
                            />
                            {discountCode && (
                                <div className="mt-2 text-center text-xs font-mono text-emerald-400">
                                    Use code <span className="font-bold bg-emerald-900/30 px-1 rounded border border-emerald-500/20">{discountCode}</span> for disc.
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="w-full sm:flex-1 bg-white/5 border border-white/10 rounded-lg p-3 text-center text-bone-white/60 text-sm">
                            Buying options not available
                        </div>
                    )}

                    {/* Upvote Button (Large) */}
                    <div className="w-full sm:w-auto">
                        <VoteControl
                            resourceId={productId}
                            resourceType="product"
                            initialUpvoteCount={upvoteCount}
                            initialUserVote={null}
                            size="lg"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
