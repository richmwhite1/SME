"use client";

import { useState, useEffect, useRef } from "react";
import { Scale, X } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function FloatingCompareButton() {
  const router = useRouter();
  const pathname = usePathname();
  const [comparison, setComparison] = useState<string[]>([]);
  const previousPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    const updateComparison = () => {
      const stored = localStorage.getItem("productComparison");
      if (stored) {
        const comparison = JSON.parse(stored);
        setComparison(comparison);
      } else {
        setComparison([]);
      }
    };

    // Initial load
    updateComparison();

    // Listen for updates
    window.addEventListener("comparisonUpdated", updateComparison);

    return () => {
      window.removeEventListener("comparisonUpdated", updateComparison);
    };
  }, []);

  // Clear comparison state when navigating away from comparison page
  useEffect(() => {
    // Track previous pathname to detect when leaving /compare
    const wasOnCompare = previousPathnameRef.current === "/compare";
    const isOnCompare = pathname === "/compare";
    
    // If we were on /compare and now we're not, clear the comparison
    if (wasOnCompare && !isOnCompare) {
      const stored = localStorage.getItem("productComparison");
      if (stored) {
        try {
          const comparison = JSON.parse(stored);
          if (Array.isArray(comparison) && comparison.length > 0) {
            localStorage.removeItem("productComparison");
            setComparison([]);
            window.dispatchEvent(new Event("comparisonUpdated"));
          }
        } catch (e) {
          // Invalid JSON, clear it
          localStorage.removeItem("productComparison");
          setComparison([]);
        }
      }
    }
    
    // Update previous pathname for next render
    previousPathnameRef.current = pathname;
  }, [pathname]);

  const handleClearComparison = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (typeof window !== "undefined") {
      localStorage.removeItem("productComparison");
      setComparison([]);
      window.dispatchEvent(new Event("comparisonUpdated"));
    }
  };

  if (comparison.length < 2) {
    return null;
  }

  const compareUrl = `/compare?p1=${comparison[0]}&p2=${comparison[1]}`;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2">
      <Link
        href={compareUrl}
        className="inline-flex items-center gap-2 rounded-md border border-[#B8860B] bg-[#B8860B] px-4 py-2.5 text-sm font-mono uppercase tracking-wider text-white shadow-lg hover:bg-[#A67A0A] transition-colors active:scale-95"
      >
        <Scale size={16} />
        <span className="hidden sm:inline">Compare Now</span>
        <span className="sm:hidden">Compare</span>
        <span className="ml-1">({comparison.length})</span>
      </Link>
      <button
        onClick={handleClearComparison}
        className="inline-flex items-center justify-center rounded-md border border-translucent-emerald bg-forest-obsidian p-2.5 text-bone-white shadow-lg hover:bg-muted-moss hover:border-heart-green transition-colors active:scale-95"
        title="Clear comparison"
        aria-label="Clear comparison"
      >
        <X size={16} />
      </button>
    </div>
  );
}





