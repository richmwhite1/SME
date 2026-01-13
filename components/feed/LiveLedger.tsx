import { getDb } from "@/lib/db";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import Tooltip from "@/components/ui/Tooltip";
import { TERMINOLOGY } from "@/lib/terminology";

// Revalidate every 60 seconds
export const revalidate = 60;

interface ActivityEntry {
    activity_type: 'signal' | 'promotion' | 'certification';
    actor_name: string;
    target_name: string;
    detail: string;
    created_at: string;
    target_slug?: string | null;
    target_id?: string | null;
}

// Helper function to format relative time
function getRelativeTime(timestamp: string): string {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 60) {
        return 'just now';
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
        const weeks = Math.floor(diffInSeconds / 604800);
        return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    }
}

// Helper function to format activity label with clickable links
function getActivityLabel(entry: ActivityEntry): JSX.Element {
    const productLink = entry.target_slug ? (
        <Link
            href={`/products/${entry.target_slug}`}
            className="text-sme-gold hover:underline font-semibold"
        >
            {entry.target_name}
        </Link>
    ) : (
        <span className="font-semibold">{entry.target_name}</span>
    );

    switch (entry.activity_type) {
        case 'signal':
            return (
                <span>
                    {entry.actor_name} verified the {entry.detail} signal for {productLink}
                </span>
            );
        case 'promotion':
            return (
                <span>
                    {productLink} was promoted to {entry.detail} via Peer Vouching
                </span>
            );
        case 'certification':
            return (
                <span>
                    {productLink} was officially awarded {entry.detail} status by the Admin
                </span>
            );
        default:
            return (
                <span>
                    {entry.actor_name} performed an action on {productLink}
                </span>
            );
    }
}

async function fetchLedgerActivity(): Promise<ActivityEntry[]> {
    const sql = getDb();

    try {
        // Modified query to include product slug for signal activities
        const activities = await sql<ActivityEntry[]>`
      WITH activity_feed AS (
        -- 1. PROMOTION ACTIVITY
        SELECT 
          'promotion' AS activity_type,
          COALESCE(voucher.display_name, voucher.full_name, voucher.username, 'Anonymous') AS actor_name,
          COALESCE(target.display_name, target.full_name, target.username, 'Anonymous') AS target_name,
          'SME Status' AS detail,
          v.created_at,
          NULL::text AS target_slug,
          NULL::uuid AS target_id
        FROM vouches v
        JOIN profiles voucher ON v.voucher_id = voucher.id
        JOIN profiles target ON v.target_user_id = target.id
        WHERE target.reputation_tier >= 3
        
        UNION ALL
        
        -- 2. CERTIFICATION ACTIVITY
        SELECT 
          'certification' AS activity_type,
          'Admin' AS actor_name,
          COALESCE(p.display_name, p.full_name, p.username, 'Anonymous') AS target_name,
          CASE 
            WHEN app.expertise_lens = 'Scientific' THEN '🧬 Scientific Expert'
            WHEN app.expertise_lens = 'Alternative' THEN '🪵 Alternative Expert'
            WHEN app.expertise_lens = 'Esoteric' THEN '👁️ Esoteric Expert'
            ELSE 'Expert'
          END AS detail,
          app.reviewed_at AS created_at,
          NULL::text AS target_slug,
          NULL::uuid AS target_id
        FROM sme_applications app
        JOIN profiles p ON app.user_id = p.id
        WHERE app.status = 'approved' AND app.reviewed_at IS NOT NULL
        
        UNION ALL
        
        -- 3. SIGNAL ACTIVITY (with product slug)
        SELECT 
          'signal' AS activity_type,
          'Community' AS actor_name,
          p.title AS target_name,
          CASE 
            WHEN p.certification_tier = 'Gold' THEN '🏆 Gold'
            WHEN p.certification_tier = 'Silver' THEN '🥈 Silver'
            WHEN p.certification_tier = 'Bronze' THEN '🥉 Bronze'
            ELSE '✓ Verified'
          END AS detail,
          p.updated_at AS created_at,
          p.slug AS target_slug,
          p.id AS target_id
        FROM products p
        WHERE p.certification_tier IS NOT NULL 
          AND p.certification_tier != 'None'
          AND p.admin_status = 'approved'
      )
      SELECT * FROM activity_feed
      ORDER BY created_at DESC
      LIMIT 15
    `;

        return activities;
    } catch (error) {
        console.error("Error fetching ledger activity:", error);
        return [];
    }
}

export default async function LiveLedger() {
    const activities = await fetchLedgerActivity();

    if (activities.length === 0) {
        return (
            <div className="border border-translucent-emerald bg-muted-moss">
                <div className="border-b border-translucent-emerald px-4 py-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-bone-white font-mono">
                        Live Activity Feed
                    </h3>
                </div>
                <div className="p-6 text-center">
                    <div className="text-xs text-bone-white/70 font-mono">
                        No recent activity. Check back soon!
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="border border-translucent-emerald bg-muted-moss">
            {/* Header */}
            <div className="border-b border-translucent-emerald px-4 py-3 bg-forest-obsidian">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-bone-white font-mono flex items-center gap-2">
                    <span className="text-heart-green">●</span>
                    Live Activity Feed
                    <Tooltip content={TERMINOLOGY.SIGNAL} />
                </h3>
            </div>

            {/* Activity Feed */}
            <div className="divide-y divide-translucent-emerald/30 max-h-[500px] overflow-y-auto">
                {activities.map((entry, index) => {
                    const label = getActivityLabel(entry);
                    const relativeTime = getRelativeTime(entry.created_at);

                    // Determine accent color based on activity type
                    const accentColor =
                        entry.activity_type === 'promotion' ? 'text-sme-gold' :
                            entry.activity_type === 'certification' ? 'text-translucent-emerald' :
                                'text-heart-green';

                    const bgHover = 'hover:bg-forest-obsidian/50';

                    return (
                        <div
                            key={`${entry.activity_type}-${entry.created_at}-${index}`}
                            className={`px-4 py-3 transition-colors ${bgHover}`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm leading-relaxed font-mono ${accentColor}`}>
                                        <span className="text-bone-white/90">{label}</span>
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className="text-xs text-bone-white/50 font-mono whitespace-nowrap">
                                        {relativeTime}
                                    </span>
                                    {entry.target_slug && entry.activity_type === 'signal' && (
                                        <Link
                                            href={`/products/${entry.target_slug}`}
                                            className="text-xs text-bone-white/50 hover:text-sme-gold transition-colors flex items-center gap-1"
                                            aria-label={`View ${entry.target_name} details`}
                                        >
                                            <ExternalLink size={12} />
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer with live indicator */}
            <div className="border-t border-translucent-emerald/30 px-4 py-2 bg-forest-obsidian/30">
                <div className="flex items-center justify-between">
                    <span className="text-xs text-bone-white/50 font-mono">
                        Auto-refreshes every 60 seconds
                    </span>
                    <span className="text-xs text-heart-green font-mono flex items-center gap-1">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-heart-green animate-pulse"></span>
                        LIVE
                    </span>
                </div>
            </div>
        </div>
    );
}
