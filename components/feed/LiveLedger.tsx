import { getDb } from "@/lib/db";

// Revalidate every 60 seconds
export const revalidate = 60;

interface ActivityEntry {
    activity_type: 'signal' | 'promotion' | 'certification';
    actor_name: string;
    target_name: string;
    detail: string;
    created_at: string;
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

// Helper function to format activity label
function getActivityLabel(entry: ActivityEntry): string {
    switch (entry.activity_type) {
        case 'signal':
            return `${entry.actor_name} verified the ${entry.detail} signal for ${entry.target_name}`;
        case 'promotion':
            return `${entry.target_name} was promoted to ${entry.detail} via Peer Vouching`;
        case 'certification':
            return `${entry.target_name} was officially awarded ${entry.detail} status by the Admin`;
        default:
            return `${entry.actor_name} performed an action on ${entry.target_name}`;
    }
}

async function fetchLedgerActivity(): Promise<ActivityEntry[]> {
    const sql = getDb();

    try {
        const activities = await sql<ActivityEntry[]>`
      SELECT 
        activity_type,
        actor_name,
        target_name,
        detail,
        created_at
      FROM live_ledger_activity
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
                                <div className="flex-shrink-0">
                                    <span className="text-xs text-bone-white/50 font-mono whitespace-nowrap">
                                        {relativeTime}
                                    </span>
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
