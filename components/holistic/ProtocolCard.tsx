"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { MessageSquare, Star } from "lucide-react";
import CompareButton from "@/components/products/CompareButton";

interface ProtocolCardProps {
  title: string;
  problemSolved: string;
  productId: string;
  imageUrl?: string | null;
  isSMECertified?: boolean;
  hasLabTested?: boolean;
  hasSourceVerified?: boolean;
  hasAISummary?: boolean;
  // 5-Pillar transparency data
  sourceTransparency?: boolean;
  purityTested?: boolean;
  potencyVerified?: boolean;
  excipientAudit?: boolean;
  operationalLegitimacy?: boolean;
  // Engagement metrics
  reviewCount?: number;
  commentCount?: number;
  averageRating?: number; // Average review rating (1-5)
  activityScore?: number; // Total community signals
}

export default function ProtocolCard({
  title,
  problemSolved,
  productId,
  imageUrl,
  isSMECertified = false,
  hasLabTested = false,
  hasSourceVerified = false,
  hasAISummary = false,
  sourceTransparency = false,
  purityTested = false,
  potencyVerified = false,
  excipientAudit = false,
  operationalLegitimacy = false,
  reviewCount = 0,
  commentCount = 0,
  averageRating,
  activityScore = 0,
}: ProtocolCardProps) {
  const router = useRouter();

  const handleCardClick = () => {
    router.push(`/products/${productId}`);
  };

  // Ensure image URL is a full URL
  const fullImageUrl = imageUrl 
    ? (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') 
        ? imageUrl 
        : null)
    : null;

  // Build signal badges array
  const signalBadges: string[] = [];
  if (hasLabTested) signalBadges.push("LAB TESTED");
  if (hasSourceVerified) signalBadges.push("SOURCE VERIFIED");
  if (hasAISummary) signalBadges.push("AI SUMMARY");

  // Count verified pillars
  const verifiedPillars = [
    sourceTransparency,
    purityTested,
    potencyVerified,
    excipientAudit,
    operationalLegitimacy,
  ].filter(Boolean).length;

  // Total engagement (reviews + comments)
  const totalEngagement = reviewCount + commentCount;

  const hasHighVelocity = activityScore > 0;

  return (
    <div 
      onClick={handleCardClick}
      className={`group border bg-muted-moss overflow-hidden relative transition-all duration-300 cursor-pointer select-none active:scale-95 ${
        hasHighVelocity 
          ? "border-forest-obsidian hover:border-heart-green hover:shadow-[0_0_16px_rgba(16,185,129,0.3),0_0_32px_rgba(16,185,129,0.15)]" 
          : "border-translucent-emerald hover:border-heart-green"
      }`}
      style={{ userSelect: 'none' }}
    >
        {/* Image Thumbnail - Denser, Clinical */}
        <div className="relative h-40 w-full overflow-hidden bg-forest-obsidian">
          {fullImageUrl ? (
            <Image
              src={fullImageUrl}
              alt={title}
              fill
              priority={fullImageUrl.includes('unsplash.com')}
              className="object-cover transition-opacity duration-200 group-hover:opacity-90"
              unoptimized={fullImageUrl.includes('supabase.co') || fullImageUrl.includes('unsplash.com')}
            />
          ) : (
            <div className="h-full w-full bg-forest-obsidian flex items-center justify-center border border-translucent-emerald">
              <div className="text-center p-4">
                <div className="bg-bone-white/10 border border-bone-white/20 p-3 mb-2">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-bone-white/70">
                    Specimen Under Audit
                  </p>
                </div>
              </div>
            </div>
          )}
          {/* SME Certified Badge Overlay */}
          {isSMECertified && (
            <div className="absolute top-2 right-2 border border-sme-gold bg-sme-gold px-2 py-0.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-forest-obsidian font-semibold">
                SME CERTIFIED
              </span>
            </div>
          )}
        </div>
        
        {/* Content - Denser, Technical */}
        <div className="p-4">
          <h3 className="mb-1 font-serif text-lg font-semibold text-bone-white line-clamp-2">
            {title}
          </h3>
          {/* Activity Score - Technical Metadata */}
          {activityScore > 0 && (
            <p className="mb-2 text-[10px] font-mono text-bone-white" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
              [{activityScore}] Community Signals
            </p>
          )}
          <p className="text-sm text-bone-white/80 line-clamp-2 leading-relaxed mb-3">{problemSolved}</p>
          
          {/* Signal Bar Footer - High-Signal Indicators */}
          <div className="pt-3 border-t border-translucent-emerald">
            <div className="flex items-center justify-between gap-4">
              {/* Pillar Score - Dot-Matrix Style */}
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-mono uppercase tracking-wider text-bone-white" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
                  Pillar:
                </span>
                <div className="flex items-center gap-0.5">
                  {[sourceTransparency, purityTested, potencyVerified, excipientAudit, operationalLegitimacy].map((verified, index) => (
                    <div
                      key={index}
                      className={`h-1.5 w-1.5 ${verified ? "bg-heart-green" : "bg-bone-white/20"}`}
                      style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" }}
                    />
                  ))}
                </div>
                <span className="text-[9px] font-mono text-bone-white" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
                  {verifiedPillars}/5
                </span>
              </div>

              {/* Community Heat - Message Icon + Count */}
              <div className="flex items-center gap-1">
                <MessageSquare size={10} className="text-bone-white/70" />
                <span className="text-[9px] font-mono text-bone-white/70" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
                  {commentCount}
                </span>
              </div>

              {/* Review Rating - Star Icon + Average (Always show if rating exists, otherwise show placeholder) */}
              <div className="flex items-center gap-1">
                <Star size={10} className={`${averageRating && averageRating > 0 ? 'text-sme-gold fill-sme-gold' : 'text-bone-white/30 fill-none'}`} />
                <span className={`text-[9px] font-mono ${averageRating && averageRating > 0 ? 'text-sme-gold' : 'text-bone-white/50'}`} style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
                  {averageRating && averageRating > 0 ? `${averageRating.toFixed(1)}/5` : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Signal Badges Footer - Technical Metadata */}
          {signalBadges.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-translucent-emerald mt-2">
              {signalBadges.map((badge) => (
                <span
                  key={badge}
                  className="inline-block border border-translucent-emerald bg-forest-obsidian px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-bone-white/70"
                >
                  {badge}
                </span>
              ))}
            </div>
          )}
        </div>
      
      {/* Compare Button - Top Left */}
      <div className="absolute top-2 left-2 z-10" onClick={(e) => e.stopPropagation()}>
        <CompareButton productId={productId} productTitle={title} />
      </div>
    </div>
  );
}
