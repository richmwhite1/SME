"use client";

import { Share2 } from "lucide-react";

interface ShareToXProps {
  title: string;
  url: string;
  type: "product" | "discussion";
  className?: string;
}

export default function ShareToX({
  title,
  url,
  type,
  className = "",
}: ShareToXProps) {
  const handleShare = () => {
    const fullUrl = typeof window !== "undefined" 
      ? `${window.location.origin}${url}`
      : url;
    
    const tweetText = type === "product"
      ? `Analyzing the integrity of ${title} on @SME_Vibe. Join the court: ${fullUrl}`
      : `Analyzing the integrity of ${title} on @SME_Vibe. Join the court: ${fullUrl}`;

    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    
    window.open(twitterUrl, "_blank", "width=550,height=420");
  };

  return (
    <button
      onClick={handleShare}
      className={`inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-slate-700 transition-colors hover:bg-slate-50 hover:border-slate-400 ${className}`}
    >
      <Share2 size={14} />
      Share to X
    </button>
  );
}




