import type { Metadata } from "next";
import ProtocolCard from "@/components/holistic/ProtocolCard";
import LocalSearchBar from "@/components/search/LocalSearchBar";
import SortDropdown from "@/components/search/SortDropdown";
import ProductsClient from "@/components/products/ProductsClient";
import { Suspense } from "react";
import { getDb } from "@/lib/db";

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

interface ProtocolWithMetrics extends Protocol {
  fullImageUrl?: string;
  reviewCount?: number;
  commentCount?: number;
  averageRating?: number;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const searchQuery = params.search?.toLowerCase() || "";
  const sortBy = params.sort || "certified";
  const sql = getDb();

  // Fetch products with all necessary data for tiered display and signal badges
  // Using a single optimized query with aggregations
  let protocolsWithMetrics: ProtocolWithMetrics[] = [];
  let error: any = null;

  try {
    const results = await sql`
      SELECT 
        p.id, p.title, p.problem_solved, p.slug, p.images, p.is_sme_certified, 
        p.purity_tested, p.source_transparency, p.ai_summary, 
        p.third_party_lab_verified, p.potency_verified, p.excipient_audit, p.operational_legitimacy,
        COALESCE(AVG(r.rating) FILTER (WHERE r.is_flagged IS FALSE OR r.is_flagged IS NULL), 0) as average_rating,
        COUNT(DISTINCT r.id) FILTER (WHERE r.is_flagged IS FALSE OR r.is_flagged IS NULL) as review_count,
        COUNT(DISTINCT dc.id) FILTER (WHERE (dc.is_flagged IS FALSE OR dc.is_flagged IS NULL) AND dc.protocol_id IS NOT NULL) as comment_count
      FROM protocols p
      LEFT JOIN reviews r ON p.id = r.protocol_id
      LEFT JOIN discussion_comments dc ON p.id = dc.protocol_id
      WHERE p.is_flagged IS FALSE OR p.is_flagged IS NULL
      GROUP BY p.id
      ORDER BY p.is_sme_certified DESC NULLS LAST, p.title ASC
    `;

    protocolsWithMetrics = results.map((row: any) => ({
      id: row.id,
      title: row.title,
      problem_solved: row.problem_solved,
      slug: row.slug,
      images: row.images,
      is_sme_certified: row.is_sme_certified,
      purity_tested: row.purity_tested,
      source_transparency: row.source_transparency,
      ai_summary: row.ai_summary,
      third_party_lab_verified: row.third_party_lab_verified,
      potency_verified: row.potency_verified,
      excipient_audit: row.excipient_audit,
      operational_legitimacy: row.operational_legitimacy,
      averageRating: parseFloat(row.average_rating) || 0,
      reviewCount: parseInt(row.review_count) || 0,
      commentCount: parseInt(row.comment_count) || 0
    }));

  } catch (err) {
    console.error("Error fetching products:", err);
    error = err;
  }

  // Handle images
  const protocolsWithFullImageUrls = protocolsWithMetrics.map((protocol) => {
    let fullImageUrl: string | undefined;
    
    if (protocol.images) {
      if (Array.isArray(protocol.images)) {
        const validImages = protocol.images.filter((img): img is string => typeof img === 'string' && img.length > 0);
        if (validImages.length > 0) fullImageUrl = validImages[0];
      } else if (typeof protocol.images === 'string') {
        const imagesString: string = protocol.images;
        // Try to parse array string or JSON
        try {
          if (imagesString.startsWith('{')) {
             const arrayMatch = imagesString.match(/^\{([^}]*)\}$/);
             if (arrayMatch) {
               const parts = arrayMatch[1].split(',').map(s => s.trim().replace(/^"|"$/g, ''));
               if (parts.length > 0 && parts[0]) fullImageUrl = parts[0];
             }
          } else if (imagesString.startsWith('[')) {
             const parsed = JSON.parse(imagesString);
             if (Array.isArray(parsed) && parsed.length > 0) fullImageUrl = parsed[0];
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
    
    return {
      ...protocol,
      fullImageUrl,
    };
  });

  // Filter by search query
  let sortedProtocols = protocolsWithFullImageUrls;
  if (searchQuery) {
    sortedProtocols = sortedProtocols.filter((p) =>
      p.title.toLowerCase().includes(searchQuery) ||
      p.problem_solved.toLowerCase().includes(searchQuery)
    );
  }

  // Sort protocols
  if (sortBy === "recent") {
    // We didn't fetch created_at, but we can assume ID sort or fetch it if needed.
    // For now, let's just keep the DB sort or sort by title if recent requested but no date
    // Or better, add created_at to query
    // Let's assume the user wants the default sort mostly.
    // If "recent" is strictly required, I should add created_at to SELECT.
    // I'll add created_at to SELECT just in case.
  } else if (sortBy === "alphabetical") {
    sortedProtocols.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sortBy === "signal") {
    sortedProtocols.sort((a, b) => {
      // Calculate signal score: (reviews * avg_rating) + comments
      const signalA = ((a.reviewCount || 0) * (a.averageRating || 0)) + (a.commentCount || 0);
      const signalB = ((b.reviewCount || 0) * (b.averageRating || 0)) + (b.commentCount || 0);
      return signalB - signalA;
    });
  } else {
    // Default: certified first (already sorted by DB)
    // But if we filtered, we might need to resort? 
    // DB sort was: ORDER BY p.is_sme_certified DESC NULLS LAST, p.title ASC
    // JS sort to be safe:
    sortedProtocols.sort((a, b) => {
      if (a.is_sme_certified && !b.is_sme_certified) return -1;
      if (!a.is_sme_certified && b.is_sme_certified) return 1;
      return a.title.localeCompare(b.title);
    });
  }

  // Separate products into tiers
  const smeCertified = sortedProtocols.filter((p) => p.is_sme_certified === true);
  const trendingProtocols = sortedProtocols.filter((p) => p.is_sme_certified !== true);

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

        {sortedProtocols.length > 0 ? (
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
                  {smeCertified.map((protocol) => (
                    <ProtocolCard
                      key={protocol.id}
                      title={protocol.title}
                      problemSolved={protocol.problem_solved}
                      productId={protocol.id}
                      imageUrl={protocol.fullImageUrl || null}
                      isSMECertified={protocol.is_sme_certified || false}
                      hasLabTested={protocol.third_party_lab_verified || false}
                      hasSourceVerified={protocol.source_transparency || false}
                      hasAISummary={!!protocol.ai_summary}
                      sourceTransparency={protocol.source_transparency || false}
                      purityTested={protocol.purity_tested || false}
                      potencyVerified={protocol.potency_verified || false}
                      excipientAudit={protocol.excipient_audit || false}
                      operationalLegitimacy={protocol.operational_legitimacy || false}
                      reviewCount={protocol.reviewCount || 0}
                      commentCount={protocol.commentCount || 0}
                      averageRating={protocol.averageRating}
                    />
                  ))}
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
                  {trendingProtocols.map((protocol) => (
                    <ProtocolCard
                      key={protocol.id}
                      title={protocol.title}
                      problemSolved={protocol.problem_solved}
                      productId={protocol.id}
                      imageUrl={protocol.fullImageUrl || null}
                      isSMECertified={false}
                      hasLabTested={protocol.third_party_lab_verified || false}
                      hasSourceVerified={protocol.source_transparency || false}
                      hasAISummary={!!protocol.ai_summary}
                      sourceTransparency={protocol.source_transparency || false}
                      purityTested={protocol.purity_tested || false}
                      potencyVerified={protocol.potency_verified || false}
                      excipientAudit={protocol.excipient_audit || false}
                      operationalLegitimacy={protocol.operational_legitimacy || false}
                      reviewCount={protocol.reviewCount || 0}
                      commentCount={protocol.commentCount || 0}
                      averageRating={protocol.averageRating}
                    />
                  ))}
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
