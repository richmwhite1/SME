"use client";

import { useState, useEffect } from "react";
import { Scale } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

interface CompareButtonProps {
  productId: string;
  productTitle: string;
}

export default function CompareButton({ productId, productTitle }: CompareButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isInComparison, setIsInComparison] = useState(false);
  const [comparisonCount, setComparisonCount] = useState(0);

  // Update comparison state from localStorage
  const updateComparisonState = () => {
    const stored = localStorage.getItem("productComparison");
    if (stored) {
      const comparison = JSON.parse(stored);
      setIsInComparison(comparison.includes(productId));
      setComparisonCount(comparison.length);
    } else {
      setIsInComparison(false);
      setComparisonCount(0);
    }
  };

  useEffect(() => {
    // Load comparison state from localStorage
    updateComparisonState();

    // Listen for comparison updates
    const handleComparisonUpdate = () => {
      updateComparisonState();
    };

    window.addEventListener("comparisonUpdated", handleComparisonUpdate);

    return () => {
      window.removeEventListener("comparisonUpdated", handleComparisonUpdate);
    };
  }, [productId]);

  // Reset state when leaving comparison view
  useEffect(() => {
    if (pathname !== "/compare") {
      // User left the comparison page, reset button state
      updateComparisonState();
    }
  }, [pathname, productId]);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const stored = localStorage.getItem("productComparison");
    let comparison: string[] = stored ? JSON.parse(stored) : [];

    if (comparison.includes(productId)) {
      // Remove from comparison
      comparison = comparison.filter((id) => id !== productId);
      setIsInComparison(false);
    } else {
      // Add to comparison (max 2)
      if (comparison.length >= 2) {
        // Remove the first one
        comparison.shift();
      }
      comparison.push(productId);
      setIsInComparison(true);
    }

    localStorage.setItem("productComparison", JSON.stringify(comparison));
    setComparisonCount(comparison.length);

    // Trigger floating button update
    window.dispatchEvent(new Event("comparisonUpdated"));
  };

  return (
    <button
      onClick={handleToggle}
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-mono uppercase tracking-wider transition-all duration-200 active:scale-95 ${
        isInComparison
          ? "border-[#B8860B] bg-[#B8860B] text-white"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      }`}
      title={isInComparison ? "Remove from comparison" : "Add to comparison"}
    >
      <Scale size={12} />
      {isInComparison ? "Added" : "Compare"}
    </button>
  );
}





