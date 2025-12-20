"use client";

import { useState } from "react";
import { Award } from "lucide-react";

interface SMECertifiedBadgeProps {
  thirdPartyLabVerified?: boolean;
  purityTested?: boolean;
  sourceTransparency?: boolean;
  potencyVerified?: boolean;
  excipientAudit?: boolean;
  operationalLegitimacy?: boolean;
}

export default function SMECertifiedBadge({
  thirdPartyLabVerified = false,
  purityTested = false,
  sourceTransparency = false,
  potencyVerified = false,
  excipientAudit = false,
  operationalLegitimacy = false,
}: SMECertifiedBadgeProps) {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  // 5 Verification Pillars
  const verificationPillars = [
    { name: "Source Transparency", verified: sourceTransparency },
    { name: "Purity", verified: purityTested },
    { name: "Potency", verified: potencyVerified },
    { name: "Excipient Audit", verified: excipientAudit },
    { name: "Operational Legitimacy", verified: operationalLegitimacy },
  ];

  const tooltipContent = (
    <div className="space-y-2">
      <div className="mb-2 font-semibold text-white font-serif">5 Verification Pillars</div>
      {verificationPillars.map((pillar, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className={pillar.verified ? "text-green-400" : "text-red-400"}>
            {pillar.verified ? "✓" : "✗"}
          </span>
          <span className="text-xs text-white/90">{pillar.name}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsTooltipVisible(true)}
        onMouseLeave={() => setIsTooltipVisible(false)}
        onTouchStart={() => setIsTooltipVisible(true)}
        onTouchEnd={() => setTimeout(() => setIsTooltipVisible(false), 2000)}
        className="inline-flex items-center gap-1.5 rounded-md border border-[#B8860B] bg-[#B8860B] px-3 py-1.5"
      >
        <Award size={14} className="text-white" />
        <span className="text-xs font-semibold text-white font-mono uppercase tracking-wider">SME Certified</span>
      </div>
      {isTooltipVisible && (
        <div className="absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-md border border-slate-200 bg-white px-4 py-3 text-xs text-slate-700 shadow-xl">
          {tooltipContent}
          <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-white" />
        </div>
      )}
    </div>
  );
}
