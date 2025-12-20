"use client";

import { useState, useEffect } from "react";
import { X, Search, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Image from "next/image";

interface Product {
  id: string;
  title: string;
  problem_solved: string | null;
  images: string[] | null;
}

interface SwapSpecimenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (productId: string) => void;
  currentProductId?: string;
}

export default function SwapSpecimenModal({
  isOpen,
  onClose,
  onSelect,
  currentProductId,
}: SwapSpecimenModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setProducts([]);
      return;
    }

    // Fetch initial products
    fetchProducts("");
  }, [isOpen]);

  useEffect(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(() => {
      fetchProducts(searchQuery);
    }, 300);

    setDebounceTimer(timer);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [searchQuery]);

  const fetchProducts = async (query: string) => {
    setLoading(true);
    const supabase = createClient();

    let queryBuilder = supabase
      .from("protocols")
      .select("id, title, problem_solved, images")
      .order("title", { ascending: true })
      .limit(20);

    if (query.trim()) {
      queryBuilder = queryBuilder.or(
        `title.ilike.%${query}%,problem_solved.ilike.%${query}%`
      );
    }

    const { data, error } = await queryBuilder;

    if (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
    } else {
      // Filter out current product
      const filtered = (data || []).filter(
        (p) => p.id !== currentProductId
      ) as Product[];
      setProducts(filtered);
    }

    setLoading(false);
  };

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
        return [];
      }
    }
    return [];
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-forest-obsidian/90"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-2xl border border-translucent-emerald bg-muted-moss p-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="mb-4 flex items-center justify-between border-b border-translucent-emerald pb-3">
            <h2 className="font-serif text-lg font-semibold text-bone-white">
              Swap Specimen
            </h2>
            <button
              onClick={onClose}
              className="text-bone-white/70 hover:text-bone-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Search Input */}
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-bone-white/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full bg-forest-obsidian border border-translucent-emerald px-10 py-2 text-sm text-bone-white placeholder-bone-white/50 focus:border-heart-green focus:outline-none transition-all font-mono"
              autoFocus
            />
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto space-y-2">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 size={20} className="animate-spin text-bone-white/70" />
              </div>
            ) : products.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-bone-white/70 font-mono">
                  {searchQuery ? "No products found" : "Start typing to search..."}
                </p>
              </div>
            ) : (
              products.map((product) => {
                const images = parseImages(product.images);
                return (
                  <button
                    key={product.id}
                    onClick={() => {
                      onSelect(product.id);
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 border border-translucent-emerald bg-forest-obsidian p-3 hover:border-heart-green transition-colors text-left"
                  >
                    {/* Product Image */}
                    <div className="relative h-16 w-16 flex-shrink-0 border border-translucent-emerald bg-forest-obsidian overflow-hidden">
                      {images.length > 0 ? (
                        <Image
                          src={images[0]}
                          alt={product.title}
                          fill
                          className="object-contain"
                          unoptimized={images[0].includes('supabase.co') || images[0].includes('unsplash.com')}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-white/5 border border-white/20">
                          <span className="text-[8px] text-bone-white font-mono text-center px-1" style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace' }}>
                            Specimen Under Audit
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-serif text-sm font-semibold text-bone-white truncate">
                        {product.title}
                      </h3>
                      {product.problem_solved && (
                        <p className="text-xs text-bone-white/70 font-mono line-clamp-1 mt-1">
                          {product.problem_solved}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}



