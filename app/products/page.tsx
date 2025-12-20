import { getDb } from "@/lib/db";
import type { Metadata } from "next";
import ProtocolCard from "@/components/holistic/ProtocolCard";
import LocalSearchBar from "@/components/search/LocalSearchBar";
import SortDropdown from "@/components/search/SortDropdown";
import ProductsClient from "@/components/products/ProductsClient";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Products - SME Transparency Reports",
  description: "Browse verified products with research-based transparency reports and SME certification.",
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL || "https://sme.example.com"}/products`,
  },
};

interface Protocol {
  id: string;
  title: string;
  problem_solved: string;
  slug: string;
  images?: string[] | null;
  is_sme_certified?: boolean | null;
  purity_tested?: boolean | null;
  source_transparency?: boolean | null;
  ai_summary?: string | null;
  third_party_lab_verified?: boolean | null;
  potency_verified?: boolean | null;
  excipient_audit?: boolean | null;
  operational_legitimacy?: boolean | null;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; sort?: string }>;
}) {
  const sql = getDb();
  const params = await searchParams;
  const searchQuery = params.search?.toLowerCase() || "";
  const sortBy = params.sort || "certified";

  // Fetch products with all necessary data for tiered display and signal badges
  let protocols: Protocol[] | null = null;
  let error: any = null;

  try {
    const results = await sql<Protocol[]>`
      SELECT 
        id, title, problem_solved, slug, images, is_sme_certified, 
        purity_tested, source_transparency, ai_summary, 
        third_party_lab_verified, potency_verified, excipient_audit, 
        operational_legitimacy
      FROM protocols
      WHERE (is_flagged IS FALSE OR is_flagged IS NULL)
      ORDER BY is_sme_certified DESC NULLS LAST, title ASC
    `;
    
    protocols = results;

    if (protocols) {
      console.log(`Successfully fetched ${protocols.length} products`);
      // Log first product for debugging
      if (protocols.length > 0) {
        console.log("Sample product:", {
          id: protocols[0].id,
          title: protocols[0].title,
          images: protocols[0].images,
          imagesType: typeof protocols[0].images,
          isArray: Array.isArray(protocols[0].images),
        });
      }
    }
  } catch (err) {
    console.error("Unexpected error fetching products:", err);
    error = err;
    protocols = null;
  }

  // Images should already be full URLs from upload, just use the first one
  const protocolsWithFullImageUrls = (protocols || [])?.map((protocol: Protocol) => {
    // Handle images - PostgreSQL TEXT[] arrays should come as arrays from Supabase
    // But sometimes they come as strings or need special handling
    let imagesArray: string[] = [];
    
    if (protocol.images) {
      if (Array.isArray(protocol.images)) {
        // Direct array - this is the expected format from PostgreSQL TEXT[]
        imagesArray = protocol.images.filter((img): img is string => 
          typeof img === 'string' && img.length > 0
        );
      } else if (typeof protocol.images === 'string') {
        // String format - try to parse
        const imagesString: string = protocol.images;
        try {
          // Try JSON parse first
          const parsed = JSON.parse(imagesString);
          if (Array.isArray(parsed)) {
            imagesArray = parsed.filter((img: any): img is string => 
              typeof img === 'string' && img.length > 0
            );
          } else {
            // Might be a PostgreSQL array string like "{url1,url2}"
            const arrayMatch = imagesString.match(/^\{([^}]*)\}$/);
            if (arrayMatch) {
              imagesArray = arrayMatch[1]
                .split(',')
                .map((s: string) => s.trim().replace(/^"|"$/g, ''))
                .filter((img: string): img is string => img.length > 0);
            }
          }
        } catch (e) {
          // Try PostgreSQL array format: {url1,url2}
          const arrayMatch = imagesString.match(/^\{([^}]*)\}$/);
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

    console.log(`Product ${protocol.id} - Images:`, {
      raw: protocol.images,
      type: typeof protocol.images,
      isArray: Array.isArray(protocol.images),
      parsed: imagesArray,
      firstImage: firstImage
    });

    return {
      ...protocol,
      fullImageUrl: firstImage,
    };
  });

  // Apply search filter if present
  let filteredProtocols = protocolsWithFullImageUrls || [];
  if (searchQuery) {
    filteredProtocols = filteredProtocols.filter((p) => {
      const titleMatch = p.title?.toLowerCase().includes(searchQuery);
      const problemMatch = p.problem_solved?.toLowerCase().includes(searchQuery);
      return titleMatch || problemMatch;
    });
  }

  // Apply sorting
  let sortedProtocols = [...filteredProtocols];
  if (sortBy === "recent") {
    sortedProtocols.sort((a, b) => {
      // Would need created_at field - for now, keep original order
      return 0;
    });
  } else if (sortBy === "alphabetical") {
    sortedProtocols.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sortBy === "signal") {
    // Sort by Signal: Certification + Community Engagement
    sortedProtocols.sort((a, b) => {
      const aProtocol = a as any;
      const bProtocol = b as any;
      
      // Calculate signal score: certification (10 points) + engagement (reviews + comments)
      const getSignalScore = (p: any) => {
        const certScore = p.is_sme_certified ? 10 : 0;
        const engagementScore = (p.reviewCount || 0) + (p.commentCount || 0);
        return certScore + engagementScore;
      };
      
      const scoreA = getSignalScore(aProtocol);
      const scoreB = getSignalScore(bProtocol);
      
      // Higher signal first
      if (scoreA > scoreB) return -1;
      if (scoreA < scoreB) return 1;
      
      // Tie-breaker: certified first, then alphabetical
      if (aProtocol.is_sme_certified && !bProtocol.is_sme_certified) return -1;
      if (!aProtocol.is_sme_certified && bProtocol.is_sme_certified) return 1;
      return aProtocol.title.localeCompare(bProtocol.title);
    });
  } else {
    // Default: certified first
    sortedProtocols.sort((a, b) => {
      if (a.is_sme_certified && !b.is_sme_certified) return -1;
      if (!a.is_sme_certified && b.is_sme_certified) return 1;
      return a.title.localeCompare(b.title);
    });
  }

  // Fetch reviews with ratings for all products to calculate average ratings
  const { data: allReviews } = await supabase
    .from("reviews")
    .select("protocol_id, rating")
    .or("is_flagged.eq.false,is_flagged.is.null");

  // Fetch comment counts for all products from product_comments table
  const protocolsWithCommentCounts = await Promise.all(
    sortedProtocols.map(async (protocol) => {
      const { count, error } = await supabase
        .from("product_comments")
        .select("*", { count: "exact", head: true })
        .eq("protocol_id", protocol.id)
        .or("is_flagged.eq.false,is_flagged.is.null");

      if (error) {
        console.error(`Error fetching comment count for product ${protocol.id}:`, error);
      }

      return {
        ...protocol,
        commentCount: count || 0,
      };
    })
  );

  // Calculate average rating for each protocol
  const protocolsWithRatings = protocolsWithCommentCounts.map((protocol) => {
    const protocolReviews = (allReviews || []).filter((r: any) => r.protocol_id === protocol.id);
    const averageRating = protocolReviews.length > 0
      ? protocolReviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / protocolReviews.length
      : undefined;
    
    return {
      ...protocol,
      averageRating,
      reviewCount: protocolReviews.length,
    };
  });

  // Separate products into tiers
  const smeCertified = protocolsWithRatings.filter((p) => p.is_sme_certified === true);
  const trendingProtocols = protocolsWithRatings.filter((p) => p.is_sme_certified !== true);

  return (
    <main className="min-h-screen bg-forest-obsidian">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="mb-2 font-serif text-3xl font-bold text-bone-white">
                Products
              </h1>
              <p className="text-sm text-bone-white/70 font-mono uppercase tracking-wider">
                Transparency Reports & Research Analysis
              </p>
            </div>
            <SortDropdown
              options={[
                { value: "certified", label: "SME Certified" },
                { value: "signal", label: "Sort by Signal" },
                { value: "recent", label: "Most Recent" },
                { value: "alphabetical", label: "Alphabetical" },
              ]}
              defaultOption="certified"
            />
          </div>

          {/* Search Bar - Apothecary Terminal */}
          <div className="mb-6">
            <Suspense fallback={<div className="h-10 w-full border border-translucent-emerald bg-muted-moss" />}>
              <ProductsClient searchQuery={searchQuery} />
            </Suspense>
          </div>
        </div>

        {protocolsWithFullImageUrls && protocolsWithFullImageUrls.length > 0 ? (
          <div className="space-y-12">
            {/* Tier 1: Featured Certified Products */}
            {smeCertified.length > 0 && (
              <section>
                <div className="mb-4 flex items-center gap-3 border-b border-translucent-emerald pb-3">
                  <h2 className="font-serif text-xl font-bold text-bone-white">
                    Featured Certified Products
                  </h2>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-bone-white/70">
                    ({smeCertified.length})
                  </span>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {smeCertified.map((protocol) => {
                    const protocolWithMetrics = protocol as Protocol & { fullImageUrl?: string; reviewCount?: number; commentCount?: number; averageRating?: number };
                    return (
                      <ProtocolCard
                        key={protocol.id}
                        title={protocol.title}
                        problemSolved={protocol.problem_solved}
                        productId={protocol.id}
                        imageUrl={protocolWithMetrics.fullImageUrl || null}
                        isSMECertified={protocol.is_sme_certified || false}
                        hasLabTested={protocol.third_party_lab_verified || false}
                        hasSourceVerified={protocol.source_transparency || false}
                        hasAISummary={!!protocol.ai_summary}
                        sourceTransparency={protocol.source_transparency || false}
                        purityTested={protocol.purity_tested || false}
                        potencyVerified={protocol.potency_verified || false}
                        excipientAudit={protocol.excipient_audit || false}
                        operationalLegitimacy={protocol.operational_legitimacy || false}
                        reviewCount={protocolWithMetrics.reviewCount || 0}
                        commentCount={protocolWithMetrics.commentCount || 0}
                        averageRating={protocolWithMetrics.averageRating}
                      />
                    );
                  })}
                </div>
              </section>
            )}

            {/* Tier 2: Community Catalog */}
            {trendingProtocols.length > 0 && (
              <section>
                <div className="mb-4 flex items-center gap-3 border-b border-translucent-emerald pb-3">
                  <h2 className="font-serif text-xl font-bold text-bone-white">
                    Community Catalog
                  </h2>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-bone-white/70">
                    ({trendingProtocols.length})
                  </span>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {trendingProtocols.map((protocol) => {
                    const protocolWithMetrics = protocol as Protocol & { fullImageUrl?: string; reviewCount?: number; commentCount?: number; averageRating?: number };
                    return (
                      <ProtocolCard
                        key={protocol.id}
                        title={protocol.title}
                        problemSolved={protocol.problem_solved}
                        productId={protocol.id}
                        imageUrl={protocolWithMetrics.fullImageUrl || null}
                        isSMECertified={false}
                        hasLabTested={protocol.third_party_lab_verified || false}
                        hasSourceVerified={protocol.source_transparency || false}
                        hasAISummary={!!protocol.ai_summary}
                        sourceTransparency={protocol.source_transparency || false}
                        purityTested={protocol.purity_tested || false}
                        potencyVerified={protocol.potency_verified || false}
                        excipientAudit={protocol.excipient_audit || false}
                        operationalLegitimacy={protocol.operational_legitimacy || false}
                        reviewCount={protocolWithMetrics.reviewCount || 0}
                        commentCount={protocolWithMetrics.commentCount || 0}
                        averageRating={protocolWithMetrics.averageRating}
                      />
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="border border-translucent-emerald bg-muted-moss p-12 text-center">
            <p className="text-bone-white/70">No products available yet.</p>
          </div>
        )}

        {error && (
          <div className="mt-8 text-center text-heart-green text-sm font-mono">
            Error loading products. Please try again later.
          </div>
        )}
      </div>
    </main>
  );
}

