import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { getApprovalQueue } from "@/app/actions/admin-approval-actions";
import { getSMEReviewQueue } from "@/app/actions/sme-review-actions";
import AdminDashboardTabs from "@/components/admin/AdminDashboardTabs";
import { Shield, ClipboardCheck, Users, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const adminStatus = await isAdmin();
  if (!adminStatus) {
    redirect("/");
  }

  // Fetch both queues
  let productQueue = [];
  let smeQueue = [];

  try {
    productQueue = await getApprovalQueue();
  } catch (error) {
    console.error("Error fetching product approval queue:", error);
  }

  try {
    smeQueue = await getSMEReviewQueue();
  } catch (error) {
    console.error("Error fetching SME review queue:", error);
  }

  // Calculate product stats
  const totalPendingProducts = productQueue.filter((p: any) => p.admin_status === 'pending_review').length;
  const totalApprovedProducts = productQueue.filter((p: any) => p.admin_status === 'approved').length;

  // Calculate SME stats
  const totalPendingSME = smeQueue.length;
  const avgReputation = smeQueue.length > 0
    ? (smeQueue.reduce((sum: number, c: any) => sum + (c.reputation_score || 0), 0) / smeQueue.length).toFixed(0)
    : 0;

  return (
    <main className="min-h-screen bg-forest-obsidian px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header - Command Center Style */}
        <div className="mb-8 border-b border-emerald-500/30 pb-6">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-emerald-400" />
            <h1 className="font-mono text-3xl font-bold text-bone-white sm:text-4xl">
              ADMIN COMMAND CENTER
            </h1>
          </div>
          <p className="font-mono text-sm text-emerald-400/70 sm:text-base">
            Product Approvals • SME Candidate Review • Certification Management
          </p>
        </div>

        {/* Stats Cards - High Contrast Command Center Style */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="border-2 border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 p-4 font-mono">
            <div className="flex items-center gap-2 mb-1">
              <ClipboardCheck className="h-5 w-5 text-yellow-400" />
              <p className="text-xs text-yellow-400/90 uppercase tracking-wider font-bold">Products Pending</p>
            </div>
            <p className="text-3xl font-bold text-yellow-400">{totalPendingProducts}</p>
          </div>

          <div className="border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-4 font-mono">
            <div className="flex items-center gap-2 mb-1">
              <ClipboardCheck className="h-5 w-5 text-emerald-400" />
              <p className="text-xs text-emerald-400/90 uppercase tracking-wider font-bold">Products Approved</p>
            </div>
            <p className="text-3xl font-bold text-emerald-400">{totalApprovedProducts}</p>
          </div>

          <div className="border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-500/5 p-4 font-mono">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-5 w-5 text-purple-400" />
              <p className="text-xs text-purple-400/90 uppercase tracking-wider font-bold">SME Candidates</p>
            </div>
            <p className="text-3xl font-bold text-purple-400">{totalPendingSME}</p>
          </div>

          <div className="border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-blue-500/5 p-4 font-mono">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-5 w-5 text-blue-400" />
              <p className="text-xs text-blue-400/90 uppercase tracking-wider font-bold">Avg Reputation</p>
            </div>
            <p className="text-3xl font-bold text-blue-400">{avgReputation}</p>
          </div>
        </div>

        {/* Tabbed Interface */}
        <AdminDashboardTabs productQueue={productQueue} smeQueue={smeQueue} />
      </div>
    </main>
  );
}
