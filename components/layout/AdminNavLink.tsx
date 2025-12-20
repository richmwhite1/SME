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
        const supabase = createClient();
        
        // Check Clerk publicMetadata first
        const clerkRole = (user.publicMetadata?.role as string) || null;
        if (clerkRole === "admin") {
          setIsAdmin(true);
          setLoading(false);
          return;
        }

        // Check Supabase profile
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .single();

        if (!error && profile) {
          setIsAdmin((profile as { is_admin: boolean }).is_admin === true);
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




