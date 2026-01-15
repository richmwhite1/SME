"use client";

import { useState, useEffect } from "react";
import { useUser, UserButton } from "@/lib/auth";

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
        const response = await fetch('/api/profile');
        if (response.ok) {
          const profile = await response.json();
          if (profile) {
            const reputationScore = profile.reputation_score || 0;
            const isSMEStatus = profile.is_sme || false;
            const adminStatus = profile.is_admin || false;
            // User is SME if they have is_sme flag OR Trusted Voice badge
            setIsSME(isSMEStatus || profile.badge_type === 'Trusted Voice');
            setIsAdmin(adminStatus);
          }
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
            userButtonPopoverActionButton: "text-white hover:bg-muted-moss",
            userButtonPopoverActionButtonText: "text-white",
            userButtonPopoverActionButtonIcon: "text-white",
            userButtonPopoverFooter: "text-white",
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
              label="SME Dashboard"
              href="/sme-dashboard"
              labelIcon={<span className="text-xs" style={{ color: "#B8860B" }}>⭐</span>}
            />
          )}
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


