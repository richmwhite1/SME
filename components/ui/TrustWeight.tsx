"use client";

import { useState } from "react";
import { Info, TrendingUp } from "lucide-react";

interface TrustWeightProps {
  value: number;
  topic?: string | null;
  verifiedCitations?: number;
  className?: string;
  showPulse?: boolean;
}

export default function TrustWeight({
  value,
  topic,
  verifiedCitations,
  className = "",
  showPulse = false,
}: TrustWeightProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Generate tooltip text based on available data
  const getTooltipText = () => {
    const parts: string[] = [];
    
    if (verifiedCitations && verifiedCitations > 0) {
      parts.push(`Earned through ${verifiedCitations} verified citation${verifiedCitations !== 1 ? "s" : ""}`);
    }
    
    if (topic) {
      if (parts.length > 0) {
        parts.push(`in ${topic}`);
      } else {
        parts.push(`Earned in ${topic}`);
      }
    }
    
    if (parts.length === 0) {
      return "Trust Weight earned through verified contributions";
    }
    
    return parts.join(" ");
  };

  return (
    <div className={`relative inline-flex items-center gap-1 ${className}`}>
      <span
        className={`font-mono text-xs font-semibold text-[#B8860B] transition-all ${
          showPulse ? "animate-pulse" : ""
        }`}
        style={{
          textShadow: showPulse ? "0 0 8px rgba(184, 134, 11, 0.5), 0 0 12px rgba(34, 197, 94, 0.3)" : "none",
          animation: showPulse ? "pulse-glow 2s ease-in-out infinite" : "none",
        }}
      >
        {value} TW
      </span>
      <button
        type="button"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="text-[#B8860B]/70 hover:text-[#B8860B] transition-colors"
        aria-label="Trust Weight information"
      >
        <Info size={12} />
      </button>
      
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50">
          <div className="bg-forest-obsidian border border-translucent-emerald px-3 py-2 rounded shadow-lg max-w-xs">
            <p className="text-xs text-bone-white font-mono whitespace-nowrap">
              {getTooltipText()}
            </p>
            {/* Tooltip arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
              <div className="border-4 border-transparent border-t-translucent-emerald"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



