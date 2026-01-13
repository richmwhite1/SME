import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { currentUser } from "@clerk/nextjs/server";
import ProductImageGallery from "@/components/products/ProductImageGallery";
import HeroSection from "@/components/products/dossier/HeroSection";
import NinePillarSummary from "@/components/products/NinePillarSummary";
import ProductDossier from "@/components/products/dossier/ProductDossier";
import TheVault from "@/components/products/dossier/TheVault";
import SearchBar from "@/components/search/SearchBar";
import ProductViewTracker from "@/components/products/ProductViewTracker";
import StickyCTABar from "@/components/products/StickyCTABar";
import ProductVideo from "@/components/products/dossier/ProductVideo";
import { getDb } from "@/lib/db";
import { getSMEReviews, getAverageSMEScores, checkIsSME } from "@/app/actions/product-sme-review-actions";


// Force dynamic rendering to bypass caching issues
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Generate dynamic metadata for SEO
export async function generateMetadata({
    params,
}: {
    params: Promise<{ product_slug: string }>;
}): Promise<Metadata> {
    const { product_slug } = await params;
    const id = product_slug; // alias for query usage
    const sql = getDb();

    try {
        const result = await sql`
      SELECT title, ai_summary, is_sme_certified, images, product_photos
      FROM products
    WHERE(id:: text = ${id} OR slug = ${id})
        AND admin_status = 'approved'
      LIMIT 1
    `;

        const product = result[0];

        if (!product) {
            return {
                title: "Product Not Found",
                description: "The requested product could not be found.",
            };
        }

        // Prefix title with certified badge if SME certified
        const titlePrefix = product.is_sme_certified ? "✅ Certified: " : "";
        const title = `${titlePrefix}${product.title} `;

        // Use first 160 characters of ai_summary as description
        const description = product.ai_summary
            ? product.ai_summary.substring(0, 160).replace(/\n/g, " ").trim()
            : `Transparency report for ${product.title}.Research - based analysis and verification.`;

        // Get first image for Open Graph
        let imageUrl: string | undefined;

        // Check product_photos first (new wizard), then legacy images
        if (product.product_photos && Array.isArray(product.product_photos) && product.product_photos.length > 0) {
            imageUrl = product.product_photos[0];
        } else if (product.images && Array.isArray(product.images) && product.images.length > 0) {
            imageUrl = product.images[0];
        }

        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sme.example.com";
        const canonicalUrl = `${baseUrl} /products/${id} `;

        return {
            title,
            description,
            alternates: {
                canonical: canonicalUrl,
            },
            openGraph: {
                title,
                description,
                url: canonicalUrl,
                type: "article",
                ...(imageUrl && { images: [imageUrl] }),
            },
            twitter: {
                card: "summary_large_image",
                title,
                description,
                ...(imageUrl && { images: [imageUrl] }),
            },
        };
    } catch (error) {
        console.error("Error generating metadata:", error);
        return {
            title: "Product",
            description: "Product transparency report and research analysis.",
        };
    }
}

interface Product {
    id: string;
    title: string;
    brand: string; // Ensure brand is fetched
    problem_solved: string;
    slug: string;
    reference_url?: string | null;
    ai_summary?: string | null;
    buy_url?: string | null;
    discount_code?: string | null;
    // lab_tested?: boolean; REMOVED invalid column
    // organic?: boolean; REMOVED invalid column
    // purity_verified?: boolean; REMOVED invalid column
    // third_party_coa?: boolean; REMOVED invalid column
    certification_notes?: string | null;
    lab_pdf_url?: string | null;
    is_sme_certified?: boolean;
    third_party_lab_verified?: boolean;
    purity_tested?: boolean;
    source_transparency?: boolean;
    potency_verified?: boolean;
    excipient_audit?: boolean;
    operational_legitimacy?: boolean;
    coa_url?: string | null;
    product_photos?: string[] | null; // New field
    images?: string[] | null; // Legacy field
    // Dossier View Fields
    community_consensus_score: number;
    score_scientific: number;
    score_alternative: number;
    score_esoteric: number;
    certification_vault_urls: string[] | null;
    // Optional Fields
    founder_video_url?: string | null;
    ingredients?: string | null;
    upvote_count?: number;
    // Brand management fields
    is_verified?: boolean;
    brand_owner_id?: string | null;
    aggregate_star_rating?: number | null;
    total_star_reviews?: number | null;
    // New fields for enhanced display
    allergens?: string[] | null;
    dietary_tags?: string[] | null;
    price?: string | null;
    serving_info?: string | null;
    target_audience?: string | null;
    warnings?: string | null;
    manufacturer?: string | null;
    youtube_link?: string | null;
    core_value_proposition?: string | null;
    technical_specs?: Record<string, string> | null;
    active_ingredients?: any[] | null;
    excipients?: string[] | null;
    certifications?: string[] | null;
    technical_docs_url?: string | null;
    // Phase 1 enhancement fields
    category?: string | null;
    lab_report_url?: string | null;
    serving_size?: string | null;
    servings_per_container?: string | null;
    form?: string | null;
    recommended_dosage?: string | null;
    best_time_take?: string | null;
    storage_instructions?: string | null;
}

interface Signal {
    signal: string;
    lens_type: 'scientific' | 'alternative' | 'esoteric';
    reason?: string;
}

export default async function ProductDetailPage({
    params,
}: {
    params: Promise<{ product_slug: string }>;
}) {
    // Await params (Next.js 15+ requirement)
    const { product_slug } = await params;
    const id = product_slug; // alias
    const user = await currentUser();
    const sql = getDb();

    console.log("Product Detail Page (Dossier) - Fetching via [product_slug]:", id);
    console.log("DEBUG: Router Transplant Successful");
    try {
        // 1. Fetch product details with new fields
        const productResult = await sql`
    SELECT
      id, title, problem_solved, ai_summary, buy_url, discount_code,
      is_sme_certified, third_party_lab_verified, purity_tested,
      source_transparency, potency_verified, excipient_audit, operational_legitimacy,
      coa_url, product_photos, images, slug,
      COALESCE(community_consensus_score, 0) as community_consensus_score,
      COALESCE(score_scientific, 0) as score_scientific,
      COALESCE(score_alternative, 0) as score_alternative,
      COALESCE(score_esoteric, 0) as score_esoteric,
      COALESCE(certification_vault_urls, '[]':: jsonb) as certification_vault_urls,
      founder_video_url,
      ingredients,
      upvote_count,
      aggregate_star_rating,
      total_star_reviews,
      dietary_tags,
      price,
      serving_info,
      target_audience,
      warnings,
      manufacturer,
      youtube_link,
      technical_specs,
      excipients,
      certifications,
      technical_docs_url,
      category,
      lab_report_url,
      serving_size,
      servings_per_container,
      formulation_type as form,
      recommended_dosage,
      best_time_to_take as best_time_take,
      storage_instructions
      FROM products
    WHERE(id:: text = ${id} OR slug = ${id})
        AND admin_status = 'approved'
      LIMIT 1
      `;

        const product = productResult[0];

        if (!product) {
            console.error("Product not found for ID:", id);
            notFound();
        }

        // 2. Fetch Product Truth Signals
        let signals: Signal[] = [];
        try {
            const signalsResult = await sql`
        SELECT signal, lens_type, reason
        FROM product_truth_signals
        WHERE product_id:: text = ${product.id}
    `;
            signals = signalsResult.map((s: any) => ({
                signal: s.signal,
                lens_type: s.lens_type,
                reason: s.reason
            }));
        } catch (e) {
            // Table might not exist yet or empty
            console.warn("Could not fetch signals:", e);
        }

        // 3. Construct full product object
        const typedProduct: Product = {
            ...product,
            community_consensus_score: product.community_consensus_score || 0,
            score_scientific: product.score_scientific || 0,
            score_alternative: product.score_alternative || 0,
            score_esoteric: product.score_esoteric || 0,
            certification_vault_urls: product.certification_vault_urls || [],
            // Handle fallback for brand if missing in DB (migration might be needed if existing products don't have brand)
            brand: product.brand || "SME Verified"
        } as Product;

        // Handle images - Support both new product_photos (Array) and legacy images (JSON/Array)
        let imagesArray: string[] = [];

        // Check new field first
        if (typedProduct.product_photos && Array.isArray(typedProduct.product_photos) && typedProduct.product_photos.length > 0) {
            imagesArray = typedProduct.product_photos;
        }
        // Fallback to legacy field
        else if (typedProduct.images) {
            if (Array.isArray(typedProduct.images)) {
                imagesArray = typedProduct.images.filter((img): img is string => typeof img === 'string' && img.length > 0);
            } else if (typeof typedProduct.images === 'string') {
                const imagesString: string = typedProduct.images;
                const arrayMatch = imagesString.match(/^\{([^}]*)\}$/);
                if (arrayMatch) {
                    imagesArray = arrayMatch[1]
                        .split(',')
                        .map((s: string) => s.trim().replace(/^"|"$/g, ''))
                        .filter((img: string): img is string => img.length > 0);
                }
            }
        }

        const safeImages = imagesArray.filter(img =>
            !!img && (img.startsWith('http://') || img.startsWith('https://'))
        );

        // Parse active_ingredients if it's a string
        let activeIngredients: any[] = [];
        if (Array.isArray(typedProduct.active_ingredients)) {
            activeIngredients = typedProduct.active_ingredients;
        } else if (typeof typedProduct.active_ingredients === 'string') {
            try {
                // @ts-ignore
                activeIngredients = JSON.parse(typedProduct.active_ingredients);
            } catch (e) {
                console.error("Failed to parse active_ingredients", e);
            }
        }

        // 4. Fetch SME reviews (with error handling for unauthenticated users)
        let smeReviews: any[] = [];
        let avgSMEScores: any = {
            purity: null,
            bioavailability: null,
            potency: null,
            evidence: null,
            sustainability: null,
            experience: null,
            safety: null,
            transparency: null,
            synergy: null,
            reviewCount: 0,
        };
        let isSME = false;

        try {
            console.log('[SME Reviews] Fetching SME data for product:', product.id);
            smeReviews = await getSMEReviews(product.id);
            console.log('[SME Reviews] Fetched reviews:', smeReviews.length);

            avgSMEScores = await getAverageSMEScores(product.id);
            console.log('[SME Reviews] Fetched avg scores, count:', avgSMEScores.reviewCount);

            isSME = await checkIsSME();
            console.log('[SME Reviews] User is SME:', isSME);
        } catch (smeError) {
            // Silently fail if SME data fetch fails (e.g., user not authenticated)
            console.error('[SME Reviews] Error fetching SME data:', smeError);
            // Continue with empty data - page should still render
        }

        // 5. Fetch comments with has_citation check and new classification fields
        let serializedComments: any[] = [];
        try {
            const commentsResult = await sql`
    SELECT
    pc.id, pc.content, pc.created_at, pc.parent_id, pc.guest_name,
      pc.insight_summary, pc.upvote_count, pc.post_type, pc.pillar_of_truth, pc.source_metadata, pc.star_rating, pc.metadata,
      p.id as author_id, p.full_name, p.username, p.avatar_url, p.badge_type, p.contributor_score,
      EXISTS(SELECT 1 FROM comment_references cr WHERE cr.comment_id = pc.id) as has_citation,
        (
          SELECT json_agg(json_build_object('emoji', emoji, 'count', count, 'user_reacted', user_reacted))
          FROM (
             SELECT emoji, COUNT(*) as count,
                    bool_or(user_id::text = ${user?.id || '0'}) as user_reacted
             FROM comment_reactions cr
             WHERE cr.comment_id = pc.id
             GROUP BY emoji
          ) r
        ) as reactions
        FROM product_comments pc
        LEFT JOIN profiles p ON pc.author_id = p.id
        WHERE pc.product_id:: text = ${product.id}
    AND(pc.is_flagged IS FALSE OR pc.is_flagged IS NULL)
        ORDER BY pc.created_at ASC
      `;

            serializedComments = commentsResult.map((comment: any) => ({
                id: comment.id,
                content: comment.content,
                created_at: comment.created_at instanceof Date ? comment.created_at.toISOString() : comment.created_at,
                parent_id: comment.parent_id,
                guest_name: comment.guest_name,
                has_citation: comment.has_citation,
                insight_summary: comment.insight_summary,
                upvote_count: comment.upvote_count || 0,
                post_type: comment.post_type,
                pillar_of_truth: comment.pillar_of_truth,
                source_metadata: comment.source_metadata,
                star_rating: comment.star_rating,
                metadata: comment.metadata,
                profiles: comment.author_id ? {
                    id: String(comment.author_id),
                    full_name: comment.full_name,
                    username: comment.username,
                    avatar_url: comment.avatar_url,
                    badge_type: comment.badge_type,
                    contributor_score: comment.contributor_score
                } : null,
                reactions: comment.reactions || []
            }));
        } catch (commentsErr) {
            console.error("Error fetching comments:", commentsErr);
        }

        // 6. Fetch product benefits for Schema.org
        let benefits: any[] = [];
        try {
            const benefitsResult = await sql`
        SELECT benefit_title, benefit_type, citation_url, source_type, is_verified, upvote_count
        FROM product_benefits
        WHERE product_id::text = ${product.id}
        AND (source_type = 'official' OR (source_type = 'community' AND upvote_count >= 5))
        ORDER BY source_type DESC, upvote_count DESC, created_at DESC
      `;
            benefits = benefitsResult;
            console.log('[Benefits] Fetched benefits:', benefits.length);
        } catch (benefitsErr) {
            console.error("[Benefits] Error fetching benefits:", benefitsErr);
        }

        // 7. Fetch distinct community benefits for the UI component
        let communityBenefits: any[] = [];
        try {
            const communityResult = await sql`
        SELECT id, benefit_title, benefit_type, citation_url, upvote_count, downvote_count, submitted_by, created_at
        FROM product_benefits
        WHERE product_id::text = ${product.id}
        AND source_type = 'community'
        ORDER BY upvote_count DESC, created_at DESC
      `;
            communityBenefits = communityResult;
        } catch (err) {
            console.error("[Community Benefits] Error fetching:", err);
        }

        // Build base URL for canonical and structured data
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sme.example.com";
        const canonicalUrl = `${baseUrl} /products/${id} `;

        // Build JSON-LD structured data for SEO
        const jsonLd = {
            "@context": "https://schema.org",
            "@type": "Product",
            name: typedProduct.title,
            description: typedProduct.ai_summary
                ? typedProduct.ai_summary.substring(0, 200).replace(/\n/g, " ").trim()
                : typedProduct.problem_solved,
            image: safeImages.length > 0 ? safeImages : undefined,
            brand: {
                "@type": "Brand",
                name: typedProduct.brand
            },
            // Add benefits with citations for SEO/LLM indexing
            ...(benefits.length > 0 && {
                hasBenefit: benefits.map(b => ({
                    "@type": "Benefit",
                    name: b.benefit_title,
                    ...(b.citation_url && {
                        citation: {
                            "@type": "CreativeWork",
                            url: b.citation_url
                        }
                    })
                }))
            }),
            // Add offers for verified brands with buy_url
            ...(typedProduct.is_verified && typedProduct.buy_url && {
                offers: {
                    "@type": "Offer",
                    url: typedProduct.buy_url,
                    priceCurrency: "USD",
                    availability: "https://schema.org/InStock",
                    ...(typedProduct.discount_code && {
                        priceSpecification: {
                            "@type": "UnitPriceSpecification",
                            referenceQuantity: {
                                "@type": "QuantitativeValue",
                                value: "1"
                            }
                        }
                    })
                }
            }),
            // Use star ratings for aggregateRating if available, otherwise fall back to consensus score
            aggregateRating: typedProduct.aggregate_star_rating && typedProduct.total_star_reviews > 0 ? {
                "@type": "AggregateRating",
                ratingValue: typedProduct.aggregate_star_rating,
                bestRating: "5",
                ratingCount: typedProduct.total_star_reviews
            } : undefined
        };

        // Calculate average SME score for dual-score display
        const avgSMEScore = avgSMEScores.reviewCount > 0
            ? Object.values(avgSMEScores)
                .filter((v): v is number => typeof v === 'number' && v > 0)
                .reduce((sum, score, _, arr) => sum + score / arr.length, 0)
            : null;

        return (
            <>
                {/* JSON-LD Structured Data */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />

                {/* Canonical URL */}
                <link rel="canonical" href={canonicalUrl} />

                {/* Product View Tracker - Metered Billing */}
                <ProductViewTracker
                    productId={typedProduct.id}
                    isVerified={typedProduct.is_verified || false}
                />

                <main className="min-h-screen bg-forest-obsidian text-bone-white">
                    <div className="mx-auto max-w-7xl px-6 py-8">
                        {/* Global Search Bar - Persistent */}
                        <div className="mb-8">
                            <div className="max-w-3xl mx-auto">
                                <SearchBar />
                            </div>
                        </div>

                        {/* Back to Products Button */}
                        <div className="mb-6">
                            <Link href="/products">
                                <button className="inline-flex items-center gap-2 text-sm text-bone-white/70 hover:text-bone-white font-mono transition-colors">
                                    <ArrowLeft size={14} />
                                    Back to Products
                                </button>
                            </Link>
                        </div>

                        {/* HERO SECTION - Enhanced with Quadrants */}
                        <HeroSection
                            title={typedProduct.title}
                            brand={typedProduct.brand}
                            images={safeImages}
                            productId={typedProduct.id}
                            upvoteCount={typedProduct.upvote_count || 0}
                            aggregateStarRating={typedProduct.aggregate_star_rating}
                            totalStarReviews={typedProduct.total_star_reviews || 0}
                            isSMECertified={typedProduct.is_sme_certified || false}
                            isVerified={typedProduct.is_verified || false}
                            buyUrl={typedProduct.buy_url}
                            discountCode={typedProduct.discount_code}
                            smeTrustScore={avgSMEScore}
                            communitySentiment={typedProduct.community_consensus_score}
                            // New Quadrant Data
                            activeIngredients={activeIngredients}
                            servingSize={typedProduct.serving_size}

                            servingsPerContainer={typedProduct.servings_per_container}
                            form={typedProduct.form}
                            price={typedProduct.price}
                            coreValueProposition={typedProduct.core_value_proposition}
                            officialBenefits={benefits.filter(b => b.source_type === 'official')}
                            allergens={typedProduct.allergens}
                            dietaryTags={typedProduct.dietary_tags}
                            warnings={typedProduct.warnings}
                            manufacturer={typedProduct.manufacturer}
                            certifications={typedProduct.certifications}
                            labTested={!!typedProduct.lab_report_url || typedProduct.third_party_lab_verified}
                            servingInfo={typedProduct.serving_info}
                            targetAudience={typedProduct.target_audience}
                        />

                        {/* 9-Pillar Summary - Compact View - Moved BELOW Hero */}
                        <div className="mb-12 max-w-4xl mx-auto">
                            <NinePillarSummary
                                avgScores={avgSMEScores}
                                reviewCount={avgSMEScores.reviewCount}
                                scrollToId="sme-deep-dive"
                            />
                        </div>

                        {/* PRODUCT DOSSIER (Continuous Scroll) */}
                        <ProductDossier
                            productId={typedProduct.id}
                            productSlug={typedProduct.slug}
                            isSME={isSME}
                            smeReviews={smeReviews}
                            avgSMEScores={avgSMEScores}
                            smeReviewCount={avgSMEScores.reviewCount}
                            comments={serializedComments}
                            ingredients={typedProduct.ingredients}
                            aiSummary={typedProduct.ai_summary}
                            isVerified={typedProduct.is_verified || false}
                            officialBenefits={benefits.filter(b => b.source_type === 'official')}
                            communityBenefits={communityBenefits}
                            // Conserved Props
                            manufacturer={typedProduct.manufacturer}
                            price={typedProduct.price}
                            servingInfo={typedProduct.serving_info}
                            targetAudience={typedProduct.target_audience}
                            coreValueProposition={typedProduct.core_value_proposition}
                            technicalSpecs={typedProduct.technical_specs}
                            excipients={typedProduct.excipients}
                            certifications={typedProduct.certifications}
                            technicalDocsUrl={typedProduct.technical_docs_url}
                            allergens={typedProduct.allergens}
                            dietaryTags={typedProduct.dietary_tags}
                            servingSize={typedProduct.serving_size}
                            servingsPerContainer={typedProduct.servings_per_container}
                            form={typedProduct.form}
                            recommendedDosage={typedProduct.recommended_dosage}
                            bestTimeTake={typedProduct.best_time_take}
                            storageInstructions={typedProduct.storage_instructions}
                            coaUrl={typedProduct.coa_url}
                            labReportUrl={typedProduct.lab_report_url}
                            certificationVaultUrls={typedProduct.certification_vault_urls}
                            brandOwnerId={typedProduct.brand_owner_id}
                            warnings={typedProduct.warnings}
                        />

                        {/* Founder Video (Video is now lower down) - Keep here or move? 
                User requested "Evidence & Insights" section. Video fits there or here. 
                Let's keep it here for now as supplemental media. 
            */}
                        {(typedProduct.youtube_link || typedProduct.founder_video_url) && (
                            <div className="mt-8 mb-8">
                                <ProductVideo
                                    videoUrl={typedProduct.youtube_link || typedProduct.founder_video_url}
                                    productTitle={typedProduct.title}
                                />
                            </div>
                        )}

                        {/* THE VAULT */}
                        <TheVault urls={typedProduct.certification_vault_urls} />

                    </div>

                    {/* Sticky CTA Bar for Mobile */}
                    {typedProduct.is_verified && typedProduct.buy_url && (
                        <StickyCTABar
                            buyUrl={typedProduct.buy_url}
                            productTitle={typedProduct.title}
                            discountCode={typedProduct.discount_code}
                            isVisible={true}
                        />
                    )}
                </main>
            </>
        );
    } catch (err) {
        console.error("[Product Page] Unexpected error:", err);
        console.error("[Product Page] Stack:", err instanceof Error ? err.stack : 'No stack');
        return (
            <main className="min-h-screen bg-forest-obsidian px-6 py-12 flex items-center justify-center">
                <div className="text-center max-w-2xl">
                    <h1 className="text-2xl font-serif text-bone-white mb-4">Error Loading Dossier</h1>
                    <p className="text-white/50 mb-2">Security clearance failed. Please try again.</p>
                    {process.env.NODE_ENV === 'development' && err instanceof Error && (
                        <div className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded text-left">
                            <p className="text-red-400 text-sm font-mono">{err.message}</p>
                        </div>
                    )}
                    <Link href="/products" className="text-emerald-400 hover:text-emerald-300 underline mt-6 inline-block">
                        Return to Index
                    </Link>
                </div>
            </main>
        );
    }
}
