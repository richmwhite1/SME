"use client";

import { useState } from "react";
import { Info } from "lucide-react";

interface TooltipProps {
  content: string;
  children?: React.ReactNode;
  className?: string;
}

export default function Tooltip({ content, children, className = "" }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        className="inline-flex items-center cursor-help bg-transparent border-none p-0 focus:outline-none focus:ring-2 focus:ring-heart-green rounded"
        aria-label={content}
      >
        {children || <Info size={12} className="text-bone-white/40 hover:text-bone-white/60 transition-colors" />}
      </button>
      {isVisible && (
        <div className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded border border-translucent-emerald bg-forest-obsidian px-3 py-2 text-xs text-bone-white shadow-lg">
          {content}
          <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-forest-obsidian" />
        </div>
      )}
    </div>
  );
}





