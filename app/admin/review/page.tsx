import { isAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";
import { getPendingClaims, getReviewStats } from "@/app/actions/onboarding-review-actions";
import ReviewDashboardClient from "@/components/admin/ReviewDashboardClient";
import { Shield, FileCheck, FileX, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminReviewPage() {
    const adminStatus = await isAdmin();

    if (!adminStatus) {
        redirect("/");
    }

    // Fetch pending claims and stats
    let pendingClaims = [];
    let stats = {
        pending_count: 0,
        verified_count: 0,
        rejected_count: 0,
        pending_brand_claims: 0,
        pending_product_edits: 0,
    };

    try {
        pendingClaims = await getPendingClaims();
    } catch (error) {
        console.error("Error fetching pending claims:", error);
    }

    try {
        stats = await getReviewStats();
    } catch (error) {
        console.error("Error fetching review stats:", error);
    }

    return (
        <main className="min-h-screen bg-forest-obsidian px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                {/* Header */}
                <div className="mb-8 border-b border-bone-white/20 pb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Shield className="h-8 w-8 text-emerald-400" />
                        <h1 className="font-mono text-3xl font-bold text-bone-white sm:text-4xl">
                            BRAND CLAIMS & PRODUCT EDITS REVIEW
                        </h1>
                    </div>
                    <p className="font-mono text-sm text-bone-white/70 sm:text-base">
                        Review and approve pending brand claims and product edit submissions
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="border border-bone-white/20 bg-bone-white/5 p-4 font-mono">
                        <div className="flex items-center gap-2 mb-1">
                            <Clock className="h-5 w-5 text-amber-400" />
                            <p className="text-xs text-bone-white/70 uppercase tracking-wider">Pending</p>
                        </div>
                        <p className="text-2xl font-bold text-amber-400">{stats.pending_count}</p>
                    </div>

                    <div className="border border-bone-white/20 bg-bone-white/5 p-4 font-mono">
                        <div className="flex items-center gap-2 mb-1">
                            <FileCheck className="h-5 w-5 text-emerald-400" />
                            <p className="text-xs text-bone-white/70 uppercase tracking-wider">Verified</p>
                        </div>
                        <p className="text-2xl font-bold text-emerald-400">{stats.verified_count}</p>
                    </div>

                    <div className="border border-bone-white/20 bg-bone-white/5 p-4 font-mono">
                        <div className="flex items-center gap-2 mb-1">
                            <FileX className="h-5 w-5 text-red-400" />
                            <p className="text-xs text-bone-white/70 uppercase tracking-wider">Rejected</p>
                        </div>
                        <p className="text-2xl font-bold text-red-400">{stats.rejected_count}</p>
                    </div>

                    <div className="border border-bone-white/20 bg-bone-white/5 p-4 font-mono">
                        <div className="flex items-center gap-2 mb-1">
                            <Shield className="h-5 w-5 text-bone-white/70" />
                            <p className="text-xs text-bone-white/70 uppercase tracking-wider">Brand Claims</p>
                        </div>
                        <p className="text-2xl font-bold text-bone-white">{stats.pending_brand_claims}</p>
                    </div>
                </div>

                {/* Review Dashboard */}
                <ReviewDashboardClient pendingClaims={pendingClaims} />
            </div>
        </main>
    );
}
