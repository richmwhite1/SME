import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import CompareClient from "./CompareClient";
import type { Metadata } from "next";
import { getDb } from "@/lib/db";
export const dynamic = "force-dynamic";
interface Product {
  id: string;
  title: string;
  problem_solved: string;
  images: string[] | null;
  is_sme_certified: boolean | null;
  source_transparency: boolean | null;
  purity_tested: boolean | null;
  potency_verified: boolean | null;
  excipient_audit: boolean | null;
  operational_legitimacy: boolean | null;
  third_party_lab_verified: boolean | null;
  ai_summary: string | null;
  buy_url: string | null;
  coa_url: string | null;
  lab_pdf_url: string | null;
}
interface Review {
  id: string;
  content: string;
  rating: number;
  created_at: string;
}
// Generate dynamic metadata for SEO and social previews
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ p1?: string; p2?: string; a?: string; b?: string }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const productAId = params.p1 || params.a;
  const productBId = params.p2 || params.b;
  if (!productAId || !productBId) {
    return {
      title: "Compare Products",
      description: "Community-sourced truth for holistic health. Compare products side-by-side.",
    };
  }
  try {
    const sql = getDb();
    const [productAResult, productBResult] = await Promise.all([
      sql`SELECT title FROM protocols WHERE id = ${productAId} LIMIT 1`,
      sql`SELECT title FROM protocols WHERE id = ${productBId} LIMIT 1`,
    ]);
    type ProductTitle = { title: string };
    const productA = (productAResult?.[0] as ProductTitle | null);
    const productB = (productBResult?.[0] as ProductTitle | null);
    if (!productA || !productB) {
      return {
        title: "Compare Products",
        description: "Community-sourced truth for holistic health. Compare products side-by-side.",
      };
    }
    const title = `SME Audit: ${productA.title} vs ${productB.title}`;
    const description = "Community-sourced truth for holistic health. See the 5-pillar audit results.";
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sme.example.com";
    const ogImageUrl = `${baseUrl}/api/og/compare?p1=${productAId}&p2=${productBId}`;
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `${baseUrl}/compare?p1=${productAId}&p2=${productBId}`,
        type: "website",
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: `${productA.title} vs ${productB.title} - Audit Summary`,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [ogImageUrl],
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Compare Products",
      description: "Community-sourced truth for holistic health. Compare products side-by-side.",
    };
  }
}
export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ p1?: string; p2?: string; a?: string; b?: string }>;
}) {
  const params = await searchParams;
  // Support both new (p1, p2) and legacy (a, b) URL parameters for backwards compatibility
  const productAId = params.p1 || params.a;
  const productBId = params.p2 || params.b;
  if (!productAId || !productBId) {
    return (
      <main className="min-h-screen bg-forest-obsidian">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="border border-translucent-emerald bg-muted-moss p-12 text-center">
            <h1 className="mb-4 font-serif text-2xl font-bold text-bone-white">
              Select Products to Compare
            </h1>
            <p className="mb-6 text-bone-white/70 font-mono">
              Please select two products to compare. Use the &quot;Compare&quot; button on product cards or detail pages.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 border border-translucent-emerald bg-forest-obsidian px-4 py-2 text-sm text-bone-white hover:bg-muted-moss hover:border-heart-green transition-colors font-mono"
            >
              <ArrowLeft size={16} />
              Browse Products
            </Link>
          </div>
        </div>
      </main>
    );
  }
  // Fetch both products
  const productAResult = await supabase
    .from("protocols")
    .select("*")
    .eq("id", productAId)
    .single();
  
  const productBResult = await supabase
    .from("protocols")
    .select("*")
    .eq("id", productBId)
    .single();
  if (productAResult.error || productBResult.error) {
    notFound();
  }
  const productAData = productAResult.data;
  const productBData = productBResult.data;
  if (!productAData || !productBData) {
    notFound();
  }
  // Type assertion to handle Supabase's complex return types
  const typedProductA = productAData as unknown as Product;
  const typedProductB = productBData as unknown as Product;
  // Parse images
  const parseImages = (images: any): string[] => {
    if (!images) return [];
    if (Array.isArray(images)) {
      return images.filter((img): img is string => typeof img === 'string' && img.length > 0);
    }
    if (typeof images === 'string') {
      try {
        const parsed = JSON.parse(images);
        if (Array.isArray(parsed)) return parsed.filter((img: any): img is string => typeof img === 'string' && img.length > 0);
      } catch {
        const arrayMatch = images.match(/^\{([^}]*)\}$/);
        if (arrayMatch) {
          return arrayMatch[1]
            .split(',')
            .map((s: string) => s.trim().replace(/^"|"$/g, ''))
            .filter((img: string): img is string => img.length > 0);
        }
      }
    }
    return [];
  };
  const imagesA = parseImages(typedProductA.images);
  const imagesB = parseImages(typedProductB.images);
  // Fetch most recent review for each product
  const [reviewA, reviewB] = await Promise.all([
    supabase
      .from("reviews")
      .select("id, content, rating, created_at")
      .eq("protocol_id", productAId)
      .or("is_flagged.eq.false,is_flagged.is.null")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("reviews")
      .select("id, content, rating, created_at")
      .eq("protocol_id", productBId)
      .or("is_flagged.eq.false,is_flagged.is.null")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  const recentReviewA = reviewA.data as Review | null;
  const recentReviewB = reviewB.data as Review | null;
  // Get sentiment snippet (first 100 chars of review)
  const getSentimentSnippet = (review: Review | null): string => {
    if (!review || !review.content) return "Signal Pending: Be the first auditor to share your intuition.";
    return review.content.substring(0, 100) + (review.content.length > 100 ? "..." : "");
  };
  // Get expert take (first 2 sentences from AI summary)
  const getExpertTake = (summary: string | null): string => {
    if (!summary) return "No expert analysis available";
    const sentences = summary.split(/[.!?]+/).filter(s => s.trim().length > 0);
    return sentences.slice(0, 2).join(". ").trim() + (sentences.length > 2 ? "." : "");
  };
  // Count helpful votes (sum of helpful_count from all reviews)
  const [reviewsA, reviewsB] = await Promise.all([
    supabase
      .from("reviews")
      .select("helpful_count")
      .eq("protocol_id", productAId)
      .or("is_flagged.eq.false,is_flagged.is.null"),
    supabase
      .from("reviews")
      .select("helpful_count")
      .eq("protocol_id", productBId)
      .or("is_flagged.eq.false,is_flagged.is.null"),
  ]);
  const upvoteCountA = ((reviewsA.data as Array<{ helpful_count?: number }>) || []).reduce((sum, review) => sum + (review.helpful_count || 0), 0);
  const upvoteCountB = ((reviewsB.data as Array<{ helpful_count?: number }>) || []).reduce((sum, review) => sum + (review.helpful_count || 0), 0);
  // Fetch intuitive reviews (reviews containing [INTUITIVE] tag)
  const [intuitiveReviewsA, intuitiveReviewsB] = await Promise.all([
    supabase
      .from("reviews")
      .select("rating")
      .eq("protocol_id", productAId)
      .ilike("content", "%[INTUITIVE]%")
      .or("is_flagged.eq.false,is_flagged.is.null"),
    supabase
      .from("reviews")
      .select("rating")
      .eq("protocol_id", productBId)
      .ilike("content", "%[INTUITIVE]%")
      .or("is_flagged.eq.false,is_flagged.is.null"),
  ]);
  // Calculate average intuitive score
  const getIntuitiveScore = (reviews: Array<{ rating?: number }>): string => {
    if (!reviews || reviews.length === 0) return "N/A";
    const avg = reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length;
    return avg.toFixed(1);
  };
  const intuitiveScoreA = getIntuitiveScore((intuitiveReviewsA.data as Array<{ rating?: number }>) || []);
  const intuitiveScoreB = getIntuitiveScore((intuitiveReviewsB.data as Array<{ rating?: number }>) || []);
  // Calculate price per serving (placeholder - would need actual price data)
  const getPricePerServing = (buyUrl: string | null): string => {
    if (!buyUrl) return "N/A";
    // In a real implementation, you'd parse the buy_url or fetch price data
    // For now, return a placeholder
    return "See Product Page";
  };
  const pricePerServingA = getPricePerServing(typedProductA.buy_url);
  const pricePerServingB = getPricePerServing(typedProductB.buy_url);
  // Check for verified COA evidence
  const [evidenceA, evidenceB] = await Promise.all([
    supabase
      .from("evidence_submissions")
      .select("id, status")
      .eq("product_id", productAId)
      .eq("status", "verified")
      .limit(1)
      .maybeSingle(),
    supabase
      .from("evidence_submissions")
      .select("id, status")
      .eq("product_id", productBId)
      .eq("status", "verified")
      .limit(1)
      .maybeSingle(),
  ]);
  const hasVerifiedCOAA = !!evidenceA.data;
  const hasVerifiedCOAB = !!evidenceB.data;
  return (
    <CompareClient
      productA={typedProductA}
      productB={typedProductB}
      productAId={productAId}
      productBId={productBId}
      imagesA={imagesA}
      imagesB={imagesB}
      recentReviewA={recentReviewA}
      recentReviewB={recentReviewB}
      upvoteCountA={upvoteCountA}
      upvoteCountB={upvoteCountB}
      intuitiveScoreA={intuitiveScoreA}
      intuitiveScoreB={intuitiveScoreB}
      pricePerServingA={pricePerServingA}
      pricePerServingB={pricePerServingB}
      hasVerifiedCOAA={hasVerifiedCOAA}
      hasVerifiedCOAB={hasVerifiedCOAB}
    />
  );
}
