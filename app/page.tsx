import Link from "next/link";
import Button from "@/components/ui/Button";
import ProductListCard from "@/components/holistic/ProductListCard";
import LatestIntelligence from "@/components/social/LatestIntelligence";
import VelocityBadge from "@/components/products/VelocityBadge";
import { Download, Share2 } from "lucide-react";
import { getDb } from "@/lib/db";
import LensAwareSearch from "@/components/search/LensAwareSearch";
import LiveLedger from "@/components/feed/LiveLedger";

export const dynamic = "force-dynamic";

interface TrendingProduct {
  id: string;
  title: string;
  problem_solved: string;
  slug: string;
  images?: string[] | null;
  is_sme_certified?: boolean;
  purity_tested?: boolean;
  source_transparency?: boolean;
  ai_summary?: boolean;
  third_party_lab_verified?: boolean;
  potency_verified?: boolean;
  excipient_audit?: boolean;
  operational_legitimacy?: boolean;
  reviewCount: number;
  commentCount: number;
  averageRating?: number;
  velocityCount: number;
  activity_score: number;
}

interface Product {
  id: string;
  title: string;
  problem_solved: string;
  slug: string;
  images: string | string[] | null;
  is_sme_certified: boolean | null;
  purity_tested: boolean | null;
  source_transparency: boolean | null;
  ai_summary: boolean | null;
  third_party_lab_verified: boolean | null;
  potency_verified: boolean | null;
  excipient_audit: boolean | null;
  operational_legitimacy: boolean | null;
  created_at: string;
  review_count?: number;
  comment_count?: number;
  average_rating?: number;
  velocity_count?: number;
}

async function fetchTrendingProducts(): Promise<TrendingProduct[]> {
  const sql = getDb();

  try {
    // Get start of this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Get start of this week (7 days ago)
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    startOfWeek.setHours(0, 0, 0, 0);

    // Fetch products with aggregated metrics
    const products = await sql<Product[]>`
      SELECT 
        p.id,
        p.title,
        p.problem_solved,
        p.slug,
        p.images,
        p.is_sme_certified,
        p.purity_tested,
        p.source_transparency,
        p.ai_summary,
        p.third_party_lab_verified,
        p.potency_verified,
        p.excipient_audit,
        p.operational_legitimacy,
        p.created_at,
        COALESCE(r.review_count, 0) as review_count,
        COALESCE(c.comment_count, 0) as comment_count,
        COALESCE(r.average_rating, 0) as average_rating,
        COALESCE(rv.velocity_count, 0) as velocity_count
      FROM products p
      LEFT JOIN (
        SELECT product_id, COUNT(*) as review_count, AVG(rating) as average_rating
        FROM reviews
        WHERE (is_flagged IS FALSE OR is_flagged IS NULL)
          AND created_at >= ${startOfMonth.toISOString()}
        GROUP BY product_id
      ) r ON p.id = r.product_id
      LEFT JOIN (
        SELECT product_id, COUNT(*) as comment_count
        FROM product_comments
        WHERE (is_flagged IS FALSE OR is_flagged IS NULL)
          AND created_at >= ${startOfMonth.toISOString()}
        GROUP BY product_id
      ) c ON p.id = c.product_id
      LEFT JOIN (
        SELECT product_id, COUNT(*) as velocity_count
        FROM (
          SELECT product_id, created_at FROM reviews
          WHERE (is_flagged IS FALSE OR is_flagged IS NULL)
            AND created_at >= ${startOfWeek.toISOString()}
          UNION ALL
          SELECT product_id, created_at FROM product_comments
          WHERE (is_flagged IS FALSE OR is_flagged IS NULL)
            AND created_at >= ${startOfWeek.toISOString()}
        ) v
        GROUP BY product_id
      ) rv ON p.id = rv.product_id
      WHERE p.created_at >= ${startOfMonth.toISOString()}
      ORDER BY 
        (COALESCE(r.review_count, 0) + COALESCE(c.comment_count, 0)) DESC,
        COALESCE(rv.velocity_count, 0) DESC
      LIMIT 6
    `;

    // Map to TrendingProduct format
    return products.map((p: any) => ({
      id: p.id,
      title: p.title,
      problem_solved: p.problem_solved,
      slug: p.slug,
      images: p.images,
      is_sme_certified: p.is_sme_certified,
      purity_tested: p.purity_tested,
      source_transparency: p.source_transparency,
      ai_summary: p.ai_summary,
      third_party_lab_verified: p.third_party_lab_verified,
      potency_verified: p.potency_verified,
      excipient_audit: p.excipient_audit,
      operational_legitimacy: p.operational_legitimacy,
      created_at: p.created_at,
      reviewCount: Number(p.review_count || 0),
      commentCount: Number(p.comment_count || 0),
      averageRating: p.average_rating ? Number(p.average_rating) : undefined,
      velocityCount: Number(p.velocity_count || 0),
      activity_score: (Number(p.review_count || 0) + Number(p.comment_count || 0)),
    }));
  } catch (error) {
    console.error("Error fetching trending products:", error);
    return [];
  }
}

export default async function Home() {
  const trendingProducts = await fetchTrendingProducts();

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-forest-obsidian px-6 py-16">
      <div className="mx-auto max-w-6xl">
        {/* Recent Insights Section */}
        <div className="mb-12">
          <LatestIntelligence className="max-w-2xl mx-auto" />
        </div>

        {/* Live Activity Feed */}
        <div className="mb-12">
          <LiveLedger />
        </div>

        {/* Lens of Truth Hero Section */}
        <div className="mb-16 text-center">
          A community driven forum where evidence meets experience. Explore community vetted products and insights from the community and subject matter experts (SME&apos;s) that are willing to help.
        </div>

        {/* Lens-Aware Search - Prioritized */}
        <div className="mb-24">
          <LensAwareSearch />
        </div>

        {/* Secondary CTAs */}
        <div className="mb-16 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/products">
            <Button variant="primary" className="text-lg px-8 py-4 border border-sme-gold bg-sme-gold text-forest-obsidian hover:bg-[#9A7209] hover:border-[#9A7209] font-mono uppercase tracking-wider">
              Browse All Products
            </Button>
          </Link>
          <Link href="/discussions">
            <Button variant="outline" className="text-lg px-8 py-4 border border-translucent-emerald bg-muted-moss text-bone-white hover:bg-forest-obsidian hover:border-heart-green font-mono uppercase tracking-wider">
              Join the Community
            </Button>
          </Link>
        </div>

        {/* Trending Products Section */}
        {trendingProducts.length > 0 && (
          <div className="mt-16">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-serif text-3xl font-semibold text-bone-white">
                Community Pulse: Trending Products This Month
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {trendingProducts.map((product: TrendingProduct) => {
                // Handle images array - get first image (matching products page logic)
                let imageUrl: string | null = null;
                let imagesArray: string[] = [];

                if (product.images) {
                  if (Array.isArray(product.images)) {
                    // Direct array - expected format from PostgreSQL TEXT[]
                    imagesArray = product.images.filter((img): img is string =>
                      typeof img === 'string' && img.length > 0
                    );
                  } else if (typeof product.images === 'string') {
                    // String format - try to parse
                    try {
                      const parsed = JSON.parse(product.images);
                      if (Array.isArray(parsed)) {
                        imagesArray = parsed.filter((img: any): img is string =>
                          typeof img === 'string' && img.length > 0
                        );
                      } else {
                        // PostgreSQL array format: {url1,url2}
                        const arrayMatch = (product.images as string).match(/^\{([^}]*)\}$/);
                        if (arrayMatch) {
                          imagesArray = arrayMatch[1]
                            .split(',')
                            .map((s: string) => s.trim().replace(/^"|"$/g, ''))
                            .filter((img: string): img is string => img.length > 0);
                        }
                      }
                    } catch (e) {
                      // Try PostgreSQL array format directly
                      const arrayMatch = (product.images as string).match(/^\{([^}]*)\}$/);
                      if (arrayMatch) {
                        imagesArray = arrayMatch[1]
                          .split(',')
                          .map((s: string) => s.trim().replace(/^"|"$/g, ''))
                          .filter((img: string): img is string => img.length > 0);
                      }
                    }
                  }
                }

                // Use the first image from the array, ensuring it's a valid URL
                const firstImage = imagesArray.length > 0
                  ? (imagesArray[0] && typeof imagesArray[0] === 'string' && (imagesArray[0].startsWith('http://') || imagesArray[0].startsWith('https://'))
                    ? imagesArray[0]
                    : null)
                  : null;

                imageUrl = firstImage;

                return (
                  <div
                    key={product.id}
                    className="relative transition-all duration-300 hover:border-translucent-emerald"
                  >
                    <ProductListCard
                      title={product.title}
                      problemSolved={product.problem_solved}
                      productId={product.id}
                      imageUrl={imageUrl}
                      isSMECertified={product.is_sme_certified || false}
                      hasLabTested={product.third_party_lab_verified || false}
                      hasSourceVerified={product.source_transparency || false}
                      hasAISummary={product.ai_summary || false}
                      sourceTransparency={product.source_transparency || false}
                      purityTested={product.purity_tested || false}
                      potencyVerified={product.potency_verified || false}
                      excipientAudit={product.excipient_audit || false}
                      operationalLegitimacy={product.operational_legitimacy || false}
                      reviewCount={product.reviewCount}
                      commentCount={product.commentCount}
                      averageRating={product.averageRating}
                      activityScore={product.activity_score}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {trendingProducts.length === 0 && (
          <div className="mt-8 text-center text-bone-white/70 font-mono">
            No trending products this month. Check back soon!
          </div>
        )}
      </div>
    </main>
  );
}
