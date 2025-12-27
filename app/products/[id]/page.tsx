import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ProductImageGallery from "@/components/products/ProductImageGallery";
import DossierHeader from "@/components/products/dossier/DossierHeader";
import SignalGrid from "@/components/products/dossier/SignalGrid";
import StreamSplitter from "@/components/products/dossier/StreamSplitter";
import TheVault from "@/components/products/dossier/TheVault";
import SearchBar from "@/components/search/SearchBar";
import { getDb } from "@/lib/db";
import ReactMarkdown from "react-markdown";

// Force dynamic rendering to bypass caching issues
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Generate dynamic metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
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
  lab_tested?: boolean;
  organic?: boolean;
  purity_verified?: boolean;
  third_party_coa?: boolean;
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
}

interface Signal {
  signal: string;
  lens_type: 'scientific' | 'alternative' | 'esoteric';
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Await params (Next.js 15+ requirement)
  const { id } = await params;
  const sql = getDb();

  console.log("Product Detail Page (Dossier) - Fetching product with ID:", id);
  try {
    // 1. Fetch product details with new fields
    const productResult = await sql`
    SELECT
      *,
      COALESCE(brand, 'Unknown Brand') as brand,
      COALESCE(community_consensus_score, 0) as community_consensus_score,
      COALESCE(score_scientific, 0) as score_scientific,
      COALESCE(score_alternative, 0) as score_alternative,
      COALESCE(score_esoteric, 0) as score_esoteric,
      COALESCE(certification_vault_urls, '[]':: jsonb) as certification_vault_urls,
      founder_video_url,
      ingredients
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
        SELECT signal, lens_type
        FROM product_truth_signals
        WHERE product_id:: text = ${product.id}
    `;
      signals = signalsResult.map((s: any) => ({
        signal: s.signal,
        lens_type: s.lens_type
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

    // 4. Fetch comments with has_citation check
    let serializedComments: any[] = [];
    try {
      const commentsResult = await sql`
    SELECT
    pc.id, pc.content, pc.created_at, pc.parent_id, pc.guest_name,
      pc.insight_summary, pc.upvote_count,
      p.id as author_id, p.full_name, p.username, p.avatar_url, p.badge_type, p.contributor_score, p.archive_clerk_id,
      EXISTS(SELECT 1 FROM comment_references cr WHERE cr.comment_id = pc.id) as has_citation
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
        profiles: comment.author_id ? {
          id: String(comment.author_id),
          full_name: comment.full_name,
          username: comment.username,
          avatar_url: comment.avatar_url,
          badge_type: comment.badge_type,
          contributor_score: comment.contributor_score,
          archive_clerk_id: comment.archive_clerk_id || comment.author_id
        } : null
      }));
    } catch (commentsErr) {
      console.error("Error fetching comments:", commentsErr);
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
      aggregateRating: typedProduct.community_consensus_score > 0 ? {
        "@type": "AggregateRating",
        ratingValue: typedProduct.community_consensus_score,
        bestRating: "100",
        ratingCount: serializedComments.length > 0 ? serializedComments.length : 1
      } : undefined
    };

    return (
      <>
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* Canonical URL */}
        <link rel="canonical" href={canonicalUrl} />

        <main className="min-h-screen bg-forest-obsidian text-bone-white">
          <div className="mx-auto max-w-5xl px-6 py-8">
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

            {/* DOSSIER HEADER */}
            <DossierHeader
              title={typedProduct.title}
              brand={typedProduct.brand}
              consensusScore={typedProduct.community_consensus_score}
              image={safeImages[0]}
            />

            {/* FOUNDER VIDEO (Optional) */}
            {typedProduct.founder_video_url && (
              <div className="mb-12 border border-translucent-emerald bg-muted-moss p-8 rounded-lg">
                <h2 className="mb-4 font-serif text-2xl font-bold text-bone-white border-b border-white/10 pb-4">
                  Founder Intent
                </h2>
                <div className="aspect-video w-full">
                  <iframe
                    className="w-full h-full rounded"
                    src={typedProduct.founder_video_url.replace('watch?v=', 'embed/')}
                    title="Founder Video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {/* Image Gallery (Optional/Collapsible or Visual Aid) */}
            {safeImages.length > 1 && (
              <div className="mb-12">
                <ProductImageGallery images={safeImages} />
              </div>
            )}

            {/* SIGNAL GRID */}
            <SignalGrid signals={signals} />

            {/* INGREDIENTS (Optional) */}
            {typedProduct.ingredients && (
              <div className="mb-12 border border-translucent-emerald bg-muted-moss p-8 rounded-lg">
                <h2 className="mb-4 font-serif text-2xl font-bold text-bone-white border-b border-white/10 pb-4">
                  Active Ingredients
                </h2>
                <p className="text-bone-white/80 leading-relaxed whitespace-pre-wrap">
                  {typedProduct.ingredients}
                </p>
              </div>
            )}

            {/* AI SUMMARY (Keeping as it's valuable context) */}
            {typedProduct.ai_summary && (
              <div className="mb-12 border border-translucent-emerald bg-muted-moss p-8 rounded-lg">
                <h2 className="mb-4 font-serif text-2xl font-bold text-bone-white border-b border-white/10 pb-4">
                  Expert Notebook
                </h2>
                <div className="prose prose-slate max-w-none 
                  prose-headings:font-serif prose-headings:text-bone-white prose-headings:font-bold
                  prose-p:text-bone-white/80 prose-p:leading-relaxed prose-p:mb-4
                  prose-strong:text-bone-white prose-strong:font-semibold
                  prose-ul:text-bone-white/80 prose-ul:leading-relaxed
                  prose-li:text-bone-white/80 prose-li:my-2
                  prose-a:text-heart-green hover:prose-a:text-emerald-300 transition-colors
                  prose-code:text-emerald-200 prose-code:bg-emerald-950/30 prose-code:px-1 prose-code:rounded
                  prose-blockquote:border-l-emerald-500/50 prose-blockquote:text-white/60">
                  <ReactMarkdown>{typedProduct.ai_summary}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* THE VAULT */}
            <TheVault urls={typedProduct.certification_vault_urls} />

            {/* STREAM SPLITTER (COMMENTS) */}
            <StreamSplitter
              productId={typedProduct.id}
              productSlug={typedProduct.slug}
              comments={serializedComments}
            />

          </div>
        </main>
      </>
    );
  } catch (err) {
    console.error("Unexpected error in product detail page:", err);
    return (
      <main className="min-h-screen bg-forest-obsidian px-6 py-12 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-serif text-bone-white mb-4">Error Loading Dossier</h1>
          <p className="text-white/50 mb-6">Security clearance failed. Please try again.</p>
          <Link href="/products" className="text-emerald-400 hover:text-emerald-300 underline">
            Return to Index
          </Link>
        </div>
      </main>
    );
  }
}
