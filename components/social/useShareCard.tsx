"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/ToastContainer";

interface ShareCardData {
  type: "insight" | "audit" | "achievement";
  content: string;
  authorName: string;
  authorUsername?: string | null;
  trustWeight?: number | null;
  contributorScore?: number | null;
  rating?: number;
  productTitle?: string;
  discussionTitle?: string;
  milestoneTitle?: string;
  milestoneType?: string;
  url: string; // Full URL to the content
}

export function useShareCard() {
  const [isOpen, setIsOpen] = useState(false);
  const [shareData, setShareData] = useState<ShareCardData | null>(null);
  const { showToast } = useToast();

  const openShareCard = (data: ShareCardData) => {
    setShareData(data);
    setIsOpen(true);
  };

  const closeShareCard = () => {
    setIsOpen(false);
    setShareData(null);
  };

  const handleExport = async (imageUrl: string) => {
    try {
      // Convert data URL to blob for reliable download
      let blob: Blob;
      let blobUrl: string;
      
      if (imageUrl.startsWith('data:')) {
        // Direct data URL - convert to blob
        const response = await fetch(imageUrl);
        blob = await response.blob();
        blobUrl = URL.createObjectURL(blob);
      } else {
        // Regular URL - fetch and convert
        const response = await fetch(imageUrl);
        blob = await response.blob();
        blobUrl = URL.createObjectURL(blob);
      }

      // Create hidden <a> tag with download attribute to trigger image save
      const link = document.createElement("a");
      link.style.display = "none";
      link.href = blobUrl;
      link.download = `health-sme-${shareData?.type || "share"}-${Date.now()}.png`;
      
      // Append to body (not #document root) to ensure proper DOM hierarchy
      if (document.body) {
        document.body.appendChild(link);
        // Trigger download once blob is ready
        link.click();
        
        // Cleanup: remove link and revoke blob URL after download
        setTimeout(() => {
          if (link.parentNode === document.body) {
            document.body.removeChild(link);
          }
          URL.revokeObjectURL(blobUrl);
        }, 100);
      } else {
        // Fallback if body not available
        window.open(blobUrl, '_blank');
        URL.revokeObjectURL(blobUrl);
      }

      // Copy shortened URL to clipboard
      const urlToCopy = shareData?.url || "";
      await navigator.clipboard.writeText(urlToCopy);

      showToast("Share card downloaded and URL copied to clipboard!", "success");
      closeShareCard();
    } catch (error) {
      console.error("Error exporting share card:", error);
      showToast("Failed to export share card. Please try again.", "error");
    }
  };

  return {
    isOpen,
    shareData,
    openShareCard,
    closeShareCard,
    handleExport,
  };
}



