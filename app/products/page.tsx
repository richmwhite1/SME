import { Suspense } from 'react';
import Link from 'next/link';
import { getDb } from '@/lib/db';

import ProductsClient from '@/components/products/ProductsClient';
import PillarProgressBar from '@/components/products/PillarProgressBar';

import {
  ShieldCheck,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  Activity,
  Users,
  Star
} from 'lucide-react';
import { getPlaceholderImage } from '@/lib/image-utils';

export const dynamic = "force-dynamic";

// Types
interface Product {
  id: string;
  title: string;
  slug: string;
  problem_solved: string;
  images: string[] | string | null; // Helper handles both
  product_photos?: string[] | null; // New field
  tags: string[];
  is_sme_certified: boolean;
  created_at: string;
}

interface ProductWithMetrics extends Product {
  reviewCount: number;
  activityScore: number;
  communityAvgRating: number | null;
  avgSMEScores: {
    purity: number | null;
    bioavailability: number | null;
    potency: number | null;
    evidence: number | null;
    sustainability: number | null;
    experience: number | null;
    safety: number | null;
    transparency: number | null;
    synergy: number | null;
  };
  smeReviewCount: number;
}

// Helper to safely parse images
const parseImages = (images: string[] | string | null): string[] => {
  if (!images) return [];
  if (Array.isArray(images)) return images;
  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      // Handle postgres array syntax {img1,img2}
      const match = images.match(/^\{([^}]+)\}$/);
      if (match) {
        return match[1].split(',').map(s => s.replace(/"/g, ''));
      }
      return [];
    }
  }
  return [];
};

// Helper to get primary image from either source
const getPrimaryImage = (product: Product): string | null => {
  if (product.product_photos && product.product_photos.length > 0) {
    return product.product_photos[0];
  }
  const legacyImages = parseImages(product.images);
  return legacyImages.length > 0 ? legacyImages[0] : null;
};

async function getProducts(searchParams: { search?: string; category?: string; certified?: string }) {
  const sql = getDb();
  const { search, category, certified } = searchParams;

  try {
    // Build the query with filters - now including SME scores
    const productsResult = await sql`
      SELECT 
        id, 
        title, 
        slug, 
        problem_solved, 
        images, 
        product_photos,
        tags, 
        is_sme_certified, 
        created_at,
        avg_sme_purity,
        avg_sme_bioavailability,
        avg_sme_potency,
        avg_sme_evidence,
        avg_sme_sustainability,
        avg_sme_experience,
        avg_sme_safety,
        avg_sme_transparency,
        avg_sme_synergy,
        sme_review_count
      FROM products
      WHERE admin_status = 'approved'
      ${search ? sql`AND (title ILIKE ${'%' + search + '%'} OR problem_solved ILIKE ${'%' + search + '%'})` : sql``}
      ${category ? sql`AND ${category} = ANY(tags)` : sql``}
      ${certified === 'true' ? sql`AND is_sme_certified = true` : sql``}
      ORDER BY created_at DESC
    `;

    // Fetch metrics (review count and average rating)
    const metricsResult = await sql`
      SELECT 
        product_id,
        COUNT(*) as count,
        AVG(rating) as avg_rating
      FROM reviews
      GROUP BY product_id
    `;

    const metricsMap = new Map(metricsResult.map((m: any) => [
      m.product_id,
      { count: parseInt(m.count), avgRating: m.avg_rating ? Number(m.avg_rating) : null }
    ]));

    const products: ProductWithMetrics[] = productsResult.map((p: any) => {
      const metric = metricsMap.get(p.id) || { count: 0, avgRating: null };
      return {
        id: p.id,
        title: p.title,
        slug: p.slug,
        problem_solved: p.problem_solved,
        images: p.images,
        product_photos: p.product_photos,
        tags: p.tags,
        is_sme_certified: p.is_sme_certified,
        created_at: p.created_at,
        reviewCount: metric.count,
        activityScore: metric.count * 10,
        communityAvgRating: metric.avgRating,
        avgSMEScores: {
          purity: p.avg_sme_purity ? Number(p.avg_sme_purity) : null,
          bioavailability: p.avg_sme_bioavailability ? Number(p.avg_sme_bioavailability) : null,
          potency: p.avg_sme_potency ? Number(p.avg_sme_potency) : null,
          evidence: p.avg_sme_evidence ? Number(p.avg_sme_evidence) : null,
          sustainability: p.avg_sme_sustainability ? Number(p.avg_sme_sustainability) : null,
          experience: p.avg_sme_experience ? Number(p.avg_sme_experience) : null,
          safety: p.avg_sme_safety ? Number(p.avg_sme_safety) : null,
          transparency: p.avg_sme_transparency ? Number(p.avg_sme_transparency) : null,
          synergy: p.avg_sme_synergy ? Number(p.avg_sme_synergy) : null,
        },
        smeReviewCount: p.sme_review_count || 0
      };
    });

    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string; certified?: string }>;
}) {
  const params = await searchParams;
  const products = await getProducts(params);
  const trendingProducts = products
    .sort((a, b) => b.activityScore - a.activityScore)
    .slice(0, 3);

  const categories = ['Gut Health', 'Sleep', 'Cognition', 'Longevity', 'Immunity', 'Fitness'];

  return (
    <div className="min-h-screen bg-forest-obsidian font-sans">
      {/* Hero Section */}
      <div className="relative border-b border-translucent-emerald">
        <div className="absolute inset-0 bg-gold-gradient opacity-5" />
        <div className="container mx-auto px-4 py-16 relative">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-serif text-bone-white mb-6">
              Community <span className="text-sme-gold">products</span>
            </h1>
            <p className="text-lg text-bone-white/80 mb-8 leading-relaxed">
              Explore a range of health products along with the feedback from our community.
              Contributors that provide enough helpful feedback are promoted to SME&apos;s (Subject Matter Experts)
              to help weigh in on products and discussions in the community.
            </p>

            {/* Search Bar - Client Action Needed */}
            <div className="relative max-w-lg">
              <Suspense>
                <ProductsClient searchQuery={params.search || ""} />
              </Suspense>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Filters Sidebar */}
          <div className="lg:col-span-1 space-y-8">
            <div className="p-6 rounded-xl bg-white/5 border border-translucent-emerald sticky top-24">
              <div className="flex items-center gap-2 mb-6">
                <Filter className="w-5 h-5 text-sme-gold" />
                <h3 className="font-serif text-xl text-bone-white">Filters</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-mono text-bone-white/60 mb-3 uppercase tracking-wider">
                    Certifications
                  </label>
                  <div className="space-y-2">
                    <Link
                      href={{
                        pathname: '/products',
                        query: { ...params, certified: params.certified === 'true' ? undefined : 'true' }
                      }}
                      className="flex items-center gap-2 text-bone-white/80 hover:text-bone-white cursor-pointer group"
                    >
                      <div className={`w-4 h-4 rounded border ${params.certified === 'true' ? 'bg-sme-gold border-sme-gold' : 'border-white/20'} group-hover:border-sme-gold/50 flex items-center justify-center transition-colors`}>
                        {params.certified === 'true' && <div className="w-1.5 h-1.5 bg-forest-black rounded-full" />}
                      </div>
                      <span className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-sme-gold" />
                        SME Verified
                      </span>
                    </Link>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-mono text-bone-white/60 mb-3 uppercase tracking-wider">
                    Categories
                  </label>
                  <div className="space-y-2">
                    {categories.map((cat) => (
                      <Link
                        key={cat}
                        href={{
                          pathname: '/products',
                          query: { ...params, category: params.category === cat ? undefined : cat }
                        }}
                        className="flex items-center gap-2 text-bone-white/80 hover:text-bone-white cursor-pointer group"
                      >
                        <div className={`w-4 h-4 rounded border ${params.category === cat ? 'bg-sme-gold border-sme-gold' : 'border-white/20'} group-hover:border-sme-gold/50 transition-colors flex items-center justify-center`}>
                          {params.category === cat && <div className="w-1.5 h-1.5 bg-forest-black rounded-full" />}
                        </div>
                        {cat}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Clear Filters */}
                {(params.search || params.category || params.certified) && (
                  <Link
                    href="/products"
                    className="block text-center text-xs font-mono text-sme-gold/60 hover:text-sme-gold transition-colors pt-4 border-t border-white/10"
                  >
                    CLEAR ALL FILTERS
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="lg:col-span-3">
            {/* Trending Section - Only show when no active search/filter */}
            {trendingProducts.length > 0 && !params.search && !params.category && !params.certified && (
              <div className="mb-12">
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp className="w-5 h-5 text-sme-gold" />
                  <h2 className="font-serif text-2xl text-bone-white">Trending Now</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                  {trendingProducts.map((product) => (
                    <Link key={product.id} href={`/products/${product.slug}`} className="group">
                      <div className="h-full p-5 rounded-xl bg-white/5 border border-translucent-emerald hover:border-sme-gold/30 hover:bg-white/10 transition-all duration-300 relative overflow-hidden">
                        <div className="aspect-square mb-4 relative rounded-lg overflow-hidden bg-black/20">
                          {getPrimaryImage(product) ? (
                            <img
                              src={getPrimaryImage(product)!}
                              alt={product.title}
                              className="object-contain w-full h-full transform group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <img
                              src={getPlaceholderImage(product.id)}
                              alt={product.title}
                              className="object-cover w-full h-full opacity-40 mix-blend-luminosity group-hover:opacity-60 transition-opacity"
                            />
                          )}
                          {product.is_sme_certified && (
                            <div className="absolute top-2 right-2 bg-sme-gold text-forest-black text-[10px] font-bold px-2 py-1 rounded shadow-lg flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" /> SME
                            </div>
                          )}
                        </div>
                        <h3 className="font-serif text-lg text-bone-white group-hover:text-sme-gold transition-colors mb-2 line-clamp-2">
                          {product.title}
                        </h3>
                        <div className="mt-2 flex items-center justify-between">
                          <PillarProgressBar
                            avgScores={product.avgSMEScores}
                            reviewCount={product.smeReviewCount}
                            compact={true}
                          />
                          <div className="flex items-center gap-1 text-[10px] font-mono text-bone-white/40">
                            <Star size={10} className={product.communityAvgRating ? 'text-sme-gold fill-sme-gold' : ''} />
                            {product.communityAvgRating ? product.communityAvgRating.toFixed(1) : '—'}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* All Products */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-2xl text-bone-white">
                {params.search ? `Results for "${params.search}"` : params.category ? `${params.category} Products` : 'All Products'}
              </h2>
              <div className="text-sm font-mono text-bone-white/50">
                Showing {products.length} results
              </div>
            </div>

            {products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {products.map((product) => (
                  <Link key={product.id} href={`/products/${product.slug}`} className="group">
                    <div className="h-full flex flex-col p-6 rounded-xl bg-white/5 border border-translucent-emerald hover:border-sme-gold/30 hover:bg-white/10 transition-all duration-300">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="w-16 h-16 rounded-lg bg-black/20 overflow-hidden flex-shrink-0 relative">
                          {getPrimaryImage(product) ? (
                            <img
                              src={getPrimaryImage(product)!}
                              alt={product.title}
                              className="object-contain w-full h-full"
                            />
                          ) : (
                            <img
                              src={getPlaceholderImage(product.id)}
                              alt={product.title}
                              className="object-cover w-full h-full opacity-30"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-serif text-lg text-bone-white group-hover:text-sme-gold transition-colors truncate">
                            {product.title}
                          </h3>
                          {product.tags && product.tags.length > 0 && (
                            <div className="text-xs font-mono text-sme-gold/80 mt-1">
                              {product.tags[0].replace(/-/g, ' ')}
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-bone-white/70 line-clamp-2 mb-6 flex-grow">
                        {product.problem_solved}
                      </p>

                      <div className="pt-4 border-t border-white/5 space-y-4">
                        <PillarProgressBar
                          avgScores={product.avgSMEScores}
                          reviewCount={product.smeReviewCount}
                          compact={false}
                        />

                        <div className="flex items-center justify-between border-t border-white/5 pt-3">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-xs font-mono">
                              <Star className={`w-3.5 h-3.5 ${product.communityAvgRating ? 'text-sme-gold fill-sme-gold' : 'text-bone-white/20'}`} />
                              <span className="text-bone-white/60 uppercase tracking-tighter">Community:</span>
                              <span className={product.communityAvgRating ? 'text-bone-white font-bold' : 'text-bone-white/30'}>
                                {product.communityAvgRating ? `${product.communityAvgRating.toFixed(1)}/5` : 'Pending'}
                              </span>
                            </div>
                            <div className="text-[9px] font-mono text-bone-white/30 uppercase tracking-widest pl-5">
                              {product.activityScore} Signals Recorded
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {product.is_sme_certified && (
                              <ShieldCheck className="w-4 h-4 text-sme-gold" />
                            )}
                            <ArrowRight className="w-4 h-4 text-sme-gold opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-24 bg-white/5 border border-white/10 rounded-2xl">
                <div className="text-bone-white/20 mb-4 flex justify-center">
                  <Search className="w-12 h-12" />
                </div>
                <h3 className="font-serif text-xl text-bone-white mb-2">No products found</h3>
                <p className="text-bone-white/60 font-mono text-sm max-w-md mx-auto">
                  Try adjusting your search terms or filters to find what you&apos;re looking for.
                </p>
                <Link
                  href="/products"
                  className="inline-block mt-8 px-6 py-2 bg-white/10 border border-white/20 rounded-lg text-bone-white hover:bg-white/20 transition-all font-mono text-sm"
                >
                  Clear all filters
                </Link>
              </div>
            )}
          </div>
        </div>
      </div >
    </div >
  );
}
