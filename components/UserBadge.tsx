"use client";

import { Shield } from "lucide-react";
import TrustWeight from "@/components/ui/TrustWeight";

interface Profile {
  id: string;
  username?: string | null;
  avatar_url?: string | null;
  contributor_score?: number | null;
  is_verified_expert?: boolean | null;
}

interface UserBadgeProps {
  profile: Profile | null;
  showScore?: boolean;
  className?: string;
}

export default function UserBadge({
  profile,
  showScore = true,
  className = "",
}: UserBadgeProps) {
  if (!profile) return null;

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {/* Verified Expert Shield */}
      {profile.is_verified_expert && (
        <Shield
          size={14}
          className="text-sme-gold flex-shrink-0"
          style={{
            filter: "drop-shadow(0 0 4px rgba(184, 134, 11, 0.4))",
          }}
        />
      )}

      {/* Contributor Score with Emerald Aura */}
      {showScore && profile.contributor_score && profile.contributor_score > 100 && (
        <div
          className="flex items-center"
          style={{
            boxShadow: "0 0 8px rgba(16, 185, 129, 0.3), 0 0 16px rgba(16, 185, 129, 0.15)",
          }}
        >
          <TrustWeight
            value={profile.contributor_score}
            className="font-mono"
          />
        </div>
      )}
    </div>
  );
}



