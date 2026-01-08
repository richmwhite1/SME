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
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="inline-flex items-center cursor-help"
        aria-label={content}
      >
        {children || <Info size={12} className="text-bone-white/40 hover:text-bone-white/60 transition-colors" />}
      </div>
      {isVisible && (
        <div className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded border border-translucent-emerald bg-forest-obsidian px-3 py-2 text-xs text-bone-white shadow-lg">
          {content}
          <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-forest-obsidian" />
        </div>
      )}
    </div>
  );
}





