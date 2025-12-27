"use client";

import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { getSMEStatus } from "@/app/actions/get-sme-status";

export default function SMEDashboardLink() {
    const { user, isLoaded } = useUser();
    const [isSME, setIsSME] = useState(false);

    useEffect(() => {
        if (!user) return;

        // Check metadata first for immediate feedback
        const metadataSME = user.publicMetadata?.is_sme ||
            user.publicMetadata?.badge_type === 'Trusted Voice' ||
            (typeof user.publicMetadata?.contributor_score === 'number' && user.publicMetadata.contributor_score >= 300);

        if (metadataSME) {
            setIsSME(true);
        }

        // Always double-check with server for accurate status (especially after DB updates)
        const checkServerStatus = async () => {
            try {
                const status = await getSMEStatus();
                if (status.isSME) {
                    setIsSME(true);
                }
            } catch (error) {
                console.error("Failed to verify SME status:", error);
            }
        };

        checkServerStatus();
    }, [user]);

    if (!isLoaded || !isSME) {
        return null;
    }

    return (
        <Link
            href="/sme-dashboard"
            className="flex items-center gap-2 min-h-[44px] px-3 text-sme-gold hover:text-sme-gold/80 transition-colors font-mono text-xs uppercase tracking-wider border border-sme-gold/30 bg-sme-gold/5 hover:bg-sme-gold/10 rounded active:scale-95"
        >
            <TrendingUp size={14} />
            <span className="hidden xl:inline">SME Dashboard</span>
            <span className="xl:hidden">Dashboard</span>
        </Link>
    );
}
