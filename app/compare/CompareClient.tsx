"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Circle, X, ExternalLink, RefreshCw, Brackets } from "lucide-react";
import Image from "next/image";
import SwapSpecimenModal from "@/components/products/SwapSpecimenModal";
import { useToast } from "@/components/ui/ToastContainer";

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

interface CompareClientProps {
  productA: Product;
  productB: Product;
  productAId: string;
  productBId: string;
  imagesA: string[];
  imagesB: string[];
  recentReviewA: Review | null;
  recentReviewB: Review | null;
  upvoteCountA: number;
  upvoteCountB: number;
  intuitiveScoreA: string;
  intuitiveScoreB: string;
  pricePerServingA: string;
  pricePerServingB: string;
  hasVerifiedCOAA?: boolean;
  hasVerifiedCOAB?: boolean;
}

export default function CompareClient({
  productA,
  productB,
  productAId,
  productBId,
  imagesA,
  imagesB,
  recentReviewA,
  recentReviewB,
  upvoteCountA,
  upvoteCountB,
  intuitiveScoreA,
  intuitiveScoreB,
  pricePerServingA,
  pricePerServingB,
  hasVerifiedCOAA = false,
  hasVerifiedCOAB = false,
}: CompareClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [swapModalOpen, setSwapModalOpen] = useState<"A" | "B" | null>(null);
  const [optimisticProductA, setOptimisticProductA] = useState<Product | null>(null);
  const [optimisticProductB, setOptimisticProductB] = useState<Product | null>(null);

  // Cleanup: Reset comparison state when leaving the compare page
  useEffect(() => {
    return () => {
      // Clear comparison from localStorage when component unmounts
      if (typeof window !== "undefined") {
        localStorage.removeItem("productComparison");
        // Dispatch event to update floating button
        window.dispatchEvent(new Event("comparisonUpdated"));
      }
    };
  }, []);

  // Use optimistic updates if available, otherwise use server data
  const displayProductA = optimisticProductA || productA;
  const displayProductB = optimisticProductB || productB;
  const displayImagesA = optimisticProductA ? parseImages(optimisticProductA.images) : imagesA;
  const displayImagesB = optimisticProductB ? parseImages(optimisticProductB.images) : imagesB;

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
  }

  const handleSwap = async (column: "A" | "B", newProductId: string) => {
    try {
      // Fetch new product data optimistically
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data, error } = await supabase
        .from("protocols")
        .select("*")
        .eq("id", newProductId)
        .single();
      
      if (error || !data) {
        console.error("Error fetching product:", error);
        return;
      }

      // Optimistic update
      if (column === "A") {
        setOptimisticProductA(data as Product);
      } else {
        setOptimisticProductB(data as Product);
      }

      // Update URL without reload
      const newParams = new URLSearchParams(searchParams.toString());
      if (column === "A") {
        newParams.set("a", newProductId);
      } else {
        newParams.set("b", newProductId);
      }
      
      router.push(`/compare?${newParams.toString()}`);
      router.refresh();
    } catch (err) {
      console.error("Error swapping product:", err);
    }
  };

  const getSentimentSnippet = (review: Review | null): string => {
    if (!review || !review.content) return "Signal Pending: Be the first auditor to share your intuition.";
    return review.content.substring(0, 100) + (review.content.length > 100 ? "..." : "");
  };

  const getExpertTake = (summary: string | null): string => {
    if (!summary) return "No expert analysis available";
    const sentences = summary.split(/[.!?]+/).filter(s => s.trim().length > 0);
    return sentences.slice(0, 2).join(". ").trim() + (sentences.length > 2 ? "." : "");
  };

  const handleShareAudit = async () => {
    // Ensure we're in a browser environment
    if (typeof window === "undefined" || !navigator.clipboard) {
      showToast("Sharing not available in this environment", "error");
      return;
    }

    const baseUrl = window.location.origin;
    const permalink = `${baseUrl}/compare?p1=${productAId}&p2=${productBId}`;
    
    try {
      await navigator.clipboard.writeText(permalink);
      showToast("Signal Copied", "success");
    } catch (error) {
      console.error("Failed to copy permalink:", error);
      // Fallback: try using execCommand for older browsers
      try {
        const textArea = document.createElement("textarea");
        textArea.value = permalink;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        showToast("Signal Copied", "success");
      } catch (fallbackError) {
        console.error("Fallback copy failed:", fallbackError);
        showToast("Failed to copy link", "error");
      }
    }
  };

  return (
    <>
      <main className="min-h-screen bg-forest-obsidian">
        <div className="mx-auto max-w-7xl px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/products"
              className="mb-4 inline-flex items-center gap-2 text-sm text-bone-white/70 hover:text-bone-white font-mono transition-colors"
            >
              <ArrowLeft size={14} />
              Back to Products
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="mb-2 font-serif text-3xl font-bold text-bone-white">
                  Collective Intelligence Audit
                </h1>
                <p className="text-sm text-bone-white font-mono uppercase tracking-wider">
                  Lab Bench Analysis
                </p>
              </div>
              <button
                onClick={handleShareAudit}
                className="inline-flex items-center gap-2 border border-sme-gold bg-sme-gold px-4 py-2 text-sm font-mono uppercase tracking-wider text-forest-obsidian hover:bg-[#9A7209] hover:border-[#9A7209] transition-colors"
              >
                <Brackets size={14} />
                Share the Audit
              </button>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="border border-translucent-emerald bg-muted-moss overflow-hidden">
            <div className="grid grid-cols-3 gap-0">
              {/* Header Row */}
              <div className="border-b border-r border-translucent-emerald bg-forest-obsidian p-4">
                <div className="text-xs font-mono uppercase tracking-wider text-bone-white">
                  Criteria
                </div>
              </div>
              <div className="border-b border-r border-translucent-emerald bg-muted-moss p-4">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/products/${productAId}`}
                    className="font-serif text-lg font-semibold text-bone-white hover:text-sme-gold transition-colors flex-1"
                  >
                    {displayProductA.title}
                  </Link>
                  <button
                    onClick={() => setSwapModalOpen("A")}
                    className="text-bone-white/70 hover:text-sme-gold transition-colors"
                    title="Swap Specimen"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>
              <div className="border-b border-translucent-emerald bg-muted-moss p-4">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/products/${productBId}`}
                    className="font-serif text-lg font-semibold text-bone-white hover:text-sme-gold transition-colors flex-1"
                  >
                    {displayProductB.title}
                  </Link>
                  <button
                    onClick={() => setSwapModalOpen("B")}
                    className="text-bone-white/70 hover:text-sme-gold transition-colors"
                    title="Swap Specimen"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>

              {/* Row 1: Visuals */}
              <div className="border-b border-r border-translucent-emerald bg-forest-obsidian p-4">
                <div className="text-xs font-mono uppercase tracking-wider text-bone-white">
                  Visuals
                </div>
              </div>
              <div className="border-b border-r border-translucent-emerald bg-muted-moss p-4">
                <div className="relative aspect-square w-full max-w-[200px] border border-translucent-emerald bg-forest-obsidian overflow-hidden">
                  {displayImagesA.length > 0 ? (
                    <Image
                      src={displayImagesA[0]}
                      alt={displayProductA.title}
                      fill
                      className="object-contain"
                      unoptimized={displayImagesA[0].includes('supabase.co') || displayImagesA[0].includes('unsplash.com')}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-white/5 border-2 border-white/20 inset-2">
                      <span className="text-xs text-bone-white font-mono text-center px-2" style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace' }}>
                        Specimen Under Audit
                      </span>
                    </div>
                  )}
                  {displayProductA.is_sme_certified && (
                    <div className="absolute top-2 right-2 border border-sme-gold bg-sme-gold px-2 py-0.5">
                      <span className="text-[9px] font-mono uppercase tracking-wider text-forest-obsidian font-semibold">
                        SME
                      </span>
                    </div>
                  )}
                  {hasVerifiedCOAA && (
                    <div className="absolute bottom-2 left-2 border border-heart-green bg-heart-green px-2 py-0.5">
                      <span className="text-[9px] font-mono uppercase tracking-wider text-forest-obsidian font-semibold">
                        Verified COA
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="border-b border-translucent-emerald bg-muted-moss p-4">
                <div className="relative aspect-square w-full max-w-[200px] border border-translucent-emerald bg-forest-obsidian overflow-hidden">
                  {displayImagesB.length > 0 ? (
                    <Image
                      src={displayImagesB[0]}
                      alt={displayProductB.title}
                      fill
                      className="object-contain"
                      unoptimized={displayImagesB[0].includes('supabase.co') || displayImagesB[0].includes('unsplash.com')}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-white/5 border-2 border-white/20 inset-2">
                      <span className="text-xs text-bone-white font-mono text-center px-2" style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace' }}>
                        Specimen Under Audit
                      </span>
                    </div>
                  )}
                  {displayProductB.is_sme_certified && (
                    <div className="absolute top-2 right-2 border border-sme-gold bg-sme-gold px-2 py-0.5">
                      <span className="text-[9px] font-mono uppercase tracking-wider text-forest-obsidian font-semibold">
                        SME
                      </span>
                    </div>
                  )}
                  {hasVerifiedCOAB && (
                    <div className="absolute bottom-2 left-2 border border-heart-green bg-heart-green px-2 py-0.5">
                      <span className="text-[9px] font-mono uppercase tracking-wider text-forest-obsidian font-semibold">
                        Verified COA
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Row 2: 5-Pillar Checklist */}
              <div className="border-b border-r border-translucent-emerald bg-forest-obsidian p-4">
                <div className="text-xs font-mono uppercase tracking-wider text-bone-white">
                  5-Pillar Checklist
                </div>
              </div>
              <div className="border-b border-r border-translucent-emerald bg-muted-moss p-4">
                <div className="space-y-2">
                  {[
                    { name: "Source Transparency", value: displayProductA.source_transparency },
                    { name: "Purity Tested", value: displayProductA.purity_tested },
                    { name: "Potency Verified", value: displayProductA.potency_verified },
                    { name: "Excipient Audit", value: displayProductA.excipient_audit },
                    { name: "Operational Legitimacy", value: displayProductA.operational_legitimacy },
                  ].map((pillar) => (
                    <div key={pillar.name} className="flex items-center gap-2">
                      {pillar.value ? (
                        <Circle size={8} className="text-sme-gold fill-sme-gold" />
                      ) : (
                        <X size={14} className="text-bone-white/30" />
                      )}
                      <span className="text-xs text-bone-white/80 font-mono" style={{ fontVariant: "small-caps" }}>
                        {pillar.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-b border-translucent-emerald bg-muted-moss p-4">
                <div className="space-y-2">
                  {[
                    { name: "Source Transparency", value: displayProductB.source_transparency },
                    { name: "Purity Tested", value: displayProductB.purity_tested },
                    { name: "Potency Verified", value: displayProductB.potency_verified },
                    { name: "Excipient Audit", value: displayProductB.excipient_audit },
                    { name: "Operational Legitimacy", value: displayProductB.operational_legitimacy },
                  ].map((pillar) => (
                    <div key={pillar.name} className="flex items-center gap-2">
                      {pillar.value ? (
                        <Circle size={8} className="text-sme-gold fill-sme-gold" />
                      ) : (
                        <X size={14} className="text-bone-white/30" />
                      )}
                      <span className="text-xs text-bone-white/80 font-mono" style={{ fontVariant: "small-caps" }}>
                        {pillar.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Row 3: Value Audit */}
              <div className="border-b border-r border-translucent-emerald bg-forest-obsidian p-4">
                <div className="text-xs font-mono uppercase tracking-wider text-bone-white">
                  Value Audit
                </div>
              </div>
              <div className="border-b border-r border-translucent-emerald bg-muted-moss p-4">
                <div className="text-sm text-bone-white/80 font-mono">
                  Price per Serving: {pricePerServingA}
                </div>
              </div>
              <div className="border-b border-translucent-emerald bg-muted-moss p-4">
                <div className="text-sm text-bone-white/80 font-mono">
                  Price per Serving: {pricePerServingB}
                </div>
              </div>

              {/* Row 4: Intuitive Score */}
              <div className="border-b border-r border-translucent-emerald bg-forest-obsidian p-4">
                <div className="text-xs font-mono uppercase tracking-wider text-bone-white">
                  Intuitive Score
                </div>
              </div>
              <div className="border-b border-r border-translucent-emerald bg-muted-moss p-4">
                <div className="text-sm text-bone-white/80 font-mono">
                  {intuitiveScoreA} / 5.0
                </div>
              </div>
              <div className="border-b border-translucent-emerald bg-muted-moss p-4">
                <div className="text-sm text-bone-white/80 font-mono">
                  {intuitiveScoreB} / 5.0
                </div>
              </div>

              {/* Row 5: Verification */}
              <div className="border-b border-r border-translucent-emerald bg-forest-obsidian p-4">
                <div className="text-xs font-mono uppercase tracking-wider text-bone-white">
                  Verification
                </div>
              </div>
              <div className="border-b border-r border-translucent-emerald bg-muted-moss p-4">
                <Link
                  href="/resources"
                  className="inline-flex items-center gap-1.5 border border-sme-gold bg-transparent px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-sme-gold hover:bg-sme-gold hover:text-forest-obsidian transition-colors"
                >
                  View Lab Report
                  <ExternalLink size={12} />
                </Link>
              </div>
              <div className="border-b border-translucent-emerald bg-muted-moss p-4">
                <Link
                  href="/resources"
                  className="inline-flex items-center gap-1.5 border border-sme-gold bg-transparent px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-sme-gold hover:bg-sme-gold hover:text-forest-obsidian transition-colors"
                >
                  View Lab Report
                  <ExternalLink size={12} />
                </Link>
              </div>

              {/* Row 6: Community Sentiment */}
              <div className="border-b border-r border-translucent-emerald bg-forest-obsidian p-4">
                <div className="text-xs font-mono uppercase tracking-wider text-bone-white">
                  Community Sentiment
                </div>
              </div>
              <div className="border-b border-r border-translucent-emerald bg-muted-moss p-4">
                <div className="space-y-2">
                  <div className="text-xs font-mono uppercase tracking-wider text-bone-white/70">
                    Upvotes: {upvoteCountA}
                  </div>
                  <p className="text-sm text-bone-white/80 leading-relaxed font-mono">
                    {getSentimentSnippet(recentReviewA)}
                  </p>
                </div>
              </div>
              <div className="border-b border-translucent-emerald bg-muted-moss p-4">
                <div className="space-y-2">
                  <div className="text-xs font-mono uppercase tracking-wider text-bone-white/70">
                    Upvotes: {upvoteCountB}
                  </div>
                  <p className="text-sm text-bone-white/80 leading-relaxed font-mono">
                    {getSentimentSnippet(recentReviewB)}
                  </p>
                </div>
              </div>

              {/* Row 7: Expert Take */}
              <div className="border-r border-translucent-emerald bg-forest-obsidian p-4">
                <div className="text-xs font-mono uppercase tracking-wider text-bone-white">
                  Expert Take
                </div>
              </div>
              <div className="border-r border-translucent-emerald bg-muted-moss p-4">
                <p className="text-sm text-bone-white/80 leading-relaxed font-mono">
                  {getExpertTake(displayProductA.ai_summary)}
                </p>
              </div>
              <div className="bg-muted-moss p-4">
                <p className="text-sm text-bone-white/80 leading-relaxed font-mono">
                  {getExpertTake(displayProductB.ai_summary)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Swap Modals */}
      <SwapSpecimenModal
        isOpen={swapModalOpen === "A"}
        onClose={() => setSwapModalOpen(null)}
        onSelect={(productId) => handleSwap("A", productId)}
        currentProductId={productAId}
      />
      <SwapSpecimenModal
        isOpen={swapModalOpen === "B"}
        onClose={() => setSwapModalOpen(null)}
        onSelect={(productId) => handleSwap("B", productId)}
        currentProductId={productBId}
      />
    </>
  );
}



