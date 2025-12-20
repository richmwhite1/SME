"use client";

import { useState, useEffect, useRef } from "react";
import { BookOpen, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ResourceData {
  title: string;
  ai_summary: string | null;
  reference_url: string | null;
  integrity_level: string | null;
  origin_type: string;
}

interface IntelligenceData {
  title: string;
  ai_summary: string;
  reference_url: string;
}

interface DiscussionData {
  title: string;
  reference_url: string | null;
}

interface IntelligencePopoverProps {
  resourceId: string;
  children: React.ReactNode;
}

export default function IntelligencePopover({
  resourceId,
  children,
}: IntelligencePopoverProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [resourceData, setResourceData] = useState<ResourceData | null>(null);
  const [loading, setLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);

  // Fetch resource data when popover becomes visible
  useEffect(() => {
    if (!isVisible || resourceData) return;

    const fetchResourceData = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        
        // Try to get from resource_library view first
        const { data: resourceData, error } = await supabase
          .from("resource_library")
          .select("title, reference_url, origin_type, origin_id")
          .eq("origin_id", resourceId)
          .single();

        if (error || !resourceData) {
          // If not in resource_library, try to get from protocols or discussions
          const { data: protocolData } = await supabase
            .from("protocols")
            .select("title, reference_url, ai_summary")
            .eq("id", resourceId)
            .single();

          if (protocolData) {
            // Cast the data explicitly so TypeScript stops calling it 'never'
            const typedProtocolData = protocolData as unknown as IntelligenceData;
            
            if (typedProtocolData && typedProtocolData.title) {
              setResourceData({
                title: typedProtocolData.title,
                ai_summary: typedProtocolData.ai_summary,
                reference_url: typedProtocolData.reference_url,
                integrity_level: "Product Reference",
                origin_type: "Product",
              });
            }
            setLoading(false);
            return;
          }

          const { data: rawDiscussionData } = await supabase
            .from("discussions")
            .select("title, reference_url")
            .eq("id", resourceId)
            .single();

          // Cast the data explicitly
          const discussionData = rawDiscussionData as unknown as DiscussionData;

          if (discussionData && discussionData.title) {
            setResourceData({
              title: discussionData.title,
              ai_summary: null,
              reference_url: discussionData.reference_url,
              integrity_level: "Discussion Reference",
              origin_type: "Discussion",
            });
            setLoading(false);
            return;
          }
        } else {
          // Get AI summary and integrity level from source
          let aiSummary = null;
          let integrityLevel = "Reference";

          if (resourceData.origin_type === "Product") {
            const { data: protocolData } = await supabase
              .from("protocols")
              .select("ai_summary, third_party_lab_verified, purity_verified")
              .eq("id", resourceId)
              .single();

            if (protocolData) {
              aiSummary = protocolData.ai_summary;
              if (protocolData.third_party_lab_verified) {
                integrityLevel = "Lab Report";
              } else if (protocolData.purity_verified) {
                integrityLevel = "Purity Verified";
              } else {
                integrityLevel = "Product Reference";
              }
            }
          } else if (resourceData.origin_type === "Discussion") {
            integrityLevel = "Discussion Reference";
          }

          setResourceData({
            title: resourceData.title,
            ai_summary: aiSummary,
            reference_url: resourceData.reference_url,
            integrity_level: integrityLevel,
            origin_type: resourceData.origin_type,
          });
        }
      } catch (err) {
        console.error("Error fetching resource data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchResourceData();
  }, [isVisible, resourceId, resourceData]);

  // Close popover on outside click
  useEffect(() => {
    if (!isVisible) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isVisible]);

  // Calculate popover position
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!isVisible || !triggerRef.current) return;

    const updatePosition = () => {
      if (!triggerRef.current) return;

      const rect = triggerRef.current.getBoundingClientRect();
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;

      setPosition({
        top: rect.bottom + scrollY + 8,
        left: rect.left + scrollX,
      });
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isVisible]);

  const summaryText = resourceData?.ai_summary
    ? resourceData.ai_summary.substring(0, 150) + (resourceData.ai_summary.length > 150 ? "..." : "")
    : "No summary available";

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => {
          // Small delay to allow moving to popover
          setTimeout(() => {
            if (popoverRef.current && !popoverRef.current.matches(":hover")) {
              setIsVisible(false);
            }
          }, 100);
        }}
        className="cursor-help underline decoration-sme-gold/50 decoration-dotted underline-offset-2 text-bone-white hover:text-sme-gold transition-colors"
      >
        {children}
      </span>

      {isVisible && position && (
        <div
          ref={popoverRef}
          onMouseEnter={() => setIsVisible(true)}
          onMouseLeave={() => setIsVisible(false)}
          className="fixed z-50 w-80 border border-sme-gold bg-forest-obsidian p-4 shadow-xl"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
        >
          {loading ? (
            <div className="text-xs text-bone-white/70 font-mono">Loading...</div>
          ) : resourceData ? (
            <div className="space-y-3">
              {/* Header */}
              <div className="border-b border-sme-gold/30 pb-2">
                <div className="flex items-start gap-2">
                  <BookOpen size={14} className="text-sme-gold mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-bone-white font-mono">
                      {resourceData.title}
                    </h4>
                    {resourceData.integrity_level && (
                      <p className="text-xs text-bone-white font-mono mt-1">
                        {resourceData.integrity_level}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* AI Summary */}
              <div>
                <p className="text-xs text-bone-white font-mono leading-relaxed">
                  {summaryText}
                </p>
              </div>

              {/* Reference URL */}
              {resourceData.reference_url && (
                <div className="pt-2 border-t border-sme-gold/20">
                  <a
                    href={resourceData.reference_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-sme-gold hover:text-sme-gold/80 font-mono transition-colors"
                  >
                    <ExternalLink size={12} />
                    <span className="truncate">View Source</span>
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-bone-white/70 font-mono">
              Resource not found
            </div>
          )}
        </div>
      )}
    </>
  );
}



