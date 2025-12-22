import { Suspense } from 'react';
import Link from 'next/link';
import { getDb } from '@/lib/db';

import {
  ShieldCheck,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  Activity,
  Users
} from 'lucide-react';

export const dynamic = "force-dynamic";

// Types
interface Product {
  id: string;
  title: string;
  slug: string;
  problem_solved: string;
  images: string[] | string | null; // Helper handles both
  tags: string[];
  is_sme_certified: boolean;
  created_at: string;
}

interface ProductWithMetrics extends Product {
  reviewCount: number;
  activityScore: number;
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

async function getProducts() {
  const sql = getDb();

  try {
    // Fetch products
    const productsResult = await sql`
      SELECT 
        id, 
        title, 
        slug, 
        problem_solved, 
        images, 
        tags, 
        is_sme_certified, 
        created_at
      FROM products
      WHERE is_flagged = false OR is_flagged IS NULL
      ORDER BY created_at DESC
    `;

    // Fetch metrics (simpler aggregations for list view)
    const metricsResult = await sql`
      SELECT 
        product_id,
        COUNT(*) as count
      FROM reviews
      WHERE is_flagged = false OR is_flagged IS NULL
      GROUP BY product_id
    `;

    // Map metrics to products
    const metricsMap = new Map(metricsResult.map((m: any) => [m.product_id, parseInt(m.count)]));

    const products: ProductWithMetrics[] = productsResult.map((p: any) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      problem_solved: p.problem_solved,
      images: p.images,
      tags: p.tags,
      is_sme_certified: p.is_sme_certified,
      created_at: p.created_at,
      reviewCount: metricsMap.get(p.id) || 0,
      activityScore: (metricsMap.get(p.id) || 0) * 10 // Simplified score
    }));

    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export default async function ProductsPage() {
  const products = await getProducts();
  const trendingProducts = products
    .sort((a, b) => b.activityScore - a.activityScore)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-forest-obsidian font-sans">
      {/* Hero Section */}
      <div className="relative border-b border-translucent-emerald">
        <div className="absolute inset-0 bg-gold-gradient opacity-5" />
        <div className="container mx-auto px-4 py-16 relative">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-serif text-bone-white mb-6">
              Verified <span className="text-sme-gold">Products</span>
            </h1>
            <p className="text-lg text-bone-white/80 mb-8 leading-relaxed">
              Explore our curated database of supplements and health products.
              Each entry is rigorously analyzed against our 5-pillar framework
              for safety, purity, and efficacy.
            </p>

            {/* Search Bar */}
            <div className="relative max-w-lg">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-bone-white/40" />
              </div>
              <input
                type="text"
                placeholder="Search products by name, problem, or ingredient..."
                className="w-full h-10 px-3 pl-10 rounded-md bg-white/5 border border-white/10 text-bone-white placeholder:text-bone-white/40 focus:outline-none focus:border-sme-gold/50 transition-all font-mono"
              />
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
                    <label className="flex items-center gap-2 text-bone-white/80 hover:text-bone-white cursor-pointer group">
                      <div className="w-4 h-4 rounded border border-white/20 group-hover:border-sme-gold/50 flex items-center justify-center transition-colors">
                        {/* Checkbox state logic would go here */}
                      </div>
                      <span className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-sme-gold" />
                        SME Verified
                      </span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-mono text-bone-white/60 mb-3 uppercase tracking-wider">
                    Categories
                  </label>
                  <div className="space-y-2">
                    {['Gut Health', 'Sleep', 'Cognition', 'Longevity', 'Immunity'].map((cat) => (
                      <label key={cat} className="flex items-center gap-2 text-bone-white/80 hover:text-bone-white cursor-pointer group">
                        <div className="w-4 h-4 rounded border border-white/20 group-hover:border-sme-gold/50 transition-colors" />
                        {cat}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="lg:col-span-3">
            {/* Trending Section */}
            {trendingProducts.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp className="w-5 h-5 text-sme-gold" />
                  <h2 className="font-serif text-2xl text-bone-white">Trending Now</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {trendingProducts.map((product) => (
                    <Link key={product.id} href={`/products/${product.slug}`} className="group">
                      <div className="h-full p-5 rounded-xl bg-white/5 border border-translucent-emerald hover:border-sme-gold/30 hover:bg-white/10 transition-all duration-300 relative overflow-hidden">
                        <div className="aspect-square mb-4 relative rounded-lg overflow-hidden bg-black/20">
                          {parseImages(product.images)[0] ? (
                            <img
                              src={parseImages(product.images)[0]}
                              alt={product.title}
                              className="object-contain w-full h-full transform group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-bone-white/20 font-serif italic">
                              No Image
                            </div>
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
                        <div className="flex items-center gap-4 text-xs font-mono text-bone-white/50">
                          <span className="flex items-center gap-1">
                            <Activity className="w-3 h-3" /> {product.activityScore}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" /> {product.reviewCount}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* All Products */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-2xl text-bone-white">All Products</h2>
              <div className="text-sm font-mono text-bone-white/50">
                Showing {products.length} results
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Link key={product.id} href={`/products/${product.slug}`} className="group">
                  <div className="h-full flex flex-col p-6 rounded-xl bg-white/5 border border-translucent-emerald hover:border-sme-gold/30 hover:bg-white/10 transition-all duration-300">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="w-16 h-16 rounded-lg bg-black/20 overflow-hidden flex-shrink-0">
                        {parseImages(product.images)[0] ? (
                          <img
                            src={parseImages(product.images)[0]}
                            alt={product.title}
                            className="object-contain w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-bone-white/20 text-xs">
                            N/A
                          </div>
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

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="flex items-center gap-3">
                        {product.is_sme_certified && (
                          <ShieldCheck className="w-4 h-4 text-sme-gold" />
                        )}
                      </div>
                      <span className="text-sm font-mono text-sme-gold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        View <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
