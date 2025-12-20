import Link from "next/link";
import { Shield, TrendingUp, Award } from "lucide-react";

export default function IntelligenceLegend() {
  return (
    <div className="border border-sme-gold/30 bg-muted-moss px-4 py-4">
      {/* Compact Header */}
      <div className="mb-4 text-center">
        <h2 className="font-serif text-lg font-semibold text-bone-white font-mono uppercase tracking-wider">
          Reference Guide
        </h2>
        <p className="mt-1 text-xs text-bone-white/70 font-mono uppercase tracking-wider">
          Signal Metrics
        </p>
      </div>

      {/* High-Density Three Columns */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-4">
        {/* Column 1: Pillar Score */}
        <div className="flex items-start gap-2 text-center md:text-left">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded border border-sme-gold/30 bg-sme-gold/10">
            <Shield size={16} className="text-sme-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="mb-1 font-mono text-xs font-semibold uppercase tracking-wider text-bone-white">
              Pillar Score
            </h3>
            <p className="text-[10px] leading-tight text-bone-white/70 font-mono">
              5 levels of transparency from source to lab.
            </p>
          </div>
        </div>

        {/* Column 2: Trust Weight */}
        <div className="flex items-start gap-2 text-center md:text-left">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded border border-sme-gold/30 bg-sme-gold/10">
            <TrendingUp size={16} className="text-sme-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="mb-1 font-mono text-xs font-semibold uppercase tracking-wider text-bone-white">
              Trust Weight
            </h3>
            <p className="text-[10px] leading-tight text-bone-white/70 font-mono">
              Evidence-backed sentiment from verified experts.
            </p>
          </div>
        </div>

        {/* Column 3: SME Certified */}
        <div className="flex items-start gap-2 text-center md:text-left">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded border border-sme-gold/30 bg-sme-gold/10">
            <Award size={16} className="text-sme-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="mb-1 font-mono text-xs font-semibold uppercase tracking-wider text-bone-white">
              SME Certified
            </h3>
            <p className="text-[10px] leading-tight text-bone-white/70 font-mono">
              Gold Standard for products passing full due diligence.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}




