"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import ProtocolCard from "@/components/holistic/ProtocolCard";
import LatestIntelligence from "@/components/social/LatestIntelligence";
import VelocityBadge from "@/components/products/VelocityBadge";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastContainer";
import { Download, Share2 } from "lucide-react";

export const dynamic = "force-dynamic";

interface TrendingProtocol {
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
  velocityCount: number; // New insights this week
  activity_score: number; // Total community signals (reviews + comments)
}

export default function Home() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [trendingProtocols, setTrendingProtocols] = useState<TrendingProtocol[]>([]);
  const [loading, setLoading] = useState(true);

  // Handle toast from redirect
  useEffect(() => {
    const toast = searchParams.get("toast");
    if (toast === "Higher+Trust+Weight+Required" || toast === "Higher Trust Weight Required") {
      showToast("Higher Trust Weight Required", "error");
      // Clean up the URL
      router.replace("/");
    }
  }, [searchParams, router, showToast]);

  // Fetch trending protocols with engagement metrics
  useEffect(() => {
    async function fetchTrendingProtocols() {
      try {
        const supabase = createClient();
        
        // Get start of this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        // Get start of this week (7 days ago)
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - 7);
        startOfWeek.setHours(0, 0, 0, 0);

        // Fetch protocols with images and metadata
        const { data: protocols, error: protocolsError } = await supabase
          .from("protocols")
          .select("id, title, problem_solved, slug, images, is_sme_certified, purity_tested, source_transparency, ai_summary, third_party_lab_verified, potency_verified, excipient_audit, operational_legitimacy, created_at")
          .or("is_flagged.eq.false,is_flagged.is.null")
          .gte("created_at", startOfMonth.toISOString());

        if (protocolsError) {
          console.error("Error fetching protocols:", protocolsError);
          setLoading(false);
          return;
        }

        // Fetch reviews with ratings for this month
        const { data: reviews } = await supabase
          .from("reviews")
          .select("protocol_id, rating, created_at")
          .gte("created_at", startOfMonth.toISOString())
          .or("is_flagged.eq.false,is_flagged.is.null");

        // Fetch comment counts for this month
        const { data: comments } = await supabase
          .from("product_comments")
          .select("protocol_id, created_at")
          .gte("created_at", startOfMonth.toISOString())
          .or("is_flagged.eq.false,is_flagged.is.null");

        // Calculate engagement metrics per protocol
        const protocolsWithMetrics: TrendingProtocol[] = (protocols || []).map((protocol: any) => {
          const protocolReviews = (reviews || []).filter((r: any) => r.protocol_id === protocol.id);
          const protocolComments = (comments || []).filter((c: any) => c.protocol_id === protocol.id);
          
          // Calculate average rating
          const averageRating = protocolReviews.length > 0
            ? protocolReviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / protocolReviews.length
            : undefined;
          
          // Velocity: new insights this week
          const velocityReviews = protocolReviews.filter((r: any) => 
            new Date(r.created_at) >= startOfWeek
          ).length;
          const velocityComments = protocolComments.filter((c: any) => 
            new Date(c.created_at) >= startOfWeek
          ).length;
          const velocityCount = velocityReviews + velocityComments;

          return {
            ...protocol,
            reviewCount: protocolReviews.length,
            commentCount: protocolComments.length,
            averageRating,
            velocityCount,
          };
        });

        // Sort by engagement (reviews + comments) this month, then by velocity
        protocolsWithMetrics.sort((a, b) => {
          const engagementA = a.reviewCount + a.commentCount;
          const engagementB = b.reviewCount + b.commentCount;
          
          if (engagementB !== engagementA) {
            return engagementB - engagementA;
          }
          
          // Tie-breaker: velocity
          return b.velocityCount - a.velocityCount;
        });

        // Calculate activity_score (reviews + comments this month)
        const protocolsWithActivityScore = protocolsWithMetrics.map((protocol) => ({
          ...protocol,
          activity_score: protocol.reviewCount + protocol.commentCount,
        }));

        // Take top 6 trending (Popular filter)
        setTrendingProtocols(protocolsWithActivityScore.slice(0, 6));
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTrendingProtocols();
  }, []);

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-forest-obsidian px-6 py-16">
      <div className="mx-auto max-w-6xl">
        {/* Recent Insights Section */}
        <div className="mb-12">
          <LatestIntelligence className="max-w-2xl mx-auto" />
        </div>

        {/* Homeostasis Anchor - Positioned below Recent Insights */}
        <div className="mb-16 text-center">
          <h1 className="mb-6 font-serif text-5xl font-bold tracking-tight text-bone-white md:text-6xl lg:text-7xl">
            Restore Your Homeostasis.
          </h1>
          <p className="mb-12 text-xl text-bone-white/80 md:text-2xl font-mono">
            Community-driven products for the gut, heart, and mind.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/products">
              <Button variant="primary" className="text-lg px-8 py-4 border border-sme-gold bg-sme-gold text-forest-obsidian hover:bg-[#9A7209] hover:border-[#9A7209] font-mono uppercase tracking-wider">
                Find a Product
              </Button>
            </Link>
            <Link href="/discussions">
              <Button variant="outline" className="text-lg px-8 py-4 border border-translucent-emerald bg-muted-moss text-bone-white hover:bg-forest-obsidian hover:border-heart-green font-mono uppercase tracking-wider">
                Join the Community
              </Button>
            </Link>
          </div>
        </div>

        {/* Trending Products Section */}
        {!loading && trendingProtocols.length > 0 && (
          <div className="mt-16">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-serif text-3xl font-semibold text-bone-white">
                Community Pulse: Trending Products This Month
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    try {
                      // Generate OG image URL
                      const ogImageUrl = `${window.location.origin}/api/og/trending`;
                      
                      // Create download link
                      const link = document.createElement('a');
                      link.href = ogImageUrl;
                      link.download = `trending-pulse-${new Date().toISOString().split('T')[0]}.png`;
                      link.click();
                      
                      showToast('Share card downloaded!', 'success');
                    } catch (error) {
                      console.error('Error downloading trending pulse:', error);
                      showToast('Failed to download share card. Please try again.', 'error');
                    }
                  }}
                  className="flex items-center gap-2 border border-heart-green bg-heart-green/20 px-4 py-2 text-sm font-mono uppercase tracking-wider text-heart-green hover:bg-heart-green/30 hover:border-heart-green transition-all"
                  style={{
                    boxShadow: "0 0 12px rgba(16, 185, 129, 0.3)",
                  }}
                >
                  <Download size={14} />
                  Download
                </button>
                <button
                  onClick={() => {
                    try {
                      const ogImageUrl = `${window.location.origin}/api/og/trending`;
                      const tweetText = `Community Pulse: Trending Products This Month on @SME_Vibe. See the trending products with the highest community signals. ${window.location.origin}`;
                      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(ogImageUrl)}`;
                      window.open(twitterUrl, "_blank", "width=550,height=420");
                    } catch (error) {
                      console.error('Error sharing to X:', error);
                      showToast('Failed to open X. Please try again.', 'error');
                    }
                  }}
                  className="flex items-center gap-2 border border-translucent-emerald bg-forest-obsidian px-4 py-2 text-sm font-mono uppercase tracking-wider text-bone-white hover:bg-muted-moss hover:border-heart-green transition-all"
                >
                  <Share2 size={14} />
                  Post to X
                </button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {trendingProtocols.map((protocol: TrendingProtocol) => {
                // Handle images array - get first image (matching products page logic)
                let imageUrl: string | null = null;
                let imagesArray: string[] = [];
                
                if (protocol.images) {
                  if (Array.isArray(protocol.images)) {
                    // Direct array - expected format from PostgreSQL TEXT[]
                    imagesArray = protocol.images.filter((img): img is string => 
                      typeof img === 'string' && img.length > 0
                    );
                  } else if (typeof protocol.images === 'string') {
                    // String format - try to parse
                    try {
                      const parsed = JSON.parse(protocol.images);
                      if (Array.isArray(parsed)) {
                        imagesArray = parsed.filter((img: any): img is string => 
                          typeof img === 'string' && img.length > 0
                        );
                      } else {
                        // PostgreSQL array format: {url1,url2}
                        const arrayMatch = protocol.images.match(/^\{([^}]*)\}$/);
                        if (arrayMatch) {
                          imagesArray = arrayMatch[1]
                            .split(',')
                            .map((s: string) => s.trim().replace(/^"|"$/g, ''))
                            .filter((img: string): img is string => img.length > 0);
                        }
                      }
                    } catch (e) {
                      // Try PostgreSQL array format directly
                      const arrayMatch = protocol.images.match(/^\{([^}]*)\}$/);
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

                const hasHighVelocity = protocol.velocityCount > 0;

                return (
                  <div 
                    key={protocol.id} 
                    className={`relative transition-all duration-300 ${
                      hasHighVelocity 
                        ? "hover:border-heart-green hover:shadow-[0_0_16px_rgba(16,185,129,0.3)]" 
                        : "hover:border-translucent-emerald"
                    }`}
                  >
                    <ProtocolCard
                      title={protocol.title}
                      problemSolved={protocol.problem_solved}
                      productId={protocol.id}
                      imageUrl={imageUrl}
                      isSMECertified={protocol.is_sme_certified || false}
                      hasLabTested={protocol.third_party_lab_verified || false}
                      hasSourceVerified={protocol.source_transparency || false}
                      hasAISummary={protocol.ai_summary || false}
                      sourceTransparency={protocol.source_transparency || false}
                      purityTested={protocol.purity_tested || false}
                      potencyVerified={protocol.potency_verified || false}
                      excipientAudit={protocol.excipient_audit || false}
                      operationalLegitimacy={protocol.operational_legitimacy || false}
                      reviewCount={protocol.reviewCount}
                      commentCount={protocol.commentCount}
                      averageRating={protocol.averageRating}
                      activityScore={protocol.activity_score}
                    />
                    {/* Velocity Badge - Overlay on image */}
                    {hasHighVelocity && (
                      <VelocityBadge velocityCount={protocol.velocityCount} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!loading && trendingProtocols.length === 0 && (
          <div className="mt-8 text-center text-bone-white/70 font-mono">
            No trending products this month. Check back soon!
          </div>
        )}
      </div>
    </main>
  );
}
