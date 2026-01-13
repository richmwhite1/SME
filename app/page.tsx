import Link from "next/link";
import Image from "next/image";
import Button from "@/components/ui/Button";
import ProductListCard from "@/components/holistic/ProductListCard";
import LatestIntelligence from "@/components/social/LatestIntelligence";
import { getDb } from "@/lib/db";
import LiveLedger from "@/components/feed/LiveLedger";
import { MessageSquare, ArrowRight, ThumbsUp, Activity } from "lucide-react";
import SearchBar from "@/components/search/SearchBar";
import HomeExplanations from "@/components/home/HomeExplanations";
import Tooltip from "@/components/ui/Tooltip";
import { TERMINOLOGY } from "@/lib/terminology";

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

interface TrendingDiscussion {
  id: string;
  title: string;
  slug: string;
  tags: string[];
  upvote_count: number;
  message_count: number;
  author_name: string;
  author_avatar?: string;
  created_at: string;
  top_emojis: string[] | null;
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
    const products = await sql`
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
      LIMIT 8
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

async function fetchTrendingDiscussions(): Promise<TrendingDiscussion[]> {
  const sql = getDb();
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const discussions = await sql`
SELECT
d.id,
  d.title,
  d.slug,
  d.tags,
  d.upvote_count,
  d.created_at,
  COALESCE(p.display_name, p.full_name, p.username) as author_name,
  p.avatar_url as author_avatar,
  (SELECT COUNT(*) FROM discussion_comments dc WHERE dc.discussion_id = d.id):: int as message_count,
  (
    SELECT json_agg(emoji) 
    FROM (
      SELECT emoji 
      FROM comment_reactions cr 
      JOIN discussion_comments dc ON cr.comment_id = dc.id 
      WHERE dc.discussion_id = d.id 
      GROUP BY emoji 
      ORDER BY COUNT(*) DESC 
      LIMIT 3
    ) e
  ) as top_emojis
      FROM discussions d
      LEFT JOIN profiles p ON d.author_id = p.id
      WHERE d.is_flagged = FALSE
      ORDER BY(d.upvote_count + (SELECT COUNT(*) FROM discussion_comments dc WHERE dc.discussion_id = d.id)) DESC
      LIMIT 6
  `;
    return discussions as unknown as TrendingDiscussion[];
  } catch (error) {
    console.error("Error fetching trending discussions:", error);
    return [];
  }
}

export default async function Home() {
  const [trendingProducts, trendingDiscussions] = await Promise.all([
    fetchTrendingProducts(),
    fetchTrendingDiscussions(),
  ]);

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-forest-obsidian px-6 py-12 md:py-20">
      <div className="mx-auto max-w-7xl">
        {/* Hero Section - Reordered for Layout Shift */}
        <div className="flex flex-col items-center text-center max-w-5xl mx-auto mb-20 space-y-10">

          {/* Main Value Proposition - Enhanced Visibility */}
          <div className="space-y-6">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-bone-white tracking-tight leading-tight drop-shadow-lg">
              Where Evidence Meets <br className="hidden md:block" />
              <span className="text-sme-gold italic">Experience</span>
            </h1>
            <p className="text-lg md:text-2xl text-bone-white/80 font-mono max-w-3xl mx-auto leading-relaxed">
              A community-driven space where both scientific rigor and experiential wisdom are valued and verified. Your insights shape the truth.
            </p>
          </div>

          {/* Expanded Search Bar Area */}
          <div className="w-full max-w-2xl mx-auto z-20">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-sme-gold/20 via-heart-green/20 to-third-eye-indigo/20 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative">
                <SearchBar />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs font-mono text-bone-white/50">
              <span>Trending Evidence:</span>
              <Link href="/search?q=magnesium" className="hover:text-sme-gold transition-colors">Magnesium</Link>
              <span className="opacity-30">•</span>
              <Link href="/search?q=sleep" className="hover:text-sme-gold transition-colors">Sleep</Link>
              <span className="opacity-30">•</span>
              <Link href="/search?q=longevity" className="hover:text-sme-gold transition-colors">Longevity</Link>
            </div>
          </div>

          {/* How it Works CTA */}
          <div className="mb-6 -mt-10">
            <Link href="/how-it-works" className="inline-flex items-center gap-2 text-sme-gold hover:text-[#9A7209] transition-colors font-mono text-sm tracking-wide uppercase border-b border-transparent hover:border-[#9A7209]">
              <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] font-bold">?</span>
              New? See how it works
            </Link>
          </div>

          {/* Primary CTAs */}
          <div className="flex flex-col sm:flex-row gap-5 pt-4 w-full sm:w-auto">
            <Link href="/products/submit" className="w-full sm:w-auto">
              <Button variant="primary" className="w-full text-lg px-8 py-6 border border-sme-gold bg-sme-gold/10 text-sme-gold hover:bg-sme-gold hover:text-forest-obsidian font-mono uppercase tracking-widest transition-all duration-300 backdrop-blur-sm">
                + Share Evidence
              </Button>
            </Link>
            <Link href="/discussions/new" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full text-lg px-8 py-6 border border-translucent-emerald bg-muted-moss/50 text-bone-white hover:bg-forest-obsidian hover:border-heart-green font-mono uppercase tracking-widest transition-all duration-300">
                Start Discussion
              </Button>
            </Link>
          </div>
        </div>

        {/* Interactive Explanations */}
        <HomeExplanations />

        {/* Content Section: Community Pulse (Products) */}
        <section className="mb-24">
          <div className="flex items-end justify-between mb-8 border-b border-translucent-emerald/30 pb-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-serif font-semibold text-bone-white flex items-center gap-3">
                <span className="text-heart-green">●</span> Top Verified Products
                <Tooltip content={TERMINOLOGY.COMMUNITY_SIGNALS} />
              </h2>
              <p className="mt-2 text-sm text-bone-white/60 font-mono">
                Highest rated by community consensus and Community Signals.
              </p>
            </div>
            <Link href="/products" className="hidden sm:flex items-center gap-2 text-sm font-mono text-sme-gold hover:text-white transition-colors group">
              View All <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {trendingProducts.length > 0 ? (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {trendingProducts.slice(0, 4).map((product: TrendingProduct) => {
                // Handle images array - get first image (matching products page logic)
                let imageUrl: string | null = null;
                let imagesArray: string[] = [];
                if (product.images) {
                  if (Array.isArray(product.images)) {
                    imagesArray = product.images.filter((img): img is string => typeof img === 'string' && img.length > 0);
                  } else if (typeof product.images === 'string') {
                    try {
                      const parsed = JSON.parse(product.images);
                      if (Array.isArray(parsed)) imagesArray = parsed.filter((img: any): img is string => typeof img === 'string' && img.length > 0);
                    } catch (e) {
                      const arrayMatch = (product.images as string).match(/^\{([^}]*)\}$/);
                      if (arrayMatch) imagesArray = arrayMatch[1].split(',').map(s => s.trim().replace(/^"|"$/g, '')).filter(img => img.length > 0);
                    }
                  }
                }
                const firstImage = imagesArray.length > 0 ? (imagesArray[0] && typeof imagesArray[0] === 'string' && (imagesArray[0].startsWith('http') || imagesArray[0].startsWith('/')) ? imagesArray[0] : null) : null;
                imageUrl = firstImage;

                return (
                  <div key={product.id} className="group relative">
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
          ) : (
            <div className="text-center py-12 border border-dashed border-translucent-emerald rounded-lg">
              <p className="text-bone-white/50 font-mono">No trending products yet.</p>
            </div>
          )}
          <div className="mt-8 text-center sm:hidden">
            <Link href="/products">
              <Button variant="outline" className="w-full">View All Products</Button>
            </Link>
          </div>
        </section>

        {/* Content Section: Trending Discussions */}
        <section className="mb-24">
          <div className="flex items-end justify-between mb-8 border-b border-translucent-emerald/30 pb-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-serif font-semibold text-bone-white flex items-center gap-3">
                <span className="text-third-eye-indigo">●</span> Active Discussions
              </h2>
              <p className="mt-2 text-sm text-bone-white/60 font-mono">
                Current topics sparking debate among experts and users.
              </p>
            </div>
            <Link href="/discussions" className="hidden sm:flex items-center gap-2 text-sm font-mono text-sme-gold hover:text-white transition-colors group">
              Join Conversation <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {trendingDiscussions.map((discussion) => (
              <Link key={discussion.id} href={`/discussions/${discussion.id}`} className="group">
                <div className="h-full flex flex-col border border-translucent-emerald bg-muted-moss/30 p-6 rounded-lg hover:border-sme-gold/50 hover:bg-forest-obsidian transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex gap-2 text-xs font-mono text-bone-white/50">
                      {discussion.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="bg-forest-obsidian px-2 py-1 rounded">#{tag}</span>
                      ))}
                    </div>
                    {/* Activity Metrics */}
                    <div className="flex items-center gap-3 text-xs font-mono text-bone-white/60">
                      <div className="flex items-center gap-1" title="Upvotes">
                        <ThumbsUp size={12} className={discussion.upvote_count > 0 ? "text-sme-gold" : ""} />
                        <span>{discussion.upvote_count}</span>
                      </div>
                      <div className="flex items-center gap-1" title="Comments">
                        <MessageSquare size={12} className={discussion.message_count > 0 ? "text-heart-green" : ""} />
                        <span>{discussion.message_count}</span>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-xl font-serif text-bone-white mb-3 group-hover:text-sme-gold transition-colors line-clamp-2">
                    {discussion.title}
                  </h3>

                  {/* Top Emojis & Author - Pushed to bottom */}
                  <div className="mt-auto pt-4 border-t border-translucent-emerald/20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-forest-obsidian border border-translucent-emerald overflow-hidden">
                        {discussion.author_avatar ? (
                          <div className="relative w-full h-full">
                            <Image
                              src={discussion.author_avatar}
                              alt={discussion.author_name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-bone-white">
                            {discussion.author_name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-mono text-bone-white/70 truncate max-w-[100px]">
                        {discussion.author_name}
                      </span>
                    </div>

                    {/* Emojis Display */}
                    {discussion.top_emojis && discussion.top_emojis.length > 0 && (
                      <div className="flex -space-x-1">
                        {discussion.top_emojis.slice(0, 3).map((emoji, i) => (
                          <span key={i} className="text-sm bg-forest-obsidian rounded-full px-1 border border-translucent-emerald/30 relative z-0 hover:z-10 transition-transform hover:scale-125 cursor-default">
                            {emoji}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {trendingDiscussions.length === 0 && (
            <div className="text-center py-12 border border-dashed border-translucent-emerald rounded-lg">
              <p className="text-bone-white/50 font-mono">No discussions yet. Contribute your wisdom!</p>
              <div className="mt-4">
                <Link href="/discussions/new">
                  <Button variant="outline">Start Discussion</Button>
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* Third Section: Activity Feed & Intelligence */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="mb-6 border-b border-translucent-emerald/30 pb-2">
              <h3 className="text-lg font-mono uppercase tracking-wider text-bone-white/80">Latest Intelligence</h3>
            </div>
            <LatestIntelligence />
          </div>
          <div>
            <div className="mb-6 border-b border-translucent-emerald/30 pb-2">
              <h3 className="text-lg font-mono uppercase tracking-wider text-bone-white/80">Live Ledger</h3>
            </div>
            <LiveLedger />
          </div>
        </div>

      </div>
    </main>
  );
}
