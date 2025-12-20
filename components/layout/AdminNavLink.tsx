"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";

export default function AdminNavLink() {
  const { user, isLoaded } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdminStatus() {
      if (!isLoaded || !user) {
        setLoading(false);
        return;
      }

      try {
        // Check Clerk publicMetadata first
        const clerkRole = (user.publicMetadata?.role as string) || null;
        if (clerkRole === "admin") {
          setIsAdmin(true);
          setLoading(false);
          return;
        }

        // Check profile via API
        const response = await fetch('/api/profile');
        if (response.ok) {
          const profile = await response.json();
          if (profile && profile.is_admin === true) {
            setIsAdmin(true);
          }
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
      } finally {
        setLoading(false);
      }
    }

    checkAdminStatus();
  }, [user, isLoaded]);

  if (loading || !isAdmin) {
    return null;
  }

  return (
    <Link
      href="/admin"
      className="flex items-center gap-1 text-emerald-400/80 transition-colors duration-300 hover:text-emerald-400 font-mono text-xs uppercase tracking-wider"
    >
      <LayoutDashboard size={16} />
      Admin
    </Link>
  );
}




