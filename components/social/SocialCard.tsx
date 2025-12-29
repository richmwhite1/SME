"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toPng } from "html-to-image";
import { Download, Loader2, X } from "lucide-react";

interface SocialCardProps {
  type: "insight" | "audit" | "achievement";
  content: string;
  authorName: string;
  authorUsername?: string | null;
  trustWeight?: number | null;
  contributorScore?: number | null;
  rating?: number; // For audit contributions (reviews)
  productTitle?: string; // For audit contributions
  discussionTitle?: string; // For insights
  milestoneTitle?: string; // For achievements
  milestoneType?: string; // For achievements
  onClose: () => void;
  onExport: (imageUrl: string) => void;
}

export default function SocialCard({
  type,
  content,
  authorName,
  authorUsername,
  trustWeight,
  contributorScore,
  rating,
  productTitle,
  discussionTitle,
  milestoneTitle,
  milestoneType,
  onClose,
  onExport,
}: SocialCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImageReady, setIsImageReady] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const isMountedRef = useRef(true);

  // Ensure component is mounted and rendered to body
  useEffect(() => {
    setMounted(true);
    isMountedRef.current = true;

    // Generate image immediately when component mounts to set downloadUrl state
    const generateImage = async () => {
      if (!cardRef.current || !isMountedRef.current) return;

      // Wait a bit longer to ensure DOM is fully rendered
      await new Promise(resolve => setTimeout(resolve, 300));

      if (!cardRef.current || !isMountedRef.current) return;

      try {
        const dataUrl = await toPng(cardRef.current, {
          quality: 1.0,
          pixelRatio: 2,
          backgroundColor: "#0A0F0D",
          cacheBust: true,
        });

        if (isMountedRef.current && dataUrl) {
          // Store the blob URL in state to enable download button
          setDownloadUrl(dataUrl);
          setIsImageReady(true);
          console.log("Share Card: Image pre-generated, downloadUrl set");
        }
      } catch (error) {
        console.error("Error pre-generating share card image:", error);
        setIsImageReady(false);
      }
    };

    // Small delay to ensure DOM is fully rendered
    const timer = setTimeout(() => {
      generateImage();
    }, 500);

    return () => {
      isMountedRef.current = false;
      clearTimeout(timer);
      // Clear any pending operations
      if (cardRef.current) {
        cardRef.current = null;
      }
    };
  }, []);

  const handleExport = async () => {
    if (!cardRef.current || !isMountedRef.current) return;

    setIsExporting(true);
    try {
      // Ensure the element is still in the DOM
      if (!document.body.contains(cardRef.current)) {
        console.error("Card element no longer in DOM");
        setIsExporting(false);
        return;
      }

      // Generate image using html-to-image
      const dataUrl = await toPng(cardRef.current, {
        quality: 1.0,
        pixelRatio: 2, // High resolution
        backgroundColor: "#0A0F0D",
        filter: (node) => {
          // Skip any elements that might cause issues
          if (!node || !isMountedRef.current) return false;
          return true;
        },
        cacheBust: true,
      });

      // Ensure we have a valid data URL
      if (!dataUrl || !isMountedRef.current) {
        console.error("Share Card Debug - Failed to generate image or component unmounted");
        setIsExporting(false);
        return;
      }

      // Store the blob URL in state FIRST before triggering download
      // This ensures the download button is enabled and state is properly set
      setDownloadUrl(dataUrl);
      setIsImageReady(true);

      // Small delay to ensure state is updated before triggering download
      await new Promise(resolve => setTimeout(resolve, 100));

      // Convert data URL to blob and trigger download via onExport
      // This ensures the download happens through the useShareCard hook
      onExport(dataUrl);
    } catch (error) {
      console.error("Error exporting image:", error);
      console.error("Share Card Debug - Full error details:", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      if (isMountedRef.current) {
        alert("Failed to generate share card. Please try again.");
      }
    } finally {
      if (isMountedRef.current) {
        setIsExporting(false);
      }
    }
  };

  // Botanical paper grain texture (subtle) - using CSS-based approach without SVG filters
  // This avoids issues with html-to-image trying to fetch filter URLs
  const grainStyle = {
    position: "relative" as const,
  };

  // Render modal content
  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative max-w-2xl w-full bg-forest-obsidian border border-translucent-emerald p-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-bone-white/70 hover:text-bone-white transition-colors"
        >
          <X size={20} />
        </button>

        {/* Preview Card - Hidden Canvas */}
        <div
          ref={cardRef}
          className="bg-forest-obsidian p-12 text-bone-white relative"
          style={grainStyle}
        >
          {/* Subtle grain overlay using CSS */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px),
                                repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.02) 2px, rgba(255,255,255,0.02) 4px)`,
            }}
          />
          {/* Header - Minimal, Trust Weight Prominent */}
          <div className="mb-6 flex items-center justify-between border-b border-translucent-emerald pb-4 relative z-10">
            <div>
              <h1 className="font-serif text-xl font-bold text-bone-white mb-1">
                The Health SME
              </h1>
              <p className="text-xs text-bone-white/60 font-mono uppercase tracking-wider">
                Health through biological intelligence
              </p>
            </div>
            <div className="text-right">
              {(trustWeight !== null && trustWeight !== undefined) ||
                (contributorScore !== null && contributorScore !== undefined) ? (
                <div className="mb-2">
                  <p className="font-mono text-xs text-bone-white/60 uppercase tracking-wider">
                    Trust Weight
                  </p>
                  <p className="font-mono text-2xl font-bold text-sme-gold">
                    {trustWeight ?? contributorScore ?? 0}
                  </p>
                </div>
              ) : null}
              <p className="font-mono text-sm font-semibold text-bone-white">
                {authorName}
              </p>
              {authorUsername && (
                <p className="font-mono text-xs text-bone-white/70">
                  @{authorUsername}
                </p>
              )}
            </div>
          </div>

          {/* Body - Human Anecdotal Text as Focal Point */}
          <div className="mb-8 relative z-10">
            {/* Context Header - Subtle */}
            {type === "achievement" && milestoneTitle && (
              <div className="mb-6 text-center">
                <p className="font-mono text-xs text-sme-gold mb-2 uppercase tracking-wider">
                  Community Achievement
                </p>
                <h2 className="font-serif text-xl font-bold text-bone-white mb-2">
                  {milestoneTitle}
                </h2>
              </div>
            )}
            {type === "audit" && productTitle && (
              <p className="font-mono text-xs text-bone-white/50 mb-6 uppercase tracking-wider">
                Audit Contribution: {productTitle}
              </p>
            )}
            {type === "insight" && discussionTitle && (
              <p className="font-mono text-xs text-bone-white/50 mb-6 uppercase tracking-wider">
                Insight: {discussionTitle}
              </p>
            )}

            {/* Rating for audit contributions - Subtle */}
            {type === "audit" && rating && (
              <div className="mb-6 flex gap-1 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`text-base ${star <= rating ? "text-sme-gold" : "text-bone-white/20"
                      }`}
                  >
                    ★
                  </span>
                ))}
              </div>
            )}

            {/* Human Anecdotal Text - CENTRAL FOCUS */}
            {type === "achievement" ? (
              <p className="font-serif text-2xl leading-relaxed text-bone-white text-center py-4">
                {content}
              </p>
            ) : (
              <blockquote className="font-serif text-2xl leading-relaxed text-bone-white py-4 border-l-2 border-sme-gold/30 pl-6">
                {content}
              </blockquote>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-translucent-emerald pt-6 relative z-10">
            <p className="font-mono text-xs text-bone-white/50 text-center uppercase tracking-wider">
              Truth Sourced via The Health SME Community.
            </p>
          </div>
        </div>

        {/* Export Button - Only enabled when image blob is ready */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleExport}
            disabled={isExporting || !downloadUrl}
            className="flex items-center gap-2 border border-sme-gold bg-sme-gold px-6 py-3 text-sm font-mono uppercase tracking-wider text-forest-obsidian hover:bg-[#9A7209] hover:border-[#9A7209] transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            {isExporting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Generating...
              </>
            ) : !downloadUrl ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Preparing...
              </>
            ) : (
              <>
                <Download size={16} />
                Download Share Card
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // Use portal to ensure modal appends to document.body, not document root
  if (!mounted) return null;

  return createPortal(modalContent, document.body);
}



