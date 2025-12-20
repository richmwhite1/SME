"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";

export default function SMEUserButton() {
  const { user, isLoaded } = useUser();
  const [isSME, setIsSME] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkStatus() {
      if (!isLoaded || !user) {
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("contributor_score, is_verified_expert, is_admin")
          .eq("id", user.id)
          .single();

        if (!error && profile) {
          const contributorScore = (profile as { contributor_score?: number }).contributor_score || 0;
          const isCertifiedSME = (profile as { is_verified_expert?: boolean }).is_verified_expert || false;
          const adminStatus = (profile as { is_admin?: boolean }).is_admin || false;
          setIsSME(contributorScore > 500 || isCertifiedSME);
          setIsAdmin(adminStatus);
        }
      } catch (error) {
        console.error("Error checking status:", error);
      } finally {
        setLoading(false);
      }
    }

    checkStatus();
  }, [user, isLoaded]);

  return (
    <div className="flex items-center gap-2">
      {!loading && isAdmin && (
        <span className="border border-emerald-400/50 bg-emerald-400/10 px-2 py-0.5 text-xs font-mono uppercase tracking-wider text-emerald-400/80">
          Admin
        </span>
      )}
      <UserButton 
        afterSignOutUrl="/"
        appearance={{
          elements: {
            userButtonPopoverCard: "bg-forest-obsidian border border-translucent-emerald",
            userButtonPopoverActionButton: "text-bone-white hover:bg-muted-moss",
          }
        }}
      >
        <UserButton.MenuItems>
          <UserButton.Link
            label="My Profile"
            href="/u/me"
            labelIcon={<span className="text-xs">👤</span>}
          />
          <UserButton.Link
            label="My Feed"
            href="/feed"
            labelIcon={<span className="text-xs">📡</span>}
          />
          {!loading && isSME && (
            <UserButton.Link
              label="Audit Dashboard"
              href="/admin/audit"
              labelIcon={<span className="text-xs" style={{ color: "#B8860B" }}>🔍</span>}
            />
          )}
          {!loading && isAdmin && (
            <UserButton.Link
              label="Admin Portal"
              href="/admin"
              labelIcon={<span className="text-xs" style={{ color: "#10B981" }}>🛡️</span>}
            />
          )}
        </UserButton.MenuItems>
      </UserButton>
    </div>
  );
}


