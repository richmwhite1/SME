import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { getSignaledItems, getWeeklySMEStats } from "@/app/actions/sme-dashboard-actions";
import { getTopSmeSummons } from "@/app/actions/sme-actions";
import SMEPriorityQueue from "@/components/sme/SMEPriorityQueue";
import SmeSummonsFeed from "@/components/profile/SmeSummonsFeed";
import { Award, TrendingUp, Hand, CheckCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SMEDashboardPage() {
    const user = await currentUser();

    if (!user) {
        redirect("/sign-in");
    }

    const sql = getDb();

    // Verify SME status - check both is_sme and contributor_score >= 300
    const profile = await sql`
    SELECT 
      is_sme, 
      badge_type, 
      full_name, 
      reputation_score,
      contributor_score
    FROM profiles 
    WHERE id = ${user.id}
  `;

    // Check if user has SME access (contributor_score >= 300 OR manual Trusted Voice badge)
    const isVerifiedSme = (profile[0]?.contributor_score || 0) >= 300;
    const isSME = profile[0]?.is_sme || profile[0]?.badge_type === 'Trusted Voice' || isVerifiedSme;

    if (!isSME) {
        // Redirect to home with error notification
        redirect("/?error=sme_access_denied");
    }

    // Fetch all dashboard data in parallel
    const [signaledItemsResult, statsResult, smeSummonsData] = await Promise.all([
        getSignaledItems(),
        getWeeklySMEStats(user.id),
        getTopSmeSummons(10)
    ]);

    const items = signaledItemsResult.success ? signaledItemsResult.data || [] : [];
    const helpedCount = statsResult.success ? statsResult.data?.helpedThisWeek || 0 : 0;
    const smeSummons = smeSummonsData || [];

    // Calculate additional stats
    const needsExpertCount = items.filter(item => !item.has_sme_reply).length;
    const urgentCount = items.filter(i => i.raise_hand_count >= 10).length;

    return (
        <div className="min-h-screen bg-forest-obsidian">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header */}
                <div className="mb-8 border-b border-white/10 pb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Award size={32} className="text-sme-gold" />
                        <h1 className="text-4xl font-serif text-bone-white font-bold">SME Dashboard</h1>
                    </div>
                    <p className="text-bone-white/60 font-mono text-sm">
                        Welcome back, {profile[0]?.full_name || "Expert"} • Your expert command center for community guidance
                    </p>
                </div>

                {/* Analytics Cards */}
                <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Contributor Score */}
                    <div className="border border-sme-gold/30 bg-sme-gold/5 p-6">
                        <div className="flex items-center gap-2 mb-2">
                            <Award size={20} className="text-sme-gold" />
                            <h2 className="text-xs font-mono uppercase tracking-wider text-sme-gold">Contributor Score</h2>
                        </div>
                        <div className="text-3xl font-bold text-bone-white font-mono mb-1">
                            {profile[0]?.contributor_score || 0}
                        </div>
                        <div className="text-[10px] text-bone-white/50 font-mono uppercase tracking-wider">
                            {profile[0]?.badge_type || 'Member'}
                        </div>
                    </div>

                    {/* Needs Expert Attention */}
                    <div className="border border-heart-green/30 bg-heart-green/5 p-6">
                        <div className="flex items-center gap-2 mb-2">
                            <Hand size={20} className="text-heart-green" />
                            <h2 className="text-xs font-mono uppercase tracking-wider text-heart-green">Needs Expert</h2>
                        </div>
                        <div className="text-3xl font-bold text-bone-white font-mono mb-1">
                            {needsExpertCount}
                        </div>
                        <div className="text-[10px] text-bone-white/50 font-mono uppercase tracking-wider">
                            Unanswered Signals
                        </div>
                    </div>

                    {/* Urgent Signals */}
                    <div className="border border-red-400/30 bg-red-400/5 p-6">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-red-400 text-xl">🚨</span>
                            <h2 className="text-xs font-mono uppercase tracking-wider text-red-400">Urgent</h2>
                        </div>
                        <div className="text-3xl font-bold text-bone-white font-mono mb-1">
                            {urgentCount}
                        </div>
                        <div className="text-[10px] text-bone-white/50 font-mono uppercase tracking-wider">
                            10+ Signals
                        </div>
                    </div>

                    {/* Weekly Impact */}
                    <div className="border border-heart-green/30 bg-heart-green/5 p-6">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle size={20} className="text-heart-green" />
                            <h2 className="text-xs font-mono uppercase tracking-wider text-heart-green">This Week</h2>
                        </div>
                        <div className="text-3xl font-bold text-bone-white font-mono mb-1">
                            {helpedCount}
                        </div>
                        <div className="text-[10px] text-bone-white/50 font-mono uppercase tracking-wider">
                            {helpedCount === 1 ? "Member Helped" : "Members Helped"}
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Priority Queue - Takes 2 columns */}
                    <div className="lg:col-span-2">
                        <div className="border border-translucent-emerald bg-muted-moss p-6">
                            <SMEPriorityQueue items={items} />
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <div className="space-y-6">
                        {/* SME Summons - Product Review Queue */}
                        {smeSummons.length > 0 && (
                            <div className="border border-translucent-emerald bg-muted-moss p-6">
                                <h2 className="text-xl font-serif text-bone-white mb-4 border-b border-white/10 pb-3">
                                    Product Review Queue
                                </h2>
                                <SmeSummonsFeed summons={smeSummons} />
                            </div>
                        )}

                        {/* Quick Actions */}
                        <div className="border border-translucent-emerald bg-muted-moss p-6">
                            <h2 className="text-xl font-serif text-bone-white mb-4 border-b border-white/10 pb-3">
                                Quick Actions
                            </h2>
                            <div className="space-y-3">
                                <a
                                    href="/discussions"
                                    className="block border border-translucent-emerald bg-forest-obsidian px-4 py-3 text-sm font-mono text-bone-white hover:border-heart-green hover:bg-forest-obsidian/50 transition-all"
                                >
                                    Browse Discussions →
                                </a>
                                <a
                                    href="/products"
                                    className="block border border-translucent-emerald bg-forest-obsidian px-4 py-3 text-sm font-mono text-bone-white hover:border-heart-green hover:bg-forest-obsidian/50 transition-all"
                                >
                                    Review Products →
                                </a>
                                <a
                                    href="/settings"
                                    className="block border border-translucent-emerald bg-forest-obsidian px-4 py-3 text-sm font-mono text-bone-white hover:border-heart-green hover:bg-forest-obsidian/50 transition-all"
                                >
                                    Update Profile →
                                </a>
                            </div>
                        </div>

                        {/* SME Status Card */}
                        <div className="border border-sme-gold/30 bg-sme-gold/5 p-6">
                            <h2 className="text-xl font-serif text-sme-gold mb-4 border-b border-sme-gold/20 pb-3">
                                SME Status
                            </h2>
                            <div className="space-y-3 text-sm font-mono">
                                <div className="flex items-center justify-between">
                                    <span className="text-bone-white/70">Verified SME:</span>
                                    <span className={`font-semibold ${isVerifiedSme ? 'text-heart-green' : 'text-bone-white/50'}`}>
                                        {isVerifiedSme ? '✓ Active' : '✗ Inactive'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-bone-white/70">Badge:</span>
                                    <span className="text-bone-white font-semibold">
                                        {profile[0]?.badge_type || 'Member'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-bone-white/70">Reputation:</span>
                                    <span className="text-sme-gold font-semibold">
                                        {profile[0]?.reputation_score?.toLocaleString() || 0}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
