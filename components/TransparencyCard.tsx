"use client";

import { Award, Check, HelpCircle } from "lucide-react";
import { useState } from "react";

interface TransparencyCardProps {
  sourceTransparency?: boolean;
  purityTested?: boolean;
  potencyVerified?: boolean;
  excipientAudit?: boolean;
  operationalLegitimacy?: boolean;
  thirdPartyLabVerified?: boolean;
  certificationNotes?: string | null;
}

interface Pillar {
  name: string;
  key: keyof TransparencyCardProps;
  description: string;
}

const pillars: Pillar[] = [
  {
    name: "Source Transparency",
    key: "sourceTransparency",
    description: "Verification of ingredient sourcing, supply chain documentation, and origin traceability. Ensures full disclosure of where raw materials are obtained.",
  },
  {
    name: "Purity Screening",
    key: "purityTested",
    description: "Laboratory testing confirms absence of contaminants, heavy metals, pesticides, and microbial pathogens. Meets pharmaceutical-grade purity standards.",
  },
  {
    name: "Potency Audit",
    key: "potencyVerified",
    description: "Quantitative analysis verifies active ingredient concentrations match label claims. Third-party testing confirms dosage accuracy within acceptable variance.",
  },
  {
    name: "Excipient Audit",
    key: "excipientAudit",
    description: "Review of all non-active ingredients (fillers, binders, preservatives) for safety, necessity, and potential allergen concerns. Ensures clean formulation.",
  },
  {
    name: "Operational Legitimacy",
    key: "operationalLegitimacy",
    description: "Verification of manufacturing facility certifications (GMP, FDA-registered), quality control protocols, and business entity legitimacy. Confirms ethical operations.",
  },
];

export default function TransparencyCard({
  sourceTransparency = false,
  purityTested = false,
  potencyVerified = false,
  excipientAudit = false,
  operationalLegitimacy = false,
  thirdPartyLabVerified = false,
  certificationNotes = null,
}: TransparencyCardProps) {
  const [hoveredPillar, setHoveredPillar] = useState<string | null>(null);

  const getPillarValue = (key: string): boolean => {
    switch (key) {
      case "sourceTransparency":
        return sourceTransparency;
      case "purityTested":
        return purityTested;
      case "potencyVerified":
        return potencyVerified;
      case "excipientAudit":
        return excipientAudit;
      case "operationalLegitimacy":
        return operationalLegitimacy;
      default:
        return false;
    }
  };

  return (
    <div className="border border-translucent-emerald bg-muted-moss p-5">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between border-b border-translucent-emerald pb-3">
        <div className="flex items-center gap-2">
          <Award size={16} className="text-sme-gold" />
          <h2 className="text-sm font-semibold text-bone-white font-serif">
            Transparency Checklist
          </h2>
        </div>
        {thirdPartyLabVerified && (
          <span className="text-[10px] font-mono uppercase tracking-wider text-bone-white/70">
            3rd Party Verified
          </span>
        )}
      </div>

      {/* 5 Verification Pillars */}
      <div className="space-y-1.5">
        <div className="mb-2 text-xs font-mono uppercase tracking-wider text-bone-white/70">
          5 Verification Pillars
        </div>
        {pillars.map((pillar) => {
          const isVerified = getPillarValue(pillar.key);
          return (
            <div
              key={pillar.key}
              className="relative flex items-center gap-2.5 py-1.5"
              onMouseEnter={() => setHoveredPillar(pillar.key)}
              onMouseLeave={() => setHoveredPillar(null)}
            >
              {/* Checkmark or empty circle */}
              {isVerified ? (
                <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center border border-heart-green bg-heart-green">
                  <Check size={10} className="text-forest-obsidian" />
                </div>
              ) : (
                <div className="h-4 w-4 flex-shrink-0 border border-translucent-emerald" />
              )}

              {/* Pillar name - small-caps mono */}
              <span className="text-sm text-bone-white font-mono" style={{ fontVariant: "small-caps" }}>
                {pillar.name}
              </span>

              {/* Help icon with tooltip */}
              <div className="relative">
                <HelpCircle
                  size={14}
                  className="text-bone-white/50 hover:text-bone-white transition-colors cursor-help"
                />
                {/* Tooltip */}
                {hoveredPillar === pillar.key && (
                  <div className="absolute left-0 top-6 z-50 w-64 border border-translucent-emerald bg-muted-moss p-3 text-xs text-bone-white">
                    <p className="leading-relaxed">{pillar.description}</p>
                    <div className="absolute -top-1 left-4 h-2 w-2 rotate-45 border-l border-t border-translucent-emerald bg-muted-moss" />
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Third Party Lab Verified - Additional */}
        {thirdPartyLabVerified && (
          <div className="mt-2 flex items-center gap-2.5 border-t border-translucent-emerald pt-2">
            <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center border border-heart-green bg-heart-green">
              <Check size={10} className="text-forest-obsidian" />
            </div>
            <span className="text-sm text-bone-white font-mono" style={{ fontVariant: "small-caps" }}>
              3rd Party Lab Verified
            </span>
          </div>
        )}
      </div>

      {/* Certification Notes */}
      {certificationNotes && (
        <div className="mt-4 border-t border-translucent-emerald pt-4">
          <h3 className="mb-2 text-xs font-mono uppercase tracking-wider text-bone-white/70">
            Certification Notes
          </h3>
          <p className="text-xs leading-relaxed text-bone-white/80 whitespace-pre-wrap font-mono">
            {certificationNotes}
          </p>
        </div>
      )}
    </div>
  );
}





