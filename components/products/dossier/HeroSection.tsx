"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ShieldCheck, Award } from "lucide-react";
import VoteControl from "@/components/ui/VoteControl";
import StarRatingDisplay from "@/components/products/StarRatingDisplay";
import BuyNowButton from "@/components/products/BuyNowButton";
import Tooltip from "@/components/ui/Tooltip";

interface HeroSectionProps {
    title: string;
    brand: string;
    images: string[];
    productId: string;
    upvoteCount?: number;
    aggregateStarRating?: number | null;
    totalStarReviews?: number;
    isSMECertified?: boolean;
    isVerified?: boolean;
    buyUrl?: string | null;
    discountCode?: string | null;
    // Dual scores
    smeTrustScore?: number | null; // Average SME score
    communitySentiment?: number | null; // Community consensus
}

export default function HeroSection({
    title,
    brand,
    images,
    productId,
    upvoteCount = 0,
    aggregateStarRating,
    totalStarReviews = 0,
    isSMECertified = false,
    isVerified = false,
    buyUrl,
    discountCode,
    smeTrustScore,
    communitySentiment,
}: HeroSectionProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

    const safeImages = images.filter(
        (img) => img && (img.startsWith("http://") || img.startsWith("https://"))
    );

    const mainImage = safeImages[selectedIndex] || "/placeholder.png";
    const hasMainImageError = imageErrors.has(selectedIndex);

    const goToPrevious = () => {
        setSelectedIndex((prev) => (prev === 0 ? safeImages.length - 1 : prev - 1));
    };

    const goToNext = () => {
        setSelectedIndex((prev) => (prev === safeImages.length - 1 ? 0 : prev + 1));
    };

    const handleImageError = (index: number) => {
        setImageErrors((prev) => new Set(prev).add(index));
    };

    // Score color helper
    const getScoreColor = (score: number | null) => {
        if (!score) return "text-bone-white/30 border-bone-white/20";
        if (score >= 8) return "text-emerald-400 border-emerald-400";
        if (score >= 6) return "text-yellow-400 border-yellow-400";
        if (score >= 4) return "text-orange-400 border-orange-400";
        return "text-red-400 border-red-400";
    };

    return (
        <div className="w-full mb-8 md:mb-12">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 md:gap-8">
                {/* LEFT COLUMN: Product Gallery (40% on desktop = 2/5 columns) */}
                {/* On mobile: appears first */}
                <div className="lg:col-span-2 order-1">
                    {/* Main Image */}
                    <div className="relative mb-4 aspect-square w-full overflow-hidden border-2 border-translucent-emerald bg-forest-obsidian rounded-lg">
                        {hasMainImageError || safeImages.length === 0 ? (
                            <div className="flex h-full w-full items-center justify-center bg-muted-moss">
                                <p className="text-bone-white/50 text-sm font-mono">
                                    Image not available
                                </p>
                            </div>
                        ) : (
                            <>
                                <Image
                                    src={mainImage}
                                    alt={`${title} - Image ${selectedIndex + 1}`}
                                    fill
                                    className="object-contain p-4"
                                    priority
                                    unoptimized={mainImage.includes("supabase.co")}
                                    onError={() => handleImageError(selectedIndex)}
                                    sizes="(max-width: 1024px) 100vw, 40vw"
                                />

                                {/* SME Certified Badge Overlay */}
                                {isSMECertified && (
                                    <div className="absolute top-4 right-4 bg-sme-gold text-forest-black text-xs font-bold px-3 py-2 rounded-lg shadow-lg flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4" />
                                        SME CERTIFIED
                                    </div>
                                )}
                            </>
                        )}

                        {/* Navigation arrows - only show if more than one image */}
                        {safeImages.length > 1 && (
                            <>
                                <button
                                    onClick={goToPrevious}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 border border-translucent-emerald bg-muted-moss/90 p-2 text-bone-white hover:bg-muted-moss transition-colors rounded"
                                    aria-label="Previous image"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <button
                                    onClick={goToNext}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 border border-translucent-emerald bg-muted-moss/90 p-2 text-bone-white hover:bg-muted-moss transition-colors rounded"
                                    aria-label="Next image"
                                >
                                    <ChevronRight size={20} />
                                </button>
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 border border-translucent-emerald bg-muted-moss/90 px-3 py-1 text-xs text-bone-white font-mono rounded">
                                    {selectedIndex + 1} / {safeImages.length}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Thumbnail Row */}
                    {safeImages.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {safeImages.slice(0, 10).map((image, index) => {
                                const hasError = imageErrors.has(index);
                                const isActive = selectedIndex === index;
                                return (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedIndex(index)}
                                        className={`relative h-16 w-16 flex-shrink-0 overflow-hidden border-2 transition-all rounded ${isActive
                                            ? "border-sme-gold"
                                            : "border-translucent-emerald hover:border-heart-green opacity-60 hover:opacity-100"
                                            }`}
                                        aria-label={`View image ${index + 1}`}
                                    >
                                        {hasError ? (
                                            <div className="flex h-full w-full items-center justify-center bg-muted-moss text-xs text-bone-white/50 font-mono">
                                                Error
                                            </div>
                                        ) : (
                                            <Image
                                                src={image}
                                                alt={`Thumbnail ${index + 1}`}
                                                fill
                                                className="object-cover"
                                                unoptimized={image.includes("supabase.co")}
                                                onError={() => handleImageError(index)}
                                            />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN: Vital Stats (60% on desktop = 3/5 columns) */}
                {/* On mobile: appears second, after gallery */}
                <div className="lg:col-span-3 flex flex-col justify-between order-2">
                    {/* Product Info */}
                    <div>
                        {/* Brand */}
                        <div className="mb-2">
                            <span className="text-xs font-mono uppercase tracking-wider text-bone-white/50 bg-white/5 px-3 py-1.5 rounded">
                                {brand}
                            </span>
                        </div>

                        {/* Title with Badge */}
                        <div className="flex flex-col sm:flex-row sm:items-start gap-3 mb-4">
                            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-bone-white flex-1">
                                {title}
                            </h1>
                            {(isSMECertified || isVerified) && (
                                <div className="flex-shrink-0">
                                    {isSMECertified ? (
                                        <div className="flex items-center gap-1 bg-sme-gold/20 border border-sme-gold/50 px-3 py-1.5 rounded-lg">
                                            <ShieldCheck className="w-4 h-4 text-sme-gold" />
                                            <span className="text-xs font-bold text-sme-gold">
                                                SME CERTIFIED
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1 bg-emerald-500/20 border border-emerald-500/50 px-3 py-1.5 rounded-lg">
                                            <Award className="w-4 h-4 text-emerald-400" />
                                            <span className="text-xs font-bold text-emerald-400">
                                                VERIFIED PARTNER
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Star Rating */}
                        {aggregateStarRating && totalStarReviews > 0 && (
                            <div className="mb-4 md:mb-6">
                                <StarRatingDisplay
                                    rating={aggregateStarRating}
                                    reviewCount={totalStarReviews}
                                    size="lg"
                                    showCount={true}
                                />
                            </div>
                        )}

                        {/* Dual Score Summary */}
                        <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
                            {/* SME Trust Score */}
                            <div className="bg-white/5 border border-sme-gold/30 rounded-lg p-3 md:p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] md:text-xs font-mono uppercase tracking-wider text-bone-white/60">
                                        SME Trust Score
                                    </span>
                                    <Tooltip content="Average score from verified Subject Matter Experts based on 9-pillar analysis" />
                                </div>
                                <div
                                    className={`text-2xl md:text-3xl font-bold font-mono ${getScoreColor(smeTrustScore).split(" ")[0]
                                        }`}
                                >
                                    {smeTrustScore ? smeTrustScore.toFixed(1) : "N/A"}
                                </div>
                                <div className="text-xs text-bone-white/40 mt-1">Out of 10</div>
                            </div>

                            {/* Community Sentiment */}
                            <div className="bg-white/5 border border-emerald-500/30 rounded-lg p-3 md:p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] md:text-xs font-mono uppercase tracking-wider text-bone-white/60">
                                        Community Sentiment
                                    </span>
                                    <Tooltip content="Community-driven consensus score based on verified reviews and feedback" />
                                </div>
                                <div
                                    className={`text-2xl md:text-3xl font-bold font-mono ${getScoreColor(communitySentiment).split(" ")[0]
                                        }`}
                                >
                                    {communitySentiment || "N/A"}
                                </div>
                                <div className="text-xs text-bone-white/40 mt-1">
                                    Consensus
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3 md:space-y-4">
                        {/* Buy Now Button (for verified brands) */}
                        {isVerified && buyUrl && (
                            <BuyNowButton
                                productId={productId}
                                productTitle={title}
                                discountCode={discountCode}
                                buyUrl={buyUrl}
                            />
                        )}

                        {/* Vote Control */}
                        <div className="flex items-center gap-4">
                            <VoteControl
                                resourceId={productId}
                                resourceType="product"
                                initialUpvoteCount={upvoteCount}
                                orientation="horizontal"
                                size="lg"
                            />
                            <span className="text-sm font-mono text-bone-white/60">
                                {upvoteCount} {upvoteCount === 1 ? "upvote" : "upvotes"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
