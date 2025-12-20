"use client";

import { Twitter, MessageCircle } from "lucide-react";

interface SocialLinksProps {
  className?: string;
  variant?: "header" | "footer";
}

export default function SocialLinks({ className = "", variant = "header" }: SocialLinksProps) {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const telegramUrl = "https://t.me/healthsme"; // Update with actual Telegram channel
  const xUrl = "https://x.com/SME_Vibe"; // Update with actual X handle

  if (variant === "footer") {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
          Secure Signal Channels:
        </span>
        <a
          href={xUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 border border-translucent-emerald bg-forest-obsidian px-3 py-1.5 text-xs text-bone-white/70 hover:text-sme-gold hover:border-sme-gold transition-all font-mono uppercase tracking-wider"
          title="X (Twitter) - Secure Signal Channel"
        >
          <Twitter size={14} />
          <span>X</span>
        </a>
        <a
          href={telegramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 border border-translucent-emerald bg-forest-obsidian px-3 py-1.5 text-xs text-bone-white/70 hover:text-sme-gold hover:border-sme-gold transition-all font-mono uppercase tracking-wider"
          title="Telegram - Secure Signal Channel"
        >
          <MessageCircle size={14} />
          <span>Telegram</span>
        </a>
      </div>
    );
  }

  // Header variant
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <a
        href={xUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 border border-translucent-emerald bg-forest-obsidian px-2 py-1 text-xs text-bone-white/70 hover:text-sme-gold hover:border-sme-gold transition-all font-mono uppercase tracking-wider"
        title="X (Twitter) - Secure Signal Channel"
      >
        <Twitter size={12} />
      </a>
      <a
        href={telegramUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 border border-translucent-emerald bg-forest-obsidian px-2 py-1 text-xs text-bone-white/70 hover:text-sme-gold hover:border-sme-gold transition-all font-mono uppercase tracking-wider"
        title="Telegram - Secure Signal Channel"
      >
        <MessageCircle size={12} />
      </a>
    </div>
  );
}



