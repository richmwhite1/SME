"use client";

import { Flame } from "lucide-react";

interface VelocityBadgeProps {
  velocityCount: number;
  className?: string;
}

export default function VelocityBadge({
  velocityCount,
  className = "",
}: VelocityBadgeProps) {
  if (velocityCount === 0) return null;

  return (
    <div
      className={`absolute top-2 right-2 z-20 flex items-center gap-1 border border-sme-gold bg-sme-gold/20 px-2 py-1 ${className}`}
      style={{
        boxShadow: "0 0 8px rgba(184, 134, 11, 0.4), 0 0 16px rgba(184, 134, 11, 0.2)",
      }}
    >
      <Flame size={12} className="text-sme-gold" />
      <span className="text-[10px] font-mono uppercase tracking-wider text-sme-gold font-semibold">
        {velocityCount}
      </span>
    </div>
  );
}



